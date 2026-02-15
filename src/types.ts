import type { ChampionClass } from "./data/classes";

export interface Champion {
    id: string;
    name: string;
    image: string;
}

export interface GameChampion extends Champion {
    classes: readonly ChampionClass[];
}

export interface HistoryEntry {
    champion: Champion;
    correctClasses: readonly ChampionClass[];
    guessedClasses: readonly ChampionClass[];
    correct: boolean;
}

export interface GameState {
    score: number;
    currentChampion: GameChampion | null;
    history: HistoryEntry[];
    selectedClasses: ChampionClass[];
}
