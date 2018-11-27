import { Direction } from "./board";

const v = -1;

export const TILE_WIDTH = 5;
export const TILE_HEIGHT = 6;

export class Tile {
    public value: number;
    public form: number[][];
    public turn: number;     // turn represents at which turn this tile is used. This is important to be able to distinguish between different instances
                             // of the same number, since it is not allowed to place a tile on one instance.
                             // since there is only one tile per turn, this serves as identity

    public getOnes(d:Direction){
        return this.getNumberLocations(1, d);
    }

    public getAdjacencies(d:Direction) {
        return this.getNumberLocations(v, d);
    }


    private getNumberLocations(num: number, d:Direction){
        const ret = [];
        for (let y = 0; y < 6; y++){
            for (let x = 0; x < 5; x++){
                if (this.form[y][x] === num){
                    switch (d) {
                        case Direction.Up:
                            ret.push({y:y,x:x});
                            break;
                        case Direction.Right:
                            ret.push({y:x,x:4-y});
                            break;
                        case Direction.Down:
                            ret.push({x:5-x,y:4-y});
                        break;
                            break;
                        case Direction.Left:
                            ret.push({y:5-x,x:y});
                            break;
                    }
                }
            }
        }
        return ret;
    }
}

export function getTile(n:number): Tile {
    if (n<0 || n>9) throw new Error('Value of a tile can only be from 0 to 9.');

    let t = new Tile;
    t.value = n;

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