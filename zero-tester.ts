import { NumberZero } from "./lib/players/number-zero";
import { playStandardDecks } from "./lib/test-harness";

async function main() {
    const player = new NumberZero({
        maxIterations: 10
    });

    await player.initialize();

    while (true) {
        const plays_per_deck = 5;
        const stats = await playStandardDecks(player, plays_per_deck);
        console.log(stats);

        console.log(`Starting another round, hit Ctrl-C when you're bored`);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});