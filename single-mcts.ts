import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playStandardDecks, playFixedDeck, FIXED_DECKS } from "./lib/test-harness";
import { Board, CandidateMove } from "./lib/board";

// Standardized test bench for the Willow player

function selector(startingBoard: Board, moves: CandidateMove[]):CandidateMove[]{
    //new selection strategy, see how many holes are possible and select smallest options

    function numberOfHolesForThisMove(move:CandidateMove){
        const board = new Board(startingBoard);
        board.playMove(move);
        return board.holesAt(move.targetLevel);
    }

    function boundingBoxForThisMove(move:CandidateMove){
        const board = new Board(startingBoard);
        board.playMove(move);
        return board.sizeOfBoundingBox(move.targetLevel);
    }

    function boundingBoxShapeForThisMove(move:CandidateMove){
        const board = new Board(startingBoard);
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


function boardCalculator(board: Board):number{


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
        branchSelector: selector,
        filenamePrefix: 'testboard',
    });

    await playFixedDeck(player, FIXED_DECKS[0]);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});