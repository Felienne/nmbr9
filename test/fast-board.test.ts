// Test that my FastBoard implementation is valid by checking that it has the
// same behavior.
import assert = require('assert');
import fc = require('fast-check');
import { Board, Direction } from '../lib/board';
import { FastBoard } from '../lib/fast-board';
import { Tile, getTile } from '../lib/tile';
import { displayBoard } from '../lib/display';
import { object } from 'fast-check';

test('FastBoard trivial placement', () => {
    // GIVEN
    const fb = new FastBoard();
    fb.place(getTile(0), { x: 0, y: 5, direction: 1});

    expect(fb.canPlace(getTile(8), { x: 54, y: 29, direction: 1})).toBeFalsy();
});

test('FastBoard and Board behave the same', () => {
    fc.assert(fc.property(
        fc.commands(allCommands, 5),
        cmds => {
            const s = () => ({ model: {
                board: new Board(),
                fastBoard: new FastBoard(),
            }, real: {} });
            fc.modelRun(s, cmds);
        }
    ));
});

interface Boards {
    board: Board;
    fastBoard: FastBoard;
};

// The FastCheck library wants us to split out the Model from the RealSystem,
// but needs the check() method to work on the Model. We need the actual
// Boards to be able to call canPlace(), so therefore we put our boards in
// the Model and our RealSystem is ignored.
type BoardsCommand = fc.Command<Boards, any>;

const arbitraryTile = fc.integer(0, 9);
const arbitraryCoord = fc.integer(0, 80);

/**
 * Defines a generator for all possible commands
 */
const allCommands = [
    fc.tuple(
        arbitraryTile,
        arbitraryCoord,
        arbitraryCoord,
        fc.constantFrom(Direction.Up, Direction.Down, Direction.Left, Direction.Right),
    ).map(x => new PlaceAbsoluteCommand(x[0], x[1], x[2], x[3])),
    fc.tuple(
        arbitraryTile,
        fc.integer(0, 80*80)
    ).map(x => new PlaceRelativeCommand(x[0], x[1]))
];

/**
 * Encode a "Place" at an absolute location command
 */
class PlaceAbsoluteCommand implements BoardsCommand {
    private readonly tile: Tile;

    constructor(
            tileNumber: number,
            private readonly x: number,
            private readonly y: number,
            private readonly direction : Direction) {
        this.tile = getTile(tileNumber);
    }

    public check(m: Readonly<Boards>): boolean {
        return m.board.canPlace(this.tile, { x: this.x,  y: this.y, direction: this.direction })
            || m.fastBoard.canPlace(this.tile, { x: this.x,  y: this.y, direction: this.direction });
    }

    public run(m: Boards, r: Boards): void {
        const boardP = m.board.canPlace(this.tile, { x: this.x,  y: this.y, direction: this.direction });
        const fastBoardP = m.fastBoard.canPlace(this.tile, { x: this.x,  y: this.y, direction: this.direction });
        if (boardP !== fastBoardP) {
            throw new Error(`Board can place: ${boardP}, FastBoard can place: ${fastBoardP}`);
        }

        m.board.place(this.tile, { x: this.x,  y: this.y, direction: this.direction });
        m.fastBoard.place(this.tile, { x: this.x,  y: this.y, direction: this.direction });

        assertBoardsEqual(m);
    }

    public toString(): string {
        return `Place(${this.tile.value}, { x: ${this.x}, y: ${this.y}, direction: ${this.direction}})`;
    }
}

/**
 * Place at a relative location inside the array of possible moves
 */
class PlaceRelativeCommand implements BoardsCommand {
    private readonly tile: Tile;

    constructor(tileNumber: number, private readonly moveNumber: number) {
        this.tile = getTile(tileNumber);
    }

    public check(m: Readonly<Boards>): boolean {
        return true;
    }

    public run(m: Boards, r: Boards): void {
        const moves = m.board.getOptions().filter(p => m.board.canPlace(this.tile, { ...p, direction: Direction.Up }));
        if (moves.length === 0) { return; }

        const move = moves[this.moveNumber % moves.length];
        m.board.place(this.tile, { ...move, direction: Direction.Up });
        m.fastBoard.place(this.tile, { ...move, direction: Direction.Up });

        assertBoardsEqual(m);
    }
}

function assertBoardsEqual(m: Boards) {
    // The boards should be the same after every step
    const board = displayBoard(m.board);
    const fastBoard = displayBoard(m.fastBoard);
    if (board !== fastBoard) {
        console.log('BOARD\n', board);
        console.log('FASTBOARD\n', fastBoard);
        assert.fail('Boards are not the same');
    }
}