import * as tile from "./lib/tile";
import * as cards from "./lib/cards";
import * as b from "./lib/board";
import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";
import { MonteCarloPlayer } from "./lib/players/monte-carlo-player";

const game = new Game([
//    new RandomPlayer(),
    new MonteCarloPlayer(),
]);

game.play();

game.report();