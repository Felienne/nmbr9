import { Tile } from "./tile";
import { Field } from "./field";

export enum Orientation {
    Up = 1, //dit is 'rechtop'
    Right, //met de bovenkant richtend naar rechts etc.
    Down,
    Left
}

export interface Point {
    x: number;
    y: number;
}

/**
 * A move is a location plus an orientation for the placement of a tile
 */
export interface Move extends Point {
    orientation: Orientation;
}

/**
 * An extension of Move that has information about the tile to be placed and
 * the level the tile will be placed at.
 */
export interface CandidateMove extends Move {
    tile: Tile;
    targetLevel: number; // 1 == placed on floor
}

export function isCandidateMove(x: any): x is CandidateMove {
    return x.x !== undefined && x.y !== undefined && x.orientation !== undefined && x.tile !== undefined && x.targetLevel !== undefined;
}

export interface Box {
    topLeft: Point;
    botRight: Point;
}



export const TILE_WIDTH = 5;
export const TILE_HEIGHT = 6;
export const BOARD_SIZE = 16;

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
export class Board {
     /**
     * Size of the field which can be played on
     */
    public readonly size = BOARD_SIZE;

    /**
     * Memory for the height map
     */
    public readonly heightMap: Field;

    /**
     * Memory for the tile data
     */
    private readonly tileMap: Field;

    /**
     * Running maximum of height on the board
     */
    private _maxHeight: number;

    /**
     * Running tally of score
     */
    private _score : number;

    //number of turns played (used in the pruning function)
    public turnsPlayed: number;

    // bounding box limits the locations that we have to check
    private readonly boundingBox: Box;

    private immutable: number = 0;

    constructor(source?: Board) {
        this.heightMap = (source && source.heightMap.clone()) || Field.zero(this.size, this.size);
        this.tileMap = (source && source.tileMap.clone()) || Field.zero(this.size, this.size);
        this._maxHeight = source ? source._maxHeight : 0;
        this._score = source ? source._score : 0;
        this.turnsPlayed = source ? source.turnsPlayed : 0;

        if (source) {
            this.boundingBox = {
                topLeft: { x: source.boundingBox.topLeft.x, y: source.boundingBox.topLeft.y },
                botRight: { x: source.boundingBox.botRight.x, y: source.boundingBox.botRight.y },
            };
        } else {
            const mid = Math.floor(this.size / 2);
            this.boundingBox = {
                topLeft: { x: mid, y: mid },
                botRight: { x: mid, y: mid },
            };
        }
    }

    /**
     * Return all fields on the board where a tile could potentially be placed
     */
    public getAllMoves(): Move[] {
        const ret: Move[] = [];
        for (let y = this.boundingBox.topLeft.y - TILE_HEIGHT - 1; y < this.boundingBox.botRight.y + 1; y++) {
            for (let x = this.boundingBox.topLeft.x - TILE_WIDTH - 1; x < this.boundingBox.botRight.x + 1; x++) {
                ret.push(
                    { x, y, orientation: Orientation.Up },
                    { x, y, orientation: Orientation.Down },
                    { x, y, orientation: Orientation.Left },
                    { x, y, orientation: Orientation.Right }
                    );
            }
        }
        return ret;
    }

    /**
     * return all moves: (position + orientations where the tile can be placed)
     */
    public getLegalMoves(tile:Tile): CandidateMove[] {
        const options = this.getAllMoves();
        let locs = options.map(p => this.determinePlacement(tile, p)).filter(x => x !== undefined);
        return locs as any;
    }

    public playMove(move: CandidateMove): void {
        this.place(move.tile, move);
    }

    /**
     * Play a move and return a copy of the board
     */
    public playMoveCopy(move: CandidateMove): Board {
        const ret = new Board(this);
        ret.playMove(move);
        return ret;
    }

