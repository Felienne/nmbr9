import { Move, CandidateMove } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, pickAndRemove, mean, sum } from '../util';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';
import { MonteCarloTree, printTreeStatistics, performMcts, defaultUpperConfidenceBound, TreeSearchSupport } from '../algo/monte-carlo';


// FIXME: A lot of things will need to change once we remove "full knowledge" of the Deck.

export type BoardFunction<T> = (board: FastBoard) => T;

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

export type BranchSelectorFn = (board: FastBoard, moves: CandidateMove[]) => CandidateMove[];

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
    public readonly continueExploringAfterInitialize = true;

    initializeNode(node: MonteCarloTree<any>): void {
        node.unexploredMoves = this.selectBranches(node.board, node.legalMoves)
    }

    public upperConfidenceBound(node: MonteCarloTree<any>, parentVisitCount: number) {
        const explorationFactor = 100;
        return defaultUpperConfidenceBound(node, parentVisitCount, explorationFactor);
    }

    public async calculateMove(board: FastBoard, deck:Deck, tile: Tile): Promise<Move | undefined> {
        const root = new MonteCarloTree(undefined, board, tile, deck, this);

        performMcts(root, this.options);

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        return root.bestMove();
    }

    public printIterationsAndSelector(){
        return `${this.options.maxIterations}, ${this.options.branchSelectorString}, ${this.options.boardScoreCalculatorString}`;
    }

    public async gameFinished(board: FastBoard): Promise<void> {
    }

    /**
     * Called by the Tree Search to prune the game tree
     */
    public selectBranches(board: FastBoard, moves: CandidateMove[]): CandidateMove[] {
        return this.options.branchSelector ? this.options.branchSelector(board, moves) : moves;
    }

    /**
     * Return a move to be used for a random playout
     *
     * We do a purely random selection from all acceptable moves
     */
    public pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined {
        const acceptableMoves = this.selectBranches(startingBoard, moves);
        return pick(acceptableMoves);
    }

    public scoreForBoard(board: FastBoard) {
        if (this.options.boardScoreCalculator) {
            return Math.max(0, this.options.boardScoreCalculator(board));
        }
        return board.score();
    }
}