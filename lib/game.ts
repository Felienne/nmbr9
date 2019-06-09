import { IPlayer } from "./player";
import { Deck } from "./cards";
import { Board } from "./board";
import { Timer } from "./util";
import { displayBoard, displayMove } from "./display";
import { GameState } from "./game-state";

/**
 * A single round of the game
 *
 * Every player g
 */
export class Game {
    private readonly deck: Deck;
    private readonly players: PlayerState[];

    constructor(players: IPlayer[]) {
        this.deck = Deck.standardDeck();
        this.players = players.map(player => ({
            logic: player,
            disqualified: false,
            board: new Board(),
            timer: new Timer()
        }));
    }

    /**
     * Play the whole game
     */
    public async play() {
        let turn = 0;
        while (this.deck.hasCards) {
            turn += 1;
            console.log("Turn:", turn, " | Tile:", this.deck.currentTile.value);

            // Give all non-disqualified players a chance to move
            for (const player of this.players) {
                if (player.disqualified) { continue; }

                player.timer.start();

                try {
                    // Player gets a randomized copy of the deck, otherwise they'll be able to modify it.
                    const playerState = new GameState(player.board.copy(), this.deck.copy());

                    const move = await player.logic.calculateMove(playerState);
                    if (move !== undefined) {
                        player.board.place(this.deck.currentTile, move);
                        console.log(player.logic.name, "plays", displayMove(move), "(score so far:", player.board.score(), ")");
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

            this.deck.advance();
        }

        // Game done
        for (const player of this.players) {
            await player.logic.gameFinished(player.board);
        }
    }

    public report() {
        for (const player of this.players) {
            console.log(`PLAYER: ${player.logic.name}`);
            console.log('STATUS: ' + (player.disqualified ? `*disqualified* (${player.disqualificationReason})` : 'finished'));
            console.log(`SCORE:  ${player.board.score()}`);
            console.log(`SPEED:  ${player.timer.average.toFixed(3)}ms/turn`);
            console.log('BOARD:');
            console.log(displayBoard(player.board));
            console.log('');
        }
    }
}

export interface PlayerState {
    logic: IPlayer;

    board: Board;

    disqualified: boolean;

    disqualificationReason?: string;

    timer: Timer;
}