    public place(tile: Tile, place: Move): void {
        if (this.immutable > 0) {
            throw new Error('This board is immutable -- please make a copy');
        }
        if (!this.canPlace(tile, place)) {
            throw new Error(`Can't place a ${tile.value} at (${place.x}, ${place.y})`);
        }

        // Make sure that we don't fail our calculation down the line
        // if tile.turn ends up unset
        if (isNaN(tile.id)) tile.id = 1;

        const ixes = this.positionsToIndexes(tile.getOnes(place.orientation), place);
        for (const i of ixes) {
            const newLevel = this.heightMap.data[i] + 1;
            if (newLevel > this._maxHeight) {
                this._maxHeight = newLevel;
            }
            this.heightMap.data[i] = newLevel;

            // Encode both turn and value in the same byte
            this.tileMap.data[i] = tile.id * 10 + tile.value;
        }

        const level = this.heightMap.data[ixes[0]];
        this._score += (level - 1) * tile.value;

        // Make a point relative to move absolute on the board
        const makeAbsolute = (p: Point) => ({ x: p.x + place.x, y: p.y + place.y });

        const ones = tile.getOnes(place.orientation).map(makeAbsolute);
        // Stretch the bounding box
        for (const p of ones) {
            if (p.x < this.boundingBox.topLeft.x) this.boundingBox.topLeft.x = p.x;
            if (p.x > this.boundingBox.botRight.x) this.boundingBox.botRight.x = p.x;
            if (p.y < this.boundingBox.topLeft.y) this.boundingBox.topLeft.y = p.y;
            if (p.y > this.boundingBox.botRight.y) this.boundingBox.botRight.y = p.y;
        }
        this.turnsPlayed += 1;
    }

    /**
     * Return true or false depending on whether the given move is legal
     */
    public canPlace(tile: Tile, move: Move): boolean {
        return this.determinePlacement(tile, move) !== undefined;
    }

    /**
     * Return a CandidateMove if the tile can be placed, or undefined
     */
    public determinePlacement(tile: Tile, move: Move): CandidateMove | undefined {
        // NOTE: In order to be as speedy as possible, I've used
        // for loops instead of of .map(), .every(), .some().
        // IIRC V8 has trouble JITting those structures. I might
        // be wrong, testing is required.

        // Translate coordinates to array indexes and only work with the indexes.
        const ones = tile.getOnes(move.orientation);
        const ixes = this.positionsToIndexes(ones, move);

        // If any of these are outside the board, they were dropped by positionsToIndexes.
        // If that happens we can't place here.
        if (ones.length !== ixes.length) return undefined;

        // FLAT: all existing heights must have the same value
        const supportingLevel = this.heightMap.data[ixes[0]];
        for (const ix of ixes) {
            if (this.heightMap.data[ix] !== supportingLevel) {
                return undefined;
            }
        }

        // ON TWO TILES: if we're at a level higher than 0, we need to be touching at least
        // two instances.
        if (supportingLevel > 0) {
            const someTile = this.tileMap.data[ixes[0]];
            let other = false;
            for (const ix of ixes) {
                if (this.tileMap.data[ix] !== someTile) {
                    other = true;
                    break;
                }
            }
            if (!other) { return undefined; }
        }

        // TOUCHING: if we're not the first tile on the new level, we need to be touching
        // a tile already there.
        const tileLevel = supportingLevel + 1;

        if (supportingLevel !== this._maxHeight) {
            let touching = false;
            const vixes = this.positionsToIndexes(tile.getAdjacencies(move.orientation), move);
            for (const ix of vixes) {
                if (this.heightMap.data[ix] >= tileLevel) {
                    touching = true;
                    break;
                }
            }
            if (!touching) return undefined;
        }

        return { ...move, tile, targetLevel: supportingLevel + 1 };
    }

    public maxHeight() {
        return this._maxHeight;
    }

    public score() {
        return this._score;
    }

    public copy() {
        return new Board(this);
    }

    public heightAt(x: number, y: number): number {
        return this.heightMap.at(x, y);
    }

    public tileValueAt(x: number, y: number): number {
        // Strip away the turn info and get the tile value
        return this.tileMap.at(x, y) % 10;
    }

    /**
     * Makes the board immutable, return a function that undoes the function
     */
    public makeImmutable() {
        this.immutable += 1;
        return () => {
            this.immutable -= 1;
        };
    }

    /**
     * Return a (subset) of the height map at a given location, for a width and
     * height, at a given level
     *
     * Cells outside the bound of the board are always returned as 0.
     *
     * @returns An array of 0 and 1 of the size width*height.
     */
    public heightMapAtLevel(origin: Point, width: number, height: number, level: number): Field {
        const ret = Field.zero(width, height);

        for (let y = origin.y; y < origin.y + height; y++) {
            for (let x = origin.x; x < origin.x + width; x++) {
                if (y < 0 || y >= this.size || x < 0 || x >= this.size) {
                    // Already at 0
                } else {
                    ret.set(x, y, this.heightMap.at(x, y) >= level ? 1 : 0);
                }
            }
        }

        return ret;
    }

    public fingerprint() {
        var hash = 0, i, chr;
        for (i = 0; i < this.heightMap.data.length; i++) {
          chr   = this.heightMap.data[i];
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
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
            if (x < 0 || x >= this.size || y < 0 || y >= this.size) continue;
            ret.push(y * this.size + x);
        }
        return ret;
    }

