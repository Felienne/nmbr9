// Test program to verify that our board can see all possible states

import { MonteCarloTree, TreeSearchSupport, performMcts, defaultUpperConfidenceBound } from '../lib/algo/monte-carlo';
import { GameState } from '../lib/game-state';
import { Board, CandidateMove } from '../lib/board';
import { FIXED_DECKS } from '../lib/test-harness';
import { Deck } from '../lib/cards';
import { pick } from '../lib/util';


class ExploreEverything implements TreeSearchSupport<{}> {
  public continueExploringAfterInitialize: boolean;

  public initializeNode(node: MonteCarloTree<{}>): void {
    node.unexploredMoves.push(...node.legalMoves);
  }

  public pickRandomPlayoutMove(startingBoard: Board, moves: CandidateMove[], remainingDeck: Deck): CandidateMove {
    return pick(moves);
  }

  public scoreForBoard(board: Board, dnf: boolean): number {
    return dnf ? 0 : board.score();
  }

  public upperConfidenceBound(node: MonteCarloTree<{}>, parentVisitCount: number): number {
    const explorationFactor = 5;
    return defaultUpperConfidenceBound(node, Math.max(1, parentVisitCount), explorationFactor);
  }
}

const state = new GameState(new Board(), FIXED_DECKS[0]);
const root = new MonteCarloTree(undefined, state, new ExploreEverything());

performMcts(root, {
  maxIterations: 1000,
  saveTreeFilename: 'full-tree.mm',
});