import { playStandardDecks, playFixedDeck } from "./lib/test-harness";
import yargs = require('yargs');

import fs = require('fs');
import util = require('util');
import { NumberZero } from "./lib/players/number-zero";
import { Deck } from "./lib/cards";

const appendFile = util.promisify(fs.appendFile);

// Standardized test bench for the Willow player

async function main() {
    const args = yargs
        .option('model', { alias: 'm', type: 'string', required: true, description: 'location of the model to load' })
        .option('playout-noise', { alias: 'n', type: 'number', description: 'bias score to add to scores for playout' })
        .option('samples', { alias: 's', type: 'string', description: 'where to write samples' })
        .argv;

    const player = new NumberZero({
        // Iterations so we don't depend on CPU speed for results
        maxIterations: 100,
        printTreeStatistics: true,
        modelDir: args.model,
        randomPlayoutNoiseScore: args["playout-noise"],
        explorationFactor: 10
    });

    const deck = Deck.fixedDeck([2, 0, 6, 8, 2, 4, 5, 7, 0, 9, 8, 3, 1, 4, 6, 9, 5, 3, 7, 1])
    const stats = await playFixedDeck(player, deck)
    console.log(`${new Date()} ${stats}`);

    if (args.samples) {
        await player.saveTrainingSamples(args.samples);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
