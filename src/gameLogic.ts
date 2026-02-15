import type { ChampionClass } from "./data/classes";
import type {
    Champion,
    GameChampion,
    ClassGuessResult,
    HistoryEntry,
} from "./types";

export function pickRandomChampion(
    champions: Champion[],
    getGameChampion: (c: Champion) => GameChampion
): GameChampion | null {
    if (champions.length === 0) return null;
    const c = champions[Math.floor(Math.random() * champions.length)];
    return getGameChampion(c);
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
