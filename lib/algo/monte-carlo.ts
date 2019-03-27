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
export class MonteCarloTree<M> {
    public readonly parent?: MonteCarloTree<M>;
    public readonly board: FastBoard;
    // The tile to be played this round
    public readonly tile?: Tile;
    // The tiles left in the deck after this tile has been played
    public readonly remainingDeck: Deck;

    /**
     * "Children" are explored submoves
     */
    public readonly exploredMoves = new Map<CandidateMove, MonteCarloTree<M>>();

    /**
     * Moves yet to explore
     */
    public unexploredMoves: CandidateMove[] = [];

    public legalMoves: CandidateMove[] = [];

    // The scoring statistics for this node and all of its children
    public totalScore: number;
    public maxScore: number = 0;
    public timesVisited: number;
    public annotation?: M;

    private support: TreeSearchSupport<M>;

    private initialized: boolean = false;

    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    constructor(
            parent: MonteCarloTree<M> | undefined,
            board: FastBoard,
            tile:Tile | undefined,
            deck: Deck,
            support: TreeSearchSupport<M>,
            ) {
        this.parent = parent;
        this.board = board;

        this.tile = tile;
        this.remainingDeck =  deck;
        this.support = support;

        this.totalScore = 0;
        this.timesVisited = 0;
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

    /**
     * Explore node
     *
     * Works in one of two modes:
     *
     * - If there are "unexplored" moves, pick one of those and do a random rollout.
     * - If no "unexplored" moves, pick the explored child with the highest UCB score
     *   and recurse into that.
     */
    public explore(): void {
        if (this.initialized === false){
            this.legalMoves = this.tile ? this.board.getLegalMoves(this.tile) : [];
            this.support.initializeNode(this)
            this.initialized = true

            if (!this.support.continueExploringAfterInitialize) { return; }
        }

        if (this.legalMoves.length === 0) {
            // This is a leaf node or there are no possible moves to play.
            this.reportScore(this.support.scoreForBoard(this.board, this.tile !== undefined));
            return;
        }

        if (this.unexploredMoves.length !== 0){
            const toExplore = pickAndRemove(this.unexploredMoves)!;
            const freshChild = this.addExploredNode(toExplore);

            freshChild.randomPlayout();
        } else {
            const bestChild = this.mostPromisingChild();
            if (bestChild === undefined) {
                console.log('This should never happen');
                // There are no more moves to play here, probably because the
                // board is filled up to the brim. We score what's currently
                // on the board.
                return;
            }
            // Collect more stats
            bestChild.randomPlayout();
            bestChild.explore();
        }
    }

    /**
     * Add a child node for the given move
     */
    public addExploredNode(move: CandidateMove): MonteCarloTree<M> {
        // What's left becomes the Deck.
        // TODO: Our life would be sooooooooo much easier if Deck was all the
        // tiles with a '.currentTile' accessor (or something)
        const boardAfterMove = this.board.playMoveCopy(move);
        const deckAfterMove = new Deck(this.remainingDeck);
        const nextTile = deckAfterMove.drawTile();

        const freshChild = new MonteCarloTree(this, boardAfterMove, nextTile, deckAfterMove, this.support);
        this.exploredMoves.set(move, freshChild);
        return freshChild;
    }

    /**
     * Add a score on this node and all of its parents
     */
    public reportScore(score: number) {
        let node: MonteCarloTree<M> | undefined = this;
        while (node !== undefined) {
            node.totalScore += score;
            if (score > node.maxScore) {
                node.maxScore = score;
            }
            node.timesVisited += 1;
            node = node.parent;
        }
    }

    /**
     * Perform a random playout starting from this node, reporting the score afterwards
     */
    public randomPlayout(): void {
        const playoutBoard = new FastBoard(this.board);
        const playoutDeck = new Deck(this.remainingDeck);

        let tile = this.tile;
        while (tile !== undefined) {
            // Random move met tile
            const move = this.support.pickRandomPlayoutMove(playoutBoard, playoutBoard.getLegalMoves(tile), playoutDeck);
            if (move === undefined) {
                break;
            }

            playoutBoard.playMove(move);
            tile = playoutDeck.drawTile();
        }

        const score = this.support.scoreForBoard(playoutBoard, tile !== undefined);
        this.reportScore(score);
    }

    private mostPromisingChild(): MonteCarloTree<M> | undefined {
        let maximumUCB = 0;
        let bestChild: MonteCarloTree<M> | undefined;
        for (const child of this.exploredMoves.values()) {
            const ucb = this.support.upperConfidenceBound(child, this.timesVisited);
            if (isNaN(ucb)) { throw new Error('UCB returned NaN'); }
            if (ucb >= maximumUCB) {
                maximumUCB = ucb;
                bestChild = child;
            }
        }
        return bestChild!;
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
     * Called exactly once on every node
     *
     * Should populate either `node.unexploredMoves` or `node.exploredMoves`, potentially
     * by filtering `node.legalMoves`.
     */
    initializeNode(node: MonteCarloTree<M>): void;

    /**
     * Controls whether exploration continues or stops after initializing a node
     *
     * If true, we'll continue exploring unexplored moves or recursing into
     * explored children after initializing.
     *
     * If not, initialization is the only thing done when a node is freshly minted.
     */
    readonly continueExploringAfterInitialize: boolean;

    /**
     * Return a move to be used for a random playout
     */
    pickRandomPlayoutMove(startingBoard: FastBoard, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined;

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
    const deadline = options.maxThinkingTimeSec !== undefined ? Date.now() + options.maxThinkingTimeSec * 1000 : undefined;
    const maxIterations = options.maxIterations;

    let i = 0;
    while ((maxIterations === undefined || i < maxIterations)
            && (deadline === undefined || Date.now() <= deadline)) {
        process.stderr.write(i === 0 ? '>' : '·');
        root.explore();
<<<<<<< HEAD
        if (i%10===0){
            process.stderr.write('·');
        }

=======
>>>>>>> 17e3d6f856fd116875963fe1c64cd7a7968998ba
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