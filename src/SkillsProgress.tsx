import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useChampions, getImageUrl } from "./data/useChampions";
import { useSpells } from "./data/useSpells";
import {
    loadHistory,
    clearHistory,
} from "./data/skillsHistory";
import type { SkillReviewRecord } from "./data/skillsHistory";
import type { Champion, GameChampion } from "./types";
import type { ChampionClass } from "./data/classes";
import { CHAMPION_CLASSES, CLASS_GROUPS } from "./data/classes";

type Tab = "history" | "directory";

const RATING_POINTS: Record<SkillReviewRecord["rating"], number> = {
    nailed: 2,
    partial: 1,
    no_idea: 0,
};

const RATING_LABEL: Record<SkillReviewRecord["rating"], string> = {
    nailed: "Nailed it",
    partial: "Partially",
    no_idea: "No idea",
};

const RATING_STYLE: Record<SkillReviewRecord["rating"], string> = {
    nailed: "bg-emerald-900/40 text-emerald-400",
    partial: "bg-yellow-900/40 text-yellow-400",
    no_idea: "bg-red-900/60 text-red-400",
};

function relativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

function computeMastery(records: readonly SkillReviewRecord[]): number | null {
    if (records.length === 0) return null;
    const points = records.reduce(
        (sum, r) => sum + RATING_POINTS[r.rating],
        0
    );
    return Math.round((points / (records.length * 2)) * 100);
}

