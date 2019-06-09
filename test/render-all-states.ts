// Test program to verify that our board can see all possible states
import { performMcts, DefaultTreeSearch } from '../lib/algo/monte-carlo';
import { GameState } from '../lib/game-state';
import { Board } from '../lib/board';
import { FIXED_DECKS } from '../lib/test-harness';
import { PlaceTileNode } from '../lib/algo/place-tile-node';


const state = new GameState(new Board(), FIXED_DECKS[0]);
const root = new PlaceTileNode(undefined, state, new DefaultTreeSearch({
  explorationFactor: 5
}));

performMcts(root, {
  maxIterations: 1000,
  saveTreeFilename: 'full-tree.mm',
});