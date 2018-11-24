export class cards {
    private allcards:number[] = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9];
    private index:number;

    public constructor()
    {
        this.index=0;
        this.shuffle()
    }

    private shuffle():void
    {
        for (let i = this.allcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.allcards[i], this.allcards[j]] = [this.allcards[j], this.allcards[i]];
        }
    }

    public nextTurn():number|false
    {
        this.index++;
        if (this.index>=this.allcards.length) return false;
        return this.index;
    }

    public getCard():number
    {
        return this.allcards[this.index];
    }

}