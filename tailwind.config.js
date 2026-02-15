/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Clash Display"', "system-ui", "sans-serif"],
                body: ["Outfit", "system-ui", "sans-serif"],
            },
            colors: {
                rift: {
                    dark: "#0a0e17",
                    card: "#111827",
                    accent: "#c89b3c",
                    gold: "#d4af37",
                    muted: "#6b7280",
                },
            },
        },
    },
    plugins: [],
};
