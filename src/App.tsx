import { useState, useCallback } from "react";
import { useChampions, getImageUrl } from "./data/useChampions";
import {
    pickRandomChampion,
    validateGuess,
    buildHistoryEntry,
} from "./gameLogic";
import type { ChampionClass } from "./data/classes";
import type { GameChampion, HistoryEntry } from "./types";
import { CHAMPION_CLASSES } from "./data/classes";

function ClassButton({
    label,
    selected,
    onToggle,
}: {
    label: string;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                selected
                    ? "border-rift-gold bg-rift-gold/20 text-rift-gold"
                    : "border-rift-muted bg-rift-card text-gray-300 hover:border-gray-500 hover:bg-gray-800"
            }`}
        >
            {label}
        </button>
    );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
    if (history.length === 0) return null;
    return (
        <section className="rounded-xl border border-gray-700 bg-rift-card/80 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rift-muted">
                History
            </h2>
            <ul className="space-y-2">
                {history
                    .slice(-10)
                    .reverse()
                    .map((entry, i) => (
                        <li
                            key={`${entry.champion.id}-${
                                history.length - 1 - i
                            }`}
                            className="flex items-center justify-between gap-2 text-sm"
                        >
                            <span className="font-medium text-white">
                                {entry.champion.name}
                            </span>
                            <span
                                className={
                                    entry.correct
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                }
                            >
                                {entry.correct ? "Correct" : "Wrong"}
                            </span>
                            <span className="text-rift-muted">
                                {entry.correctClasses.join(" / ")}
                            </span>
                        </li>
                    ))}
            </ul>
        </section>
    );
}

function App() {
    const { champions, getGameChampion } = useChampions();
    const [current, setCurrent] = useState<GameChampion | null>(() =>
        pickRandomChampion(champions, getGameChampion)
    );
    const [selectedClasses, setSelectedClasses] = useState<ChampionClass[]>([]);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [lastResult, setLastResult] = useState<{
        correct: boolean;
        correctClasses: readonly ChampionClass[];
    } | null>(null);

    const toggleClass = useCallback((cls: ChampionClass) => {
        setSelectedClasses((prev) =>
            prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
        );
        setLastResult(null);
    }, []);

    const submitGuess = useCallback(() => {
        if (current == null) return;
        const correct = validateGuess(current.classes, selectedClasses);
        setScore((s) => s + (correct ? 1 : 0));
        setHistory((h) => [
            ...h,
            buildHistoryEntry(current, selectedClasses, correct),
        ]);
        setLastResult({ correct, correctClasses: current.classes });
        setSelectedClasses([]);
        const next = pickRandomChampion(champions, getGameChampion);
        setCurrent(next);
    }, [current, selectedClasses, champions, getGameChampion]);

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
                        Score: {score}
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-8 p-6">
                <section className="flex flex-col items-center gap-6 rounded-2xl border border-gray-700 bg-rift-card/60 p-8">
                    <p className="text-sm uppercase tracking-wider text-rift-muted">
                        Who is this champion?
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
                    {lastResult !== null && (
                        <p
                            className={
                                lastResult.correct
                                    ? "text-emerald-400"
                                    : "text-red-400"
                            }
                        >
                            {lastResult.correct
                                ? "Correct!"
                                : `Actual: ${lastResult.correctClasses.join(
                                      ", "
                                  )}`}
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-700 bg-rift-card/60 p-6">
                    <p className="mb-4 text-sm text-rift-muted">
                        Select all classes that apply (1 or 2). Then submit.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {CHAMPION_CLASSES.map((cls) => (
                            <ClassButton
                                key={cls}
                                label={cls}
                                selected={selectedClasses.includes(cls)}
                                onToggle={() => toggleClass(cls)}
                            />
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
