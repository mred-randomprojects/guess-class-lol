import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useChampions, getImageUrl } from "./data/useChampions";
import { useSpells } from "./data/useSpells";
import type { SpellInfo } from "./data/useSpells";
import type { Champion, GameChampion } from "./types";
import type { ChampionClass } from "./data/classes";
import { CHAMPION_CLASSES, CLASS_GROUPS } from "./data/classes";
import { shuffleChampions } from "./gameLogic";
import { appendHistory } from "./data/skillsHistory";
import type { SkillReviewRecord } from "./data/skillsHistory";

type Rating = "nailed" | "partial" | "no_idea";
type GameMode = "per-champion" | "per-ability";

interface AbilityResult {
    champion: Champion;
    ability: SpellInfo;
    rating: Rating;
}

interface QueueItem {
    champion: Champion;
    ability: SpellInfo;
    patchLastChanged: string | null;
}

const RATING_POINTS: Record<Rating, number> = {
    nailed: 2,
    partial: 1,
    no_idea: 0,
};

/**
 * Approximate the real-world date of a LoL patch from its version string.
 * Patches follow a ~2-week cadence; each season starts around Jan 8.
 * Format: "YY.NN" → e.g. "25.03" ≈ Feb 2025.
 */
function approximatePatchDate(patch: string): string | null {
    const match = patch.match(/^(\d{2})\.(\d{1,2})$/);
    if (match == null) return null;

    const year = 2000 + parseInt(match[1], 10);
    const patchNum = parseInt(match[2], 10);

    const seasonStart = new Date(year, 0, 8);
    const patchDate = new Date(
        seasonStart.getTime() + (patchNum - 1) * 14 * 24 * 60 * 60 * 1000
    );

    return patchDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });
}

/** Color-code damage type labels */
function damageTypeColor(damageType: string | null): string {
    if (damageType == null) return "text-gray-400";
    if (damageType.includes("MAGIC")) return "text-blue-400";
    if (damageType.includes("PHYSICAL")) return "text-red-400";
    if (damageType.includes("TRUE")) return "text-white";
    return "text-gray-400";
}

function damageTypeLabel(damageType: string | null): string | null {
    if (damageType == null) return null;
    if (damageType.includes("MAGIC")) return "Magic damage";
    if (damageType.includes("PHYSICAL")) return "Physical damage";
    if (damageType.includes("TRUE")) return "True damage";
    return null;
}

// --- Results screen ---

