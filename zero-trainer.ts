import { playStandardDecks } from "./lib/test-harness";
import yargs = require('yargs');

import fs = require('fs');
import util = require('util');
import { NumberZero } from "./lib/players/number-zero";

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
        maxIterations: 1000,
        printTreeStatistics: true,
        modelDir: args.model,
        randomPlayoutNoiseScore: args["playout-noise"],
        samplesDirectory: args.samples,
    });

    const plays_per_deck = 3;
    const stats = await playStandardDecks(player, plays_per_deck);

    console.log(stats);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
