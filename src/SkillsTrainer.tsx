import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useChampions, getImageUrl } from "./data/useChampions";
import { useSpells } from "./data/useSpells";
import type { SpellInfo } from "./data/useSpells";
import type { Champion } from "./types";
import { shuffleChampions } from "./gameLogic";

type Rating = "nailed" | "partial" | "no_idea";

interface AbilityResult {
    champion: Champion;
    ability: SpellInfo;
    rating: Rating;
}

const RATING_POINTS: Record<Rating, number> = {
    nailed: 2,
    partial: 1,
    no_idea: 0,
};

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

function SkillsTrainer() {
    const { champions } = useChampions();
    const { getSpellSet } = useSpells();

    const [gameStarted, setGameStarted] = useState(false);
    const [finished, setFinished] = useState(false);
    const [queue, setQueue] = useState<Champion[]>([]);
    const [champIndex, setChampIndex] = useState(0);
    const [abilityIndex, setAbilityIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [results, setResults] = useState<AbilityResult[]>([]);

    const currentSpellSet = useMemo(() => {
        if (queue.length === 0) return null;
        return getSpellSet(queue[champIndex]);
    }, [queue, champIndex, getSpellSet]);

    const currentAbility =
        currentSpellSet != null
            ? currentSpellSet.abilities[abilityIndex] ?? null
            : null;

    const totalAbilities = queue.length * 5; // passive + Q W E R per champ
    const completedAbilities = champIndex * 5 + abilityIndex;

    const launchGame = useCallback(() => {
        const shuffled = shuffleChampions(champions);
        setQueue(shuffled);
        setChampIndex(0);
        setAbilityIndex(0);
        setRevealed(false);
        setResults([]);
        setFinished(false);
        setGameStarted(true);
    }, [champions]);

    const submitRating = useCallback(
        (rating: Rating) => {
            if (currentSpellSet == null || currentAbility == null) return;

            setResults((prev) => [
                ...prev,
                {
                    champion: currentSpellSet.champion,
                    ability: currentAbility,
                    rating,
                },
            ]);
            setRevealed(false);

            // Advance to next ability or next champion
            if (abilityIndex + 1 < (currentSpellSet.abilities.length)) {
                setAbilityIndex((i) => i + 1);
            } else if (champIndex + 1 < queue.length) {
                setChampIndex((i) => i + 1);
                setAbilityIndex(0);
            } else {
                setFinished(true);
            }
        },
        [currentSpellSet, currentAbility, abilityIndex, champIndex, queue.length]
    );

    const finishEarly = useCallback(() => {
        setFinished(true);
    }, []);

    const restart = useCallback(() => {
        setGameStarted(false);
        setFinished(false);
    }, []);

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
                        <Link
                            to="/"
                            className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                        >
                            Back
                        </Link>
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
                        <p className="text-lg text-gray-300">
                            <span className="font-bold text-rift-gold">
                                {champions.length}
                            </span>{" "}
                            champions &middot;{" "}
                            <span className="font-bold text-rift-gold">
                                {champions.length * 5}
                            </span>{" "}
                            abilities
                        </p>
                        <button
                            type="button"
                            onClick={launchGame}
                            className="rounded-lg bg-rift-gold px-8 py-3 text-lg font-semibold text-rift-dark hover:bg-rift-gold/90"
                        >
                            Start
                        </button>
                    </section>
                </main>
            </div>
        );
    }

    // --- Game loop ---
    if (currentSpellSet == null || currentAbility == null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rift-dark p-8">
                <p className="text-rift-muted">No spell data available.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        Skills Trainer
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-rift-muted">
                            {completedAbilities + 1} / {totalAbilities}{" "}
                            abilities
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
                        src={getImageUrl(currentSpellSet.champion)}
                        alt={currentSpellSet.champion.name}
                        className="h-16 w-16 rounded-xl object-cover ring-2 ring-rift-gold/50"
                    />
                    <div>
                        <span className="text-xl font-bold text-white">
                            {currentSpellSet.champion.name}
                        </span>
                        <p className="text-sm text-rift-muted">
                            Ability {abilityIndex + 1} of{" "}
                            {currentSpellSet.abilities.length}
                        </p>
                    </div>
                </section>

                {/* Ability card */}
                <section className="rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <div className="flex flex-col items-center gap-6">
                        {/* Icon + key badge */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <img
                                    src={currentAbility.imageUrl}
                                    alt={
                                        revealed
                                            ? currentAbility.name
                                            : "Mystery ability"
                                    }
                                    className="h-24 w-24 rounded-xl object-cover ring-2 ring-gray-600"
                                />
                                <span className="absolute -right-2 -top-2 rounded-full bg-rift-gold px-2.5 py-0.5 text-xs font-bold text-rift-dark">
                                    {currentAbility.key}
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
                                {/* Ability name + damage type */}
                                <div className="flex flex-col items-center gap-1">
                                    <h3 className="text-xl font-bold text-white">
                                        {currentAbility.name}
                                    </h3>
                                    {damageTypeLabel(
                                        currentAbility.damageType
                                    ) != null && (
                                        <span
                                            className={`text-xs font-medium ${damageTypeColor(currentAbility.damageType)}`}
                                        >
                                            {damageTypeLabel(
                                                currentAbility.damageType
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Effects with scalings */}
                                <div className="space-y-3">
                                    {currentAbility.effects.map(
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
                                                                    <span className={damageTypeColor(currentAbility.damageType)}>
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
                                {(currentAbility.cooldown != null ||
                                    currentAbility.cost != null) && (
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {currentAbility.cooldown != null && (
                                            <div className="rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-2">
                                                <span className="text-xs font-semibold uppercase text-rift-muted">
                                                    Cooldown
                                                </span>
                                                <p className="text-blue-400">
                                                    {currentAbility.cooldown}s
                                                </p>
                                            </div>
                                        )}
                                        {currentAbility.cost != null && (
                                            <div className="rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-2">
                                                <span className="text-xs font-semibold uppercase text-rift-muted">
                                                    Cost
                                                </span>
                                                <p className="text-blue-400">
                                                    {currentAbility.cost}{" "}
                                                    {currentAbility.resource ??
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
