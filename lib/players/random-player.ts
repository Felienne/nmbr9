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
        let locs = board.getOptions().filter(p => board.canPlace(tile, { direction: Direction.Up, ...p }));
        const loc = getRandom(locs);
        return { x: loc.x, y: loc.y, direction: Direction.Up };
    }
}