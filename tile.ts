import { toASCII } from "punycode";

export class Tile {
    public value: number;
    public form: number[][];
    public turn: number;     // turn represents at which turn this tile is used. This is important to be able to distinguish between different instances
                             // of the same number, since it is not allowed to place a tile on one instance.
                             // since there is only one tile per turn, this serves as identity

    public getOnes(){
        const ones = [];
        for (let y = 0; y < 6; y++){
            for (let x = 0; x < 5; x++){
                if (this.form[y][x] === 1){
                    ones.push({y,x});
                    //TODO: iets komt nu altijd op level 1 terecht
                } //TODO: Ook nog zorgen dat je geen 1'tjes overschrijft met vtjes.
            }
        }
        return ones;
    }
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

export function getTile(n:number): Tile
{
    if (n<0 || n>9) throw new Error('Value of a tile can only be from 0 to 9.');

    let t = new Tile;
    t.value = n;
    const v = -1;

    switch(n) {
        case 0: {
            t.form = [[0,v,v,v,0],
                      [v,1,1,1,v],
                      [v,1,0,1,v],
                      [v,1,0,1,v],
                      [v,1,1,1,v],
                      [0,v,v,v,0]];
            break;
        }
        case 1: {
            t.form = [[0,v,v,0,0],
                      [v,1,1,v,0],
                      [0,v,1,v,0],
                      [0,v,1,v,0],
                      [0,v,1,v,0],
                      [0,0,v,0,0]];
            break;
        }
        case 2: {
            t.form = [[0,0,v,v,0],
                      [0,v,1,1,v],
                      [0,v,1,1,v],
                      [v,1,1,v,0],
                      [v,1,1,1,v],
                      [0,v,v,v,0]];
            break;
        }
        case 3: {
            t.form = [[0,v,v,v,0],
                      [v,1,1,1,v],
                      [0,v,v,1,v],
                      [0,v,1,1,v],
                      [v,1,1,1,v],
                      [0,v,v,v,0]];
            break;
        }
        case 4: {
            t.form = [[0,0,v,v,0],
                      [0,v,1,1,v],
                      [0,v,1,v,0],
                      [v,1,1,1,v],
                      [0,v,1,1,v],
                      [0,0,v,v,0]];
            break;
        }
        case 5: {
            t.form = [[0,v,v,v,0],
                      [v,1,1,1,v],
                      [v,1,1,1,v],
                      [0,v,v,1,v],
                      [v,1,1,1,v],
                      [0,v,v,v,0]];
            break;
        }
        case 6: {
            t.form = [[0,v,v,0,0],
                      [v,1,1,v,0],
                      [v,1,v,v,0],
                      [v,1,1,1,v],
                      [v,1,1,1,v],
                      [0,v,v,v,0]];
            break;
        }
        case 7: {
            t.form = [[0,v,v,v,0],
                      [v,1,1,1,v],
                      [0,v,1,v,0],
                      [v,1,1,v,0],
                      [v,1,v,0,0],
                      [0,v,0,0,0]];
            break;
        }
        case 8: {
            t.form = [[0,0,v,v,0],
                      [0,v,1,1,v],
                      [0,v,1,1,v],
                      [v,1,1,v,0],
                      [v,1,1,v,0],
                      [0,v,v,0,0]];
            break;
        }
        case 9: {
            t.form = [[0,v,v,v,0],
                      [v,1,1,1,v],
                      [v,1,1,1,v],
                      [v,1,1,v,0],
                      [v,1,1,v,0],
                      [0,v,v,0,0]];
            break;
        }
    }

    return t;
}