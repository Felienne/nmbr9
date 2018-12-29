import { Game } from "./lib/game";
import { MonteCarloTreePlayer } from "./lib/players/monte-carlo-tree-hugger";
import { playFixedDeck, FIXED_DECKS, playStandardDecks } from "./lib/test-harness";
import { mean, standardDeviation } from "./lib/util";
import { FastBoard } from "./lib/fast-board";

// Standardized test bench for the Willow player

function boardCalculator(board: FastBoard):number{
    return board.score(); 
}

function selector(board: FastBoard):boolean{
    if (board.turnsPlayed < 5){
        return board.holesAt(0) < 6;
    }
    else{
        const maxSize = 12;
        return board.widthOfBoudingBox() < maxSize && board.heightOfBoundingBox() < maxSize;
    }
    
    //met een veld van max 15 (een van de twee) krijg je nog steeds wel 48 gaten! 
    //dus: veld nog kleiner maken
    //of toch ook selecteren op gaten, hieronder:

    // const maxSize = 12;
    // const sizeOk = board.widthOfBoudingBox() < maxSize || board.heightOfBoundingBox() < maxSize;
    // if (board.turnsPlayed < 5){
    //     return board.holesAt(0) < 6;
    // }
    // else{
    //     if (board.turnsPlayed < 10){
    //         return sizeOk && board.holesAt(0) < 12;
    //     }
    //     else{
    //         if (board.turnsPlayed < 15){
    //             return sizeOk && board.maxHeight() >= 1 && board.holesAt(0) < 15;
    //         }
    //         else{
    //             return sizeOk && board.maxHeight() >= 2 && board.holesAt(0) < 20;
    //         }
    //     }
    // }

    // if (board.turnsPlayed < 5){
    //     return board.holesAt(0) < 6;
    // }
    // else{c
    //     if (board.turnsPlayed < 10){
    //         return board.holesAt(0) < 12;
    //     }
    //     else{
    //         if (board.turnsPlayed < 15){
    //             return board.maxHeight() >= 1 && board.holesAt(0) < 15;
    //         }
    //         else{
    //             return board.maxHeight() >= 2 && board.holesAt(0) < 20;
    //         }
    //     }
    // }

}


const player = new MonteCarloTreePlayer({
    // Iterations so we don't depend on CPU speed for results
    maxIterations: 100,
    printTreeStatistics: true,
    boardScoreCalculator: boardCalculator,
    branchSelectorString: '>5 turns width and height < 12',
    boardScoreCalculatorString: 'board.score()', 
    branchSelector: selector
});

const plays_per_deck = 5;
const deck_number = 5;
const stats = playStandardDecks(player, plays_per_deck);
//const stats = playFixedDeck(player, FIXED_DECKS[deck_number], plays_per_deck);

console.log(stats);

const fs = require('fs');


// write to a new file named 2pac.txt
fs.appendFile('willow-stats.txt', stats + '\n', (err:any) => {  
    // throws an error, you could also catch it here
    if (err) throw err;
});


