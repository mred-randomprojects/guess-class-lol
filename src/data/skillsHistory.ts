type AbilityKey = "P" | "Q" | "W" | "E" | "R";
type Rating = "nailed" | "partial" | "no_idea";

export interface SkillReviewRecord {
    championId: string;
    championName: string;
    abilityKey: AbilityKey;
    abilityName: string;
    rating: Rating;
    timestamp: number;
}

const STORAGE_KEY = "skills-trainer-history";

export function loadHistory(): SkillReviewRecord[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as SkillReviewRecord[];
    } catch {
        return [];
    }
}

export function appendHistory(records: readonly SkillReviewRecord[]): void {
    const existing = loadHistory();
    const merged = [...existing, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}
