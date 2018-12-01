// Test that my FastBoard implementation is valid by checking that it has the
// same behavior.
import assert = require('assert');
import fc = require('fast-check');
import { Board, Orientation, Point, Move } from '../lib/board';
import { FastBoard } from '../lib/fast-board';
import { Tile, getTile } from '../lib/tile';
import { displayBoard } from '../lib/display';
import { randInt, timeIt } from '../lib/util';

test('FastBoard trivial move', () => {
    // GIVEN
    const fb = new FastBoard();
    fb.place(getTile(0), { x: 0, y: 5, orientation: 1});

    expect(fb.canPlace(getTile(8), { x: 54, y: 29, orientation: 1})).toBeFalsy();
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

test('Check speed of copying', () => {
    const fastBoard = new FastBoard();

    const N = 1000;
    const boardTime = timeIt(N, () => fastBoard.copy());

    console.log('FastBoard copy():', boardTime, 'ms /', N);
});

test('FastBoard is actually faster -- canPlace() edition', () => {
    // GIVEN
    const board = new Board();
    const fastBoard = new FastBoard();

    forSomeMoves(10, board, (tile, move) => {
        board.place(tile, move);
        fastBoard.place(tile, move);
    });

    // WHEN
    const options = board.getAllMoves();
    const N = 100;
    const tile = getTile(5);

    const boardTime = timeIt(N, () => options.filter(p => board.canPlace(tile, p)));
    const fastBoardTime = timeIt(N, () => options.filter(p => fastBoard.canPlace(tile, p)));
    const trivialTime = timeIt(N, () => options.filter(p => true));

    console.log('Board canPlace(): ', boardTime, 'ms /', N);
    console.log('FastBoard canPlace():', fastBoardTime, 'ms /', N);

    expect(fastBoardTime).toBeLessThanOrEqual(boardTime);
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
        fc.constantFrom(Orientation.Up, Orientation.Down, Orientation.Left, Orientation.Right),
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
            private readonly orientation : Orientation) {
        this.tile = getTile(tileNumber);
    }

    public check(m: Readonly<Boards>): boolean {
        return m.board.canPlace(this.tile, { x: this.x,  y: this.y, orientation: this.orientation })
            || m.fastBoard.canPlace(this.tile, { x: this.x,  y: this.y, orientation: this.orientation });
    }

    public run(m: Boards, r: Boards): void {
        const boardP = m.board.canPlace(this.tile, { x: this.x,  y: this.y, orientation: this.orientation });
        const fastBoardP = m.fastBoard.canPlace(this.tile, { x: this.x,  y: this.y, orientation: this.orientation });
        if (boardP !== fastBoardP) {
            throw new Error(`Board can place: ${boardP}, FastBoard can place: ${fastBoardP}`);
        }

        m.board.place(this.tile, { x: this.x,  y: this.y, orientation: this.orientation });
        m.fastBoard.place(this.tile, { x: this.x,  y: this.y, orientation: this.orientation });

        assertBoardsEqual(m);
    }

    public toString(): string {
        return `Place(${this.tile.value}, { x: ${this.x}, y: ${this.y}, direction: ${this.orientation}})`;
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
        const moves = m.board.getAllMoves().filter(p => m.board.canPlace(this.tile, p));
        if (moves.length === 0) { return; }

        const move = moves[this.moveNumber % moves.length];
        m.board.place(this.tile, move);
        m.fastBoard.place(this.tile, move);

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

    if (m.board.score() !== m.fastBoard.score()) {
        assert.fail(`Scores are not the same: ${m.board.score()} vs ${m.fastBoard.score()}`);
    }
}

function forSomeMoves(n: number, board: Board, fn: (t: Tile, m: Move) => void) {
    for (let i = 0; i < n; i++) {
        const tile = getTile(randInt(0, 10));
        const moves = board.getLegalMoves(tile);
        const move = moves[randInt(0, moves.length)];
        fn(tile, move);
    }
}