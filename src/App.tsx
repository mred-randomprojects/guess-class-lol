import { useState, useCallback, useMemo } from "react";
import { useChampions, getImageUrl } from "./data/useChampions";
import {
    shuffleChampions,
    isExactMatch,
    classifyGuess,
    buildHistoryEntry,
} from "./gameLogic";
import type { ChampionClass } from "./data/classes";
import type { GameChampion, HistoryEntry } from "./types";
import { CLASS_GROUPS, CLASS_DESCRIPTIONS } from "./data/classes";

const MAX_SELECTION = 2;

function ClassButton({
    label,
    description,
    selected,
    disabled,
    triedStatus,
    onToggle,
}: {
    label: string;
    description: string;
    selected: boolean;
    disabled: boolean;
    triedStatus: "hit" | "miss" | null;
    onToggle: () => void;
}) {
    const triedHit = triedStatus === "hit";
    const triedMiss = triedStatus === "miss";

    return (
        <div className="group relative inline-block">
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                        ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                        : disabled
                        ? "cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500"
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

    const toggleClass = useCallback((cls: ChampionClass) => {
        setSelectedClasses((prev) => {
            if (prev.includes(cls)) return prev.filter((c) => c !== cls);
            if (prev.length >= MAX_SELECTION) return prev;
            return [...prev, cls];
        });
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
            }
            setTotalChampions((t) => t + 1);
            setAttemptsOnCurrent(0);
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
                    <span className="rounded-full bg-rift-gold/20 px-4 py-1 text-rift-gold">
                        Score: {score} / {totalChampions}
                    </span>
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
                </section>

                <section className="rounded-2xl border border-gray-700 bg-rift-card/60 p-6">
                    <p className="mb-4 text-sm text-rift-muted">
                        Select up to 2 classes that apply. Then submit.
                    </p>
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
                                            triedStatus={triedClasses.get(cls) ?? null}
                                            onToggle={() => toggleClass(cls)}
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
