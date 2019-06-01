// Test program to verify that our board can see all possible states

import { MonteCarloTree, TreeSearchSupport, performMcts, defaultUpperConfidenceBound, DefaultTreeSearch } from '../lib/algo/monte-carlo';
import { GameState } from '../lib/game-state';
import { Board, CandidateMove } from '../lib/board';
import { FIXED_DECKS } from '../lib/test-harness';
import { Deck } from '../lib/cards';
import { pick } from '../lib/util';


const state = new GameState(new Board(), FIXED_DECKS[0]);
const root = new MonteCarloTree(undefined, state, new DefaultTreeSearch({
  explorationFactor: 5
}));

performMcts(root, {
  maxIterations: 1000,
  saveTreeFilename: 'full-tree.mm',
});