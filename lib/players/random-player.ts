import { Board, Orientation, Move } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public calculateMove(board: FastBoard, deck:Deck, tile: Tile): Move | undefined {

        const loc = pick(board.getLegalMoves(tile));

        if (loc) {
            return loc;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }

    public printIterationsAndSelector(){
        return 'determined by a fair dice roll';
    }

    public async gameFinished(board: FastBoard): Promise<void> {
    }
}