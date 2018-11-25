import * as tile from "./tile";
import * as cards from "./cards";
import * as b from "./board";

function getRandom<T>(list:T[]){
    if (list.length !== 0){
        const len = list.length;
        const index = Math.floor(Math.random() * len);
        return list[index];
    }
    else {
        return undefined
    }
}


const deck = new cards.deck;
const board = new b.Board;

let turn_tuple  = deck.draw()

let t:tile.Tile = tile.getTile(1);
t.turn = 1
board.place(0,38,t, b.Direction.Up)
console.log(board.boardToString())

let t2:tile.Tile = tile.getTile(9);
t2.turn = 2
board.place(2,38,t2,b.Direction.Up)
console.log(board.boardToString())

let t3:tile.Tile = tile.getTile(6);
t3.turn = 3
console.log(board.canPlace(2,38,t3, b.Direction.Right))
board.place(2,38,t3,b.Direction.Right)
console.log(board.boardToString())

// while (turn_tuple !== false)
// {
//     const value = turn_tuple.value;
//     let t:tile.Tile = tile.getTile(value);
//     t.turn = turn_tuple.turn;

//     if (turn_tuple.turn === 1){
//         console.log(t)
//         board.place(38,38,t)
//     }
//     else{
//         let locs = board.getOptions().filter(p => board.canPlace(p.x, p.y, t));
//         const loc = getRandom(locs);

//         if (loc !== undefined){
//             console.log(loc.x, loc.y, t.value)
//             board.place(loc.x, loc.y, t)
//         }
//     }
//     turn_tuple = deck.draw();

//     console.log("---")
//     console.log(board.boardToString())

// }

