import { HashRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ClassTrainer from "./ClassTrainer";
import SkillsTrainer from "./SkillsTrainer";

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/class-trainer" element={<ClassTrainer />} />
                <Route path="/skills-trainer" element={<SkillsTrainer />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
