import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { testPlayer, playFixedDeck, FIXED_DECKS } from "./lib/test-harness";

// Standardized test bench for the Willow player

const player = new MonteCarloTreePlayer({
    // Iterations so we don't depend on CPU speed for results
    maxIterations: 100,
});

//const avgScore = testPlayer(player);
const avgScore = playFixedDeck(player, FIXED_DECKS[0], 10);

console.log('Mean score:', avgScore);
