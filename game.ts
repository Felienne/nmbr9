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
const board = new b.board;

let turn_tuple  = deck.draw()
while (turn_tuple !== false)
{
    const value = turn_tuple.value;
    let t:tile.Tile = tile.getTile(value);
    t.turn = turn_tuple.turn;

    if (turn_tuple.turn === 1){
        console.log(t)        
        board.place(38,38,t)
    }
    else{
        let locs = board.getOptions().filter(p => board.canPlace(p.x, p.y, t));
        const loc = getRandom(locs);

        if (loc !== undefined){
            console.log(loc.x, loc.y, t.value)
            board.place(loc.x, loc.y, t)
        }
    }
    turn_tuple = deck.draw();



    console.log("---")
    console.log(board.boardToString())
 

}

