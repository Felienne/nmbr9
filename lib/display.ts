const chalk = require('chalk');
import { range, sum } from "./util";
import { Board, Move, Orientation } from "./board";
import util = require('util');
import { Deck } from "./cards";
import mm3 = require('murmurhash-native');

/**
 * Return a nice colorized stringification of the board
 */
export function displayBoard(board: IBoard) {
    const span = range(board.size);

    const lines: string[] = [];
    for (let y = 0; y < board.size; y++) {
        const rowHeights = span.map(x => board.heightAt(x, y));

        // Skip empty rows
        if (rowHeights.every(h => h === 0)) continue;

        lines.push(rowHeights.map((h, x) => {
            if (h === 0) { return chalk.hex('#5C5C5C')('·'); }
            const tileNr = board.tileValueAt(x, y);
            return chalk.bgHex(TILE_COLORS[tileNr])(h);
        }).join(''));
    }

    lines.push(board.printExtraInfo());;
    return lines.join('\n') + '\n';
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

export function fingerprintBoard(board: Board, remainingDeck: Deck) {
    const h = mm3.murmurHash32(Buffer.from([...board.heightMap.data, ...remainingDeck.remainingHisto()]));

    return emoji[h % emoji.length];
}