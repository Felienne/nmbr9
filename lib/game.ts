import { IPlayer } from "./player";
import { Deck } from "./cards";
import { Board } from "./board";
import { getTile } from "./tile";
import { Timer } from "./util";
import { displayBoard } from "./display";

/**
 * A single round of the game
 *
 * Every player g
 */
export class Game {
    private readonly deck: Deck;
    private readonly players: PlayerState[];

    constructor(players: IPlayer[]) {
        this.deck = new Deck();
        this.players = players.map(player => ({
            player,
            disqualified: false,
            board: new Board(),
            timer: new Timer()
        }));
    }

    /**
     * Play the whole game
     */
    public play() {
        let drawnCard = this.deck.draw();
        while (drawnCard !== false) {
            const { turn, value }  = drawnCard;

            const tile = getTile(value);
            tile.turn = turn;
            console.log("Turn:", turn, " | Tile:", value);

            // Give all non-disqualified players a chance to move
            for (const player of this.players) {
                if (player.disqualified) { continue; }

                player.timer.start();

                try {
                    //speler krijgt een kopie van het bord en het deck, anders kan hij het stiekem aanpassen!
                    const copiedDeck = new Deck(this.deck);
                    const copiedBoard = new Board(player.board);

                    const placement = player.player.move(copiedBoard, copiedDeck, tile); 
                    if (placement !== undefined) {
                        player.board.place(tile, placement);
                    } else {
                        player.disqualified = true;
                        player.disqualificationReason = 'Player gave up';
                    }
                } catch(e) {
                    player.disqualified = true;
                    player.disqualificationReason = e.message;
                    console.log(e);
                } finally {
                    player.timer.end();
                }
            }

            drawnCard = this.deck.draw();
        }
    }

    public report() {
        for (const player of this.players) {
            console.log(`PLAYER: ${player.player.name}`);
            console.log('STATUS: ' + (player.disqualified ? `*disqualified* (${player.disqualificationReason})` : 'finished'));
            console.log(`SCORE:  ${player.board.score()}`);
            console.log(`SPEED:  ${player.timer.average.toPrecision(3)}ms/turn`);
            console.log('BOARD:');
            console.log(displayBoard(player.board));
            console.log('');
        }
    }
}

export interface PlayerState {
    player: IPlayer;

    board: Board;

    disqualified: boolean;

    disqualificationReason?: string;

    timer: Timer;
}
