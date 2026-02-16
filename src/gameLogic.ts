import type { ChampionClass } from "./data/classes";
import type {
    Champion,
    GameChampion,
    ClassGuessResult,
    HistoryEntry,
} from "./types";

/** Fisher-Yates shuffle, returns a new array. */
export function shuffleChampions(champions: readonly Champion[]): Champion[] {
    const shuffled = [...champions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/** Check if a guess is an exact match (same classes, same count). */
export function isExactMatch(
    actual: readonly ChampionClass[],
    guessed: readonly ChampionClass[]
): boolean {
    if (actual.length !== guessed.length) return false;
    const a = [...actual].sort();
    const g = [...guessed].sort();
    return a.every((x, i) => x === g[i]);
}

/** Classify each guessed class as a hit (in champion's classes) or miss. */
export function classifyGuess(
    actual: readonly ChampionClass[],
    guessed: readonly ChampionClass[]
): ClassGuessResult[] {
    return guessed.map((cls) => ({
        cls,
        hit: actual.includes(cls),
    }));
}

export function buildHistoryEntry(
    champion: GameChampion,
    guessResults: ClassGuessResult[],
    exactMatch: boolean
): HistoryEntry {
    return {
        champion: {
            id: champion.id,
            name: champion.name,
            image: champion.image,
        },
        guessResults,
        exactMatch,
    };
}
