import { NumberZero } from "./lib/players/number-zero";
import { playFixedDeck, FIXED_DECKS } from "./lib/test-harness";

async function main() {
    const player = new NumberZero({
        maxIterations: 50
    });

    await player.initialize();

    while (true) {
        const stats = await playFixedDeck(player, FIXED_DECKS[5]); // Felienne says 5
        console.log(stats);

        console.log(`Starting another round, hit Ctrl-C when you're bored`);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});