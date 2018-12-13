import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playFixedDeck, FIXED_DECKS } from "./lib/test-harness";
import { mean, standardDeviation } from "./lib/util";

// Standardized test bench for the Willow player

const player = new MonteCarloTreePlayer({
    // Iterations so we don't depend on CPU speed for results
    maxIterations: 100,
    printTreeStatistics: true,
});

//const avgScore = testPlayer(player);
const scores = playFixedDeck(player, FIXED_DECKS[0], 10);

console.log('Mean:  ', mean(scores));
console.log('StdDev:', standardDeviation(scores));
