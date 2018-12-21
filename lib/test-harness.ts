import { IPlayer } from "./player";
import { Deck } from "./cards";
import { Board } from "./board";
import { FastBoard } from "./fast-board";
import { setupMaster } from "cluster";
import { range, flatMap } from "./util";

// Some decks that are always the same so that we can honestly evaluate
// multiple runs of the same agent.
export const FIXED_DECKS = [
    Deck.fixedDeck([2, 7, 1, 3, 2, 9, 1, 3, 4, 6, 9, 0, 0, 8, 5, 4, 8, 5, 6, 7]),
    Deck.fixedDeck([6, 1, 7, 2, 9, 8, 1, 3, 0, 0, 8, 5, 4, 3, 4, 7, 5, 6, 2, 9]),
    Deck.fixedDeck([1, 1, 9, 3, 2, 4, 2, 3, 0, 4, 7, 6, 8, 7, 6, 8, 5, 0, 5, 9]),
    Deck.fixedDeck([8, 6, 4, 9, 5, 2, 7, 0, 0, 4, 3, 8, 9, 1, 3, 1, 2, 6, 7, 5]),
    Deck.fixedDeck([1, 1, 4, 5, 5, 4, 3, 7, 6, 2, 9, 8, 8, 6, 2, 0, 0, 7, 3, 9]),
    Deck.fixedDeck([9, 7, 6, 3, 6, 0, 1, 3, 0, 9, 7, 4, 5, 4, 8, 2, 8, 1, 2, 5]),
    Deck.fixedDeck([3, 1, 2, 8, 9, 5, 4, 8, 0, 5, 6, 3, 7, 2, 4, 0, 1, 6, 9, 7]),
    Deck.fixedDeck([0, 6, 3, 5, 2, 6, 8, 7, 3, 8, 7, 1, 5, 9, 9, 4, 2, 0, 1, 4]),
    Deck.fixedDeck([9, 3, 4, 0, 5, 2, 6, 6, 0, 7, 3, 2, 8, 8, 7, 1, 4, 5, 9, 1]),
    Deck.fixedDeck([9, 6, 4, 4, 5, 7, 3, 7, 3, 0, 2, 1, 6, 8, 1, 8, 9, 5, 0, 2]),
    Deck.fixedDeck([0, 5, 3, 0, 1, 8, 2, 1, 5, 8, 6, 9, 7, 9, 2, 4, 3, 4, 6, 7]),
];

/**
 * Play a given deck N times, return the mean score
 */
export function playFixedDeck(player: IPlayer, sourceDeck: Deck, times: number=1): number[] {
    return range(times).map(i => {
        const deck = new Deck(sourceDeck);
        const board = new FastBoard();

        let tile = deck.drawTile();
        while (tile !== undefined) {
            const move = player.calculateMove(board, deck, tile);
            if (move === undefined) { break; } // End of game. FIXME: Should we score 0 to penalize harder?
            board.place(tile, move);

            tile = deck.drawTile();
        }

        console.log('Score: ', board.score());
        return board.score();
    });
}

/**
 * Evaluate a player on a standardized set of decks and return all scores it got
 */
export function playStandardDecks(player: IPlayer, gamesPerDeck: number = 1): number[] {
    return flatMap(FIXED_DECKS, sourceDeck => {
        return playFixedDeck(player, sourceDeck, gamesPerDeck);
    });
}