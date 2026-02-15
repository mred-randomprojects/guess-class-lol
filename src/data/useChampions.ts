import { useMemo } from "react";
import championsData from "./champions.json";
import classesData from "./championClasses.json";
import type { ChampionClass } from "./classes";
import { CHAMPION_CLASSES, isChampionClass } from "./classes";
import type { Champion, GameChampion } from "../types";

const championList: Champion[] = championsData.champions;
const version: string = championsData.version;

const classMap: Record<string, ChampionClass[]> = {};
for (const [id, arr] of Object.entries(classesData)) {
    if (!Array.isArray(arr)) continue;
    const valid = arr.filter((c): c is ChampionClass => isChampionClass(c));
    if (valid.length > 0) classMap[id] = valid;
}

function getClassesForChampion(id: string): ChampionClass[] {
    const mapped = classMap[id];
    if (mapped != null) return [...mapped];
    return ["Specialist"];
}

export function getImageUrl(champion: Champion): string {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image}`;
}

export function useChampions(): {
    champions: Champion[];
    getGameChampion: (champion: Champion) => GameChampion;
    imageVersion: string;
} {
    return useMemo(
        () => ({
            champions: championList,
            imageVersion: version,
            getGameChampion(c: Champion): GameChampion {
                return {
                    ...c,
                    classes: getClassesForChampion(c.id),
                };
            },
        }),
        []
    );
}

export { CHAMPION_CLASSES };
