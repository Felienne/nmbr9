require('@tensorflow/tfjs-node'); // Speed up TensorFlow by including this before the actual library
import fs = require('fs');
import tf = require('@tensorflow/tfjs');
import util = require('util');
import { FastBoard, BOARD_SIZE } from "../fast-board";
import { CandidateMove, Move } from "../board";
import { mean, weightedPick } from "../util";
import { IPlayer } from '../player';
import { Deck, CARD_TYPES } from '../cards';
import { Tile } from '../tile';
import { MonteCarloTree, performMcts, printTreeStatistics, MonteCarloMove, defaultUpperConfidenceBound, TreeSearchSupport } from '../algo/monte-carlo';
import { networkInterfaces } from 'os';

const MODEL_DIR = 'file://numberzero.model';

export interface NumberZeroOptions {
    /**
     * How many iterations to run
     */
    maxIterations?: number;

    /**
     * How many seconds to run, at most
     */
    maxThinkingTimeSec?: number;

    /**
     * Print tree statistics at the end of a move
     */
    printTreeStatistics?: boolean;
}

/**
 * NN-based player
 *
 * Current strategy, inspired by but not actually copying AlphaZero:
 *
 * - Try to teach the NN to predict final board scores.
 * - Pick moves according to predicted board scores.
 *
 * NN input:
 *
 * Height map of entire board, plus a vector to indicate which tiles
 * are still left.
 */
export class NumberZero implements IPlayer, TreeSearchSupport<N0Move> {
    
    initializeNode(node: MonteCarloTree<N0Move>): void {
        node.unexploredMoves = this.selectBranches(node.board, node.legalMoves, node.remainingDeck);
    }

    public readonly name: string = 'Number Zero';

    private model?: tf.Model;

    constructor(private readonly options: NumberZeroOptions) {
    }

    public async calculateMove(board: FastBoard, remainingDeck: Deck, tile: Tile): Promise<Move | undefined> {
        const root = new MonteCarloTree(board, tile, remainingDeck, this);

        performMcts(root, this.options);

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        await this.trainNetwork(root, remainingDeck);

        const bestMove = root.bestMove();
        return bestMove && bestMove.move;
    }

    public printIterationsAndSelector(): string {
        return '';
    }

    public upperConfidenceBound(node: MonteCarloTree<N0Move>, parentVisitCount: number) {
        const explorationFactor = 1;
        // We have a slighly modified UCB; incorporate the predicted value with
        // weight 1.
        return node.meanScore + explorationFactor * Math.sqrt(Math.log(parentVisitCount) / node.timesVisited);
    }

    /**
     * Load the model from disk
     */
    public async initialize() {
        try {
            // Throws an error if file doesn't exist, in which case we use the defaulted model
            this.model = await tf.loadModel(MODEL_DIR + '/model.json');
            console.log('Model loaded from disk.');
        } catch(e) {
            console.error(e.message);
            console.log('Creating new model.');
            // The shape of this network has been literally pulled out of my ass
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: [BOARD_SIZE * BOARD_SIZE + CARD_TYPES],
                        units: 150,
                        activation: 'relu',
                        kernelInitializer: 'randomUniform',
                        useBias: true
                    }),
                    tf.layers.dense({
                        units: 50,
                        activation: 'relu',
                        kernelInitializer: 'randomUniform',
                        useBias: true,
                    }),
                    tf.layers.dense({
                        units: 1,
                        activation: 'relu',
                        kernelInitializer: 'randomUniform',
                        useBias: true
                    }),
                ]
            });
        }
        // Why these settings?  ¯\_(ツ)_/¯
        this.model.compile({
            optimizer: tf.train.sgd(0.01),
            loss: 'meanSquaredError'
        });
    }

    public async gameFinished(board: FastBoard): Promise<void> {
    }

    /**
     * Return all branches, but annotate them with a predicted score.
     */
    public selectBranches(board: FastBoard, moves: CandidateMove[], remainingDeck: Deck): MonteCarloMove<N0Move>[] {
        if (!this.model) { throw new Error('Call initialize() first'); }
        if (moves.length === 0) { return []; }
        const self = this;

        const predictedScores = tf.tidy(() => {
            // A list of new boards
            const cardHisto = remainingDeck.remainingHisto();
            const newBoards = moves.map(m => board.playMoveCopy(m));
            const representations = newBoards.map(board => Array.from(board.heightMap.data).concat(cardHisto));

            const predictedScores = self.model!.predict(tf.tensor2d(representations));
            if (Array.isArray(predictedScores)) throw new Error('nuh-uh'); // Make type checker happy

            return predictedScores;
        });

        const predictedScoresData = predictedScores.dataSync();

        // The values from the output tensor are the predicted scores, annotate
        // the moves with those values.
        const annotatedMoves = moves.map((move, i) => {
            return { move, annotation: { predictedScore: predictedScoresData[i] }};
        });

        tf.dispose(predictedScores);

        return annotatedMoves;
    }

    public pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): MonteCarloMove<N0Move> | undefined {
        const annotatedMoves = this.selectBranches(startingBoard, moves, remainingDeck)
                .map(m => ([m, m.annotation.predictedScore]) as ([MonteCarloMove<N0Move>, number]));
        // Pick a move according to the predicted values
        return weightedPick(annotatedMoves);
    }

    private async trainNetwork(root: MonteCarloTree<N0Move>, remainingDeck: Deck) {
        if (!this.model) { throw new Error('Call initialize() first'); }

        const cardHisto = remainingDeck.remainingHisto();

        // At this point we pretend that the scores we found by MCTSing are the
        // real scores. Teach them to the network.

        const gameRepr = [];
        const boardValues = [];

        if (root.exploredMoves.size === 0) {
            // Nothing to train
            return;
        }

        for (const [move, child] of root.exploredMoves) {
            gameRepr.push(Array.from(child.board.heightMap.data).concat(cardHisto));
            // Take the mean of the predicated and the calculated score, so that
            // we have some game retention.
            boardValues.push([mean([child.meanScore, move.annotation.predictedScore])]);
        }

        console.log(`Training on ${gameRepr.length} samples`);
        await this.saveTrainingSamples(gameRepr, boardValues);

        const X = tf.tensor2d(gameRepr);
        const Y = tf.tensor2d(boardValues);

        await this.model.fit(X, Y);
        await this.model.save(MODEL_DIR);

        tf.dispose(X);
        tf.dispose(Y);
    }

    public scoreForBoard(board: FastBoard, dnf: boolean) {
        // Punish very badly for not finishing the board
        if (dnf) {
            return 0;
        } else {
            return board.score();
        }
    }

    private async saveTrainingSamples(moves: number[][], values: number[][]) {
        const dir = 'samples';
        if (!await exists(dir)) {
            await mkdir(dir);
        }
        await writeFile(`${dir}/${Date.now()}.json`, JSON.stringify({
            moves, values
        }), { encoding: 'utf-8' });
    }
}

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

/**
 * Move annotations
 */
interface N0Move {
    predictedScore: number;
}