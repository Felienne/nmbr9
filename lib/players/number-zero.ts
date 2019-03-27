require('@tensorflow/tfjs-node'); // Speed up TensorFlow by including this before the actual library
import fs = require('fs');
import tf = require('@tensorflow/tfjs');
import util = require('util');
import { FastBoard, BOARD_SIZE } from "../fast-board";
import { CandidateMove, Move } from "../board";
import { weightedPick } from "../util";
import { IPlayer } from '../player';
import { Deck, CARD_TYPES } from '../cards';
import { Tile } from '../tile';
import { MonteCarloTree, performMcts, printTreeStatistics, TreeSearchSupport, defaultUpperConfidenceBound } from '../algo/monte-carlo';
import { distribution } from '../display';
import { ModelLoggingVerbosity } from '@tensorflow/tfjs-layers/dist/base_callbacks';

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
export class NumberZero implements IPlayer, TreeSearchSupport<N0Annotation> {
    public readonly name: string = 'Number Zero';


    private model?: tf.Model;

    constructor(private readonly options: NumberZeroOptions) {
    }

    public async calculateMove(board: FastBoard, remainingDeck: Deck, tile: Tile): Promise<Move | undefined> {
        const root = new MonteCarloTree(undefined, board, tile, remainingDeck, this);

        performMcts(root, this.options);

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        await this.trainNetwork(root, remainingDeck);

        return root.bestMove();
    }

    public printIterationsAndSelector(): string {
        return '';
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
                        units: 50,
                        activation: 'ReLU',
                    }),
                    tf.layers.dense({
                        units: 1,
                    }),
                ]
            });
        }
        // Why these settings?  ¯\_(ツ)_/¯
        this.model.compile({
            optimizer: tf.train.sgd(0.0001), // Higher learning rate makes loss explode
            loss: 'meanSquaredError'
        });
    }

    /**
     * False because we treat NN predictions as random rollouts
     */
    public readonly continueExploringAfterInitialize = false;

    public initializeNode(node: MonteCarloTree<N0Annotation>): void {
        // All nodes are immediately explored, and use the NN to attach a score to it
        const children = node.legalMoves.map(move => node.addExploredNode(move));

        // The values from the output tensor are the predicted scores, annotate
        // the moves with those values.
        const scores = this.predictBoardScores(children.map(c => c.board), node.remainingDeck);
        children.forEach((child, i) => {
            // Store the predicted score on the node and use it for
            // exploration selection later on.
            child.annotation = { predictedScore: scores[i] };
        });

        process.stderr.write((scores.length > 0 ? distribution(scores) : '?') + '\n');

        // Also do a random rollout on the one node we're initializing. This
        // will correspond to one random rollout per thinking turn.
        node.randomPlayout();
    }

    public upperConfidenceBound(node: MonteCarloTree<N0Annotation>, parentVisitCount: number) {
        const explorationFactor = 0.5;

        return adjustedMeanScore(node)
            + explorationFactor * Math.sqrt(Math.log(Math.max(1, parentVisitCount)) / (node.timesVisited + 1));
    }

    public pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined {
        const boards = moves.map(move => startingBoard.playMoveCopy(move));
        const scores = this.predictBoardScores(boards, remainingDeck);

        // Some additional selection noise to prevent moves from starving
        const baseWeight = 0.5;

        const annotatedMoves = scores.map((score, i) => ([moves[i], score + baseWeight]) as ([CandidateMove, number]));

        // Pick a move according to the predicted values
        return weightedPick(annotatedMoves);
    }

    private predictBoardScores(boards: FastBoard[], remainingDeck: Deck): number[] {
        if (!this.model) { throw new Error('Call initialize() first'); }
        const self = this;

        if (boards.length === 0) { return []; }

        const cardHisto = remainingDeck.remainingHisto();

        const predictedScores = tf.tidy(() => {
            const representations = boards.map(board => Array.from(board.heightMap.data).concat(cardHisto));

            const predictedScores = self.model!.predict(tf.tensor2d(representations));
            if (Array.isArray(predictedScores)) throw new Error('nuh-uh'); // Make type checker happy

            return predictedScores;
        });

        const ret = Array.from(predictedScores.dataSync());
        tf.dispose(predictedScores);
        return ret.map(w => w >= 0 ? w : 0);
    }

    private async trainNetwork(root: MonteCarloTree<N0Annotation>, remainingDeck: Deck) {
        if (!this.model) { throw new Error('Call initialize() first'); }

        const cardHisto = remainingDeck.remainingHisto();

        // At this point we pretend that the scores we found by MCTSing are the
        // real scores. Teach them to the network.

        const gameRepr = [];
        const boardValues = [];

        for (const child of root.exploredMoves.values()) {
            // Every node will have a visitcount of 1, but we only want to train
            // on nodes that have had additional exploration.
            if (child.timesVisited > 0) {
                gameRepr.push(Array.from(child.board.heightMap.data).concat(cardHisto));
                // Take the mean of the predicated and the calculated score, so that
                // we have some game retention.
                boardValues.push(child.maxScore);
            }
        }

        if (gameRepr.length === 0) {
            return; // Nothing to train
        }

        console.log(`Training on ${gameRepr.length} samples (${distribution(boardValues)})`);
        await this.saveTrainingSamples(gameRepr, boardValues);

        const X = tf.tensor2d(gameRepr);
        const Y = tf.tensor1d(boardValues);

        console.log(`${boardValues}`);

        const output = await this.model.fit(X, Y, {
            verbose: ModelLoggingVerbosity.SILENT,
            shuffle: true,
            epochs: 100,
        });
        console.log('Loss', output.history.loss && output.history.loss[output.history.loss.length - 1]);
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

    public async gameFinished(board: FastBoard): Promise<void> {
    }

    private async saveTrainingSamples(moves: number[][], values: number[]) {
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
interface N0Annotation {
    predictedScore: number;
}

/**
 * Mean score that incorporates the NN prediction as a single "visit"
 */
function adjustedMeanScore(node: MonteCarloTree<N0Annotation>) {
    return (node.totalScore + node.annotation!.predictedScore) / (node.timesVisited + 1);
}