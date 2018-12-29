import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";
import { MonteCarloPlayer } from "./lib/players/monte-carlo-player";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { FastBoard } from "./lib/fast-board";


function boardCalculator(board: FastBoard):number{

    return 50 + board.score()*2 - board.holesAt(0)*3; //reward for less holes
}

function selector(board: FastBoard):boolean{
        const select = board.holesAt(0) < 20;
        return select;
    }



const game = new Game([
    new RandomPlayer(),
    new MonteCarloTreePlayer({
        maxIterations: 10,
        printTreeStatistics: true,
        boardScoreCalculator: boardCalculator,
        branchSelector: selector

    }),
//    new MonteCarloPlayer(),
]);

game.play();

game.report();


