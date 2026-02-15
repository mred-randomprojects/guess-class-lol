# LoL Champion Class Quiz

A simple game: a random League of Legends champion is shown (image + name) and you guess their **subclass(es)** from Riot’s class framework. Get it right to score a point; wrong answer shows the correct classes. History of correct/wrong is listed below.

## Classes (subclasses)

-   **Controller:** Enchanter, Catcher
-   **Fighter:** Juggernaut, Diver
-   **Mage:** Burst, Battlemage, Artillery
-   **Marksman**
-   **Slayer:** Assassin, Skirmisher
-   **Tank:** Vanguard, Warden (defensive; sometimes called Guardian)
-   **Specialist** (unclassified / unique)

Champions can have one or two classes.

## Setup

```bash
npm install
```

Fetch the latest champion list and version from [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon):

```bash
npm run fetch-champions
```

This writes `src/data/champions.json`. Without it, the app shows a message asking you to run this script.

## Run

```bash
npm run dev
```

## Data

-   **Champions:** From [Data Dragon](https://ddragon.leagueoflegends.com/) (`cdn/{version}/data/en_US/champion.json`). Images use `cdn/{version}/img/champion/{id}.png`.
-   **Subclass mapping:** `src/data/championClasses.json` maps champion `id` → array of subclass names. Not provided by Riot; this repo uses a hand-maintained list. Missing champions are treated as **Specialist**. You can extend the mapping from the [LoL Wiki](https://leagueoflegends.fandom.com/wiki/Champion_classes).

## Scripts

-   `npm run dev` – start dev server
-   `npm run build` – production build
-   `npm run fetch-champions` – fetch latest champions from Data Dragon into `src/data/champions.json`
