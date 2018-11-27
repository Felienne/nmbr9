import { Board, Direction, Placement } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom } from '../util';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public move(board: Board, tile: Tile): Placement {

        const options = board.getOptions();
        console.log("Options are", options)        
        let locs = options.filter(p => board.canPlace(tile, {x:p.x, y:p.y, direction: Direction.Up}));
        console.log("Possible options", locs)        
        const loc = getRandom(locs);
        console.log("Player chooses", loc)
        return { x: loc.x, y: loc.y, direction: Direction.Up };
    }
}