/**
 * LoL champion subclasses (Riot's class + subclass framework).
 * Controller: Enchanter, Catcher. Fighter: Juggernaut, Diver. Mage: Burst, Battlemage, Artillery.
 * Slayer: Assassin, Skirmisher. Tank: Vanguard, Warden. Plus Marksman, Specialist.
 */
export const CHAMPION_CLASSES = [
    "Enchanter",
    "Catcher",
    "Juggernaut",
    "Diver",
    "Burst",
    "Battlemage",
    "Artillery",
    "Marksman",
    "Assassin",
    "Skirmisher",
    "Vanguard",
    "Warden",
    "Specialist",
] as const;

export type ChampionClass = (typeof CHAMPION_CLASSES)[number];

export function isChampionClass(s: string): s is ChampionClass {
    return CHAMPION_CLASSES.includes(s as ChampionClass);
}
