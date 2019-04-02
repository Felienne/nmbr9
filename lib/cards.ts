import { Tile } from "./tile";
import { shuffle } from "./util";

export const CARD_TYPES = 20;

export class Deck {
    /**
     * Return a fixed Deck with the given cards
     */
    public static fixedDeck(cardValues: number[]) {
        const ret = new Deck();
        ret.remainingCards = cardValues.map((v, i) => new Tile(v, i));
        return ret;
    }

    public static standardDeck(): Deck {
        const values = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
        return Deck.fixedDeck(values).shuffle();
    }

    public remainingCards: Tile[];

    public constructor(d?: Deck)
    {
        if (d === undefined) {
            this.remainingCards = [];
        }
        else {
            this.remainingCards = d.remainingCards.slice();
        }
    }

    public get isEmpty(): boolean {
        return this.remainingCards.length === 0;
    }

    /**
     * Turn the remaining cards into a histogram
     */
    public remainingHisto(): number[] {
        const ret = new Array(10).fill(0);
        for (const tile of this.remainingCards) {
            ret[tile.value] += 1;
        }
        return ret;
    }

    public draw(): Tile | undefined {
        return this.remainingCards.pop();
    }

    /**
     * Card values remaining in the deck
     */
    public get cardValues(): number[] {
        return this.remainingCards.map(c => c.value);
    }

    public copy(): Deck {
        return new Deck(this);
    }

    public shuffle(): Deck {
        const ret = new Deck(this);
        shuffle(ret.remainingCards);
        return ret;
    }
}
