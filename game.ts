import * as tile from "./tile";
import * as cards from "./cards";


let c = new cards.cards;

while (!c.nextTurn() == false)
{
    console.log(c.getCard());
}
