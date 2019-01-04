import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";
import { MonteCarloPlayer } from "./lib/players/monte-carlo-player";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { FastBoard } from "./lib/fast-board";
import { Tile } from "./lib/tile";
import { CandidateMove } from "./lib/board";

function selector(startingBoard: FastBoard, moves: CandidateMove[]):CandidateMove[]{
    //new selection strategy, see how many holes are possible and select smallest options

    function numberOfHolesForThisMove(move:CandidateMove){
        const board = new FastBoard(startingBoard);
        board.playMove(move);
        return board.holesAt(1);
    }

    function boundingBoxForThisMove(move:CandidateMove){
        const board = new FastBoard(startingBoard);
        board.playMove(move);
        return board.sizeOfBoundingBox();
    }



    const allHoles = moves.map(numberOfHolesForThisMove);
    const minNumberofHoles = Math.min(...allHoles)

    const ret = moves.filter((move,i) => { 
        return allHoles[i] === minNumberofHoles
    })

    const allBoundingBoxes = ret.map(boundingBoxForThisMove);
    const minBoundingBox = Math.min(...allBoundingBoxes)

    const ret2 = ret.filter((move,i) => { 
        return allBoundingBoxes[i] === minBoundingBox
    })

    return ret2;

}


function boardCalculator(board: FastBoard):number{

    return board.score()*2 + board.maxHeight()*2;
}

const game = new Game([
    new RandomPlayer(),
    new MonteCarloTreePlayer({
        maxIterations: 100,
        printTreeStatistics: true,
        boardScoreCalculator: boardCalculator,
        branchSelector: selector,
    }),
//    new MonteCarloPlayer(),
]);

async function main() {
    await game.play();
    game.report();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});