import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
    plugins: [react()],
    // GitHub Pages serves from /guess-class-lol/, but local dev uses /
    base: command === "serve" ? "/" : "/guess-class-lol/",
}));
