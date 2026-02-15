import type { ChampionClass } from "./data/classes";

export interface Champion {
    id: string;
    name: string;
    image: string;
}

export interface GameChampion extends Champion {
    classes: readonly ChampionClass[];
}

export interface ClassGuessResult {
    cls: ChampionClass;
    hit: boolean;
}

export interface HistoryEntry {
    champion: Champion;
    guessResults: readonly ClassGuessResult[];
    exactMatch: boolean;
}

export interface GameState {
    score: number;
    totalChampions: number;
    currentChampion: GameChampion | null;
    history: HistoryEntry[];
    selectedClasses: ChampionClass[];
    attemptsOnCurrent: number;
}
