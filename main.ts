import * as tile from "./lib/tile";
import * as cards from "./lib/cards";
import * as b from "./lib/board";
import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";
import { MonteCarloPlayer } from "./lib/players/monte-carlo-player";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";

const game = new Game([
    new RandomPlayer(),
    new MonteCarloTreePlayer(),
//    new MonteCarloPlayer(),
]);

game.play();

game.report();