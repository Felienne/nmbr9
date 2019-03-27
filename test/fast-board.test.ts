// Test that my FastBoard implementation is valid by checking that it has the
// same behavior.
import assert = require('assert');
import fc = require('fast-check');
import { Board, Orientation, Point, Move } from '../lib/board';
import { FastBoard } from '../lib/fast-board';
import { Tile } from '../lib/tile';
import { displayBoard } from '../lib/display';
import { randInt, timeIt } from '../lib/util';

test('FastBoard trivial move', () => {
    // GIVEN
    const fb = new FastBoard();
    fb.place(new Tile(0,1), { x: 0, y: 5, orientation: 1});

    expect(fb.canPlace(new Tile(8,1), { x: 54, y: 29, orientation: 1})).toBeFalsy();
});

test('Check speed of copying', () => {
    const fastBoard = new FastBoard();

    const N = 1000;
    const boardTime = timeIt(N, () => fastBoard.copy());

    console.log('FastBoard copy():', boardTime, 'ms /', N);
});
