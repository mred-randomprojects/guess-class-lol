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
const CHAMPION_LIST_URL = (v) =>
    `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`;
const CHAMPION_DETAIL_URL = (v, id) =>
    `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion/${id}.json`;
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

function extractAbility(key, abilityArray, ddImage) {
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
        image: ddImage || null,
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

    // Fetch DDragon data for reliable spell icon filenames
    console.log("Fetching Data Dragon champion list...");
    const listData = await fetchJson(CHAMPION_LIST_URL(ddVersion));
    const ddChampionIds = Object.keys(listData.data);
    console.log(
        `Fetching Data Dragon details for ${ddChampionIds.length} champions...`
    );

    // Map champion key → { passive image, spell images [Q,W,E,R] }
    const ddImages = {};
    const BATCH_SIZE = 10;
    let done = 0;
    for (let i = 0; i < ddChampionIds.length; i += BATCH_SIZE) {
        const batch = ddChampionIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(async (id) => {
                const detail = await fetchJson(
                    CHAMPION_DETAIL_URL(ddVersion, id)
                );
                const c = detail.data[id];
                return {
                    id,
                    passiveImage: c.passive.image.full,
                    spellImages: c.spells.map((s) => s.image.full),
                };
            })
        );
        for (const r of results) {
            ddImages[r.id] = r;
        }
        done += batch.length;
        process.stdout.write(
            `\r  ${done}/${ddChampionIds.length} DDragon details`
        );
    }
    console.log("");

    const ABILITY_KEYS = ["P", "Q", "W", "E", "R"];
    const SPELL_INDEX = { Q: 0, W: 1, E: 2, R: 3 };
    const champions = {};

    for (const key of championKeys) {
        const champ = merakiData[key];
        const dd = ddImages[key];
        const abilities = [];

        for (const abilityKey of ABILITY_KEYS) {
            const abilityArray = champ.abilities[abilityKey];
            if (abilityArray == null) continue;

            // Get DDragon image filename for this ability
            let ddImage = null;
            if (dd != null) {
                if (abilityKey === "P") {
                    ddImage = dd.passiveImage;
                } else if (SPELL_INDEX[abilityKey] != null) {
                    ddImage = dd.spellImages[SPELL_INDEX[abilityKey]] || null;
                }
            }

            const extracted = extractAbility(abilityKey, abilityArray, ddImage);
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
