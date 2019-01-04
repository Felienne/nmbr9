require('@tensorflow/tfjs-node'); // Speed up TensorFlow by including this before the actual library
import tf = require('@tensorflow/tfjs');
import { MonteCarloTreePlayer } from "./monte-carlo-tree-hugger";
import { FastBoard, TILE_WIDTH, TILE_HEIGHT } from "../fast-board";
import { CandidateMove } from "../board";
import { mean } from "../util";

const MODEL_FILENAME = 'file://numberzero.model';

// BranchSelector -- board + tile + move
// Post-game feedback function

export interface NumberZeroOptions {
    /**
     * How many iterations to run
     */
    maxIterations?: number;

    /**
     * How many seconds to run, at most
     */
    maxThinkingTimeSec?: number;
}

export class NumberZero extends MonteCarloTreePlayer {
    public readonly name: string = 'Number Zero';

    private model?: tf.Model;

    // These fields will be used to keep track of what decisions we made
    // during the most recent game. They will be converted into training
    // samples when the game concludes.
    private readonly trainingSamples: tf.Tensor[] = [];
    private readonly decisions: number[] = [];

    private readonly averageScores: number[] = [];

    constructor(options: NumberZeroOptions) {
        super(options);
    }

    /**
     * Load the model from disk
     */
    public async initialize() {
        try {
            // Throws an error if file doesn't exist, in which case we use the defaulted model
            this.model = await tf.loadModel(MODEL_FILENAME);
        } catch(e) {
            console.error(e);
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [TILE_WIDTH*TILE_HEIGHT + 10 + 4], units: 100 }),
                    tf.layers.dense({ units: 40 }),  // https://stats.stackexchange.com/questions/181/how-to-choose-the-number-of-hidden-layers-and-nodes-in-a-feedforward-neural-netw
                    tf.layers.dense({ units: 1 }), // Output layer
                ]
            });
        }
        // Why these settings?  ¯\_(ツ)_/¯
        // https://github.com/tensorflow/tfjs-examples/blob/master/website-phishing/index.js
        this.model.compile({optimizer: 'adam', loss: 'binaryCrossentropy'});
    }

    public async gameFinished(board: FastBoard): Promise<void> {
        if (!this.model) { throw new Error('Call initialize() first'); }

        // Train on accumulated samples, reinforcing if our score is better
        // than the
        const meanScore = mean(this.averageScores);
        const decisionsTensor = tf.tidy(() => {
            const decisionsTensor = tf.tensor1d(this.decisions);
            if (board.score() >= meanScore) {
                // Reinforce
                console.log('We did well--training up!');
                return decisionsTensor;
            }

            // Should have predicted the opposite
            console.log('We did not do so well--training down');
            return decisionsTensor.mul(-1);
        });

        const inputTensor = tf.concat(this.trainingSamples);

        await this.model.fit(inputTensor, decisionsTensor);
        await this.model.save(MODEL_FILENAME);

        // Clean that shit up
        tf.dispose(inputTensor);
        tf.dispose(decisionsTensor);
        tf.dispose(this.trainingSamples);
        this.trainingSamples.splice(0); // clear
        this.decisions.splice(0); // clear
    }

    public selectBranches(board: FastBoard, moves: CandidateMove[]): CandidateMove[] {
        if (!this.model) { throw new Error('Call initialize() first'); }
        const self = this;

        const outputTensor = tf.tidy(() => {
            // Input tensors are not disposed!
            const inputTensors = moves.map(move => {
                // Get the height map at the given position and level.
                const localArea = tf.tensor1d(board.heightMapAtLevel(move, TILE_WIDTH, TILE_HEIGHT, move.targetLevel).data).toFloat();
                const tileNr = tf.oneHot([move.tile.value], 10).reshape([-1]).toFloat();
                const orientation = tf.oneHot([move.orientation - 1], 4).reshape([-1]).toFloat(); // ???

                return tf.concat([localArea, tileNr, orientation]);
            });

            // Will not be disposed!
            const combinedInput = tf.stack(inputTensors);

            const outputTensor = self.model!.predict(combinedInput);
            if (Array.isArray(outputTensor)) throw new Error('nuh-uh'); // Make type checker happy

            self.trainingSamples.push(tf.keep(combinedInput));
            return outputTensor;
        });

        // Predictions for whether or not to pick these values
        // Value >= 0 == select, < 0 == reject
        const decisions: boolean[] = (outputTensor as any).dataSync().map((x: number) => x >= 0);
        self.decisions.push(...decisions.map(x => x ? 1 : -1));

        return moves.filter((_, i) => decisions[i]);
    }
}
