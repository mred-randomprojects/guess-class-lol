import type { ChampionClass } from "./data/classes";
import type { Champion, GameChampion, HistoryEntry } from "./types";

export function pickRandomChampion(
    champions: Champion[],
    getGameChampion: (c: Champion) => GameChampion
): GameChampion | null {
    if (champions.length === 0) return null;
    const c = champions[Math.floor(Math.random() * champions.length)];
    return getGameChampion(c);
}

export function validateGuess(
    actual: readonly ChampionClass[],
    guessed: readonly ChampionClass[]
): boolean {
    if (actual.length !== guessed.length) return false;
    const a = [...actual].sort();
    const g = [...guessed].sort();
    return a.every((x, i) => x === g[i]);
}

export function buildHistoryEntry(
    champion: GameChampion,
    guessedClasses: readonly ChampionClass[],
    correct: boolean
): HistoryEntry {
    return {
        champion: {
            id: champion.id,
            name: champion.name,
            image: champion.image,
        },
        correctClasses: champion.classes,
        guessedClasses: [...guessedClasses],
        correct,
    };
}
