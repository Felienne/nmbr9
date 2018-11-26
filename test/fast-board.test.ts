// Test that my FastBoard implementation is valid by checking that it has the
// same behavior.
import assert = require('assert');
import fc = require('fast-check');
import { Board, Direction } from '../lib/board';
import { FastBoard } from '../lib/fast-board';
import { Tile, getTile } from '../lib/tile';
import { displayBoard } from '../lib/display';

const arbTile = fc.integer(0, 9);
const arbCoord = fc.integer(0, 80);
const arbDirection = fc.constantFrom(Direction.Up, Direction.Down, Direction.Left, Direction.Right);

/*
test('FastBoard trivial placement', () => {
    // GIVEN
    const fb = new FastBoard();
    fb.place(getTile(1), { x: 0, y: 0, direction: Direction.Up });
    console.log(displayBoard(fb));
});
*/

test('FastBoard and Board behave the same', () => {
    fc.assert(fc.property(
        fc.commands(allCommands, 100),
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

/**
 * Defines a generator for all possible commands
 */
const allCommands = [
    fc.tuple(
        fc.integer(0, 9),
        fc.integer(0, 80),
        fc.integer(0, 80),
        fc.constantFrom(Direction.Up, Direction.Down, Direction.Left, Direction.Right),
    ).map(x => new PlaceCommand(x[0], x[1], x[2], x[3]))
];

/**
 * Encode a "Place" command (actually the only command we have)
 */
class PlaceCommand implements BoardsCommand {
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
        m.board.place(this.tile, { x: this.x,  y: this.y, direction: this.direction });
        m.fastBoard.place(this.tile, { x: this.x,  y: this.y, direction: this.direction });

        // The boards should be the same after every step
        const board = displayBoard(m.board);
        const fastBoard = displayBoard(m.fastBoard);
        if (board !== fastBoard) {
            console.log('BOARD\n', board);
            console.log('FASTBOARD\n', fastBoard);
            assert.fail('Boards are not the same');
        }
    }

    public toString(): string {
        return `Place(${this.tile.value}, ${this.x}, ${this.y}, ${this.direction})`;
    }
}