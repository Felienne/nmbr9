import { Board, Orientation, Move } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public calculateMove(board: FastBoard, deck:Deck, tile: Tile): Move | undefined {

        const loc = getRandom(board.getLegalMoves(tile));

        if (loc) {
            console.log("Hmmm... I think I'm going to play", loc)
            return loc;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }
}