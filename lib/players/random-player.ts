import { Board, Direction, Placement } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom } from '../util';
import { displayBoard } from '../display';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public move(board: Board, tile: Tile): Placement {

        const options = board.getOptions();
        let locs = options.filter(p => board.canPlace(tile, {x:p.x, y:p.y, direction: Direction.Up}));
        const loc = getRandom(locs);
        console.log("I think I'm going to play", loc)
        return { x: loc.x, y: loc.y, direction: Direction.Up };
    }
}