"use strict";
exports.__esModule = true;
var cards = require("./cards");
var c = new cards.cards;
while (!c.nextTurn() == false) {
    console.log(c.getCard());
}
