import { pick, mean, sum } from '../util';
import { Board, CandidateMove } from '../board';
import { Deck } from '../cards';
import { GameState } from '../game-state';
import xmlbuilder = require('xmlbuilder');
import fs = require('fs');

/**
 * An implementation of MCTS for Nmbr9
 */

export interface ExploreOptions {
    /**
     * Print node fingerprints
     */
    fingerprintNodes?: boolean;
}

export abstract class MonteCarloTree<M>{
    public readonly parent?: MonteCarloTree<M>;
    public readonly state: GameState;

    /**
     * Depth of this node in the tree
     */
    public readonly level: number;

    // The scoring statistics for this node and all of its children
    public totalScore: number;
    public maxScore: number = 0;
    public timesVisited: number;

    // annotation can be used by the AI to store arbitrary data on the nodes.
    public annotation?: M;


    /**
     * This is in fact a set of parameter of explore, but since they are used in many places, 
     * it's now a field (we might change this at one point)
     */    
    protected callbacks: MonteCarloCallbacks<M>;

    constructor(
            parent: MonteCarloTree<M> | undefined,
            state: GameState,
            support: MonteCarloCallbacks<M>,
        ) {
        this.parent = parent;
        this.state = state;
        this.callbacks = support;
        this.level = parent ? parent.level + 1 : 0;

        this.totalScore = 0;
        this.timesVisited = 0;
    }

    public abstract explore(options?: ExploreOptions): void;
    public abstract randomPlayout(): void;
    public abstract report(parent: xmlbuilder.XMLElement, edgeAnnotation: string): void;

    public get meanScore(): number{
        if (this.timesVisited === 0) { return 0; }
        return this.totalScore / this.timesVisited;
    }

    public* rootPath(): IterableIterator<MonteCarloTree<M>> {
        if (this.parent) { yield* this.parent.rootPath(); }
        yield this;
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
}

export interface PlayoutResult {
    score: number;
}

/**
 * Callbacks that the MCTS uses to do its work
 */
export interface MonteCarloCallbacks<M> {
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
        if (node instanceof PlaceTileNode){
            stats.maxDepth = Math.max(depth, stats.maxDepth);
            stats.totalChildren.push(node.unexploredMoves.length + node.exploredMoves.size);
            stats.unexploredChildren.push(node.unexploredMoves.length);
            for (const child of node.exploredMoves.values()) {
                visit(child, depth + 1);
            }
        }
        else if (node instanceof DrawCardNode){
            stats.maxDepth = Math.max(depth, stats.maxDepth);
            stats.totalChildren.push(node.exploredCards.size);
            //TODO op zich zouden we hier ook het aantal niet geprobeerde kaarten kunnen meten 
            //stats.unexploredChildren.push(node.unexploredMoves.length);
            for (const child of node.exploredCards.values()) {
                visit(child, depth + 1);
            }
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
export function performMcts<M>(root: PlaceTileNode<M>, options: MctsOptions) {
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

export class DefaultTreeSearch<M> implements MonteCarloCallbacks<M> {
    public continueExploringAfterInitialize: boolean = true;

    private readonly explorationFactor: number;

    constructor(options: DefaultTreeSearchOptions = {}) {
        this.explorationFactor = options.explorationFactor !== undefined ? options.explorationFactor : 5;
    }

    public initializeNode(node: PlaceTileNode<M>): void {
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
    // Prevent NaN's
    parentVisitCount = Math.max(1, parentVisitCount);
    const nodeVisitCount = Math.max(1, node.timesVisited);

    return node.meanScore + explorationFactor * Math.sqrt(Math.log(parentVisitCount) / nodeVisitCount);
}

export function fingerprintAll(path: IterableIterator<MonteCarloTree<any>>) {
    const ret = new Array<string>();
    for (const node of path) { ret.push(node.state.fingerprint); }
    return ret.join('');
}

export function saveTree<M>(fileName: string, root: MonteCarloTree<M>) {
    const doc = xmlbuilder.create('map');
    doc.attribute('version', '1.0.1');
    root.report(doc, '');

    fs.writeFileSync(fileName, doc.end({ pretty: true }), { encoding: 'utf-8' });
}

import { PlaceTileNode } from './place-tile-node';import DrawCardNode from './draw-card-node';

