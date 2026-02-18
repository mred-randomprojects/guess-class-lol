import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "../src/data/championSpells.json");
const { champions } = JSON.parse(readFileSync(dataPath, "utf-8"));

function parseCooldownValues(cooldownStr) {
    if (cooldownStr == null) return [];
    const parts = cooldownStr.split("/").map((s) => s.trim());
    return parts
        .map((p) => {
            const numPart = p.replace(/\s*\([^)]*\)\s*$/, "").trim();
            const parsed = parseFloat(numPart);
            return Number.isNaN(parsed) ? null : parsed;
        })
        .filter((v) => v != null);
}

function getDescription(ability) {
    const effects = ability.effects ?? [];
    const first = effects[0];
    return first != null ? first.description : "";
}

const entries = [];

for (const [championName, champion] of Object.entries(champions)) {
    const abilities = champion.abilities ?? [];
    for (const ability of abilities) {
        const values = parseCooldownValues(ability.cooldown);
        if (values.length === 0) continue;

        const cdLevel1 = values[0];
        const cdMaxLevel = values[values.length - 1];

        entries.push({
            champion: championName,
            key: ability.key,
            name: ability.name,
            description: getDescription(ability),
            cdLevel1,
            cdMaxLevel,
        });
    }
}

const byLevel1 = [...entries].sort((a, b) => b.cdLevel1 - a.cdLevel1);
const byMaxLevel = [...entries].sort((a, b) => b.cdMaxLevel - a.cdMaxLevel);

console.log("=== ABILITIES BY COOLDOWN AT LEVEL 1 (highest first) ===\n");
for (const e of byLevel1) {
    console.log(`${e.champion} ${e.key}: ${e.name} (${e.cdLevel1}s)`);
    console.log(
        `  ${e.description.slice(0, 120)}${e.description.length > 120 ? "..." : ""}`,
    );
    console.log("");
}

console.log("\n=== ABILITIES BY COOLDOWN AT MAX LEVEL (highest first) ===\n");
for (const e of byMaxLevel) {
    console.log(`${e.champion} ${e.key}: ${e.name} (${e.cdMaxLevel}s)`);
    console.log(
        `  ${e.description.slice(0, 120)}${e.description.length > 120 ? "..." : ""}`,
    );
    console.log("");
}
