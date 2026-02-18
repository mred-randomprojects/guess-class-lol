import { HashRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ClassTrainer from "./ClassTrainer";
import SkillsTrainer from "./SkillsTrainer";
import SkillsProgress from "./SkillsProgress";

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/class-trainer" element={<ClassTrainer />} />
                <Route path="/skills-trainer" element={<SkillsTrainer />} />
                <Route
                    path="/skills-trainer/progress"
                    element={<SkillsProgress />}
                />
            </Routes>
        </HashRouter>
    );
}

export default App;
