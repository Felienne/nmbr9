const chalk = require('chalk');
import { range, sum } from "./util";
import { Board, Move, Orientation, Box } from "./board";
import util = require('util');
import { Deck } from "./cards";
import mm3 = require('murmurhash-native');
import xmlbuilder = require('xmlbuilder');

/**
 * Return a nice colorized stringification of the board
 */
export function displayBoard(board: IBoard) {
    const lines: string[] = [];

    let line: string[] = [];
    displayBoardGen(board, {
        beginRow() {},
        endRow() {
            lines.push(line.join(''));
            line = [];
        },
        emptyCell() {
            lines.push(chalk.hex('#5C5C5C')('·'));
        },
        tile(nr: number, color: string) {
            lines.push(chalk.hex(color)(`${nr}`));
        }
    });
    return lines.join('\n') + '\n';
}

export function displayBoardHtml(board: IBoard, into: xmlbuilder.XMLElement) {
    const table = into.ele('table', { cellspacing: 1 });
    let tr: xmlbuilder.XMLElement;
    displayBoardGen(board, {
        beginRow() {
            tr = table.ele('tr');
        },
        endRow() {
        },
        emptyCell() {
            tr.ele('td');
        },
        tile(nr: number, color: string) {
            tr.ele('td', {
                style: `background: ${color}`
            }, `${nr}`);
        }
    });
}

interface Renderer {
    beginRow(): void;
    emptyCell(): void;
    tile(nr: number, color: string): void;
    endRow(): void;
}

export function displayBoardGen(board: IBoard, renderer: Renderer) {
    const bb = board.boundingBox;

    for (let y = bb.topLeft.y; y < bb.botRight.y; y++) {
        renderer.beginRow();
        for (let x = bb.topLeft.x; x < bb.botRight.x; x++) {
            const h = board.heightAt(x, y);
            if (h === 0) {
                renderer.emptyCell();
            } else {
                const tileNr = board.tileValueAt(x, y);
                renderer.tile(h, TILE_COLORS[tileNr]);
            }
        }
        renderer.endRow();
    }
}

export function displayMove(move: Move) {
    const ori = {
        [Orientation.Up]: '△',
        [Orientation.Down]: '▽',
        [Orientation.Left]: '◁',
        [Orientation.Right]: '▷',
    };
    return util.format('(%s, %s, %s)', move.x, move.y, ori[move.orientation])
}

interface IBoard {
    readonly size:number;
    readonly boundingBox: Box;
    heightAt(x: number, y: number): number;
    tileValueAt(x: number, y: number): number;
    printExtraInfo(): string;
}

export const TILE_COLORS = [
    '#BABABA', // 0
    '#9C7300', // 1
    '#BD6B0D', // 2
    '#F2DB27', // 3
    '#559E1C', // 4
    '#4AD1D4', // 5
    '#336FF2', // 6
    '#9C0FD4', // 7
    '#E820E8', // 8
    '#D42242', // 9
];

const BARCHARS = '▁▂▃▄▅▆▇█';

/**
 * Represent a fraction roughly as a character
 */
export function roughFraction(x: number) {
    if (x < 0.001) { return '⢀'; }
    if (x >= 0.99) { return BARCHARS[BARCHARS.length - 1]; }
    const i = Math.floor(x / 0.125);
    return BARCHARS[i];
}

export function distribution(xs: number[]): string {
    const lowest = Math.min(...xs);
    let highest = Math.max(...xs);
    if (highest === 0) { highest = 1; }
    const distr = xs.map(c => roughFraction(c / highest)).join('');
    return `[${lowest.toFixed(1)} ${distr} ${highest.toFixed(1)}]`;
}

const emoji = require('./emoji.json');

export function fingerprintGameState(board: Board, remainingDeck: Deck) {
    const h = mm3.murmurHash32(Buffer.from([...board.heightMap.data, ...remainingDeck.remainingHisto()]));

    return emoji[h % emoji.length];
}