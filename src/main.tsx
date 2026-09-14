import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { interceptSave } from "cmd-s";
import "./index.css";
import App from "./App.tsx";

// ⌘S / Ctrl+S has nothing to save here — the quiz keeps no document and the
// trainer's history writes itself after every round — so it only stops the
// browser from offering to save the page.
interceptSave();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
