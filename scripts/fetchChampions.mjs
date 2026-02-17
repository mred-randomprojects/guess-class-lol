/**
 * Fetches the latest champion list from Data Dragon and writes
 * src/data/champions.json. Run: npm run fetch-champions
 *
 * Image URL: https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{image.full}
 */
const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const CHAMPION_URL = (v) =>
    `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`;
const OUT_PATH = new URL("../src/data/champions.json", import.meta.url);

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
}

async function main() {
    const versions = await fetchJson(VERSIONS_URL);
    const version = versions[0];
    const data = await fetchJson(CHAMPION_URL(version));
    const champions = Object.values(data.data).map((c) => ({
        id: c.id,
        name: c.name,
        image: c.image.full,
    }));
    const output = { version, fetchedAt: new Date().toISOString(), champions };
    await import("fs").then((fs) =>
        fs.promises.writeFile(
            new URL(OUT_PATH),
            JSON.stringify(output, null, 2),
            "utf8"
        )
    );
    console.log(
        `Wrote ${champions.length} champions (DD version ${version}) to ${OUT_PATH.pathname}`
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
