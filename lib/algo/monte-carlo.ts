import { pick, pickAndRemove, mean, sum } from '../util';
import { Board, CandidateMove } from '../board';
import { Deck } from '../cards';
import { GameState } from '../game-state';
import xmlbuilder = require('xmlbuilder');
import { displayBoardHtml } from '../display';
import fs = require('fs');

let nodeCounter = 0;

/**
 * An implementation of MCTS for Nmbr9
 */

export interface ExploreOptions {
    /**
     * Print node fingerprints
     */
    fingerprintNodes?: boolean;
}

/**
 * A node in a Monte Carlo Tree
 */
export class MonteCarloTree<M> {
    public readonly parent?: MonteCarloTree<M>;
    public readonly state: GameState;
    public readonly level: number;

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

    constructor(
            parent: MonteCarloTree<M> | undefined,
            state: GameState,
            support: TreeSearchSupport<M>,
            ) {
        this.parent = parent;
        this.state = state;
        this.support = support;
        this.level = parent ? parent.level + 1 : 0;

        this.totalScore = 0;
        this.timesVisited = 0;
    }

    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    public* rootPath(): IterableIterator<MonteCarloTree<M>> {
        if (this.parent) { yield* this.parent.rootPath(); }
        yield this;
    }

    public bestMoveChild(): [CandidateMove | undefined, MonteCarloTree<M> | undefined] {
        if (this.exploredMoves.size === 0) {
            //we have not explored, we know nothing (we are from Barcelona)
            //we can returns any unexplored move.
            const move = pick(this.unexploredMoves);
            if (!move) { return [undefined, undefined]; }

            const node = this.addExploredNode(move);
            return [move, node];
        }

        let maximumMeanScore = 0
        let bestPair: [CandidateMove | undefined, MonteCarloTree<M> | undefined] = [undefined, undefined];
        for (const [move, child] of this.exploredMoves.entries()){
            if (child.meanScore >= maximumMeanScore){
                maximumMeanScore = child.meanScore;
                bestPair = [move, child];
            }
        }

        return bestPair;
    }

