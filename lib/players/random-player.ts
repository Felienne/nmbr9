import { Board, Direction, Placement } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public move(board: Board, deck:Deck, tile: Tile): Placement | undefined {

        const options = board.getOptions();
        let locs = options.filter(p => board.canPlace(tile, p));
        const loc = getRandom(locs);

        if (loc) {
            console.log("Hmmm... I think I'm going to play", loc)
            return loc;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }
}