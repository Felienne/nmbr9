import { Move, CandidateMove } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, padLeft } from '../util';
import { Deck } from '../cards';
import { Board } from '../board';
import { MonteCarloTree, printTreeStatistics, performMcts, defaultUpperConfidenceBound, MonteCarloCallbacks } from '../algo/monte-carlo';
import { GameState } from '../game-state';
import { PlaceTileNode } from '../algo/place-tile-node';


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

    /**
     * Exploitation vs exploration factor
     * 
     * Higher = more exploration
     * Lower = more exploitation
     * 
     * Good values are in the range ???? - ? ??? ? ? 
     * 
     * @default 5
     */
    explorationFactor?: number;

    filenamePrefix?: string;
}

export type BranchSelectorFn = (board: Board, moves: CandidateMove[]) => CandidateMove[];

/**
 * This player executes MC tree search
 */
export class MonteCarloTreePlayer implements IPlayer, MonteCarloCallbacks<any> {

    public readonly name: string = 'Willow McTreeFace';
    private round = 0;
    private readonly explorationFactor: number;

    constructor(protected readonly options: MonteCarloOptions) {
        if (options.maxIterations === undefined && options.maxThinkingTimeSec === undefined) {
            throw new Error('Supply at least maxIterations or maxThinkingTimeSec');
        }

        this.explorationFactor = options.explorationFactor !== undefined ? options.explorationFactor : 5;
    }

    /**
     * True because we have unexplored moves
     */
    public readonly continueExploringAfterInitialize = false;

    initializeNode(node: PlaceTileNode<any>): void {
        for (const move of this.selectBranches(node.state.board, node.legalMoves)){
            const child = node.addExploredNode(move)
            const score = child.randomPlayout();
        }
    }

    public upperConfidenceBound(node: MonteCarloTree<any>, parentVisitCount: number) {
        return defaultUpperConfidenceBound(node, Math.max(1,parentVisitCount), this.explorationFactor);
    }

    public async calculateMove(state: GameState): Promise<Move | undefined> {
        this.round += 1;
        const root = new PlaceTileNode(undefined, state, this);

        let saveTreeFilename;
        if (this.options.filenamePrefix) {
            saveTreeFilename = this.options.filenamePrefix + `-${padLeft(5, this.round)}.mm`;
        }

        performMcts(root, {
            ...this.options,
            saveTreeFilename,
        });

        if (this.options.printTreeStatistics) {
            printTreeStatistics(root);
        }

        return root.bestMove();
    }

    public printIterationsAndSelector(){
        return `${this.options.maxIterations}, ${this.options.branchSelectorString}, ${this.options.boardScoreCalculatorString}`;
    }

    public async gameFinished(board: Board): Promise<void> {
        this.round = 0;
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

