require('@tensorflow/tfjs-node'); // Speed up TensorFlow by including this before the actual library
import fs = require('fs');
import tf = require('@tensorflow/tfjs');
import util = require('util');
import { FastBoard, BOARD_SIZE } from "../fast-board";
import { CandidateMove, Move } from "../board";
import { weightedPick } from "../util";
import { IPlayer } from '../player';
import { Deck } from '../cards';
import { Tile } from '../tile';
import { MonteCarloTree, performMcts, printTreeStatistics, TreeSearchSupport, fingerprintAll } from '../algo/monte-carlo';
import { distribution } from '../display';

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
     *
     * @default false
     */
    printTreeStatistics?: boolean;

    /**
     * Base score to add to all moves during a random playout, to encourage exploration
     *
     * @default 10
     */
    randomPlayoutNoiseScore?: number;

    /**
     * Model directory
     */
    modelDir: string;

    /**
     * Exploration factor
     *
     * The higher this number, the more lack of exploration is incorporated
     * into the search.
     *
     * Range: if a node is only visited 1 time, and a 1000 iterations are done,
     * this value is multiplied by ~2.5. So values should be on the order of
     * half of game scores.
     *
     * @default 10
     */
    explorationFactor?: number;
}

export type TrainingSample = [number[], number];

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

    private model?: tf.LayersModel;
    private readonly randomPlayoutNoiseScore: number;
    private readonly explorationFactor: number;
    private readonly trainigSamples = new Array<TrainingSample>();

    constructor(private readonly options: NumberZeroOptions) {
        this.randomPlayoutNoiseScore = options.randomPlayoutNoiseScore !== undefined ? options.randomPlayoutNoiseScore : 5;
        this.explorationFactor = options.explorationFactor !== undefined ? options.explorationFactor : 10;
    }

    public async calculateMove(board: FastBoard, remainingDeck: Deck, tile: Tile): Promise<Move | undefined> {
        if (!this.model) { await this.initialize(); }

        const root = new MonteCarloTree(undefined, board, tile, remainingDeck, this);

        performMcts(root, {
            ...this.options,
            fingerprintNodes: true
        });

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        this.recordTrainingSamples(root);

        const [bestMove, bestNode] = root.bestMoveChild();
        if (bestNode) {
            process.stderr.write(`Picking ${bestNode.fingerprint}, max score ${bestNode.maxScore}, mean score ${bestNode.meanScore}\n`);
        } else {
            process.stderr.write(`No move to make.\n`);
        }

        return bestMove;
    }

    public printIterationsAndSelector(): string {
        return '';
    }

    /**
     * Load the model from disk
     */
    private async initialize() {
        this.model = await tf.loadLayersModel(`file://${this.options.modelDir}/model.json`);
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

        process.stderr.write((scores.length > 0 ? distribution(scores) : '?'));

        // Also do a random rollout on the one node we're initializing. This
        // will correspond to one random rollout per thinking turn.
        node.randomPlayout();
    }

    /**
     * Pick the move to explore
     *
     * Combine exploration with exploitation.
     */
    public upperConfidenceBound(node: MonteCarloTree<N0Annotation>, parentVisitCount: number) {
        return adjustedMeanScore(node)
            + this.explorationFactor * Math.sqrt(Math.log(Math.max(1, parentVisitCount)) / (node.timesVisited + 1));
    }

    /**
     * Pick the move during a "random" playout
     *
     * Random playouts are used to calculate the actual/predicted value of a
     * board position, and will be used to update the NN value of it.
     *
     * Normally we'd pick completely randomly, but that's not a good indication of
     * the real value of a board position; we'd want to pick according to the
     * values predicted by our NN, with some noise to make sure the NN doesn't
     * go myopic.
     */
    public pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined {
        const boards = moves.map(move => startingBoard.playMoveCopy(move));
        const scores = this.predictBoardScores(boards, remainingDeck);

        // Some additional selection noise to prevent moves from starving
        const baseWeight = this.randomPlayoutNoiseScore;

        const annotatedMoves = scores.map((score, i) => ([moves[i], score + baseWeight]) as ([CandidateMove, number]));

        // Pick a move according to the predicted values
        return weightedPick(annotatedMoves);
    }

    /**
     * Predict scores for the given board positions
     */
    private predictBoardScores(boards: FastBoard[], remainingDeck: Deck): number[] {
        if (!this.model) { throw new Error('Call initialize() first'); }
        const self = this;

        if (boards.length === 0) { return []; }

        const cardHisto = remainingDeck.remainingHisto();

        const predictedScores = tf.tidy(() => {
            const representations = boards.map(board => [...board.heightMap.data, ...cardHisto]);

            const predictedScores = self.model!.predict(tf.tensor2d(representations));
            if (Array.isArray(predictedScores)) throw new Error('nuh-uh'); // Make type checker happy

            return predictedScores;
        });

        const ret = Array.from(predictedScores.dataSync());
        tf.dispose(predictedScores);
        return ret.map(w => w >= 0 ? w : 0);
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

    private recordTrainingSamples(root: MonteCarloTree<any>) {
        // Turn every explored node into a training sample, as such:
        // [ state ] -> maxScore
        for (const node of exploredNodes(root)) {
            const repr = [
                ...node.board.heightMap.data,
                ...node.remainingDeck.remainingHisto()
            ];
            this.trainigSamples.push([repr, node.maxScore]);
        }
    }

    public async saveTrainingSamples(dir: string) {
        if (!await exists(dir)) {
            await mkdir(dir);
        }
        await writeFile(
            `${dir}/${Date.now()}.json`,
            JSON.stringify({
                board_size: BOARD_SIZE,
                samples: this.trainigSamples
            }),
            { encoding: 'utf-8' });
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

function* exploredNodes<T>(root: MonteCarloTree<T>): IterableIterator<MonteCarloTree<T>> {
    if (root.timesVisited > 0) {
        yield root;
    }
    for (const [_, node] of root.exploredMoves) {
        yield* exploredNodes(node);
    }
}