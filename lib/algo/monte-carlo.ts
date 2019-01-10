import { pick, pickAndRemove, mean, sum } from '../util';
import { roughFraction } from '../display';
import { FastBoard } from '../fast-board';
import { Tile } from '../tile';
import { Deck } from '../cards';
import { Move, CandidateMove } from '../board';

/**
 * An implementation of MCTS for Nmbr9
 */

/**
 * A node in a Monte Carlo Tree
 */
export class MonteCarloTree {
    public readonly board: FastBoard;
    // The tile to be played this round
    public readonly tile?: Tile;
    // The tiles left in the deck
    public readonly deck: Deck;

    //children contains the subtree that is formed from the board by making the corresponding move
    public readonly children = new Map <CandidateMove, MonteCarloTree>();

    public readonly unexploredMoves: CandidateMove[];

    // The scoring statistics for this node and all of its children
    public totalScore: number;
    public timesVisited: number;

    private possibleMoveCount: number;
    private player: TreeSearchSupport;

    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    constructor(
            board: FastBoard,
            tile:Tile | undefined,
            deck: Deck,
            player: TreeSearchSupport
            ) {
        this.board = board;
        this.tile = tile;
        this.deck =  deck;
        this.player = player;

        this.totalScore = 0;
        this.timesVisited = 0;

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
            //we can returns any unexplored move.
            return pick(this.unexploredMoves);
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
            return { score: this.player.scoreForBoard(this.board, !this.deck.isEmpty) };
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

            const freshChild = new MonteCarloTree(boardAfterMove, nextTile, deckAfterMove, this.player);
            this.children.set(toExplore, freshChild);

            result = freshChild.randomPlayout();
        } else {
            const bestChild = this.mostPromisingChild(this.timesVisited);
            if (bestChild === undefined) {
                // There are no more moves to play here, probably because the
                // board is filled up to the brim. We score what's currently
                // on the board.
                return { score: this.player.scoreForBoard(this.board, true) };
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

        const score = this.player.scoreForBoard(playoutBoard, !playoutDeck.isEmpty);
        this.totalScore += score;
        this.timesVisited += 1;
        return { score };
    }

    private mostPromisingChild(totalGamesPlayed: number): MonteCarloTree | undefined {
        let maximumUCB = 0;
        let bestChild: MonteCarloTree | undefined;
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

    private filterAcceptableMoves(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): CandidateMove[] {
        if (moves.length === 0) { return []; }

        const makeMutable = startingBoard.makeImmutable();
        try {
            const acceptableMoves = this.player.selectBranches(startingBoard, moves);
            process.stderr.write(roughFraction(acceptableMoves.length / moves.length));
            if (acceptableMoves.length === 0) {
                return [pick(moves)!];
            }
            return acceptableMoves;
        } finally {
            makeMutable();
        }
    }
}

export interface PlayoutResult {
    score: number;
}

/**
 * Callbacks that the MCTS uses to do its work
 */
export interface TreeSearchSupport {
    /**
     * Restrict the search of a given node to a set of possible moves
     */
    selectBranches(startingBoard: FastBoard, moves: CandidateMove[]): CandidateMove[];

    /**
     * Return the score for a given board
     *
     * 'dnf' (Did Not Finish) is true if this is the final score for
     * a board in which the player painted themselves into a corner.
     */
    scoreForBoard(board: FastBoard, dnf: boolean): number;
}

/**
 * Take a tree and calculate and print some pertinent statistics of it
 */
export function printTreeStatistics(root: MonteCarloTree) {
    const stats: TreeStats = {
        maxDepth: 0,
        totalChildren: [],
        unexploredChildren: [],
    };

    function visit(node: MonteCarloTree, depth: number) {
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

interface TreeStats {
    maxDepth: number;
    totalChildren: number[];
    unexploredChildren: number[];
}

export interface MctsOptions {
    maxThinkingTimeSec?: number;
    maxIterations?: number;
}

/**
 * Perform MCTS search
 */
export function performMcts(root: MonteCarloTree, options: MctsOptions) {
    process.stderr.write('>');

    const deadline = options.maxThinkingTimeSec !== undefined ? Date.now() + options.maxThinkingTimeSec * 1000 : undefined;
    const maxIterations = options.maxIterations;

    let i = 0;
    while ((maxIterations === undefined || i < maxIterations)
            && (deadline === undefined || Date.now() <= deadline)) {
        root.explore();
        process.stderr.write('·');
        i += 1;
    }

    process.stderr.write('\n');

    return root.bestMove();
}