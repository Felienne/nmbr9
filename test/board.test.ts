import 'jest';
import { Board, Direction } from '../lib/board';
import { getTile } from '../lib/tile';

test('maxHeight is 1 after placing a stone', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    board.place(getTile(1), { x: 0, y: 0, direction: Direction.Up });

    // THEN
    expect(board.maxHeight()).toBe(1);
});

test('cannot place an 8 fully on top of a single 9', () => {
    // GIVEN
    const board = new Board();

    const t9 = getTile(9);
    t9.turn = 1;
    board.place(t9, { x: 0, y: 0, direction: Direction.Up });

    // WHEN
    const t8 = getTile(8);
    t8.turn = 2;

    // THEN
    expect(board.canPlace(t8, { x: 0, y: 0, direction: Direction.Up })).toBeFalsy();
    // console.log(board.boardToString());
});

test('can place an 8 on top of a combination of a 1 and a 9', () => {
    // GIVEN
    const board = new Board();

    const t9 = getTile(9);
    t9.turn = 1;
    board.place(t9, { x: 1, y: 0, direction: Direction.Up });

    const t1 = getTile(1);
    t1.turn = 2;
    board.place(t1, { x: -1, y: 0, direction: Direction.Up });

    // WHEN
    const t8 = getTile(8);
    t8.turn = 3;

    // THEN
    expect(board.canPlace(t8, { x: 0, y: 0, direction: Direction.Up })).toBeTruthy();

    //  11889..
    //  .1889..
    //  .889...
    //  .889...

    // console.log(board.boardToString());
});