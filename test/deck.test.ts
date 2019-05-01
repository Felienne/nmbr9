
import { Deck } from '../lib/cards';

test('deck and advancing', () => {
  const deck = Deck.fixedDeck([1, 2, 3, 4, 5]);

  expect(deck.currentTile.value).toEqual(1);
  deck.advance();
  expect(deck.currentTile.value).toEqual(2);
  deck.advance();
  expect(deck.currentTile.value).toEqual(3);
  deck.advance();
  expect(deck.currentTile.value).toEqual(4);
});

test('deck and histogram', () => {
  const deck = Deck.fixedDeck([1, 1, 2, 3, 3]);

  expect(deck.remainingHisto()).toEqual([0, 2, 1, 2, 0, 0, 0, 0, 0, 0]);

  deck.advance();
  expect(deck.remainingHisto()).toEqual([0, 1, 1, 2, 0, 0, 0, 0, 0, 0]);

  deck.advance();
  expect(deck.remainingHisto()).toEqual([0, 0, 1, 2, 0, 0, 0, 0, 0, 0]);
});

test('deck and onehot', () => {
  const deck = Deck.fixedDeck([1, 1, 2, 3, 3]);

  expect(deck.remainingOneHot()).toEqual([0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  deck.advance();
  expect(deck.remainingOneHot()).toEqual([0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  deck.advance();
  expect(deck.remainingOneHot()).toEqual([0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});


test('deck and shufflerest', () => {
  const deck = Deck.fixedDeck([1, 2, 3]);

  expect(deck.currentTile.value).toEqual(1);

  const copy = deck.copyShuffleInvisible();
  expect(copy.currentTile.value).toEqual(1);
});