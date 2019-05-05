import { Move, CandidateMove } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick } from '../util';
import { Deck } from '../cards';
import { Board } from '../board';
import { MonteCarloTree, printTreeStatistics, performMcts, defaultUpperConfidenceBound, TreeSearchSupport } from '../algo/monte-carlo';
import { GameState } from '../game-state';


// FIXME: A lot of things will need to change once we remove "full knowledge" of the Deck.

export type BoardFunction<T> = (board: Board) => T;

export interface MonteCarloOptions {
    /**
     * How many iterations to run
     */
    maxIterations?: number;

    /**
     * How many seconds to run, at most
     */
    maxThinkingTimeSec?: number;

    /**
     * Print tree statistics at the end of a move
     */
    printTreeStatistics?: boolean;

    /**
     * What tree branches should be explored
     *
     * If supplied, only branches for which the selection function returns
     * true will be explored.
     *
     * If not supplied, all branches will be explored.
     */
    branchSelector?: BranchSelectorFn;
    branchSelectorString?: string;

    /**
     * Decide on whether to give additional or fewer points to a board position given the board
     */
    boardScoreCalculator?: BoardFunction<number>;
    boardScoreCalculatorString?: string;
}

export type BranchSelectorFn = (board: Board, moves: CandidateMove[]) => CandidateMove[];

/**
 * This player executes MC tree search
 */
export class MonteCarloTreePlayer implements IPlayer, TreeSearchSupport<any> {

    public readonly name: string = 'Willow McTreeFace';

    constructor(protected readonly options: MonteCarloOptions) {
        if (options.maxIterations === undefined && options.maxThinkingTimeSec === undefined) {
            throw new Error('Supply at least maxIterations or maxThinkingTimeSec');
        }
    }

    /**
     * True because we have unexplored moves
     */
    public readonly continueExploringAfterInitialize = false;

    initializeNode(node: MonteCarloTree<any>): void {
        for (const move of this.selectBranches(node.state.board, node.legalMoves)){
            const child = node.addExploredNode(move)
            const score = child.randomPlayout();
        }
    }

    public upperConfidenceBound(node: MonteCarloTree<any>, parentVisitCount: number) {
        //magic Twiddly factor
        const explorationFactor = 100;
        return defaultUpperConfidenceBound(node, Math.max(1,parentVisitCount), explorationFactor);
    }

    public async calculateMove(state: GameState): Promise<Move | undefined> {
        const root = new MonteCarloTree(undefined, state, this);

        performMcts(root, this.options);

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        return root.bestMove();
    }

    public printIterationsAndSelector(){
        return `${this.options.maxIterations}, ${this.options.branchSelectorString}, ${this.options.boardScoreCalculatorString}`;
    }

    public async gameFinished(board: Board): Promise<void> {
    }

    /**
     * Called by the Tree Search to prune the game tree
     */
    public selectBranches(board: Board, moves: CandidateMove[]): CandidateMove[] {
        return this.options.branchSelector ? this.options.branchSelector(board, moves) : moves;
    }

    /**
     * Return a move to be used for a random playout
     *
     * We do a purely random selection from all acceptable moves
     */
    public pickRandomPlayoutMove(startingBoard: Board, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined {
        const acceptableMoves = this.selectBranches(startingBoard, moves);
        return pick(acceptableMoves);
    }

    public scoreForBoard(board: Board) {
        if (this.options.boardScoreCalculator) {
            return Math.max(0, this.options.boardScoreCalculator(board));
        }
        return board.score();
    }
}