function SkillsResults({
    results,
    onRestart,
}: {
    results: readonly AbilityResult[];
    onRestart: () => void;
}) {
    const totalPoints = results.reduce(
        (sum, r) => sum + RATING_POINTS[r.rating],
        0
    );
    const maxPoints = results.length * 2;
    const percentage =
        maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const struggled = results.filter((r) => r.rating !== "nailed");

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        Skills Trainer — Results
                    </h1>
                    <Link
                        to="/"
                        className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                    >
                        Menu
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-4xl space-y-8 p-6">
                <section className="flex flex-col items-center gap-4 rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <p className="text-sm uppercase tracking-wider text-rift-muted">
                        Final score
                    </p>
                    <span className="text-4xl font-bold text-rift-gold">
                        {totalPoints} / {maxPoints}
                    </span>
                    <span className="text-lg text-gray-300">
                        {percentage}% recall accuracy
                    </span>
                </section>

                {struggled.length > 0 && (
                    <section className="rounded-xl border border-gray-700 bg-rift-card/80 p-4">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rift-muted">
                            Abilities to review
                        </h2>
                        <ul className="space-y-2">
                            {struggled.map((r, i) => (
                                <li
                                    key={`${r.champion.id}-${r.ability.key}-${i}`}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <img
                                        src={r.ability.imageUrl}
                                        alt={r.ability.name}
                                        className="h-8 w-8 shrink-0 rounded object-cover ring-1 ring-gray-600"
                                    />
                                    <span className="w-24 shrink-0 truncate font-medium text-white">
                                        {r.champion.name}
                                    </span>
                                    <span className="text-rift-muted">
                                        {r.ability.key}
                                    </span>
                                    <span className="text-gray-300">
                                        {r.ability.name}
                                    </span>
                                    <span
                                        className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${
                                            r.rating === "partial"
                                                ? "bg-yellow-900/40 text-yellow-400"
                                                : "bg-red-900/60 text-red-400"
                                        }`}
                                    >
                                        {r.rating === "partial"
                                            ? "Partial"
                                            : "No idea"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="rounded-lg bg-rift-gold px-6 py-2 font-semibold text-rift-dark hover:bg-rift-gold/90"
                    >
                        Play again
                    </button>
                    <Link
                        to="/"
                        className="rounded-lg border border-gray-600 px-6 py-2 font-semibold text-gray-300 hover:border-gray-400 hover:text-white"
                    >
                        Back to menu
                    </Link>
                </div>
            </main>
        </div>
    );
}

// --- Main game ---

const ALL_ABILITY_KEYS: readonly AbilityKey[] = ["P", "Q", "W", "E", "R"];
type AbilityKey = "P" | "Q" | "W" | "E" | "R";

function SkillsTrainer() {
    const { champions, getGameChampion } = useChampions();
    const { getSpellSet, version: dataVersion } = useSpells();

    const [gameMode, setGameMode] = useState<GameMode>("per-champion");
    const [showIcon, setShowIcon] = useState(true);
    const [enabledKeys, setEnabledKeys] = useState<Set<AbilityKey>>(
        () => new Set(ALL_ABILITY_KEYS)
    );
    const [enabledClasses, setEnabledClasses] = useState<Set<ChampionClass>>(
        () => new Set(CHAMPION_CLASSES)
    );
    const [gameStarted, setGameStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [viewedAbilityKey, setViewedAbilityKey] =
        useState<AbilityKey | null>(null);
    const [results, setResults] = useState<AbilityResult[]>([]);

    // Flat queue of individual abilities (used in both modes)
    const [abilityQueue, setAbilityQueue] = useState<QueueItem[]>([]);
    const [queueIndex, setQueueIndex] = useState(0);

    const currentItem: QueueItem | null =
        abilityQueue.length > 0 ? abilityQueue[queueIndex] ?? null : null;

    const totalAbilities = abilityQueue.length;

    const toggleKey = useCallback((key: AbilityKey) => {
        setEnabledKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const toggleClass = useCallback((cls: ChampionClass) => {
        setEnabledClasses((prev) => {
            const next = new Set(prev);
            if (next.has(cls)) {
                next.delete(cls);
            } else {
                next.add(cls);
            }
            return next;
        });
    }, []);

    const selectAllClasses = useCallback(() => {
        setEnabledClasses(new Set(CHAMPION_CLASSES));
    }, []);

    const deselectAllClasses = useCallback(() => {
        setEnabledClasses(new Set());
    }, []);

    // Champions filtered by enabled classes
    const filteredChampions = useMemo(() => {
        if (enabledClasses.size === CHAMPION_CLASSES.length) return champions;
        return champions.filter((c) => {
            const gc: GameChampion = getGameChampion(c);
            return gc.classes.some((cls) => enabledClasses.has(cls));
        });
    }, [champions, enabledClasses, getGameChampion]);

    // Preview count of abilities in the pool
    const poolSize = useMemo(() => {
        return filteredChampions.length * enabledKeys.size;
    }, [filteredChampions, enabledKeys]);

    /** Build a flat list of all (champion, ability) pairs */
    const buildAbilityQueue = useCallback(
        (mode: GameMode): QueueItem[] => {
            const shuffled = shuffleChampions(filteredChampions);
            const items: QueueItem[] = [];

            for (const champ of shuffled) {
                const spellSet = getSpellSet(champ);
                if (spellSet == null) continue;
                for (const ability of spellSet.abilities) {
                    if (enabledKeys.has(ability.key)) {
                        items.push({
                            champion: champ,
                            ability,
                            patchLastChanged: spellSet.patchLastChanged,
                        });
                    }
                }
            }

            // In per-ability mode, shuffle all items so abilities from
            // different champions are interleaved
            if (mode === "per-ability") {
                for (let i = items.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [items[i], items[j]] = [items[j], items[i]];
                }
            }

            return items;
        },
        [filteredChampions, getSpellSet, enabledKeys]
    );

    const canLaunch = enabledKeys.size > 0 && enabledClasses.size > 0;

    const launchGame = useCallback(() => {
        if (!canLaunch) return;
        const items = buildAbilityQueue(gameMode);
        setAbilityQueue(items);
        setQueueIndex(0);
        setRevealed(false);
        setResults([]);
        setFinished(false);
        setGameStarted(true);
    }, [gameMode, buildAbilityQueue, canLaunch]);

    const submitRating = useCallback(
        (rating: Rating) => {
            if (currentItem == null) return;

            setResults((prev) => [
                ...prev,
                {
                    champion: currentItem.champion,
                    ability: currentItem.ability,
                    rating,
                },
            ]);
            setRevealed(false);
            setViewedAbilityKey(null);

            if (queueIndex + 1 < abilityQueue.length) {
                setQueueIndex((i) => i + 1);
            } else {
                setFinished(true);
            }
        },
        [currentItem, queueIndex, abilityQueue.length]
    );

    const finishEarly = useCallback(() => {
        setFinished(true);
    }, []);

    const restart = useCallback(() => {
        setGameStarted(false);
        setFinished(false);
    }, []);

    // Persist results to localStorage when a session finishes
    useEffect(() => {
        if (!finished || results.length === 0) return;

        const records: SkillReviewRecord[] = results.map((r) => ({
            championId: r.champion.id,
            championName: r.champion.name,
            abilityKey: r.ability.key,
            abilityName: r.ability.name,
            rating: r.rating,
            timestamp: Date.now(),
        }));
        appendHistory(records);
    }, [finished, results]);

    // --- Results screen ---
    if (finished) {
        return <SkillsResults results={results} onRestart={restart} />;
    }

    // --- Start screen ---
    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-rift-dark font-body text-gray-100">
                <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                    <div className="mx-auto flex max-w-4xl items-center justify-between">
                        <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                            Skills Trainer
                        </h1>
                        <div className="flex items-center gap-2">
                            <Link
                                to="/skills-trainer/progress"
                                className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                            >
                                Progress
                            </Link>
                            <Link
                                to="/"
                                className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                            >
                                Back
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="mx-auto max-w-4xl p-6">
                    <section className="flex flex-col items-center gap-6 rounded-2xl border border-gray-700 bg-rift-card/60 p-12">
                        <h2 className="text-2xl font-bold text-white">
                            Test your ability knowledge
                        </h2>
                        <p className="max-w-md text-center text-gray-400">
                            You'll see a champion and one of their ability
                            icons. Try to recall what the ability does, then
                            reveal the answer and rate yourself.
                        </p>
                        {/* Mode selector */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setGameMode("per-champion")}
                                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                                    gameMode === "per-champion"
                                        ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                                }`}
                            >
                                All abilities per champion
                            </button>
                            <button
                                type="button"
                                onClick={() => setGameMode("per-ability")}
                                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                                    gameMode === "per-ability"
                                        ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                                }`}
                            >
                                Random ability each time
                            </button>
                        </div>
                        <p className="text-xs text-rift-muted">
                            {gameMode === "per-champion"
                                ? "Go through P → Q → W → E → R for each champion before moving on."
                                : "Jump between random champions — one ability at a time."}
                        </p>

                        {/* Show icon toggle */}
                        <button
                            type="button"
                            onClick={() => setShowIcon((v) => !v)}
                            className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                                showIcon
                                    ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                                    : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                            }`}
                        >
                            {showIcon
                                ? "Ability icon: shown"
                                : "Ability icon: hidden"}
                        </button>
                        <p className="text-xs text-rift-muted">
                            {showIcon
                                ? "You'll see the ability icon before revealing."
                                : "Hard mode — no icon hint, just the ability key (P/Q/W/E/R)."}
                        </p>

                        {/* Ability key filter */}
                        <div className="w-full max-w-md space-y-2">
                            <p className="text-center text-sm font-semibold text-gray-300">
                                Ability slots
                            </p>
                            <div className="flex justify-center gap-2">
                                {ALL_ABILITY_KEYS.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => toggleKey(key)}
                                        className={`h-10 w-10 rounded-lg border-2 text-sm font-bold transition-colors ${
                                            enabledKeys.has(key)
                                                ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                                                : "border-gray-600 text-gray-500 hover:border-gray-500"
                                        }`}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Champion class filter */}
                        <div className="w-full max-w-md space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-300">
                                    Champion classes
                                </p>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={selectAllClasses}
                                        className="text-rift-gold hover:underline"
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAllClasses}
                                        className="text-gray-400 hover:underline"
                                    >
                                        None
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {CLASS_GROUPS.map((group) => (
                                    <div
                                        key={group.parent}
                                        className="flex flex-wrap gap-1.5"
                                    >
                                        {group.subclasses.map((cls) => (
                                            <button
                                                key={cls}
                                                type="button"
                                                onClick={() =>
                                                    toggleClass(cls)
                                                }
                                                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                                    enabledClasses.has(cls)
                                                        ? "border-rift-gold/50 bg-rift-gold/15 text-rift-gold"
                                                        : "border-gray-700 text-gray-500 hover:border-gray-600"
                                                }`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pool size preview */}
                        <p className="text-sm text-gray-300">
                            <span className="font-bold text-rift-gold">
                                {filteredChampions.length}
                            </span>{" "}
                            champions &middot;{" "}
                            <span className="font-bold text-rift-gold">
                                {poolSize}
                            </span>{" "}
                            abilities in pool
                        </p>

                        <button
                            type="button"
                            onClick={launchGame}
                            disabled={!canLaunch}
                            className={`rounded-lg px-8 py-3 text-lg font-semibold ${
                                canLaunch
                                    ? "bg-rift-gold text-rift-dark hover:bg-rift-gold/90"
                                    : "cursor-not-allowed bg-gray-700 text-gray-500"
                            }`}
                        >
                            Start
                        </button>

                        <p className="text-xs text-gray-500">
                            Data Dragon {dataVersion} — ability
                            descriptions sourced from Meraki Analytics
                            (per-champion patch shown during game)
                        </p>
                    </section>
                </main>
            </div>
        );
    }

    // --- Game loop ---
    if (currentItem == null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rift-dark p-8">
                <p className="text-rift-muted">No spell data available.</p>
            </div>
        );
    }

    const { champion, ability, patchLastChanged } = currentItem;
    const championSpellSet = getSpellSet(champion);
    const allAbilities = championSpellSet?.abilities ?? [];
    const displayedAbility =
        viewedAbilityKey != null
            ? (allAbilities.find((a) => a.key === viewedAbilityKey) ?? ability)
            : ability;

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        Skills Trainer
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-rift-muted">
                            {queueIndex + 1} / {totalAbilities} abilities
                        </span>
                        <button
                            type="button"
                            onClick={finishEarly}
                            className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                        >
                            Finish
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-6 p-6">
                {/* Champion info */}
                <section className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-rift-card/60 p-6">
                    <img
                        src={getImageUrl(champion)}
                        alt={champion.name}
                        className="h-16 w-16 rounded-xl object-cover ring-2 ring-rift-gold/50"
                    />
                    <div>
                        <span className="text-xl font-bold text-white">
                            {champion.name}
                        </span>
                        {patchLastChanged != null && (
                            <p className="text-xs text-gray-500">
                                Data from patch {patchLastChanged}
                                {approximatePatchDate(patchLastChanged) != null &&
                                    ` · ~${approximatePatchDate(patchLastChanged)}`}
                            </p>
                        )}
                    </div>
                </section>

                {/* Ability card */}
                <section className="rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <div className="flex flex-col items-center gap-6">
                        {/* Icon + key badge */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                {showIcon || revealed ? (
                                    <img
                                        src={ability.imageUrl}
                                        alt={
                                            revealed
                                                ? ability.name
                                                : "Mystery ability"
                                        }
                                        className="h-24 w-24 rounded-xl object-cover ring-2 ring-gray-600"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-800 text-3xl font-bold text-gray-500 ring-2 ring-gray-600">
                                        ?
                                    </div>
                                )}
                                <span className="absolute -right-2 -top-2 rounded-full bg-rift-gold px-2.5 py-0.5 text-xs font-bold text-rift-dark">
                                    {ability.key}
                                </span>
                            </div>
                            {!revealed && (
                                <p className="text-sm text-rift-muted">
                                    What does this ability do?
                                </p>
                            )}
                        </div>

                        {/* Reveal button or revealed content */}
                        {!revealed ? (
                            <button
                                type="button"
                                onClick={() => setRevealed(true)}
                                className="rounded-lg bg-rift-gold px-8 py-3 text-lg font-semibold text-rift-dark hover:bg-rift-gold/90"
                            >
                                Reveal
                            </button>
                        ) : (
                            <div className="w-full space-y-4">
                                {/* Ability tab bar */}
                                <div className="flex justify-center gap-1">
                                    {allAbilities.map((a) => {
                                        const isTestedAbility =
                                            a.key === ability.key;
                                        const isViewing =
                                            displayedAbility.key === a.key;
                                        return (
                                            <button
                                                key={a.key}
                                                type="button"
                                                onClick={() =>
                                                    setViewedAbilityKey(
                                                        a.key ===
                                                            ability.key
                                                            ? null
                                                            : a.key
                                                    )
                                                }
                                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                    isViewing
                                                        ? isTestedAbility
                                                            ? "bg-rift-gold/20 text-rift-gold ring-1 ring-rift-gold/50"
                                                            : "bg-gray-700 text-white ring-1 ring-gray-500"
                                                        : isTestedAbility
                                                          ? "bg-rift-gold/10 text-rift-gold/70 hover:bg-rift-gold/20"
                                                          : "bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                                                }`}
                                            >
                                                <span className="font-bold">
                                                    {a.key}
                                                </span>
                                                <span className="hidden sm:inline">
                                                    {a.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Ability name + damage type */}
                                <div className="flex flex-col items-center gap-1">
                                    <h3 className="text-xl font-bold text-white">
                                        {displayedAbility.name}
                                    </h3>
                                    {damageTypeLabel(
                                        displayedAbility.damageType
                                    ) != null && (
                                        <span
                                            className={`text-xs font-medium ${damageTypeColor(displayedAbility.damageType)}`}
                                        >
                                            {damageTypeLabel(
                                                displayedAbility.damageType
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Effects with scalings */}
                                <div className="space-y-3">
                                    {displayedAbility.effects.map(
                                        (effect, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl bg-gray-800/60 p-4"
                                            >
                                                <p className="text-sm leading-relaxed text-gray-200">
                                                    {effect.description}
                                                </p>
                                                {effect.scalings.length >
                                                    0 && (
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                                        {effect.scalings.map(
                                                            (s, si) => (
                                                                <span
                                                                    key={si}
                                                                    className="text-xs"
                                                                >
                                                                    <span className="font-semibold text-rift-muted">
                                                                        {
                                                                            s.attribute
                                                                        }
                                                                        :
                                                                    </span>{" "}
                                                                    <span
                                                                        className={damageTypeColor(
                                                                            displayedAbility.damageType
                                                                        )}
                                                                    >
                                                                        {
                                                                            s.value
                                                                        }
                                                                    </span>
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Cooldown + Cost stats */}
                                {(displayedAbility.cooldown != null ||
                                    displayedAbility.cost != null) && (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {displayedAbility.cooldown !=
                                            null && (
                                            <div className="rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-2">
                                                <span className="text-xs font-semibold uppercase text-rift-muted">
                                                    Cooldown
                                                </span>
                                                <p className="text-blue-400">
                                                    {
                                                        displayedAbility.cooldown
                                                    }
                                                    s
                                                </p>
                                            </div>
                                        )}
                                        {displayedAbility.cost != null && (
                                            <div className="rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-2">
                                                <span className="text-xs font-semibold uppercase text-rift-muted">
                                                    Cost
                                                </span>
                                                <p className="text-blue-400">
                                                    {displayedAbility.cost}{" "}
                                                    {displayedAbility.resource ??
                                                        ""}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rating buttons */}
                                <div className="flex justify-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            submitRating("nailed")
                                        }
                                        className="rounded-lg border-2 border-emerald-700/50 bg-emerald-900/20 px-6 py-2.5 font-semibold text-emerald-400 hover:border-emerald-600 hover:bg-emerald-900/30"
                                    >
                                        Nailed it
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            submitRating("partial")
                                        }
                                        className="rounded-lg border-2 border-yellow-700/50 bg-yellow-900/20 px-6 py-2.5 font-semibold text-yellow-400 hover:border-yellow-600 hover:bg-yellow-900/30"
                                    >
                                        Partially
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            submitRating("no_idea")
                                        }
                                        className="rounded-lg border-2 border-red-700/50 bg-red-900/20 px-6 py-2.5 font-semibold text-red-400 hover:border-red-600 hover:bg-red-900/30"
                                    >
                                        No idea
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default SkillsTrainer;
