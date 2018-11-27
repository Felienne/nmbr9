import { Direction, Board, Placement } from "./board";
import { Tile } from "./tile";

/**
 * Interface that should be implemented by Players
 */
export interface IPlayer {
    /**
     * Name of this player
     */
    readonly name: string;

    /**
     * Called when the player needs to make a move
     */
    move(board: Board, tile: Tile): Placement | undefined;
}
