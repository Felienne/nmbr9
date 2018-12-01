import { Tile, TILE_HEIGHT, TILE_WIDTH } from "./tile";

export enum Direction {
    Up = 1, //dit is 'rechtop'
    Right, //met de bovenkant richtend naar rechts etc.
    Down,
    Left
}

export class Board {

    private _score : number = 0;

    //we gebruiken 2 losse datastructuren om het bord te representeren
    //heightmap zet op ieder veld de hoogte van die plek, hoeveel lagen liggen er al op
    //0 is een leeg vakje
    //-1 geeft aan dat er daar aangesloten kan worden (in de visualisatie weergegeven met 'v')

    private readonly heightmap : number[][] = [];

    // tileturns is een even grote array en die geeft weer welke tegel er ligt,
    // dmv het hele tegelobject
    // dat is nodig om te bepalen of er niet op 1 tegel gestapeld wordt

    private readonly tileTurns : Tile[][] = [];

    // This influences where the first tile MUST be placed
    private readonly boundingBox: Box = {
        topLeft: { x: 40, y: 40 },
        botRight: { x: 40, y: 40 },
    };

    constructor() {
        for (let i = 0; i < 80; i++) {
            this.heightmap[i] = [];
            this.tileTurns[i] = [];
            for (let j = 0; j < 80; j++) {
                this.heightmap[i][j] = 0;
                this.tileTurns[i][j] = undefined;
            }
        }
    }

    /**
     * Return all fields on the board (TODO: could be cached, always returns the same list)
     */
    public getAllPlacements(): Placement[] {
        const ret: Placement[] = [];
        for (let y = this.boundingBox.topLeft.y - TILE_HEIGHT - 1; y < this.boundingBox.botRight.y + 1; y++) {
            for (let x = this.boundingBox.topLeft.x - TILE_WIDTH - 1; x < this.boundingBox.botRight.x + 1; x++) {
                ret.push(
                    { x, y, direction: Direction.Up },
                    { x, y, direction: Direction.Down },
                    { x, y, direction: Direction.Left },
                    { x, y, direction: Direction.Right }
                    );
            }
        }
        return ret;
    }

    /**
     * return all placements: (position + directions where the tile can be placed)
     */

    public getLegalPlacement(tile:Tile){
        const options = this.getAllPlacements();
        let locs = options.filter(p => this.canPlace(tile, p));
        return locs;
    }




    /**
     * Place the given tile here
     */
    public place(tile: Tile, place: Placement) {
        if (!this.canPlace(tile, place)) {
            throw new Error(`Can't place a ${tile.value} at (${place.x}, ${place.y})`);
        }

        // Make a point relative to placement absolute on the board
        const makeAbsolute = (p: Point) => ({ x: p.x + place.x, y: p.y + place.y });

        const ones = tile.getOnes(place.direction).map(makeAbsolute);
        ones.forEach(p => {
            this.heightmap[p.y][p.x] += 1;
            this.tileTurns[p.y][p.x] = tile;
        });

        // als we kunnen plaatsen, dan gaan we meteen de score updaten
        // tegels op de bodem zijn 0 waard dus we moeten de hoogte - 1 nemen
        // om te weten heo hoog iets ligt, kijken we naar de hoogte van 1 van de eentjes
        // we weten dankzij de call naar canPlace toch zeker dat dat allemaal dezelfde hoogte is
        const p = ones[0];
        const placementHeight = this.heightmap[p.y][p.x] - 1;
        this._score += placementHeight * tile.value;

        // Stretch the bounding box
        for (const p of ones) {
            if (p.x < this.boundingBox.topLeft.x) this.boundingBox.topLeft.x = p.x;
            if (p.x > this.boundingBox.botRight.x) this.boundingBox.botRight.x = p.x;
            if (p.y < this.boundingBox.topLeft.y) this.boundingBox.topLeft.y = p.y;
            if (p.y > this.boundingBox.botRight.y) this.boundingBox.botRight.y = p.y;
        }
    }

    /**
     * Return whether the given tile can be placed here
     */
    public canPlace(tile: Tile, placement: Placement) {
        // Make a point relative to placement absolute on the board
        const makeAbsolute = (p: Point) => ({ x: p.x + placement.x, y: p.y + placement.y });
        // Return the heightmap at a certain (absolute) point
        const getHeight = (p: Point) => this.heightmap[p.y][p.x];
        // Return the tileTurns at a certain (absolute) point
        const getTile = (p: Point) => this.tileTurns[p.y] && this.tileTurns[p.y][p.x];
        // Predicate to check if a point lies fully within the board
        const onBoard = (p: Point) => 0 <= p.x && p.x < 80 && 0 <= p.y && p.y < 80;

        const onesLocations = tile.getOnes(placement.direction).map(makeAbsolute);
        const boardLocations = onesLocations.filter(onBoard);

        // Return false if there are any boardLocations outside the actual board
        if (boardLocations.length !== onesLocations.length) { return false; }

        const below: number[] = boardLocations.map(getHeight) //een lijst van alle element die 'onder' deze form ligt

        //lig ik 'recht' aka zijn alle getallen onder de form in de heightmap hetzelfde getal?

        const supportingLevel = below[0]
        const balanced: boolean = below.length === 0 || below.every(x => x === supportingLevel) //dan kijken of alle elementen hetzelfde zin als het eerste

        // als we op een hogere verdieping liggen (niet 0), dan moeten er minstens 2 instanties (turn-numbers) onder liggen

        //we kijken in tileTurns wat er onder deze tegel komt te liggen
        const tileTurnsBelow: number[] = boardLocations.map(getTile).filter(x=> x !== undefined).map(x => x.turn) //een lijst van alle turns (id's) die 'onder' deze form liggen

        //we gebruiken een truukje vergelijkbaar met wat we bij balanced doen
        //we pakken element 0, en er moet er minstens eentje anders zijn dan elem 1
        //anders zijn ze allemaal hetzelfde
        const firstTurn = tileTurnsBelow[0]
        const onTwoTiles = tileTurnsBelow.length === 0 || tileTurnsBelow.some(x => x !== firstTurn)

        //if we are placing the first tile of a new level (aka the lower level is currently the highst)
        //touching is not a requirement (it is touching from below haha!)
        if (supportingLevel === this.maxHeight()) {
            return balanced && onTwoTiles;
        }
        else {
            //is minstens een van de vakjes die in de form een v is, in de heightmap gelijk aan het gewenste level (supporting level + 1)
            const touchesV:boolean = tile.getAdjacencies(placement.direction)
                    .map(makeAbsolute)
                    .filter(onBoard)
                    .map(getHeight)
                    .some(x => x >= supportingLevel + 1);

            return touchesV && balanced && onTwoTiles;
        }
    }

    public score(){
        return this._score;
    }


    /**
     * Return the maximum height of tiles on the board
     */
    public maxHeight() {
        let max = -1;
        for (let y = 0; y < 80; y++){
            for (let x = 0; x < 80; x++){
                if (this.heightmap[y][x] > max){
                    max = this.heightmap[y][x];
                }
            }
        }
        return max;
    }

    public heightAt(x: number, y: number): number {
        return this.heightmap[y][x];
    }

    public tileValueAt(x: number, y: number): number {
        return this.tileTurns[y][x].value;
    }

}

/**
 * A placement of a tile
 */
export interface Placement {
    x: number;
    y: number;
    direction: Direction;
}

export interface Point {
    x: number;
    y: number;
}

export interface Box {
    topLeft: Point;
    botRight: Point;
}