import { Board, Move } from "./board";
import { Tile } from "./tile";
import { Deck } from "./cards";

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
    calculateMove(board: Board, deck: Deck, tile: Tile): Promise<Move | undefined>;

    /**
     * Prints info about the player needed for logging
     */
    printIterationsAndSelector() : string;

    /**
     * Called when the game is over
     */
    gameFinished(board: Board): Promise<void>;
}
