"use strict";
exports.__esModule = true;
var cards = /** @class */ (function () {
    function cards() {
        this.allcards = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
        this.index = 0;
        this.shuffle();
    }
    cards.prototype.shuffle = function () {
        var _a;
        for (var i = this.allcards.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [this.allcards[j], this.allcards[i]], this.allcards[i] = _a[0], this.allcards[j] = _a[1];
        }
    };
    cards.prototype.nextTurn = function () {
        this.index++;
        if (this.index >= this.allcards.length)
            return false;
        return this.index;
    };
    cards.prototype.getCard = function () {
        return this.allcards[this.index];
    };
    return cards;
}());
exports.cards = cards;
