import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playFixedDeck, FIXED_DECKS, mean, standardDeviation } from "./lib/test-harness";

// Standardized test bench for the Willow player

const player = new MonteCarloTreePlayer({
    // Iterations so we don't depend on CPU speed for results
    maxIterations: 100,
});

//const avgScore = testPlayer(player);
const scores = playFixedDeck(player, FIXED_DECKS[0], 10);

console.log('Mean:  ', mean(scores));
console.log('StdDev:', standardDeviation(scores));
