import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";
import { MonteCarloPlayer } from "./lib/players/monte-carlo-player";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { FastBoard } from "./lib/fast-board";
import { Tile } from "./lib/tile";
import { CandidateMove } from "./lib/board";

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


function boardCalculator(board: FastBoard):number{

    return 50 + board.score()*2 - board.holesAt(0)*3; //reward for less holes
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