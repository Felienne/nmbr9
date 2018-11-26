import * as tile from "./lib/tile";
import * as cards from "./lib/cards";
import * as b from "./lib/board";
import { Game } from "./lib/game";
import { RandomPlayer } from "./lib/players/random-player";

const game = new Game([
    new RandomPlayer()
]);

game.play();

game.report();