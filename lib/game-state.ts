import { Board, Move } from "./board";
import { Deck } from "./cards";
import { fingerprintGameState } from "./display";

export class GameState {
  constructor(public readonly board: Board, public readonly deck: Deck) {
  }

  public get hasCards(): boolean {
    return this.deck.hasCards;
  }

  public copy() {
    return new GameState(this.board.copy(), this.deck.copy());
  }

  public randomizedCopy() {
    return new GameState(this.board.copy(), this.deck.shuffledCopy());
  }

  public play(move: Move) {
    this.board.place(this.deck.currentTile, move);
    this.deck.advance();
  }

  public trainingRepresentation(): Array<number[] | number> {
    const layers = [1, 2, 3, 4, 5];
    return [
        ...Array.from(this.board.heightMap.data).map(h => layers.map(H => h >= H ? 1 : 0)),
        ...this.deck.remainingOneHot()
    ];
  }

  public get score() {
    return this.board.score();
  }

  public* legalMoves() {
    yield* this.deck.hasCards ? this.board.getLegalMoves(this.deck.currentTile) : [];
  }

  public get fingerprint() {
    return fingerprintGameState(this.board, this.deck);
  }
}