import { IPlayer } from "./player";
import { Deck } from "./cards";
import { Board } from "./board";
import { mean, standardDeviation } from "./util";

import fs = require('fs');
import util = require('util');
import { GameState } from "./game-state";
const appendFile = util.promisify(fs.appendFile);

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
export async function runDeck(player: IPlayer, sourceDeck: Deck, times: number=1): Promise<(undefined | number)[]> {
    let numberOfFails = 0;
    const ret = new Array<number | undefined>();

    for (let i = 0; i < times; i++) {
        const state = new GameState(new Board(), sourceDeck.copy());

        while (state.hasCards) {
            const move = await player.calculateMove(state);
            if (move === undefined) {
                console.log("Failed game with", state.deck.cardsRemaining, " tiles remaining. Score so far was:", state.board.score())
                // End of game. FIXME: Should we score 0 to penalize harder?
                ret.push(undefined);
                continue;
            }
            state.play(move);
        }

        console.log(`Deck played ${i+1} out of ${times} times`)
        console.log('Score: ', state.score);
        console.log('Holes: ', state.board.holesAt(1));
        await player.gameFinished(state.board);

        ret.push(state.score);
    };

    return ret;
}

export async function playFixedDeck(player: IPlayer, sourceDeck: Deck, times: number=1){
    const startingDeck = sourceDeck.copy();

    function filterNotUndefined(y:(number|undefined)[]):number[]{
        const ret:number[] = [];
        y.forEach(x => {
            if (x !== undefined){
                ret.push(x);
            }
        });
        return ret;
    }

    const scores_of_this_deck = await runDeck(player, sourceDeck, times);
    //const header =  'deck, #plays per deck, mean, stdev, iterations, selectorstring'
    const valid_scores = filterNotUndefined(scores_of_this_deck)
    //.filter(x => x !== undefined) does not make the typechecker happy :/
    const fails = scores_of_this_deck.splice(0).filter(x => x === undefined).length;

    const stat:string = `[${startingDeck.cardValues}], ${times}, ${fails}, ${mean(valid_scores)}, ${standardDeviation(valid_scores)}, ${player.printIterationsAndSelector()}`;
    return stat;
}

/**
 * Evaluate a player on a standardized set of decks and return all scores it got
 */
export async function playStandardDecks(player: IPlayer, gamesPerDeck: number = 1): Promise<string> {
    let allStats = '';
    let i = 0;

    for (const sourceDeck of FIXED_DECKS) {
       const stat = await playFixedDeck(player, sourceDeck, gamesPerDeck)
       allStats += stat;
       allStats += '\n';
       console.log(stat)
       await appendFile('willow-stats.txt', stat + '\n');
       console.log(`Deck ${i+1} finished (out of ${FIXED_DECKS.length} decks)`)
       i++;
    }

    return allStats;
}