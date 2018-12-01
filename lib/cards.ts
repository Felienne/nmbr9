import { Tile, getTile } from "./tile";

export interface tuple {
    turn: number;
    value: number;
}

export class Deck {
    private allcards:number[];
    private index:number;

    public constructor(d?:Deck)
    {
        if (d === undefined){
            this.index = 0;
            this.allcards = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
            this.shuffle()
        }
        else{
            this.index = d.index;
            this.allcards = d.allcards.slice();
        }
    }

    private shuffle():void
    {
        for (let i = this.allcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.allcards[i], this.allcards[j]] = [this.allcards[j], this.allcards[i]];
        }
    }

    public draw():tuple|false
    {
        this.index++;
        if (this.allcards.length === 0){
            return false
        }
        else{
            const returnValue = this.allcards.pop();
            return {turn: this.index, value: returnValue}
        }
    }

    public drawTile():Tile|undefined{
        const drawnCard = this.draw();
        if (drawnCard === false) {
            return undefined;
        }
        
        const { turn, value }  = drawnCard;
        const t = getTile(value);
        t.turn = turn;
        return t;        
    }



    public remainingCards(){
        return this.allcards;
    }

    public copy():Deck{
        return new Deck(this); //constructor with argument creates copy
    }
}