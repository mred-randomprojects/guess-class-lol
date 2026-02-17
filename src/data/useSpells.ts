import { useMemo } from "react";
import spellsData from "./championSpells.json";
import type { Champion } from "../types";

const version: string = spellsData.version;
const championsSpells = spellsData.champions as Record<string, RawChampionSpells>;

interface RawSpell {
    key: string;
    name: string;
    description: string;
    image: string;
    cooldown: number[];
    cost: number[];
    costType: string;
    range: number[];
    maxrank: number;
}

interface RawPassive {
    name: string;
    description: string;
    image: string;
}

interface RawChampionSpells {
    passive: RawPassive;
    spells: RawSpell[];
}

export interface SpellInfo {
    key: "Passive" | "Q" | "W" | "E" | "R";
    name: string;
    description: string;
    imageUrl: string;
    cooldown: number[] | null;
    cost: number[] | null;
    costType: string | null;
    range: number[] | null;
    maxrank: number | null;
}

export interface ChampionSpellSet {
    champion: Champion;
    abilities: readonly SpellInfo[];
}

function stripHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, "");
}

function buildSpellImageUrl(image: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${image}`;
}

function buildPassiveImageUrl(image: string): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${image}`;
}

function buildAbilities(data: RawChampionSpells): SpellInfo[] {
    const abilities: SpellInfo[] = [];

    abilities.push({
        key: "Passive",
        name: data.passive.name,
        description: stripHtmlTags(data.passive.description),
        imageUrl: buildPassiveImageUrl(data.passive.image),
        cooldown: null,
        cost: null,
        costType: null,
        range: null,
        maxrank: null,
    });

    const keys = ["Q", "W", "E", "R"] as const;
    for (let i = 0; i < data.spells.length; i++) {
        const s = data.spells[i];
        abilities.push({
            key: keys[i],
            name: s.name,
            description: stripHtmlTags(s.description),
            imageUrl: buildSpellImageUrl(s.image),
            cooldown: s.cooldown,
            cost: s.cost,
            costType: s.costType,
            range: s.range,
            maxrank: s.maxrank,
        });
    }

    return abilities;
}

export function useSpells(): {
    getSpellSet: (champion: Champion) => ChampionSpellSet | null;
} {
    return useMemo(
        () => ({
            getSpellSet(champion: Champion): ChampionSpellSet | null {
                const data = championsSpells[champion.id];
                if (data == null) return null;
                return {
                    champion,
                    abilities: buildAbilities(data),
                };
            },
        }),
        []
    );
}
