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
        return board.sizeOfBoundingBox(move.targetLevel);
    }

    function boundingBoxShapeForThisMove(move:CandidateMove){
        const board = new FastBoard(startingBoard);
        board.playMove(move);
        return Math.abs(1-board.shapeOfBoundingBox(move.targetLevel));
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

    //kijk ook naar de 'vierkantste' vorm
    const allBoundingBoxesShapes = ret.map(boundingBoxShapeForThisMove);
    const minBoundingBoxShape = Math.min(...allBoundingBoxesShapes)
    //console.log(minBoundingBoxShape)

    const ret3 = ret2.filter((move,i) => { 
        return allBoundingBoxesShapes[i] <= minBoundingBoxShape + 0.5
    })

    return ret3;

}


function boardCalculator(board: FastBoard):number{


    return board.score();
}

async function main() {
    const player = new MonteCarloTreePlayer({
        // Iterations so we don't depend on CPU speed for results
        maxIterations: 1000,
        printTreeStatistics: true,
        boardScoreCalculator: boardCalculator,
        branchSelectorString: 'min holes targetlevel + 3 and min boundingbox + 5 + min shape + 0.5',
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