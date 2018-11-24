export class Tile {
    public value: number;
    public form: number[][];


}

export function getTile(n:number): Tile
{
    if (n<0 || n>9) throw new Error('Value of a tile can only be from 0 to 9.');

    let t = new Tile;
    t.value = n;

    switch(n) {
        case 0: {
            t.form = [[1,1,1],
                      [1,0,1],
                      [1,0,1],
                      [1,1,1]];
            break;
        }
        case 1: {
            t.form = [[1,1,0],
                      [0,1,0],
                      [0,1,0],
                      [0,1,0]];
            break;
        }
        case 2: {
            t.form = [[0,1,1],
                      [0,1,1],
                      [1,1,0],
                      [1,1,1]];
            break;
        }
        case 3: {
            t.form = [[1,1,1],
                      [0,0,1],
                      [0,1,1],
                      [1,1,1]];
            break;
        }
        case 4: {
            t.form = [[0,1,1],
                      [0,1,0],
                      [1,1,1],
                      [0,1,1]];
            break;
        }
        case 5: {
            t.form = [[1,1,1],
                      [1,1,1],
                      [0,0,1],
                      [1,1,1]];
            break;
        }
        case 6: {
            t.form = [[1,1,0],
                      [1,0,0],
                      [1,1,1],
                      [1,1,1]];
            break;
        }
        case 7: {
            t.form = [[1,1,1],
                      [0,1,0],
                      [1,1,0],
                      [1,0,0]];
            break;
        }
        case 8: {
            t.form = [[0,1,1],
                      [0,1,1],
                      [1,1,0],
                      [1,1,0]];
            break;
        }
        case 9: {
            t.form = [[1,1,1],
                      [1,1,1],
                      [1,1,0],
                      [1,1,0]];
            break;
        }
    }

    return t;
}