import { Move, CandidateMove } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, pickAndRemove, mean, sum } from '../util';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';
import { stream } from 'fast-check';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';


// FIXME: A lot of things will need to change once we remove "full knowledge" of the Deck.

class Tree{
    public readonly board: FastBoard;
    // The tile to be played this round
    public readonly tile?: Tile;
    // The tiles left in the deck
    public readonly deck: Deck;

    //children contains the subtree that is formed from the board by making the corresponding move
    public readonly children: Map <Move, Tree> = new Map <Move, Tree>();

    public readonly unexploredMoves: Move[];

    // The scoring statistics for this node and all of its children
    public totalScore: number;
    public timesVisited: number;

    private player: MonteCarloTreePlayer;
    private possibleMoveCount: number;

    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    constructor(
            board: FastBoard,
            tile:Tile | undefined,
            deck: Deck,
            player: MonteCarloTreePlayer) {
        this.board = board;
        this.tile = tile;
        this.deck =  deck;
        this.totalScore = 0;
        this.timesVisited = 0;
        this.player = player;

        if (tile) {
            this.unexploredMoves = this.filterAcceptableMoves(board, board.getLegalMoves(tile), deck);
        } else {
            this.unexploredMoves = [];
        }

        this.possibleMoveCount = this.unexploredMoves.length;
    }

    public bestMove(){
        if (this.children.size === 0){
            //we have not explored, we know nothing (we are from Barcelona)
            //we can returns any unexplored move, why not the first one?
            return this.unexploredMoves[0];
        }

        let maximumMeanScore = 0
        let bestMove = undefined;
        for (const [move, child] of this.children.entries()){
            if (child.meanScore >= maximumMeanScore){
                maximumMeanScore = child.meanScore;
                bestMove = move;
            }
        }

        return bestMove;
    }

    public explore(): PlayoutResult {
        if (this.possibleMoveCount === 0) {
            // This is a leaf node or all possible moves got pruned. Just return the current score.
            return { score: this.player.scoreForBoard(this.board) };
        }

        let result;
        if (this.unexploredMoves.length !== 0){
            const toExplore = pickAndRemove(this.unexploredMoves)!;
            const boardAfterMove = new FastBoard(this.board);
            boardAfterMove.place(this.tile!, toExplore);

            // Determine the next tile to be played, and what's left becomes the
            // Deck.
            // TODO: Our life would be sooooooooo much easier if Deck was all the
            // tiles with a '.currentTile' accessor (or something)
            const deckAfterMove = new Deck(this.deck);
            const nextTile = deckAfterMove.drawTile();

            const freshChild = new Tree(boardAfterMove, nextTile, deckAfterMove, this.player);
            this.children.set(toExplore, freshChild);

            result = freshChild.randomPlayout();
        } else {
            const bestChild = this.mostPromisingChild(this.timesVisited);
            if (bestChild === undefined) {
                // There are no more moves to play here, probably because the
                // board is filled up to the brim. We score what's currently
                // on the board.
                // FIXME: Should we score 0 to penalize harder?
                return { score: this.player.scoreForBoard(this.board) };
            }
            result = bestChild.explore();
        }

        this.totalScore += result.score;
        this.timesVisited += 1;
        return result;
    }

    private randomPlayout(): PlayoutResult {
        const playoutBoard = new FastBoard(this.board);
        const playoutDeck = new Deck(this.deck);

        let tile = this.tile;
        while (tile !== undefined) {
            // Random move met tile
            const moves = this.filterAcceptableMoves(playoutBoard, playoutBoard.getLegalMoves(tile), playoutDeck);
            const move = pick(moves);

            if (move === undefined) { break; } // End of game. FIXME: Should we score 0 to penalize harder?
            playoutBoard.place(tile, move);

            tile = playoutDeck.drawTile();
        }

        this.totalScore += this.player.scoreForBoard(playoutBoard);
        this.timesVisited += 1;
        return { score: this.player.scoreForBoard(playoutBoard) };
    }

    private mostPromisingChild(totalGamesPlayed: number): Tree | undefined {
        let maximumUCB = 0;
        let bestChild: Tree | undefined;
        for (const child of this.children.values()) {
            const ucb = child.upperConfidenceBound(totalGamesPlayed);
            if (ucb >= maximumUCB) {
                maximumUCB = ucb;
                bestChild = child;
            }
        }
        return bestChild!;
    }

    private upperConfidenceBound(totalGamesPlayed: number) {
        const explorationFactor = 100; // Magic twiddle factor
        return this.meanScore + explorationFactor * Math.sqrt(Math.log(totalGamesPlayed) / this.timesVisited);
    }

    private filterAcceptableMoves(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck) {
        const makeMutable = startingBoard.makeImmutable();
        try {
            const acceptableMoves = this.player.selectBranches(startingBoard, moves);
            if (acceptableMoves.length === 0) {
                console.log('Rejected all moves');
                return [moves[0]];
            }
            return acceptableMoves;
        } finally {
            makeMutable();
        }
    }
}


export type BoardFunction<T> = (board: FastBoard) => T;

interface PlayoutResult {
    score: number;
}

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
export class MonteCarloTreePlayer implements IPlayer {
    public readonly name: string = 'Willow McTreeFace';

    constructor(protected readonly options: MonteCarloOptions) {
        if (options.maxIterations === undefined && options.maxThinkingTimeSec === undefined) {
            throw new Error('Supply at least maxIterations or maxThinkingTimeSec');
        }
    }

    public calculateMove(board: FastBoard, deck:Deck, tile: Tile): Move | undefined {
        const deadline = this.options.maxThinkingTimeSec !== undefined ? Date.now() + this.options.maxThinkingTimeSec * 1000 : undefined;
        const maxIterations = this.options.maxIterations;

        const root = new Tree(board, tile, deck, this);

        let i = 0;
        while ((maxIterations === undefined || i < maxIterations)
                && (deadline === undefined || Date.now() <= deadline)) {
            //console.log('Thinking...');
            root.explore();
            i += 1;
        }

        if (this.options.printTreeStatistics) {
            this.printTreeStatistics(root);
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

    public scoreForBoard(board: FastBoard) {
        if (this.options.boardScoreCalculator) {
            return Math.max(0, this.options.boardScoreCalculator(board));
        }
        return board.score();
    }

    private printTreeStatistics(root: Tree) {
        const stats: TreeStats = {
            maxDepth: 0,
            totalChildren: [],
            unexploredChildren: [],
        };

        function visit(node: Tree, depth: number) {
            stats.maxDepth = Math.max(depth, stats.maxDepth);
            stats.totalChildren.push(node.unexploredMoves.length + node.children.size);
            stats.unexploredChildren.push(node.unexploredMoves.length);
            for (const child of node.children.values()) {
                visit(child, depth + 1);
            }
        }

        visit(root, 0);

        console.log([
           `Tree depth: ${stats.maxDepth}`,
           `total nodes: ${sum(stats.totalChildren).toFixed(0)}`,
           `avg degree: ${mean(stats.totalChildren).toFixed(1)}`,
           `unexplored: ${sum(stats.unexploredChildren).toFixed(0)}`
        ].join(', '));
    }
}

interface TreeStats {
    maxDepth: number;
    totalChildren: number[];
    unexploredChildren: number[];
}