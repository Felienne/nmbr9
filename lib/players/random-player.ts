import { Board, Move } from '../board';
import { IPlayer } from "../player";
import { pick } from '../util';
import { GameState } from '../game-state';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Randy McRandFace';

    public async calculateMove(state: GameState): Promise<Move | undefined> {
        const loc = pick(state.legalMoves());

        if (loc) {
            return loc;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }

    public printIterationsAndSelector(){
        return 'determined by a fair dice roll';
    }

    public async gameFinished(board: Board): Promise<void> {
    }
}