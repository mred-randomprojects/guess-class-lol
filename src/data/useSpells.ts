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
    image: string | null;
    effects: RawEffect[];
    cooldown: string | null;
    cost: string | null;
    resource: string | null;
    damageType: string | null;
    targeting: string | null;
}

interface RawChampionSpells {
    name: string;
    patchLastChanged: string | null;
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
    patchLastChanged: string | null;
    abilities: readonly SpellInfo[];
}

type AbilityKey = "P" | "Q" | "W" | "E" | "R";

function isAbilityKey(key: string): key is AbilityKey {
    return key === "P" || key === "Q" || key === "W" || key === "E" || key === "R";
}

function buildImageUrl(key: AbilityKey, image: string | null): string {
    if (image == null) return "";
    if (key === "P") {
        return `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${image}`;
    }
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${image}`;
}

function buildAbilities(data: RawChampionSpells): SpellInfo[] {
    return data.abilities
        .filter((a) => isAbilityKey(a.key))
        .map((a) => ({
            key: a.key as AbilityKey,
            name: a.name,
            imageUrl: buildImageUrl(a.key as AbilityKey, a.image),
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
                    patchLastChanged: data.patchLastChanged ?? null,
                    abilities: buildAbilities(data),
                };
            },
        }),
        []
    );
}