    public shapeOfBoundingBox(level:number):number{
        if (level === 1){
            const b = this.boundingBox;
            const ratio = this.widthOfBoudingBox()/this.heightOfBoundingBox()
            return ratio;
        }
        else{
            //find min and max point of this level:
            let minx = 80
            let miny = 80
            let maxx = -80
            let maxy = -80

            for (let x = this.boundingBox.topLeft.x; x <= this.boundingBox.botRight.x; x++) {
                for (let y = this.boundingBox.topLeft.y; y <= this.boundingBox.botRight.y; y++) {
                    if (this.heightMap.at(x, y) === level) {
                        if (x < minx) minx = x;
                        if (y < miny) miny = y;
                        if (x > maxx) maxx = x;
                        if (y > maxy) maxy = y;
                    }
                };
            }
        const ratio = (maxx-minx)/(maxy-miny);
        //console.log(ratio)
        return ratio;
        }


    }

    public sizeOfBoundingBox(level:number):number{
        if (level === 1){
            const b = this.boundingBox;
            const size = this.widthOfBoudingBox() * this.heightOfBoundingBox();
            return size;
        }
        else{
            //find min and max point of this level:
            let minx = 80
            let miny = 80
            let maxx = -80
            let maxy = -80

            for (let x = this.boundingBox.topLeft.x; x <= this.boundingBox.botRight.x; x++) {
                for (let y = this.boundingBox.topLeft.y; y <= this.boundingBox.botRight.y; y++) {
                    if (this.heightMap.at(x, y) === level) {
                        if (x < minx) minx = x;
                        if (y < miny) miny = y;
                        if (x > maxx) maxx = x;
                        if (y > maxy) maxy = y;
                    }
                };
            }
        const ret = (maxx-minx) * (maxy-miny)
        //console.log(ret)
        return ret;
        }
    }

    public widthOfBoudingBox():number{
        const b = this.boundingBox
        return b.botRight.x - b.topLeft.x;
    }

    public heightOfBoundingBox():number{
        const b = this.boundingBox
        return b.botRight.y - b.topLeft.y;
    }

    public printExtraInfo(): string {
        return `Holes: ${this.holesAt(1)}`;
    }

    public holesAt(level:number):number{
        const gatenMap = Field.zero(this.size, this.size);
        const holesToCheck = new Array<Point>();

        const self = this;
        function isSleuf(p:Point):boolean{
            if (p.y !== self.boundingBox.topLeft.y && p.y != self.boundingBox.botRight.y && self.heightMap.at(p.x, p.y-1) >= level && self.heightMap.at(p.x, p.y+1) >= level){
                return true;
            }
            if (p.x !== self.boundingBox.topLeft.x && p.x != self.boundingBox.botRight.x && self.heightMap.at(p.x-1, p.y) >= level && self.heightMap.at(p.x+1, p.y) >= level){
                return true;
            }
            return false;
        }

        for (let x = this.boundingBox.topLeft.x; x <= this.boundingBox.botRight.x; x++) {
            for (let y = this.boundingBox.topLeft.y; y <= this.boundingBox.botRight.y; y++) {
                if (this.heightMap.at(x, y) < level) {                // Hole?
                    if (x === this.boundingBox.topLeft.x || x === this.boundingBox.botRight.x
                        || y === this.boundingBox.topLeft.y || y === this.boundingBox.botRight.y)  // At edge?
                    {
                        gatenMap.set(x, y, isSleuf({x,y})? 2 : 1);
                    } else {
                        holesToCheck.push({ x, y });
                    }
                }
            }
        }



        function isReachableFromEdge(p:Point):number{
            return Math.max(gatenMap.at(p.x, p.y-1), gatenMap.at(p.x, p.y+1), gatenMap.at(p.x-1, p.y), gatenMap.at(p.x+1, p.y))

        }

        let madeChanges = true;
        while (holesToCheck.length > 0 && madeChanges) {
            madeChanges = false;

            let i = 0;
            while (i < holesToCheck.length) {
                const holeToCheck = holesToCheck[i];
                const isEdge = isReachableFromEdge(holeToCheck)

                if (isEdge) {
                    gatenMap.set(holeToCheck.x, holeToCheck.y, Math.max(isSleuf(holeToCheck)?2:1,isEdge));
                    holesToCheck.splice(i, 1);
                    madeChanges = true;
                } else {
                    i++;
                }
            }
        }

        return holesToCheck.length + gatenMap.data.filter(x => x >= 2).length;
    }
}