function MasteryBadge({ mastery }: { mastery: number | null }) {
    if (mastery == null) {
        return (
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-500">
                No data
            </span>
        );
    }

    let colorClass: string;
    if (mastery >= 80) {
        colorClass = "bg-emerald-900/40 text-emerald-400";
    } else if (mastery >= 50) {
        colorClass = "bg-yellow-900/40 text-yellow-400";
    } else {
        colorClass = "bg-red-900/60 text-red-400";
    }

    return (
        <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${colorClass}`}
        >
            {mastery}%
        </span>
    );
}

// --- History Tab ---

function HistoryTab({
    history,
    onClear,
}: {
    history: readonly SkillReviewRecord[];
    onClear: () => void;
}) {
    const sorted = useMemo(
        () => [...history].sort((a, b) => b.timestamp - a.timestamp),
        [history]
    );

    if (sorted.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
                <p>No reviews yet. Play the Skills Trainer to build history.</p>
                <Link
                    to="/skills-trainer"
                    className="rounded-lg bg-rift-gold px-6 py-2 font-semibold text-rift-dark hover:bg-rift-gold/90"
                >
                    Start training
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ul className="space-y-1">
                {sorted.map((r, i) => (
                    <li
                        key={`${r.championId}-${r.abilityKey}-${r.timestamp}-${i}`}
                        className="flex items-center gap-3 rounded-lg bg-gray-800/40 px-4 py-2 text-sm"
                    >
                        <span className="w-28 shrink-0 truncate font-medium text-white">
                            {r.championName}
                        </span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-rift-gold/20 text-xs font-bold text-rift-gold">
                            {r.abilityKey}
                        </span>
                        <span className="truncate text-gray-300">
                            {r.abilityName}
                        </span>
                        <span
                            className={`ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-medium ${RATING_STYLE[r.rating]}`}
                        >
                            {RATING_LABEL[r.rating]}
                        </span>
                        <span className="w-16 shrink-0 text-right text-xs text-gray-500">
                            {relativeTime(r.timestamp)}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="flex justify-center pt-4">
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:border-red-600 hover:bg-red-900/20"
                >
                    Clear all history
                </button>
            </div>
        </div>
    );
}

// --- Champion Detail ---

function ChampionDetail({
    champion,
    records,
    onBack,
}: {
    champion: Champion;
    records: readonly SkillReviewRecord[];
    onBack: () => void;
}) {
    const { getSpellSet } = useSpells();
    const spellSet = getSpellSet(champion);

    const abilityKeys = ["P", "Q", "W", "E", "R"] as const;

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-400 hover:text-white"
            >
                &larr; Back to directory
            </button>

            <div className="flex items-center gap-4">
                <img
                    src={getImageUrl(champion)}
                    alt={champion.name}
                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-rift-gold/50"
                />
                <div>
                    <h3 className="text-xl font-bold text-white">
                        {champion.name}
                    </h3>
                    <MasteryBadge mastery={computeMastery(records)} />
                </div>
            </div>

            <div className="space-y-3">
                {abilityKeys.map((key) => {
                    const spell = spellSet?.abilities.find(
                        (a) => a.key === key
                    );
                    const abilityRecords = records.filter(
                        (r) => r.abilityKey === key
                    );
                    const mastery = computeMastery(abilityRecords);
                    const lastFive = [...abilityRecords]
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 5);

                    return (
                        <div
                            key={key}
                            className="rounded-xl border border-gray-700 bg-gray-800/40 p-4"
                        >
                            <div className="flex items-center gap-3">
                                {spell != null && spell.imageUrl !== "" && (
                                    <img
                                        src={spell.imageUrl}
                                        alt={spell.name}
                                        className="h-10 w-10 rounded-lg object-cover ring-1 ring-gray-600"
                                    />
                                )}
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rift-gold text-xs font-bold text-rift-dark">
                                    {key}
                                </span>
                                <span className="font-medium text-white">
                                    {spell?.name ?? key}
                                </span>
                                <span className="ml-auto">
                                    <MasteryBadge mastery={mastery} />
                                </span>
                            </div>

                            {lastFive.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {lastFive.map((r, i) => (
                                        <span
                                            key={`${r.timestamp}-${i}`}
                                            className={`rounded px-2 py-0.5 text-xs ${RATING_STYLE[r.rating]}`}
                                            title={new Date(
                                                r.timestamp
                                            ).toLocaleString()}
                                        >
                                            {RATING_LABEL[r.rating]}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {lastFive.length === 0 && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Not reviewed yet
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- Directory Tab ---

function DirectoryTab({
    history,
}: {
    history: readonly SkillReviewRecord[];
}) {
    const { champions, getGameChampion } = useChampions();

    const [search, setSearch] = useState("");
    const [enabledClasses, setEnabledClasses] = useState<Set<ChampionClass>>(
        () => new Set(CHAMPION_CLASSES)
    );
    const [selectedChampion, setSelectedChampion] = useState<Champion | null>(
        null
    );

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

    const recordsByChampion = useMemo(() => {
        const map = new Map<string, SkillReviewRecord[]>();
        for (const r of history) {
            const existing = map.get(r.championId) ?? [];
            existing.push(r);
            map.set(r.championId, existing);
        }
        return map;
    }, [history]);

    const filteredChampions = useMemo(() => {
        const lowerSearch = search.toLowerCase();
        return champions.filter((c) => {
            if (lowerSearch !== "" && !c.name.toLowerCase().includes(lowerSearch)) {
                return false;
            }
            if (enabledClasses.size < CHAMPION_CLASSES.length) {
                const gc: GameChampion = getGameChampion(c);
                return gc.classes.some((cls) => enabledClasses.has(cls));
            }
            return true;
        });
    }, [champions, search, enabledClasses, getGameChampion]);

    if (selectedChampion != null) {
        const records = recordsByChampion.get(selectedChampion.id) ?? [];
        return (
            <ChampionDetail
                champion={selectedChampion}
                records={records}
                onBack={() => setSelectedChampion(null)}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Search bar */}
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search champions..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-rift-gold/50 focus:outline-none"
            />

            {/* Class filter — DUPLICATED from SkillsTrainer start screen */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-300">
                        Filter by class
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
                                    onClick={() => toggleClass(cls)}
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

            {/* Champion grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {filteredChampions.map((c) => {
                    const records = recordsByChampion.get(c.id) ?? [];
                    const mastery = computeMastery(records);

                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedChampion(c)}
                            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/40 p-3 transition-colors hover:border-rift-gold/50 hover:bg-gray-800/70"
                        >
                            <img
                                src={getImageUrl(c)}
                                alt={c.name}
                                className="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-600"
                            />
                            <span className="w-full truncate text-center text-xs font-medium text-gray-200">
                                {c.name}
                            </span>
                            <MasteryBadge mastery={mastery} />
                        </button>
                    );
                })}
            </div>

            {filteredChampions.length === 0 && (
                <p className="py-8 text-center text-gray-500">
                    No champions match your filters.
                </p>
            )}
        </div>
    );
}

// --- Main page ---

function SkillsProgress() {
    const [tab, setTab] = useState<Tab>("directory");
    const [history, setHistory] = useState(() => loadHistory());

    const handleClear = useCallback(() => {
        if (window.confirm("Clear all review history? This cannot be undone.")) {
            clearHistory();
            setHistory([]);
        }
    }, []);

    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        Skills Progress
                    </h1>
                    <Link
                        to="/skills-trainer"
                        className="rounded-lg border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:border-gray-400 hover:text-white"
                    >
                        Back to trainer
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-4xl p-6">
                {/* Tab bar */}
                <div className="mb-6 flex gap-1 rounded-lg bg-gray-800/60 p-1">
                    <button
                        type="button"
                        onClick={() => setTab("directory")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            tab === "directory"
                                ? "bg-rift-gold/20 text-rift-gold"
                                : "text-gray-400 hover:text-gray-200"
                        }`}
                    >
                        Champion Directory
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("history")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                            tab === "history"
                                ? "bg-rift-gold/20 text-rift-gold"
                                : "text-gray-400 hover:text-gray-200"
                        }`}
                    >
                        Review History
                        {history.length > 0 && (
                            <span className="ml-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                                {history.length}
                            </span>
                        )}
                    </button>
                </div>

                {tab === "history" && (
                    <HistoryTab history={history} onClear={handleClear} />
                )}
                {tab === "directory" && (
                    <DirectoryTab history={history} />
                )}
            </main>
        </div>
    );
}

export default SkillsProgress;
