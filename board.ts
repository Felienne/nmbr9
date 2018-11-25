const chalk = require('chalk');
import { Tile, TILE_COLORS } from "./tile";

export class board {
    //we gebruiken 2 losse datastructuren om het bord te representeren
    //heightmap zet op ieder veld de hoogte van die plek, hoeveel lagen liggen er al op
    //0 is een leeg vakje 
    //-1 geeft aan dat er daar aangesloten kan worden (in de visualisatie weergegeven met 'v')

    heightmap : number[][] = [];

    // tileturns is een even grote array en die geeft weer welke tegel er ligt,
    // dmv het hele tegelobject
    // dat is nodig om te bepalen of er niet op 1 tegel gestapeld wordt 

    tileTurns : Tile[][] = [];

    public constructor()
        {
            for (let i = 0; i < 80; i++){
                this.heightmap[i] = [];
                this.tileTurns[i] = [];
                for (let j = 0; j < 80; j++){
                    this.heightmap[i][j] = 0
                    this.tileTurns[i][j] = undefined
                }   
            }
        }

    public getOptions(){
        const options = [];
        for (let y = 0; y < 74; y++){
            for (let x = 0; x < 75; x++){
                if (this.heightmap[y][x] < 1){
                    options.push({x,y})
                }
            }
        }
        return options;
    }


    public place(i:number, j:number,  tile:Tile) //TODO: er moet hier nog een orientatie bij
    {
        for (let y = 0; y < 6; y++){
            for (let x = 0; x < 5; x++){
                const isSolid = tile.form[y][x] === 1;
                if (isSolid) {
                    this.heightmap[j+y][i+x] += 1
                    this.tileTurns[j+y][i+x] = tile
                }
            }   
        }
    }

    public canPlace(x:number, y:number,  tile:Tile) //TODO: er moet hier nog een orientatie bij
    {
        const self = this;
        function heightMapValue(p: {x: number, y: number}) {
            return self.heightmap[y+p.y][x+p.x];
        }
        function tileTurnsValue(p: {x: number, y: number}) {
            return self.tileTurns[y+p.y][x+p.x];
        }       

        const below:number[] = tile.getOnes().map(heightMapValue) //een lijst van alle element die 'onder' deze form ligt

        //lig ik 'recht' aka zijn alle getallen onder de form in de heightmap hetzelfde getal?

        const formBelow:number[] = below.filter(x => x !== -1) //eerst alle non-v's eruit filteren

        const supportingLevel = formBelow[0] 
        const balanced:boolean = formBelow.length === 0 || formBelow.every(x => x === supportingLevel) //dan kijken of alle elementen hetzelfde zin als het eerste

        // als we op een hogere verdieping liggen (niet 0), dan moeten er minstens 2 instanties (turn-numbers) onder liggen

        //we kijken in tileTurns wat er onder deze tegel komt te liggen
        const tileTurnsBelow:number[] = tile.getOnes().map(tileTurnsValue).filter(x=> x !== undefined).map(x => x.turn) //een lijst van alle turns (id's) die 'onder' deze form liggen

        console.log(tileTurnsBelow)
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
            const touchesV:boolean = tile.getAdjacencies().map(heightMapValue).some(x => x === supportingLevel + 1);

            return touchesV && balanced && onTwoTiles;
        }

    }

    public maxHeight(){
        let max = -1;
        for (let y = 0; y < 80; y++){
            for (let x = 0; x < 80; x++){
                if (this.heightmap[y][x] > max){
                    max = this.heightmap[y][x]
                }
            }
        }
        return max;
    }






    public boardToString(){
        let board: string = ""
        for (let y = 0; y < 80; y++){
            let line: string = ""
            if (!this.heightmap[y].every(x => x === 0))
            {
                for (let x = 0; x < 80; x++){
                    if (this.heightmap[y][x] === -1)
                        line += 'v'
                    else {

                        const height = this.heightmap[y][x];

                        if (height === 0) {
                            line += chalk.hex('#5C5C5C')('0');
                        } else {
                            const tileNr = this.tileTurns[y][x].value; 
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



