import * as tile from "./tile";
import * as cards from "./cards";
import * as b from "./board";


const deck = new cards.deck;
const board = new b.board;

let turn_tuple  = deck.draw()
while (turn_tuple !== false)
{

    const value = turn_tuple.value;
    let t:tile.Tile = tile.getTile(value);

    if (turn_tuple.turn === 1){
        console.log(t)        
        board.place(0,0,t)
    }
    else{
        let loc = board.getAdjacencies().find(p => board.canPlace(p.x, p.y, t))
        if (loc !== undefined){
            console.log(loc.x, loc.y, t.value)
            board.place(loc.x, loc.y, t)
        }
    }
    turn_tuple = deck.draw();

    // t.turn = turn

    console.log("---")
    console.log(board.toString())

 

}

