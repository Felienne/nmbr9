import { Board, Orientation, Move, Point } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, range } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';

/**
 * This player executes a simple MC algorithm
 */
export class MonteCarloPlayer implements IPlayer {
    public readonly name: string = 'Carlo McMonte';

    public calculateMove(board: FastBoard, deck:Deck, tile: Tile): Move | undefined {

        const moves = board.getLegalMoves(tile);
        let maxMoveScore = 0;
        let maxMove = undefined;
        for (const m of moves){
            const MoveMax = this.maxScore(new FastBoard(board),deck, tile, m);
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

    private maxScore(board: FastBoard, deck:Deck, t:Tile, p:Move): number{
        const maxNumberofTries = 100;
        //plaats deze tile op het bord in deze orientatie
        board.place(t,p)

        let maxScore = 0;

        //nu gaan we voor deze plaatsing een aantal mogelijke trekkingen proberen
        for (const i of range(maxNumberofTries)){
            const tryDeck = new Deck(deck);
            const tryBoard = new FastBoard(board);

            let drawnTile = tryDeck.drawTile();
            while (drawnTile !== undefined) {
                const move = pick(tryBoard.getLegalMoves(drawnTile));
                if (move === undefined) { break; } // End of game. FIXME: Should we score 0 to penalize harder?
                tryBoard.place(drawnTile, move);

                drawnTile = tryDeck.drawTile();
            }

            if (tryBoard.score() > maxScore){
                maxScore = tryBoard.score();
            }

        }
        return maxScore;
    }
}