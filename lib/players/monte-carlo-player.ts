import { Board, Move } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, range } from '../util';
import { Deck } from '../cards';
import { GameState } from '../game-state';

/**
 * This player executes a simple MC algorithm
 */
export class MonteCarloPlayer implements IPlayer {
    public readonly name: string = 'Carlo McMonte';

    public printIterationsAndSelector(){
        return 'determined by a fair dice roll';
    }

    public async calculateMove(state: GameState): Promise<Move | undefined> {

        const moves = state.legalMoves();
        let maxMoveScore = 0;
        let maxMove = undefined;
        for (const m of moves){
            const MoveMax = this.maxScore(state.board.copy(), state.deck, m);
            if (MoveMax > maxMoveScore){
                maxMoveScore = MoveMax;
                maxMove = m;
            }
        }


        if (maxMove) {
            console.log("Hmmm... I think I'm going to play", maxMove)
            return maxMove;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }

    private maxScore(board: Board, deck: Deck, p: Move): number{
        const maxNumberofTries = 100;
        //plaats deze tile op het bord in deze orientatie
        board.place(deck.currentTile, p);

        let maxScore = 0;

        //nu gaan we voor deze plaatsing een aantal mogelijke trekkingen proberen
        for (const i of range(maxNumberofTries)){
            const tryDeck = deck.copy();
            tryDeck.shuffle();
            const tryBoard = new Board(board);

            while (tryDeck.hasCards) {
                const drawnTile = tryDeck.currentTile;

                const move = pick(Array.from(tryBoard.getLegalMoves(drawnTile)));
                if (move === undefined) { break; } // End of game. FIXME: Should we score 0 to penalize harder?
                tryBoard.place(drawnTile, move);

                tryDeck.advance();
            }

            if (tryBoard.score() > maxScore){
                maxScore = tryBoard.score();
            }

        }
        return maxScore;
    }

    public async gameFinished(board: Board): Promise<void> {
    }
}