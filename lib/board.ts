import { Tile } from "./tile";

export enum Direction {
    Up = 1, //dit is 'rechtop'
    Right, //met de bovenkant richtend naar rechts etc.
    Down,
    Left
}

export class Board {
    //we gebruiken 2 losse datastructuren om het bord te representeren
    //heightmap zet op ieder veld de hoogte van die plek, hoeveel lagen liggen er al op
    //0 is een leeg vakje
    //-1 geeft aan dat er daar aangesloten kan worden (in de visualisatie weergegeven met 'v')

    private readonly heightmap : number[][] = [];

    // tileturns is een even grote array en die geeft weer welke tegel er ligt,
    // dmv het hele tegelobject
    // dat is nodig om te bepalen of er niet op 1 tegel gestapeld wordt

    private readonly tileTurns : Tile[][] = [];

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
     * Return all possible positions on this map where a tile can be placed
     */
    public getOptions() {
        const options = [];
        for (let y = 0; y < 74; y++) {
            for (let x = 0; x < 75; x++) {
                if (this.heightmap[y][x] < 1) {
                    options.push({x,y});
                }
            }
        }
        return options;
    }

    /**
     * Place the given tile here
     */
    public place(tile: Tile, place: Placement) {
        if (!this.canPlace(tile, place)) {
            throw new Error(`Can't place a ${tile.value} at (${place.x}, ${place.y})`);
        }

        const ones = tile.getOnes(place.direction);
        ones.forEach(p => {
            this.heightmap[place.y+p.y][place.x+p.x] += 1;
            this.tileTurns[place.y+p.y][place.x+p.x] = tile;
        });
    }

    /**
     * Return whether the given tile can be placed here
     */
    public canPlace(tile: Tile, placement: Placement) {
        // Make a point relative to placement absolute on the board
        const onBoard = (p: Point) => ({ x: p.x + placement.x, y: p.y + placement.y });
        // Return the heightmap at a certain (absolute) point
        const heightMapValue = (p: Point) => this.heightmap[p.y][p.x];
        // Return the tileTurns at a certain (absolute) point
        const tileTurnsValue = (p: Point) => this.tileTurns[p.y][p.x];

        const boardLocations = tile.getOnes(placement.direction).map(onBoard);

        // Return false if there are any boardLocations outside the actual board
        const xs = boardLocations.map(p => p.x);
        const ys = boardLocations.map(p => p.y);
        if (Math.min(...xs) < 0 || Math.max(...xs) >= 80) { return false; }
        if (Math.min(...ys) < 0 || Math.max(...ys) >= 80) { return false; }

        const below: number[] = boardLocations.map(heightMapValue) //een lijst van alle element die 'onder' deze form ligt

        //lig ik 'recht' aka zijn alle getallen onder de form in de heightmap hetzelfde getal?

        const formBelow: number[] = below.filter(x => x !== -1) //eerst alle non-v's eruit filteren

        const supportingLevel = formBelow[0]
        const balanced: boolean = formBelow.length === 0 || formBelow.every(x => x === supportingLevel) //dan kijken of alle elementen hetzelfde zin als het eerste

        // als we op een hogere verdieping liggen (niet 0), dan moeten er minstens 2 instanties (turn-numbers) onder liggen

        //we kijken in tileTurns wat er onder deze tegel komt te liggen
        const tileTurnsBelow: number[] = boardLocations.map(tileTurnsValue).filter(x=> x !== undefined).map(x => x.turn) //een lijst van alle turns (id's) die 'onder' deze form liggen

        //we gebruiken een truukje vergelikjbaar met wat we bij balanced doen
        //we pakken element 0, en er moet er minstens eentje anders zijn dan elem 1
        //anders zijn ze allemaal hetzelfde
        const firstTurn = tileTurnsBelow[0]
        const onTwoTiles = tileTurnsBelow.length === 0 || tileTurnsBelow.some(x => x !== firstTurn)

        //if we are placing the first tile of a new level (aka the lower level is currently the highst)
        //touching is not a requirement (it is touching from below haha!)
        if (supportingLevel === this.maxHeight()){
            return balanced && onTwoTiles;
        }
        else{
            //is minstens een van de vakjes die in de form een v is, in de heightmap gelijk aan het gewenste level (supporting level + 1)
            const touchesV:boolean = tile.getAdjacencies(placement.direction).map(heightMapValue).some(x => x === supportingLevel + 1);

            return touchesV && balanced && onTwoTiles;
        }
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