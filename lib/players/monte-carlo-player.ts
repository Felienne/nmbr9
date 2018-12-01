import { Board, Direction, Placement, Point } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { getRandom, range } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';

/**
 * This player picks a move at random
 */
export class RandomPlayer implements IPlayer {
    public readonly name: string = 'Carlo McMonte';

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

    private maxScore(board: Board, deck:Deck, t:Tile, p: Point, d: Direction): number{
        const maxNumberofTries = 10;
        //plaats deze tile op het bord in deze orientatie
        board.place(t,{x:p.x, y:p.y, direction: Direction.Up})

        let maxScore = 0;

        //nu gaan we voor deze plaatsing een aantal mogelijke trekkingen proberen
        for (const i of range(maxNumberofTries)){
            const remainingDeckForThisRound = new Deck(deck);

            let scoreForTry = 0;

            let drawnCard = remainingDeckForThisRound.draw();
            while (drawnCard !== false) {
                const { turn, value }  = drawnCard;





                drawnCard = remainingDeckForThisRound.draw();
            }
        }
        return maxScore;
    }
}