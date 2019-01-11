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

function selector(startingBoard: FastBoard, moves: CandidateMove[]):CandidateMove[]{
    //new selection strategy, see how many holes are possible and select smallest options

    function numberOfHolesForThisMove(move:CandidateMove){
        const board = new FastBoard(startingBoard);
        board.playMove(move);
        return board.holesAt(move.targetLevel);
    }

    function boundingBoxForThisMove(move:CandidateMove){
        const board = new FastBoard(startingBoard);
        board.playMove(move);
        return board.sizeOfBoundingBox(1);
    }

    const allHoles = moves.map(numberOfHolesForThisMove);
    const minNumberofHoles = Math.min(...allHoles)

    const ret = moves.filter((move,i) => { 
        return allHoles[i] <= minNumberofHoles + 3
    })

    const allBoundingBoxes = ret.map(boundingBoxForThisMove);
    const minBoundingBox = Math.min(...allBoundingBoxes)

    const ret2 = ret.filter((move,i) => { 
        return allBoundingBoxes[i] <= minBoundingBox + 5 
    })

    return ret2;

}


function boardCalculator(board: FastBoard):number{

    return board.score()*2;
}

async function main() {
    const player = new MonteCarloTreePlayer({
        // Iterations so we don't depend on CPU speed for results
        maxIterations: 5000,
        printTreeStatistics: true,
        boardScoreCalculator: boardCalculator,
        branchSelectorString: 'min holes targetlevel + 3 and min boundingbox + 5',
        boardScoreCalculatorString: 'board.score',
        branchSelector: selector
    });

    const plays_per_deck = 3;
    const deck_number = 5;
    const stats = await playStandardDecks(player, plays_per_deck);
    //const stats = await playFixedDeck(player, FIXED_DECKS[deck_number], plays_per_deck);

    console.log(stats);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});