    public bestMove(): CandidateMove | undefined {
        return this.bestMoveChild()[0];
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
    public explore(options: ExploreOptions = {}): void {
        if (options.fingerprintNodes) {
            process.stderr.write(this.state.fingerprint);
        }

        if (this.initialized === false){
            this.legalMoves = Array.from(this.state.legalMoves());
            this.support.initializeNode(this)
            this.initialized = true

            if (!this.support.continueExploringAfterInitialize) {
                if (options.fingerprintNodes) { process.stderr.write('\n'); }
                return;
            }
        }

        if (this.legalMoves.length === 0) {
            // This is a leaf node or there are no possible moves to play.
            // Report the score so that we may update the weights and other
            // trees may get explored.
            // FIXME: Might bump exploration factor a bit if this happens?
            this.reportScore(this.support.scoreForBoard(this.state.board, this.state.deck.hasCards));
            if (options.fingerprintNodes) { process.stderr.write('[end-of-game]\n'); }
            return;
        }

        if (this.unexploredMoves.length !== 0){
            const toExplore = pickAndRemove(this.unexploredMoves)!;
            const freshChild = this.addExploredNode(toExplore);

            freshChild.randomPlayout();
            if (options.fingerprintNodes) { process.stderr.write('\n'); }
        } else {
            const bestChild = this.mostPromisingChild();
            if (bestChild === undefined) {
                process.stderr.write('(no child to recurse into)');
                // There are no more moves to play here, probably because the
                // board is filled up to the brim. We score what's currently
                // on the board.
                return;
            }
            // bestChild.randomPlayout(); // Collect more stats
            bestChild.explore(options);
        }
    }

    /**
     * Add a child node for the given move
     */
    public addExploredNode(move: CandidateMove): MonteCarloTree<M> {
        // What's left becomes the Deck.
        const stateAfterMove = this.state. copy();
        stateAfterMove.play(move);

        const freshChild = new MonteCarloTree(this, stateAfterMove, this.support);
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

        process.stderr.write('(playout → ');
        const playoutState = this.state.randomizedCopy();

        while (playoutState.hasCards) {
            // Random move met tile
            const move = this.support.pickRandomPlayoutMove(playoutState.board, Array.from(playoutState.legalMoves()), playoutState.deck);
            if (move === undefined) {
                break;
            }

            playoutState.play(move);
        }

        const score = this.support.scoreForBoard(playoutState.board, playoutState.hasCards);
        process.stderr.write(`${score})`);
        this.reportScore(score);
    }

    public report(parent: xmlbuilder.XMLElement) {
        const nodeText = `${this.meanScore.toFixed(0)} v:${this.timesVisited} M:${this.maxScore}`;
        const now = Date.now();
        const node = parent.ele('node', {
            TEXT: nodeText,
            FOLDED: 'true',
            POSITION: 'right',
            CREATED: `${now}`,
            MODIFIED: `${now}`,
            ID: `ID_${++nodeCounter}`,
        });
        const note = node.ele('richcontent', { TYPE: 'NOTE' });
        displayBoardHtml(this.state.board, note.ele('body'));

        for (const child of this.orderedExploredChildren()) {
            child.report(node);
        }

        for (const unexplored of this.unexploredMoves) {
            node.ele('node', { TEXT: '*unexplored*' });
        }
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

    private orderedExploredChildren(): MonteCarloTree<M>[] {
        const ret = Array.from(this.exploredMoves.values());
        ret.sort((a, b) => b.meanScore - a.meanScore);
        return ret;
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
    pickRandomPlayoutMove(startingBoard: Board, moves: CandidateMove[], remainingDeck: Deck): CandidateMove | undefined;

    /**
     * Return the score for a given board
     *
     * 'dnf' (Did Not Finish) is true if this is the final score for
     * a board in which the player painted themselves into a corner.
     */
    scoreForBoard(board: Board, dnf: boolean): number;

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

    console.error([
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

export interface MctsOptions extends ExploreOptions{
    maxThinkingTimeSec?: number;
    maxIterations?: number;
    saveTreeFilename?: string;
}

/**
 * Perform MCTS search
 */
export function performMcts<M>(root: MonteCarloTree<M>, options: MctsOptions) {
    const deadline = options.maxThinkingTimeSec !== undefined ? Date.now() + options.maxThinkingTimeSec * 1000 : undefined;
    const maxIterations = options.maxIterations;

    process.stderr.write('performMcts()\n');

    let i = 0;
    while ((maxIterations === undefined || i < maxIterations)
            && (deadline === undefined || Date.now() <= deadline)) {
        root.explore(options);
        if (!options.fingerprintNodes) { process.stderr.write('·'); }
        i += 1;
    }

    process.stderr.write('\n');

    if (options.saveTreeFilename) {
        saveTree(options.saveTreeFilename, root);
    }

    return root.bestMove();
}

export interface DefaultTreeSearchOptions {
    /**
     * Exploration factor
     *
     * Lower = More exploitation
     * Higher = More exploration
     *
     * Good values are in the range 1..10
     */
    explorationFactor?: number;
}

export class DefaultTreeSearch<M> implements TreeSearchSupport<M> {
    public continueExploringAfterInitialize: boolean = true;

    private readonly explorationFactor: number;

    constructor(options: DefaultTreeSearchOptions = {}) {
        this.explorationFactor = options.explorationFactor !== undefined ? options.explorationFactor : 5;
    }

    public initializeNode(node: MonteCarloTree<M>): void {
        node.unexploredMoves.push(...node.legalMoves);
    }

    public pickRandomPlayoutMove(startingBoard: Board, moves: CandidateMove[], remainingDeck: Deck): CandidateMove {
        return pick(moves);
    }

    public scoreForBoard(board: Board, dnf: boolean): number {
        return dnf ? 0 : board.score();
    }

    public upperConfidenceBound(node: MonteCarloTree<M>, parentVisitCount: number): number {
        return defaultUpperConfidenceBound(node, Math.max(1, parentVisitCount), this.explorationFactor);
    }
}

/**
 * Default UCB calculcation
 * @param explorationFactor Lower = deeper, higher = wider tree
 */
export function defaultUpperConfidenceBound<M>(node: MonteCarloTree<M>, parentVisitCount: number, explorationFactor: number) {
    return node.meanScore + explorationFactor * Math.sqrt(Math.log(parentVisitCount) / node.timesVisited);
}

export function fingerprintAll(path: IterableIterator<MonteCarloTree<any>>) {
    const ret = new Array<string>();
    for (const node of path) { ret.push(node.state.fingerprint); }
    return ret.join('');
}

export function saveTree<M>(fileName: string, root: MonteCarloTree<M>) {
    const doc = xmlbuilder.create('map');
    doc.attribute('version', '1.0.1');
    root.report(doc);

    fs.writeFileSync(fileName, doc.end({ pretty: true }), { encoding: 'utf-8' });
}