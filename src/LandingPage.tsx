import { Link } from "react-router-dom";

function LandingPage() {
    return (
        <div className="min-h-screen bg-rift-dark font-body text-gray-100">
            <header className="border-b border-gray-800 bg-rift-card/50 px-6 py-4">
                <div className="mx-auto max-w-4xl">
                    <h1 className="text-xl font-bold tracking-tight text-rift-gold">
                        LoL Champion Training Suite
                    </h1>
                </div>
            </header>

            <main className="mx-auto max-w-4xl space-y-8 p-6">
                <p className="text-center text-rift-muted">
                    Choose a game mode to start practicing.
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                    <Link
                        to="/class-trainer"
                        className="flex flex-col gap-4 rounded-2xl border-2 border-gray-700 bg-rift-card/60 p-8 transition-colors hover:border-rift-gold/60"
                    >
                        <h2 className="text-lg font-bold text-rift-gold">
                            Class Trainer
                        </h2>
                        <p className="text-sm text-gray-300">
                            Guess the class of each champion. Are they a
                            Juggernaut? A Burst mage? An Enchanter? Test your
                            knowledge of Riot's champion subclass system.
                        </p>
                        <span className="mt-auto inline-block rounded-full bg-rift-gold/20 px-4 py-1 text-center text-sm font-medium text-rift-gold">
                            Play now
                        </span>
                    </Link>

                    <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-gray-700/50 bg-rift-card/30 p-8 opacity-70">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-400">
                                Skills Trainer
                            </h2>
                            <span className="rounded-full bg-blue-900/40 px-3 py-0.5 text-xs font-semibold text-blue-400">
                                Coming soon
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            See a champion's ability icon and try to recall what
                            it does — cooldowns, costs, effects, and all. Then
                            reveal the answer and rate yourself.
                        </p>
                        <span className="mt-auto inline-block rounded-full bg-gray-700/30 px-4 py-1 text-center text-sm font-medium text-gray-500">
                            Work in progress
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default LandingPage;
