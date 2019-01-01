import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playFixedDeck, FIXED_DECKS, playStandardDecks } from "./lib/test-harness";
import { mean, standardDeviation } from "./lib/util";
import { FastBoard } from "./lib/fast-board";
import { Tile } from "./lib/tile";
import { Move, CandidateMove } from "./lib/board";

import fs = require('fs');
import util = require('util');

const appendFile = util.promisify(fs.appendFile);

// Standardized test bench for the Willow player

function boardCalculator(board: FastBoard):number{
    return board.score();
}

function selector(startingBoard: FastBoard, moves: CandidateMove[]):CandidateMove[]{
    const ret = moves.filter(move => {
    
        const board = new FastBoard(startingBoard);
    
        board.playMove(move);
    
        const maxSize = 12;
        const sizeOK = board.widthOfBoudingBox() < maxSize && board.heightOfBoundingBox() < maxSize;
    
        if (board.turnsPlayed < 5){
            return board.holesAt(0) <= 6 ;
        }
        else{
            return board.holesAt(0) <= 20 && sizeOK;
        }
    })

    return ret;

}

async function main() {
    const player = new MonteCarloTreePlayer({
        // Iterations so we don't depend on CPU speed for results
        maxIterations: 100,
        printTreeStatistics: true,
        boardScoreCalculator: boardCalculator,
        branchSelectorString: '>5 turns width and height < 12',
        boardScoreCalculatorString: 'board.score()',
        branchSelector: selector
    });

    const plays_per_deck = 5;
    const deck_number = 5;
    const stats = await playStandardDecks(player, plays_per_deck);
    //const stats = await playFixedDeck(player, FIXED_DECKS[deck_number], plays_per_deck);

    console.log(stats);

    await appendFile('willow-stats.txt', stats + '\n');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});