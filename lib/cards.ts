import { Tile } from "./tile";
import { shuffle } from "./util";

export const CARD_TYPES = 20;

export class Deck {
    /**
     * Return a fixed Deck with the given cards in the given order
     */
    public static fixedDeck(cardValues: number[]) {
        const ret = new Deck();
        ret.cards = cardValues.reverse().map((v, i) => new Tile(v, i));
        return ret;
    }

    /**
     * Return a standard deck
     *
     * Contains all cards between 0-9 twice in a random order
     */
    public static standardDeck(): Deck {
        const values = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
        const ret = Deck.fixedDeck(values);
        ret.shuffle();
        return ret;
    }

    public cards: Tile[];

    public constructor(d?: Deck)
    {
        if (d === undefined) {
            this.cards = [];
        }
        else {
            this.cards = d.cards.slice();
        }
    }

    public get cardsRemaining() {
        return this.cards.length;
    }

    public get currentTile(): Tile {
        if (this.isEmpty) {
            throw new Error('Cannot get current card from empty deck');
        }
        return this.cards[this.cards.length - 1];
    }

    public get hasCards(): boolean {
        return this.cards.length > 0;
    }

    public get isEmpty(): boolean {
        return this.cards.length === 0;
    }

    /**
     * Consume one card from the deck
     */
    public advance() {
        this.cards.pop();
    }

    /**
     * Turn the remaining cards into a histogram
     */
    public remainingHisto(): number[] {
        const ret = new Array(10).fill(0);
        for (const tile of this.cards) {
            ret[tile.value] += 1;
        }
        return ret;
    }

    /**
     * Turn remaining cards into a one-hot vector
     */
    public remainingOneHot(): number[] {
        const ret = new Array(20).fill(0);
        for (const tile of this.cards) {
            const index = tile.value * 2;
            if (!ret[index])
                ret[index] = 1;
            else
                ret[index + 1] = 1;
        }
        return ret;
    }

    /**
     * Card values remaining in the deck
     */
    public get cardValues(): number[] {
        return this.cards.map(c => c.value);
    }

    /**
     * Create an ordered copy of this Deck
     */
    public copy(): Deck {
        return new Deck(this);
    }

    /**
     * Shuffle the remaining cards in this deck
     */
    public shuffle() {
        shuffle(this.cards);
    }

    /**
     * Return a copy of the deck, shuffling everything 
     */
    public shuffledCopy(): Deck {
        if (this.isEmpty) { return this; }

        const ret = this.copy();
        ret.shuffle();
        return ret;
    }
}
