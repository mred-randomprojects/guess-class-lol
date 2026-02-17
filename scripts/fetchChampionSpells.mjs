/**
 * Fetches detailed spell data for every champion from Data Dragon and writes
 * src/data/championSpells.json. Run: npm run fetch-spells
 *
 * Spell icon URL:   https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{image}
 * Passive icon URL: https://ddragon.leagueoflegends.com/cdn/{version}/img/passive/{image}
 */
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const CHAMPION_LIST_URL = (v) =>
    `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`;
const CHAMPION_DETAIL_URL = (v, id) =>
    `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion/${id}.json`;
const OUT_PATH = new URL("../src/data/championSpells.json", import.meta.url);

const SPELL_KEYS = ["Q", "W", "E", "R"];

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
}

function extractSpell(spell, key) {
    return {
        key,
        name: spell.name,
        description: spell.description,
        image: spell.image.full,
        cooldown: spell.cooldown,
        cost: spell.cost,
        costType: spell.costType.trim(),
        range: spell.range,
        maxrank: spell.maxrank,
    };
}

function extractPassive(passive) {
    return {
        name: passive.name,
        description: passive.description,
        image: passive.image.full,
    };
}

async function main() {
    const versions = await fetchJson(VERSIONS_URL);
    const version = versions[0];
    console.log(`Using Data Dragon version ${version}`);

    // Get the list of all champion IDs
    const listData = await fetchJson(CHAMPION_LIST_URL(version));
    const championIds = Object.keys(listData.data);
    console.log(`Found ${championIds.length} champions, fetching details...`);

    const champions = {};
    let done = 0;

    // Fetch in batches of 10 to be polite to the CDN
    const BATCH_SIZE = 10;
    for (let i = 0; i < championIds.length; i += BATCH_SIZE) {
        const batch = championIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(async (id) => {
                const detail = await fetchJson(
                    CHAMPION_DETAIL_URL(version, id)
                );
                const champ = detail.data[id];
                return {
                    id,
                    passive: extractPassive(champ.passive),
                    spells: champ.spells.map((s, idx) =>
                        extractSpell(s, SPELL_KEYS[idx])
                    ),
                };
            })
        );
        for (const r of results) {
            champions[r.id] = {
                passive: r.passive,
                spells: r.spells,
            };
        }
        done += batch.length;
        process.stdout.write(`\r  ${done}/${championIds.length} champions`);
    }
    console.log("");

    const output = {
        version,
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
