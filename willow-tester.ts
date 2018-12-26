import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playFixedDeck, FIXED_DECKS, playStandardDecks } from "./lib/test-harness";
import { mean, standardDeviation } from "./lib/util";
import { FastBoard } from "./lib/fast-board";

// Standardized test bench for the Willow player

function boardCalculator(board: FastBoard):number{

    return 50 + board.score()*2 - board.holesAt(0)*3; //reward for less holes
}


const player = new MonteCarloTreePlayer({
    // Iterations so we don't depend on CPU speed for results
    maxIterations: 10000,
    printTreeStatistics: true,
    boardScoreCalculator: boardCalculator
});

const scores = playStandardDecks(player, 1);
//const scores = playFixedDeck(player, FIXED_DECKS[0], 10);

console.log('Mean:  ', mean(scores));
console.log('StdDev:', standardDeviation(scores));

// Run op 80x80
// Mean:   11.6
// StdDev: 7.213875518748574
