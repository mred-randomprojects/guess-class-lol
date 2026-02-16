import { useState, useCallback, useMemo } from "react";
import { useChampions, getImageUrl } from "./data/useChampions";
import {
    shuffleChampions,
    isExactMatch,
    classifyGuess,
    buildHistoryEntry,
} from "./gameLogic";
import type { ChampionClass } from "./data/classes";
import type { Champion, HistoryEntry, MissedChampion } from "./types";
import { CLASS_GROUPS, CLASS_DESCRIPTIONS } from "./data/classes";

const MAX_SELECTION = 2;

function ClassButton({
    label,
    description,
    selected,
    disabled,
    discarded,
    triedStatus,
    onToggle,
    onDiscard,
}: {
    label: string;
    description: string;
    selected: boolean;
    disabled: boolean;
    discarded: boolean;
    triedStatus: "hit" | "miss" | null;
    onToggle: () => void;
    onDiscard: () => void;
}) {
    const triedHit = triedStatus === "hit";
    const triedMiss = triedStatus === "miss";

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            onDiscard();
        },
        [onDiscard]
    );

    return (
        <div className="group relative inline-block">
            <button
                type="button"
                onClick={onToggle}
                onContextMenu={handleContextMenu}
                disabled={disabled}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                        ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                        : disabled
                        ? "cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500"
                        : discarded
                        ? "border-gray-700/50 bg-gray-800/30 text-gray-600 line-through"
                        : triedHit
                        ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-400/80 hover:border-emerald-600 hover:bg-emerald-900/30"
                        : triedMiss
                        ? "border-red-700/50 bg-red-900/20 text-red-400/80 hover:border-red-600 hover:bg-red-900/30"
                        : "border-rift-muted bg-rift-card text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                }`}
            >
                {label}
            </button>
            <div
                role="tooltip"
                className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-left text-sm font-normal text-gray-200 shadow-xl opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
            >
                {description}
            </div>
        </div>
    );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
    if (history.length === 0) return null;
    return (
        <section className="rounded-xl border border-gray-700 bg-rift-card/80 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rift-muted">
                Attempt history
            </h2>
            <ul className="space-y-2">
                {history
                    .slice(-15)
                    .reverse()
                    .map((entry, i) => (
                        <li
                            key={`${entry.champion.id}-${
                                history.length - 1 - i
                            }`}
                            className="flex items-center gap-3 text-sm"
                        >
                            <span className="w-24 shrink-0 truncate font-medium text-white">
                                {entry.champion.name}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {entry.guessResults.map((r) => (
                                    <span
                                        key={r.cls}
                                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                                            r.hit
                                                ? "bg-emerald-900/60 text-emerald-400"
                                                : "bg-red-900/60 text-red-400"
                                        }`}
                                    >
                                        {r.cls}
                                    </span>
                                ))}
                            </div>
                            {entry.exactMatch && (
                                <span className="ml-auto text-xs text-emerald-400">
                                    Solved
                                </span>
                            )}
                        </li>
                    ))}
            </ul>
        </section>
    );
}

const NEXT_UP_COUNT = 3;

function NextUpPreview({ champions }: { champions: Champion[] }) {
    if (champions.length === 0) return null;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rift-muted">
                Next up
            </span>
            <div className="flex gap-2">
                {champions.map((c) => (
                    <img
                        key={c.id}
                        src={getImageUrl(c)}
                        alt={c.name}
                        title={c.name}
                        className="h-10 w-10 rounded-lg object-cover ring-1 ring-gray-600"
                    />
                ))}
            </div>
        </div>
    );
}

function FinishReport({
    score,
    totalChampions,
    missed,
    onRestart,
}: {
    score: number;
    totalChampions: number;
    missed: readonly MissedChampion[];
    onRestart: () => void;
}) {
    const percentage =
        totalChampions > 0 ? Math.round((score / totalChampions) * 100) : 0;

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        LoL Champion Class Quiz — Results
                    </h1>
                </div>
            </header>
            <main className="mx-auto max-w-4xl space-y-8 p-6">
                <section className="flex flex-col items-center gap-4 rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <p className="text-sm uppercase tracking-wider text-rift-muted">
                        Final score
                    </p>
                    <span className="text-4xl font-bold text-rift-gold">
                        {score} / {totalChampions}
                    </span>
                    <span className="text-lg text-gray-300">
                        {percentage}% first-attempt accuracy
                    </span>
                </section>

                {missed.length > 0 && (
                    <section className="rounded-xl border border-gray-700 bg-rift-card/80 p-4">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rift-muted">
                            Champions you missed
                        </h2>
                        <ul className="space-y-2">
                            {missed.map((m) => (
                                <li
                                    key={m.champion.id}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <img
                                        src={getImageUrl(m.champion)}
                                        alt={m.champion.name}
                                        className="h-8 w-8 rounded-lg object-cover ring-1 ring-gray-600"
                                    />
                                    <span className="w-28 shrink-0 truncate font-medium text-white">
                                        {m.champion.name}
                                    </span>
                                    <span className="text-gray-400">
                                        is actually
                                    </span>
                                    <div className="flex gap-1">
                                        {m.actualClasses.map((cls) => (
                                            <span
                                                key={cls}
                                                className="rounded bg-emerald-900/60 px-2 py-0.5 text-xs font-medium text-emerald-400"
                                            >
                                                {cls}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="rounded-lg bg-rift-gold px-6 py-2 font-semibold text-rift-dark hover:bg-rift-gold/90"
                    >
                        Play again
                    </button>
                </div>
            </main>
        </div>
    );
}

function App() {
    const { champions, getGameChampion } = useChampions();
    const [queue, setQueue] = useState(() => shuffleChampions(champions));
    const [queueIndex, setQueueIndex] = useState(0);
    const current =
        queue.length > 0 ? getGameChampion(queue[queueIndex]) : null;
    const [selectedClasses, setSelectedClasses] = useState<ChampionClass[]>([]);
    const [score, setScore] = useState(0);
    const [totalChampions, setTotalChampions] = useState(0);
    const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [missed, setMissed] = useState<MissedChampion[]>([]);
    const [finished, setFinished] = useState(false);
    const [discardedClasses, setDiscardedClasses] = useState<
        Set<ChampionClass>
    >(new Set());

    const nextUpChampions = useMemo(
        () => queue.slice(queueIndex + 1, queueIndex + 1 + NEXT_UP_COUNT),
        [queue, queueIndex]
    );

    const toggleClass = useCallback(
        (cls: ChampionClass) => {
            // Selecting a class removes it from discarded
            setDiscardedClasses((prev) => {
                if (prev.has(cls)) {
                    const next = new Set(prev);
                    next.delete(cls);
                    return next;
                }
                return prev;
            });
            setSelectedClasses((prev) => {
                if (prev.includes(cls)) return prev.filter((c) => c !== cls);
                if (prev.length >= MAX_SELECTION) return prev;
                return [...prev, cls];
            });
        },
        []
    );

    const toggleDiscard = useCallback((cls: ChampionClass) => {
        setDiscardedClasses((prev) => {
            const next = new Set(prev);
            if (next.has(cls)) {
                next.delete(cls);
            } else {
                next.add(cls);
            }
            return next;
        });
        // If the class was selected, deselect it
        setSelectedClasses((prev) => prev.filter((c) => c !== cls));
    }, []);

    // Build a map of classes already tried for the current champion
    const triedClasses = useMemo(() => {
        const map = new Map<ChampionClass, "hit" | "miss">();
        if (attemptsOnCurrent === 0) return map;
        const recentEntries = history.slice(-attemptsOnCurrent);
        for (const entry of recentEntries) {
            for (const r of entry.guessResults) {
                // If a class was hit in any attempt, mark it as hit (green wins over red)
                if (map.get(r.cls) !== "hit") {
                    map.set(r.cls, r.hit ? "hit" : "miss");
                }
            }
        }
        return map;
    }, [history, attemptsOnCurrent]);

    const submitGuess = useCallback(() => {
        if (current == null) return;
        const exact = isExactMatch(current.classes, selectedClasses);
        const results = classifyGuess(current.classes, selectedClasses);

        setHistory((h) => [...h, buildHistoryEntry(current, results, exact)]);
        setSelectedClasses([]);

        if (exact) {
            // Score +1 only on first-attempt correct (1-shot)
            if (attemptsOnCurrent === 0) {
                setScore((s) => s + 1);
            } else {
                setMissed((prev) => [
                    ...prev,
                    { champion: current, actualClasses: current.classes },
                ]);
            }
            setTotalChampions((t) => t + 1);
            setAttemptsOnCurrent(0);
            setDiscardedClasses(new Set());
            // Advance to next champion; reshuffle when we've gone through all
            if (queueIndex + 1 >= queue.length) {
                setQueue(shuffleChampions(champions));
                setQueueIndex(0);
            } else {
                setQueueIndex((i) => i + 1);
            }
        } else {
            // Stay on the same champion
            setAttemptsOnCurrent((a) => a + 1);
        }

        // TODO: after 3 failed attempts, show a "Give up" button that reveals
        // the answer and advances to the next champion (without awarding a point).
    }, [
        current,
        selectedClasses,
        champions,
        attemptsOnCurrent,
        queueIndex,
        queue.length,
    ]);

    const finishGame = useCallback(() => {
        setFinished(true);
    }, []);

    const restart = useCallback(() => {
        setQueue(shuffleChampions(champions));
        setQueueIndex(0);
        setSelectedClasses([]);
        setScore(0);
        setTotalChampions(0);
        setAttemptsOnCurrent(0);
        setHistory([]);
        setMissed([]);
        setFinished(false);
        setDiscardedClasses(new Set());
    }, [champions]);

    if (finished) {
        return (
            <FinishReport
                score={score}
                totalChampions={totalChampions}
                missed={missed}
                onRestart={restart}
            />
        );
    }

    if (champions.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-rift-muted">
                    No champions loaded. Run{" "}
                    <code className="rounded bg-gray-800 px-2 py-1">
                        npm run fetch-champions
                    </code>{" "}
                    to fetch the latest list from Data Dragon.
                </p>
            </div>
        );
    }

    if (current == null) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <p className="text-rift-muted">No champion to show.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        LoL Champion Class Quiz
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-rift-muted">
                            {queueIndex + 1} / {queue.length} champs
                        </span>
                        <span className="rounded-full bg-rift-gold/20 px-4 py-1 text-rift-gold">
                            Score: {score} / {totalChampions}
                        </span>
                        <button
                            type="button"
                            onClick={finishGame}
                            className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                        >
                            Finish
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-8 p-6">
                <section className="flex flex-col items-center gap-6 rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <p className="text-sm uppercase tracking-wider text-rift-muted">
                        What class is this champion?
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <img
                            src={getImageUrl(current)}
                            alt={current.name}
                            className="h-32 w-32 rounded-2xl object-cover ring-2 ring-rift-gold/50"
                        />
                        <span className="text-2xl font-bold text-white">
                            {current.name}
                        </span>
                    </div>
                    {attemptsOnCurrent > 0 && (
                        <p className="text-sm text-rift-muted">
                            Attempt {attemptsOnCurrent + 1} — keep trying!
                        </p>
                    )}
                    <NextUpPreview champions={nextUpChampions} />
                </section>

                <section className="rounded-2xl border border-gray-700 bg-rift-card/60 p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <p className="text-sm text-rift-muted">
                            Select up to 2 classes that apply. Then submit.
                        </p>
                        <div className="group relative inline-block">
                            <span className="cursor-help text-sm text-rift-muted">
                                &#9432;
                            </span>
                            <div
                                role="tooltip"
                                className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-left text-sm font-normal text-gray-200 shadow-xl opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
                            >
                                Right-click a class to cross it out and mark it
                                as eliminated.
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-6">
                        {CLASS_GROUPS.map((group) => (
                            <div
                                key={group.parent}
                                className="flex flex-col gap-2"
                            >
                                <span className="text-xs font-semibold uppercase tracking-wider text-rift-muted">
                                    {group.parent}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {group.subclasses.map((cls) => (
                                        <ClassButton
                                            key={cls}
                                            label={cls}
                                            description={
                                                CLASS_DESCRIPTIONS[cls]
                                            }
                                            selected={selectedClasses.includes(
                                                cls
                                            )}
                                            disabled={
                                                !selectedClasses.includes(
                                                    cls
                                                ) &&
                                                selectedClasses.length >=
                                                    MAX_SELECTION
                                            }
                                            discarded={discardedClasses.has(cls)}
                                            triedStatus={triedClasses.get(cls) ?? null}
                                            onToggle={() => toggleClass(cls)}
                                            onDiscard={() => toggleDiscard(cls)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={submitGuess}
                            className="rounded-lg bg-rift-gold px-6 py-2 font-semibold text-rift-dark hover:bg-rift-gold/90"
                        >
                            Submit guess
                        </button>
                    </div>
                </section>

                <HistoryList history={history} />
            </main>
        </div>
    );
}

export default App;
