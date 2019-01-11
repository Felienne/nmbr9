import 'jest';
import { Board, Orientation } from '../lib/board';
import { Tile } from '../lib/tile';
import { displayBoard } from '../lib/display';

test('maxHeight is 1 after placing a stone', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    board.place(new Tile(1,1), { x: 0, y: 0, orientation: Orientation.Up });

    // THEN
    expect(board.maxHeight()).toBe(1);
});

test('canPlace outside board domain returns false', () => {
    // GIVEN
    const board = new Board();

    // THEN
    expect(board.canPlace(new Tile(1,1), { x: 85, y: 85, orientation: Orientation.Up })).toBeFalsy();
});

test('canPlace outside board domain returns false, also when checking adjacencies', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    board.place(new Tile(5,1), { x: 0, y: 0, orientation: Orientation.Up });

    // THEN
    expect(board.canPlace(new Tile(1,1), { x: 85, y: 85, orientation: Orientation.Up })).toBeFalsy();
});

test('cannot place an 8 fully on top of a single 9', () => {
    // GIVEN
    const board = new Board();

    const t9 = new Tile(9,1);
    board.place(t9, { x: 0, y: 0, orientation: Orientation.Up });

    // WHEN
    const t8 = new Tile(8,2);

    // THEN
    expect(board.canPlace(t8, { x: 0, y: 0, orientation: Orientation.Up })).toBeFalsy();
    // console.log(board.boardToString());
});

test('can place an 8 on top of a combination of a 1 and a 9', () => {
    // GIVEN
    const board = new Board();

    const t9 = new Tile(9,1);
    board.place(t9, { x: 1, y: 0, orientation: Orientation.Up });

    const t1 = new Tile(1,2);
    board.place(t1, { x: -1, y: 0, orientation: Orientation.Up });

    // WHEN
    const t8 = new Tile(8,3);

    // THEN
    expect(board.canPlace(t8, { x: 0, y: 0, orientation: Orientation.Up })).toBeTruthy();

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
    const options = board.getAllMoves();

    // THEN
    expect(options.length).toBeGreaterThan(0);
});




test('place 8, score is 0', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    const t8 = new Tile(8,1);
    board.place(t8, { x: 0, y: 0, orientation: Orientation.Up });

    // THEN
    expect(board.score()).toBe(0);
});

test('8 on the first level, score 8', () => {
    // GIVEN
    const board = new Board();

    const t9 = new Tile(9,1);
    board.place(t9, { x: 1, y: 0, orientation: Orientation.Up });

    const t1 = new Tile(1,2);
    board.place(t1, { x: -1, y: 0, orientation: Orientation.Up });

    // WHEN
    const t8 = new Tile(8,3);
    board.place(t8, { x: 0, y: 0, orientation: Orientation.Up })

    // THEN
    expect(board.score()).toBe(8);
})


test('place 9, should be able to place another 9 next to it', () => {
    // GIVEN
    const board = new Board();

    // WHEN
    const t9 = new Tile(9,1);
    board.place(t9, { x: 11, y: 16, orientation: Orientation.Up });

    const t9_2 = new Tile(9,2);
    let allowed = board.canPlace(t9_2, {x:14, y:16, orientation: Orientation.Up});

    // THEN
    expect(allowed).toBe(true);
});