import { MonteCarloTree, ExploreOptions } from "./monte-carlo";
import { CandidateMove } from "../board";
import { pick, pickAndRemove } from "../util";
import { displayBoardHtml } from "../display";
import xmlbuilder = require('xmlbuilder');
import DrawCardNode from "./draw-card-node";

let nodeCounter = 0;

/**
 * A node in a Monte Carlo Tree representing the game state when a tile is offered by the 
 * game engine and needs to be placed
 */
export class PlaceTileNode<M> extends MonteCarloTree<M> {

    /**
     * "Children" are explored submoves
     */
    public readonly exploredMoves = new Map<CandidateMove, DrawCardNode<M>>();

    /**
     * Moves yet to explore
     */
    public unexploredMoves: CandidateMove[] = [];

    /** 
     * Immutable list of all possible moves from this node
     */
    public legalMoves: CandidateMove[] = [];



    private initialized: boolean = false;

    public bestMoveAndChild(): [CandidateMove | undefined, DrawCardNode<M> | undefined] {
        if (this.exploredMoves.size === 0) {
            //we have not explored, we know nothing (we are from Barcelona)
            //we can returns any unexplored move.
            const move = pick(this.unexploredMoves);
            if (!move) { return [undefined, undefined]; }

            const node = this.addExploredNode(move);
            return [move, node];
        }

        let maximumMeanScore = 0
        let bestPair: [CandidateMove | undefined, DrawCardNode<M> | undefined] = [undefined, undefined];
        for (const [move, child] of this.exploredMoves.entries()){
            if (child.meanScore >= maximumMeanScore){
                maximumMeanScore = child.meanScore;
                bestPair = [move, child];
            }
        }

        return bestPair;
    }

    public bestMove(): CandidateMove | undefined {
        return this.bestMoveAndChild()[0];
    }

    /**
     * Explore node
     *
     * Works in one of two modes:
     *
     * - If there are "unexplored" moves, pick one of those and do a random playout.
     * - If no "unexplored" moves, pick the explored child with the highest UCB score
     *   and recurse into that.
     */
    public explore(options: ExploreOptions = {}): void {
        if (options.fingerprintNodes) {
            process.stderr.write(this.state.fingerprint);
        }

        if (this.initialized === false){
            this.legalMoves = Array.from(this.state.legalMoves());
            this.callbacks.initializeNode(this)
            this.initialized = true

            if (!this.callbacks.continueExploringAfterInitialize) {
                if (options.fingerprintNodes) { process.stderr.write('\n'); }
                return;
            }
        }

        if (this.legalMoves.length === 0) {
            // This is a leaf node or there are no possible moves to play.
            // Report the score so that we may update the weights and other
            // trees may get explored.
            // FIXME: Might bump exploration factor a bit if this happens?
            this.reportScore(this.callbacks.scoreForBoard(this.state.board, this.state.deck.hasCards));
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
    public addExploredNode(move: CandidateMove): DrawCardNode<M> {
        // What's left becomes the Deck.
        const stateAfterMove = this.state.copy();
        stateAfterMove.play(move);

        const freshChild = new DrawCardNode(this, stateAfterMove, this.callbacks);
        this.exploredMoves.set(move, freshChild);
        return freshChild;
    }

    /**
     * Perform a random playout starting from this node, reporting the score afterwards
     */
    public randomPlayout(): void {
        process.stderr.write('(playout → ');
        const playoutState = this.state.randomizedCopy();

        while (playoutState.hasCards) {
            // Random move met tile
            const move = this.callbacks.pickRandomPlayoutMove(playoutState.board, Array.from(playoutState.legalMoves()), playoutState.deck);
            if (move === undefined) {
                break;
            }

            playoutState.play(move);
        }

        const score = this.callbacks.scoreForBoard(playoutState.board, playoutState.hasCards);
        process.stderr.write(`${score})`);
        this.reportScore(score);
    }

    public report(parent: xmlbuilder.XMLElement, edgeAnnotation: string) {
        const nodeText = `${edgeAnnotation} ${this.meanScore.toFixed(0)} v:${this.timesVisited} M:${this.maxScore}`;
        const now = Date.now();
        const node = parent.ele('node', {
            TEXT: nodeText,
            FOLDED: 'true',
            POSITION: 'right',
            CREATED: `${now}`,
            MODIFIED: `${now}`,
            ID: `ID_PT${++nodeCounter}`,
        });
        const note = node.ele('richcontent', { TYPE: 'NOTE' });
        displayBoardHtml(this.state.board, note.ele('body'));

        for (const child of this.orderedExploredChildren()) {
            child.report(node, '');
        }

        for (const unexplored of this.unexploredMoves) {
            node.ele('node', { TEXT: '*unexplored*' });
        }
    }

    private mostPromisingChild(): DrawCardNode<M> | undefined {
        let maximumUCB = 0;
        let bestChild: DrawCardNode<M> | undefined;
        for (const child of this.exploredMoves.values()) {
            const ucb = this.callbacks.upperConfidenceBound(child, this.timesVisited);
            if (isNaN(ucb)) { throw new Error('UCB returned NaN'); }
            if (ucb >= maximumUCB) {
                maximumUCB = ucb;
                bestChild = child;
            }
        }
        return bestChild!;
    }

    private orderedExploredChildren(): DrawCardNode<M>[] {
        const ret = Array.from(this.exploredMoves.values());
        ret.sort((a, b) => b.meanScore - a.meanScore);
        return ret;
    }
}
