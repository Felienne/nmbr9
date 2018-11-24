const chalk = require('chalk');
import { Tile, TILE_COLORS } from "./tile";

export class board {
    heightmap : number[][] = [];
    tileTurns : number[][] = [];

    public constructor()
        {
            for (let i = 0; i < 80; i++){
                this.heightmap[i] = [];
                for (let j = 0; j < 80; j++){
                    this.heightmap[i][j] = 0
                }
            }

            for (let i = 0; i < 80; i++){
                this.tileTurns[i] = [];
                for (let j = 0; j < 80; j++){
                    this.tileTurns[i][j] = 0
                }
            }
        }

    public getAdjacencies(){
        const adjacencies = [];
        for (let y = 0; y < 80; y++){
            for (let x = 0; x < 80; x++){
                if (this.heightmap[y][x] == -1){
                    adjacencies.push({x,y})
                }
            }
        }


        return adjacencies;
    }


    public place(i:number, j:number,  tile:Tile) //TODO: er moet hier nog een orientatie bij
    {
        for (let y = 0; y < 5; y++){
            for (let x = 0; x < 5; x++){
                const formIsNonEmpty = tile.form[y][x] !== 0;
                const boardSpaceFree = this.heightmap[j+y][i+x] < 1; // TODO: Klopt niet meer op hoger niveau
                if (formIsNonEmpty && boardSpaceFree) {
                    this.heightmap[j+y][i+x] = tile.form[y][x] //TODO: iets komt nu altijd op level 1 terecht
                }
            }
        }


    }

    public canPlace(x:number, y:number,  tile:Tile) //TODO: er moet hier nog een orientatie bij
    {
        //TODO: hoger niveau v-tjes



        //TODO de vergelijking met -1 moet nog in een functie (want op hogere niveaus gaan we de vrijheid met een ander getal coderen)

        const below:number[] = tile.getOnes().map(p => this.heightmap[y+p.y][x+p.x]) //een lijst van alle element die 'onder' deze form ligt

        //is minstens een van de vakjes die in de form een 1 is, in de heightmap een v (en dat is in de datastructuur een -1)
        const touchesV:boolean = below.some(x => x === -1)

        //lig ik 'recht' aka zijn alle getallen onder de form in de heightmap hetzelfde getal?

        const formBelow:number[] = below.filter(x => x !== -1) //eerst alle non-v's eruit filteren

        const expectedLevel = 0; // formBelow[0] // TODO: Klopt niet meer vanaf tweede verdieping
        const balanced:boolean = formBelow.length === 0 || formBelow.every(x => x === expectedLevel) //dan kijken of alle elementen hetzelfde zin als het eerste

        return touchesV && balanced

        // TODO: als we op een hogere verdieping liggen, moeten er minstens 2 instanties (turn-numbers) onder liggen


    }






    public toString(){
        let board: string = ""
        for (let y = 0; y < 80; y++){
            let line: string = ""
            if (!this.heightmap[y].every(x => x === 0))
            {
                for (let x = 0; x < 80; x++){
                    if (this.heightmap[y][x] === -1)
                        line += 'v'
                    else {
                        const tileNr = this.heightmap[y][x]; // TODO: Niet het echte nummer!
                        const height = this.heightmap[y][x];

                        if (height === 0) {
                            line += chalk.hex('#5C5C5C')('0');
                        } else {
                            line += chalk.hex(TILE_COLORS[tileNr])(height);
                        }
                    }
                }
                board += line + "\n";
            }
        }
        return board;
    }
}



