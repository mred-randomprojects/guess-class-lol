/**
 * Fetches detailed spell data for every champion from Meraki Analytics
 * (which pulls resolved data from the League wiki) and writes
 * src/data/championSpells.json. Run: npm run fetch-spells
 *
 * We still use Data Dragon for spell/passive icon URLs since they're
 * the most reliable CDN for those.
 *
 * Meraki API: https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json
 */
const MERAKI_ALL_URL =
    "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json";
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const OUT_PATH = new URL("../src/data/championSpells.json", import.meta.url);

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
}

/**
 * Formats a single leveling entry into a human-readable string.
 * e.g. "Magic Damage: 85/130/175/220/265 (+90% AP)"
 */
function formatLeveling(entry) {
    const parts = [];
    for (const mod of entry.modifiers) {
        const unique = [...new Set(mod.values)];
        const valStr =
            unique.length === 1 ? `${unique[0]}` : mod.values.join("/");
        const unit = mod.units[0] || "";
        if (unit) {
            parts.push(`${valStr}${unit}`);
        } else {
            parts.push(valStr);
        }
    }

    // Join base values and scaling: "85/130/175/220/265 (+90% AP)"
    const base = parts[0] || "";
    const scalings = parts
        .slice(1)
        .map((s) => `(+${s})`)
        .join(" ");
    const value = scalings ? `${base} ${scalings}` : base;

    return { attribute: entry.attribute, value };
}

/**
 * Formats cost/cooldown modifiers into a display string.
 */
function formatModifiers(obj) {
    if (obj == null || obj.modifiers == null) return null;
    const parts = [];
    for (const mod of obj.modifiers) {
        const unique = [...new Set(mod.values)];
        const valStr =
            unique.length === 1 ? `${unique[0]}` : mod.values.join("/");
        const unit = mod.units[0] || "";
        parts.push(`${valStr}${unit}`);
    }
    return parts.join(" ");
}

function extractAbility(key, abilityArray) {
    // Meraki stores abilities as arrays (for transforms etc.), take the first
    const ability = abilityArray[0];
    if (ability == null) return null;

    const effects = ability.effects.map((effect) => ({
        description: effect.description,
        scalings: effect.leveling.map(formatLeveling),
    }));

    return {
        key,
        name: ability.name,
        icon: ability.icon || null,
        effects,
        cooldown: formatModifiers(ability.cooldown),
        cost: formatModifiers(ability.cost),
        resource: ability.resource || null,
        damageType: ability.damageType || null,
        targeting: ability.targeting || null,
    };
}

async function main() {
    console.log("Fetching Data Dragon version...");
    const versions = await fetchJson(VERSIONS_URL);
    const ddVersion = versions[0];
    console.log(`Data Dragon version: ${ddVersion}`);

    console.log("Fetching Meraki champions data...");
    const merakiData = await fetchJson(MERAKI_ALL_URL);
    const championKeys = Object.keys(merakiData);
    console.log(`Found ${championKeys.length} champions`);

    const ABILITY_KEYS = ["P", "Q", "W", "E", "R"];
    const champions = {};

    for (const key of championKeys) {
        const champ = merakiData[key];
        const abilities = [];

        for (const abilityKey of ABILITY_KEYS) {
            const abilityArray = champ.abilities[abilityKey];
            if (abilityArray == null) continue;
            const extracted = extractAbility(abilityKey, abilityArray);
            if (extracted != null) {
                abilities.push(extracted);
            }
        }

        champions[key] = {
            name: champ.name,
            abilities,
        };
    }

    const output = {
        version: ddVersion,
        fetchedAt: new Date().toISOString(),
        champions,
    };

    const { promises: fs } = await import("fs");
    await fs.writeFile(
        new URL(OUT_PATH),
        JSON.stringify(output, null, 2),
        "utf8"
    );
    console.log(
        `Wrote spell data for ${Object.keys(champions).length} champions to ${OUT_PATH.pathname}`
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
