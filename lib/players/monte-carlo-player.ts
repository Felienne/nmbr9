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
        let locs = options.filter(p => board.canPlace(tile, {x:p.x, y:p.y, direction: Direction.Up}));
        const loc = getRandom(locs);

        if (loc) {
            console.log("Hmmm... I think I'm going to play", loc)
            return { x: loc.x, y: loc.y, direction: Direction.Up };
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
            let scoreForTry = 0;
            for (const j of range(deck.remainingCards().length)){
                //trek een kaart
                let drawnCard = deck.draw();
                if (drawnCard !== false){ // dit staat hier alleen om de compiler tevreden te houden
                                          // stil maar compilertje, er komt geen false hoor!
                    const { turn, value }  = drawnCard;
                    
                //TODO: hier verder
                //hier weer het maximum voor die kaart rekenen en 
                //dan optellen allemaal
    
                }
            }
        }
        return maxScore;
    }
}