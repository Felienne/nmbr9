import 'jest';
import { Board, Direction } from '../lib/board';
import { getTile } from '../lib/tile';
import { displayBoard } from '../lib/display';

test('maxHeight is 1 after placing a stone', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    board.place(getTile(1), { x: 0, y: 0, direction: Direction.Up });

    // THEN
    expect(board.maxHeight()).toBe(1);
});

test('canPlace outside board domain returns false', () => {
    // GIVEN
    const board = new Board();

    // THEN
    expect(board.canPlace(getTile(1), { x: 85, y: 85, direction: Direction.Up })).toBeFalsy();
});

test('canPlace outside board domain returns false, also when checking adjacencies', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    board.place(getTile(5), { x: 0, y: 0, direction: Direction.Up });

    // THEN
    expect(board.canPlace(getTile(1), { x: 85, y: 85, direction: Direction.Up })).toBeFalsy();
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
})

test('empty board had no score', () => {
    // GIVEN
    const board = new Board();

    // WHEN

    // THEN
    expect(board.score()).toBe(0);
});

test('empty board has many possible positions', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    const options = board.getOptions();

    // THEN
    expect(options.length).toBeGreaterThan(0);
});




test('place 8, score is 0', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    const t8 = getTile(8);
    board.place(t8, { x: 0, y: 0, direction: Direction.Up });

    // THEN
    expect(board.score()).toBe(0);
});

test('8 on the first level, score 8', () => {
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
    board.place(t8, { x: 0, y: 0, direction: Direction.Up })

    // THEN
    expect(board.score()).toBe(8);
})


test('place 9, should be able to place another 9 next to it', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    const t9 = getTile(9);
    board.place(t9, { x: 11, y: 16, direction: Direction.Up });

    const t9_2 = getTile(9);
    let allowed = board.canPlace(t9_2, {x:14, y:16, direction: Direction.Up});

    // THEN
    expect(allowed).toBe(true);
});