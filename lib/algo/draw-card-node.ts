import { MonteCarloTree, MonteCarloCallbacks, ExploreOptions } from "./monte-carlo";
import { GameState } from "../game-state";
import xmlbuilder = require('xmlbuilder');
import { PlaceTileNode } from "./place-tile-node";
import { displayBoardHtml } from "../display";

let nodeCounter = 0;
/**
 * A node in a Monte Carlo Tree representing the game state when a tile has just been placed 
 * and we will simulate the next card
 */
export default class DrawCardNode<M> extends MonteCarloTree<M> {
    /**
     * We explore all possible cards, represented not as cards or tiles but as numbers
     */
    public readonly exploredCards = new Map<number, PlaceTileNode<M>>();

    constructor(
        parent: MonteCarloTree<M> | undefined,
        state: GameState,
        callbacks: MonteCarloCallbacks<M>,
    ) {
        super(parent, state, callbacks);
    }
    
    public explore(options?: ExploreOptions): void {
        if (this.state.deck.isEmpty) {
            // This is a leaf node or there are no possible moves to play.
            // Report the score so that we may update the weights and other
            // trees may get explored.
            // FIXME: Might bump exploration factor a bit if this happens?
            this.reportScore(this.callbacks.scoreForBoard(this.state.board, this.state.deck.hasCards));
            return;
        }

        const d = this.state.deck.shuffledCopy();
        const cardToBeExplored = d.currentTile.value;

        //check if this node already has a child. if so, explore it
        //if not, create a node and do a random playout
        const existingChild = this.exploredCards.get(cardToBeExplored);

        if (!existingChild){
            const newGameState = new GameState(this.state.board, d);
            const p = new PlaceTileNode(this, newGameState, this.callbacks);
            p.randomPlayout();
            this.exploredCards.set(cardToBeExplored, p);
        } 
        else {
            existingChild.explore(options);  
        }
    }
    
    public randomPlayout(): void {
        //TODO: could be merged with the function above because of a lot of shared functionality
        if (this.state.deck.isEmpty) {
            // DrawCard nodes at the bottom of the tree can exist but can't be explored
            this.reportScore(this.callbacks.scoreForBoard(this.state.board, this.state.deck.hasCards));
            return;
        }

        const d = this.state.deck.shuffledCopy();
        const newGameState = new GameState(this.state.board, d);

        const newKid = new PlaceTileNode(this, newGameState, this.callbacks)
        newKid.randomPlayout();
        this.exploredCards.set(d.currentTile.value, newKid);
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
            ID: `ID_DC${++nodeCounter}`,
        });
        const note = node.ele('richcontent', { TYPE: 'NOTE' });
        displayBoardHtml(this.state.board, note.ele('body'));

        for (const [card,child] of this.exploredCards.entries()) {
            child.report(node, `draw ${card}`);
        }

        //TODO: we could also report the unexplred cards here
    }


    
}