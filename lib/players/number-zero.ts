import { MonteCarloTreePlayer } from "./monte-carlo-tree-hugger";
import { FastBoard, TILE_WIDTH, TILE_HEIGHT } from "../fast-board";
import { Tile } from "../tile";
import { Move, CandidateMove } from "../board";

// Speed up TensorFlow
require('@tensorflow/tfjs-node');
import tf = require('@tensorflow/tfjs');
import { mean } from "../util";
import { timeDistributed } from "@tensorflow/tfjs-layers/dist/exports_layers";

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

    private model: tf.Model;

    // These fields will be used to keep track of what decisions we made
    // during the most recent game. They will be converted into training
    // samples when the game concludes.
    private readonly trainingSamples: tf.Tensor[] = [];
    private readonly decisions: number[] = [];

    private readonly averageScores: number[] = [];

    constructor(options: NumberZeroOptions) {
        super(options);

        this.model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [TILE_WIDTH*TILE_HEIGHT + 10 + 4], units: 100 }),
                tf.layers.dense({ units: 40 }),  // https://stats.stackexchange.com/questions/181/how-to-choose-the-number-of-hidden-layers-and-nodes-in-a-feedforward-neural-netw
                tf.layers.dense({ units: 1 }), // Output layer
            ]
        });
        // Why these settings?  ¯\_(ツ)_/¯
        // https://github.com/tensorflow/tfjs-examples/blob/master/website-phishing/index.js
        this.model.compile({optimizer: 'adam', loss: 'binaryCrossentropy'});
    }

    public async gameFinished(board: FastBoard): Promise<void> {
        console.log('gameFinished');
        // Train on accumulated samples, reinforcing if our score is better
        // than the
        const meanScore = mean(this.averageScores);
        const decisionsTensor = tf.tidy(() => {
            const decisionsTensor = tf.tensor1d(this.decisions);
            if (board.score() >= meanScore) {
                // Reinforce
                return decisionsTensor;
            }

            // Should have predicted the opposite
            return decisionsTensor.mul(-1);
        });

        console.log(`Training on ${this.trainingSamples.length} samples`);
        await this.model.fit(this.trainingSamples, decisionsTensor);

        // Clean that shit up
        tf.dispose(decisionsTensor);
        tf.dispose(this.trainingSamples);
        this.trainingSamples.splice(0); // clear
        this.decisions.splice(0); // clear
    }

    public selectBranches(board: FastBoard, moves: CandidateMove[]): CandidateMove[] {
        const self = this;

        return moves.filter(move => {
            // Get the height map at the given position and level.
            return tf.tidy(function() {
                const localArea = tf.tensor1d(board.heightMapAtLevel(move, TILE_WIDTH, TILE_HEIGHT, move.targetLevel));
                const tileNr = tf.oneHot([move.tile.value], 10).reshape([-1]).toFloat();
                const orientation = tf.oneHot([move.orientation - 1], 4).reshape([-1]).toFloat(); // ???

                // Will not be disposed!
                const inputTensor = tf.keep(tf.concat([localArea, tileNr, orientation]));

                const prediction = self.model.predict(inputTensor.reshape([1, -1]));
                if (Array.isArray(prediction)) throw new Error('nuh-uh'); //Make type checker happy

                const predictedValue = prediction.get(0, 0);

                // Remember decisions for training later (in gameFinished)
                const decision = predictedValue > 0;
                self.trainingSamples.push(inputTensor);
                self.decisions.push(decision ? 1 : -1);

                return decision;
            });
        });
    }
}
