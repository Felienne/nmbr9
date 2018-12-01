import { Board, Direction, Placement, Point } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom, range } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';

/**
 * This player picks a move at random
 */
export class MonteCarloPlayer implements IPlayer {
    public readonly name: string = 'Carlo McMonte';

    public move(board: Board, deck:Deck, tile: Tile): Placement | undefined {

        const moves = board.getLegalPlacements(tile); //TODO: placements should be named moves! (everywhere)
        let max = 0;
        let maxPlacement = undefined;
        for (const m of moves){
            const MoveMax = this.maxScore(new Board(board),deck, tile, m);
            if (MoveMax > max){
                max = MoveMax;
                maxPlacement = m;
            }
        }


        if (maxPlacement) {
            console.log("Hmmm... I think I'm going to play", maxPlacement)
            return maxPlacement;
        }

        console.log("Oh blimey. Apparently I didn't find any possible moves?");
        return undefined;
    }

    private maxScore(board: Board, deck:Deck, t:Tile, p:Placement): number{
        const maxNumberofTries = 10;
        //plaats deze tile op het bord in deze orientatie
        board.place(t,p)

        let maxScore = 0;

        //nu gaan we voor deze plaatsing een aantal mogelijke trekkingen proberen
        for (const i of range(maxNumberofTries)){
            const tryDeck = new Deck(deck);
            const tryBoard = new Board(board);

            let drawnTile = tryDeck.drawTile();
            while (drawnTile !== undefined) {
                const move = getRandom(tryBoard.getLegalPlacements(drawnTile));
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