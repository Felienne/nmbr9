import { Tile } from "./tile";
import { Placement, Point } from "./board";

const WIDTH = 80;
const HEIGHT = 80;

/**
 * A class similar to Board (but hopefully faster) which can be copied
 *
 * They work by mapping to an array of raw memory. In JavaScript. this is
 * represented as an ArrayBuffer to represent the memory, and a Uint8Array
 * which indexes into that piece of memory as if it was an array of bytes.
 *
 * It contains a heightMap and a tileMap. I would prefer the tileMap to be
 * able to contain both tile identity and tile value (otherwise I would
 * need 3 arrays, one for the identity and one for the value).
 *
 * Because tiles don't have an identity number, just a turn and value
 * number, I'm going to do an ugly thing and encode both into the same
 * byte: turn * 10 + value. This is a reversible encoding because
 * value is in the range [0..9] and turn will never go above 20, so
 * the highest number we need to store is 209 which fits in 8 bits.
 */
export class FastBoard {
    /**
     * Memory for the height map
     */
    private readonly heightMap: Uint8Array;

    /**
     * Memory for the tile data
     */
    private readonly tileMap: Uint8Array;

    /**
     * Running maximum of height on the board
     */
    private _maxHeight: number;

    /**
     * Running tally of score
     */
    private _score : number;

    constructor(source?: FastBoard) {
        this.heightMap = (source && source.heightMap.slice(0)) || new Uint8Array(WIDTH * HEIGHT);
        this.tileMap = (source && source.tileMap.slice(0)) || new Uint8Array(WIDTH * HEIGHT);
        this._maxHeight = source ? source._maxHeight : 0;
        this._score = source ? source._score : 0;
    }

    public place(tile: Tile, place: Placement) {
        if (!this.canPlace(tile, place)) {
            throw new Error(`Can't place a ${tile.value} at (${place.x}, ${place.y})`);
        }

        // Make sure that we don't fail our calculation down the line
        // if tile.turn ends up unset.
        if (isNaN(tile.turn)) tile.turn = 1;

        const ixes = this.positionsToIndexes(tile.getOnes(place.direction), place);
        for (const i of ixes) {
            const newLevel = this.heightMap[i] + 1;
            if (newLevel > this._maxHeight) {
                this._maxHeight = newLevel;
            }
            this.heightMap[i] = newLevel;

            // Encode both turn and value in the same byte
            this.tileMap[i] = tile.turn * 10 + tile.value;
        }

        const level = this.heightMap[ixes[0]];
        this._score += (level - 1) * tile.value;
    }

    public canPlace(tile: Tile, placement: Placement): boolean {
        // NOTE: In order to be as speedy as possible, I've used
        // for loops instead of of .map(), .every(), .some().
        // IIRC V8 has trouble JITting those structures. I might
        // be wrong, testing is required.

        // Translate coordinates to array indexes and only work with the indexes.
        const ones = tile.getOnes(placement.direction);
        const ixes = this.positionsToIndexes(ones, placement);

        // If any of these are outside the board, they were dropped by positionsToIndexes.
        // If that happens we can't place here.
        if (ones.length !== ixes.length) return false;

        // FLAT: all existing heights must have the same value
        const supportingLevel = this.heightMap[ixes[0]];
        for (const ix of ixes) {
            if (this.heightMap[ix] !== supportingLevel) {
                return false;
            }
        }

        // ON TWO TILES: if we're at a level higher than 0, we need to be touching at least
        // two instances.
        if (supportingLevel > 0) {
            const someTile = this.tileMap[ixes[0]];
            let other = false;
            for (const ix of ixes) {
                if (this.tileMap[ix] !== someTile) {
                    other = true;
                    break;
                }
            }
            if (!other) { return false; }
        }

        // TOUCHING: if we're not the first tile on the new level, we need to be touching
        // a tile already there.
        const tileLevel = supportingLevel + 1;

        if (supportingLevel !== this._maxHeight) {
            let touching = false;
            const vixes = this.positionsToIndexes(tile.getAdjacencies(placement.direction), placement);
            for (const ix of vixes) {
                if (this.heightMap[ix] >= tileLevel) {
                    touching = true;
                    break;
                }
            }
            if (!touching) return false;
        }

        return true;
    }

    public maxHeight() {
        return this._maxHeight;
    }

    public score() {
        return this._score;
    }

    public copy() {
        return new FastBoard(this);
    }

    public heightAt(x: number, y: number): number {
        return this.heightMap[y * WIDTH + x];
    }

    public tileValueAt(x: number, y: number): number {
        // Strip away the turn info and get the tile value
        return this.tileMap[y * WIDTH + x] % 10;
    }

    /**
     * Turn a list of coordinates into a list of array indexes
     *
     * Drops indexes that are outside the board.
     */
    private positionsToIndexes(pts: Point[], origin: Point): number[] {
        const ret: number[] = [];
        for (const pt of pts) {
            const x = origin.x + pt.x;
            const y = origin.y + pt.y;
            if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) continue;
            ret.push(y * WIDTH + x);
        }
        return ret;
    }
}