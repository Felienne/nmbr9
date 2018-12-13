import { Board, Orientation, Move, Point } from '../board';
import { Tile } from '../tile';
import { IPlayer } from "../player";
import { pick, range, pickAndRemove, Timer, mean, sum } from '../util';
import { displayBoard } from '../display';
import { Deck } from '../cards';
import { FastBoard } from '../fast-board';
import { moveCursor } from 'readline';
import { DESTRUCTION } from 'dns';


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


    public get meanScore(): number{
        return this.totalScore / this.timesVisited;
    }

    constructor(board: FastBoard, tile:Tile | undefined, deck: Deck){
        this.board = board;
        this.tile = tile;
        this.deck =  deck;
        this.totalScore = 0;
        this.timesVisited = 0;

        this.unexploredMoves = tile ? board.getLegalMoves(tile) : [];
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

    public explore(totalGamesPlayed: number): PlayoutResult {
        if (this.tile === undefined) {
            // This is a leaf node. Just return the current score.
            return { score: this.board.score() };
        }

        let result;
        if (this.unexploredMoves.length !== 0){
            const toExplore = pickAndRemove(this.unexploredMoves);
            const boardAfterMove = new FastBoard(this.board);
            boardAfterMove.place(this.tile, toExplore);

            // Determine the next tile to be played, and what's left becomes the
            // Deck.
            // TODO: Our life would be sooooooooo much easier if Deck was all the
            // tiles with a '.currentTile' accessor (or something)
            const deckAfterMove = new Deck(this.deck);
            const nextTile = deckAfterMove.drawTile();

            const freshChild = new Tree(boardAfterMove, nextTile, deckAfterMove);
            this.children.set(toExplore, freshChild);

            result = freshChild.randomPlayout();
        } else {
            result = this.mostPromisingChild(totalGamesPlayed).explore(totalGamesPlayed);
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
            const move = pick(playoutBoard.getLegalMoves(tile));
            playoutBoard.place(tile, move);

            tile = playoutDeck.drawTile();
        }

        this.totalScore += playoutBoard.score();
        this.timesVisited += 1;
        return { score: playoutBoard.score() };
    }

    private mostPromisingChild(totalGamesPlayed: number): Tree {
        let maximumUCB = 0;
        let bestChild;
        for (const child of this.children.values()) {
            const ucb = child.upperConfidenceBound(totalGamesPlayed);
            if (ucb >= maximumUCB) {
                maximumUCB = ucb;
                bestChild = child;
            }
        }
        return bestChild;
    }

    private upperConfidenceBound(totalGamesPlayed: number) {
        const explorationFactor = 100; // Magic twiddle factor
        return this.meanScore + explorationFactor * Math.sqrt(Math.log(totalGamesPlayed) / this.timesVisited);
    }
}

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
}

/**
 * This player executes MC tree search
 */
export class MonteCarloTreePlayer implements IPlayer {
    public readonly name: string = 'Willow McTreeFace';

    constructor(private readonly options: MonteCarloOptions) {
        if (options.maxIterations === undefined && options.maxThinkingTimeSec === undefined) {
            throw new Error('Supply at least maxIterations or maxThinkingTimeSec');
        }
    }

    public calculateMove(board: FastBoard, deck:Deck, tile: Tile): Move | undefined {
        const deadline = this.options.maxThinkingTimeSec !== undefined ? Date.now() + this.options.maxThinkingTimeSec * 1000 : undefined;
        const maxIterations = this.options.maxIterations;

        const root = new Tree(board, tile, deck);

        let i = 0;
        while ((maxIterations === undefined || i < maxIterations)
                && (deadline === undefined || Date.now() <= deadline)) {
            root.explore(i);
            i += 1;
        }

        if (this.options.printTreeStatistics) {
            this.printTreeStatistics(root);
        }

        return root.bestMove();
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

        console.log(`Tree depth: ${stats.maxDepth}, nodes: ${sum(stats.totalChildren).toFixed(3)}, unexplored: ${sum(stats.unexploredChildren).toFixed(3)}`);
    }
}

interface TreeStats {
    maxDepth: number;
    totalChildren: number[];
    unexploredChildren: number[];
}