const chalk = require('chalk');
import { range } from "./util";

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

