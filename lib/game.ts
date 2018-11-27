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
            console.log("Turn", turn);
            console.log("Placing tile of value", value);

            // Give all non-disqualified players a chance to move
            for (const player of this.players) {
                if (player.disqualified) { continue; }

                player.timer.start();

                try {
                    // FIXME: Since players get a copy of their board, they can
                    // cheat by mutating the Board instance. We'll have to fix that
                    // at some point in the future.
                    //
                    // Or they can cheat by changing tile.value.
                    //
                    // Should not be allowed :).
                    const placement = player.player.move(player.board, tile);

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
            console.log(`SPEED:  ${player.timer.average.toPrecision(3)}ms/turn`);
            // FIXME: Score
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
