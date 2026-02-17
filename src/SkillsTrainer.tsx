import { Link } from "react-router-dom";

function SkillsTrainer() {
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
                    <span className="rounded-full bg-blue-900/40 px-4 py-1 text-sm font-semibold text-blue-400">
                        Work in progress
                    </span>
                    <h2 className="text-2xl font-bold text-white">
                        Coming soon
                    </h2>
                    <p className="max-w-md text-center text-gray-400">
                        The Skills Trainer will show you champion ability icons
                        and challenge you to recall what each ability does —
                        including cooldowns, costs, and effects.
                    </p>
                    <Link
                        to="/"
                        className="rounded-lg bg-rift-gold px-6 py-2 font-semibold text-rift-dark hover:bg-rift-gold/90"
                    >
                        Back to menu
                    </Link>
                </section>
            </main>
        </div>
    );
}

export default SkillsTrainer;
