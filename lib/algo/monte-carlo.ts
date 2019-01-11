import { pick, pickAndRemove, mean, sum } from '../util';
import { roughFraction } from '../display';
import { FastBoard } from '../fast-board';
import { Tile } from '../tile';
import { Deck } from '../cards';
import { Move, CandidateMove } from '../board';

/**
 * A move in the monte carlo tree
 *
 * It's a CandidateMove with additional data of some type.
 */
export interface MonteCarloMove<M> {
    move: CandidateMove;
    annotation: M;
}

/**
 * An implementation of MCTS for Nmbr9
 */

/**
 * A node in a Monte Carlo Tree
 */
export class MonteCarloTree<M> {
    public readonly board: FastBoard;
    // The tile to be played this round
    public readonly tile?: Tile;
    // The tiles left in the deck after this tile has been played
    public readonly remainingDeck: Deck;

    public readonly moveGettingHere?: MonteCarloMove<M>;

    /**
     * "Children" are explored submoves
     */
    public readonly exploredMoves = new Map<MonteCarloMove<M>, MonteCarloTree<M>>();

    /**
     * Moves yet to explore
     */
    public readonly unexploredMoves: MonteCarloMove<M>[];

    // The scoring statistics for this node and all of its children
    public totalScore: number;
    public timesVisited: number;

    private possibleMoveCount: number;
    private support: TreeSearchSupport<M>;

    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    constructor(
            board: FastBoard,
            tile:Tile | undefined,
            deck: Deck,
            support: TreeSearchSupport<M>,
            moveGettingHere?: MonteCarloMove<M>
            ) {
        this.board = board;
        this.tile = tile;
        this.remainingDeck =  deck;
        this.support = support;
        this.moveGettingHere = moveGettingHere;

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
        if (this.exploredMoves.size === 0){
            //we have not explored, we know nothing (we are from Barcelona)
            //we can returns any unexplored move.
            return pick(this.unexploredMoves);
        }

        let maximumMeanScore = 0
        let bestMove = undefined;
        for (const [move, child] of this.exploredMoves.entries()){
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
            return { score: this.support.scoreForBoard(this.board, !this.remainingDeck.isEmpty) };
        }

        let result;
        if (this.unexploredMoves.length !== 0){
            const toExplore = pickAndRemove(this.unexploredMoves)!;
            const boardAfterMove = new FastBoard(this.board);
            boardAfterMove.place(this.tile!, toExplore.move);

            // Determine the next tile to be played, and what's left becomes the
            // Deck.
            // TODO: Our life would be sooooooooo much easier if Deck was all the
            // tiles with a '.currentTile' accessor (or something)
            const deckAfterMove = new Deck(this.remainingDeck);
            const nextTile = deckAfterMove.drawTile();

            const freshChild = new MonteCarloTree(boardAfterMove, nextTile, deckAfterMove, this.support, toExplore);
            this.exploredMoves.set(toExplore, freshChild);

            result = freshChild.randomPlayout();
        } else {
            const bestChild = this.mostPromisingChild();
            if (bestChild === undefined) {
                console.log('This should never happen');
                // There are no more moves to play here, probably because the
                // board is filled up to the brim. We score what's currently
                // on the board.
                return { score: this.support.scoreForBoard(this.board, true) };
            }
            result = bestChild.explore();
        }

        this.totalScore += result.score;
        this.timesVisited += 1;
        return result;
    }

    private randomPlayout(): PlayoutResult {
        const playoutBoard = new FastBoard(this.board);
        const playoutDeck = new Deck(this.remainingDeck);

        let tile = this.tile;
        while (tile !== undefined) {
            // Random move met tile
            const move = this.support.pickRandomPlayoutMove(playoutBoard, playoutBoard.getLegalMoves(tile), playoutDeck);

            if (move === undefined) { break; }
            playoutBoard.playMove(move.move);

            tile = playoutDeck.drawTile();
        }

        const score = this.support.scoreForBoard(playoutBoard, tile !== undefined);
        this.totalScore += score;
        this.timesVisited += 1;
        return { score };
    }

    private mostPromisingChild(): MonteCarloTree<M> | undefined {
        let maximumUCB = 0;
        let bestChild: MonteCarloTree<M> | undefined;
        for (const child of this.exploredMoves.values()) {
            const ucb = this.support.upperConfidenceBound(child, this.timesVisited);
            if (ucb >= maximumUCB) {
                maximumUCB = ucb;
                bestChild = child;
            }
        }
        return bestChild!;
    }

    private filterAcceptableMoves(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): MonteCarloMove<M>[] {
        if (moves.length === 0) { return []; }

        const makeMutable = startingBoard.makeImmutable();
        try {
            const acceptableMoves = this.support.selectBranches(startingBoard, moves, remainingDeck);
            process.stderr.write(roughFraction(acceptableMoves.length / moves.length));
            // If this returns nothing, we're effed.
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
export interface TreeSearchSupport<M> {
    /**
     * Restrict the search of a given node to a set of possible moves
     */
    selectBranches(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): MonteCarloMove<M>[];

    /**
     * Return a move to be used for a random playout
     */
    pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): MonteCarloMove<M> | undefined;

    /**
     * Return the score for a given board
     *
     * 'dnf' (Did Not Finish) is true if this is the final score for
     * a board in which the player painted themselves into a corner.
     */
    scoreForBoard(board: FastBoard, dnf: boolean): number;

    /**
     * Return the UCB for a given node
     *
     * The node with the highest UCB will be explored.
     */
    upperConfidenceBound(node: MonteCarloTree<M>, parentVisitCount: number): number;
}

/**
 * Take a tree and calculate and print some pertinent statistics of it
 */
export function printTreeStatistics<M>(root: MonteCarloTree<M>) {
    const stats: TreeStats = {
        maxDepth: 0,
        totalChildren: [],
        unexploredChildren: [],
    };

    function visit(node: MonteCarloTree<M>, depth: number) {
        stats.maxDepth = Math.max(depth, stats.maxDepth);
        stats.totalChildren.push(node.unexploredMoves.length + node.exploredMoves.size);
        stats.unexploredChildren.push(node.unexploredMoves.length);
        for (const child of node.exploredMoves.values()) {
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
export function performMcts<M>(root: MonteCarloTree<M>, options: MctsOptions) {
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

/**
 * Default UCB calculcation
 * @param explorationFactor Lower = deeper, higher = wider tree
 */
export function defaultUpperConfidenceBound<M>(node: MonteCarloTree<M>, parentVisitCount: number, explorationFactor: number) {
    return node.meanScore + explorationFactor * Math.sqrt(Math.log(parentVisitCount) / node.timesVisited);
}