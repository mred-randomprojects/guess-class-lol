import { useMemo } from "react";
import spellsData from "./championSpells.json";
import type { Champion } from "../types";

const version: string = spellsData.version;
const championsSpells = spellsData.champions as Record<
    string,
    RawChampionSpells
>;

interface RawScaling {
    attribute: string;
    value: string;
}

interface RawEffect {
    description: string;
    scalings: RawScaling[];
}

interface RawAbility {
    key: string;
    name: string;
    icon: string | null;
    effects: RawEffect[];
    cooldown: string | null;
    cost: string | null;
    resource: string | null;
    damageType: string | null;
    targeting: string | null;
}

interface RawChampionSpells {
    name: string;
    abilities: RawAbility[];
}

export interface AbilityScaling {
    attribute: string;
    value: string;
}

export interface AbilityEffect {
    description: string;
    scalings: readonly AbilityScaling[];
}

export interface SpellInfo {
    key: "P" | "Q" | "W" | "E" | "R";
    name: string;
    imageUrl: string;
    effects: readonly AbilityEffect[];
    cooldown: string | null;
    cost: string | null;
    resource: string | null;
    damageType: string | null;
}

export interface ChampionSpellSet {
    champion: Champion;
    abilities: readonly SpellInfo[];
}

type AbilityKey = "P" | "Q" | "W" | "E" | "R";

function isAbilityKey(key: string): key is AbilityKey {
    return key === "P" || key === "Q" || key === "W" || key === "E" || key === "R";
}

function buildSpellImageUrl(champion: Champion, key: AbilityKey): string {
    if (key === "P") {
        return `https://cdn.communitydragon.org/latest/champion/${champion.id}/ability-icon/p`;
    }
    return `https://cdn.communitydragon.org/latest/champion/${champion.id}/ability-icon/${key.toLowerCase()}`;
}

function buildAbilities(
    data: RawChampionSpells,
    champion: Champion
): SpellInfo[] {
    return data.abilities
        .filter((a) => isAbilityKey(a.key))
        .map((a) => ({
            key: a.key as AbilityKey,
            name: a.name,
            imageUrl: a.icon ?? buildSpellImageUrl(champion, a.key as AbilityKey),
            effects: a.effects,
            cooldown: a.cooldown,
            cost: a.cost,
            resource: a.resource,
            damageType: a.damageType,
        }));
}

export function useSpells(): {
    getSpellSet: (champion: Champion) => ChampionSpellSet | null;
    version: string;
} {
    return useMemo(
        () => ({
            version,
            getSpellSet(champion: Champion): ChampionSpellSet | null {
                const data = championsSpells[champion.id];
                if (data == null) return null;
                return {
                    champion,
                    abilities: buildAbilities(data, champion),
                };
            },
        }),
        []
    );
}
