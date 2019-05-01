import { IPlayer } from "./player";
import { Deck } from "./cards";
import { Board } from "./board";
import { Timer } from "./util";
import { displayBoard, displayMove } from "./display";

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
        let drawnTile = this.deck.draw();
        while (drawnTile !== undefined) {
            const tile = drawnTile;
            turn += 1;
            console.log("Turn:", turn, " | Tile:", tile.value);

            // Give all non-disqualified players a chance to move
            for (const player of this.players) {
                if (player.disqualified) { continue; }

                player.timer.start();

                try {
                    // speler krijgt een kopie van het bord en het deck, anders kan hij het stiekem aanpassen!
                    const copiedDeck = this.deck.shuffle();
                    const copiedBoard = new Board(player.board);

                    const move = await player.logic.calculateMove(copiedBoard, copiedDeck, tile);
                    if (move !== undefined) {
                        player.board.place(tile, move);
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

            drawnTile = this.deck.draw();
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
