import React from "react";
import SmoothScroll from "./components/SmoothScroll";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import UnityPage from "./pages/Unity";
import { availableLangs } from "./i18n";
import { BASENAME } from "./config";

import "./styles/main.scss";

function App() {
    return (
        <>
            <Router basename={BASENAME}>
                <SmoothScroll />
                <Routes>
                    {/* дефолтный русский */}
                    <Route path="/" element={<Home />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:slug" element={<Projects />} />
                    <Route path="/unity" element={<UnityPage />} />

                    {/* остальные языки циклом */}
                    {availableLangs.filter(l => l !== "ru").map(lang => (
                        <React.Fragment key={lang}>
                            <Route key={`${lang}-home`} path={`/${lang}`} element={<Home />} />
                            <Route path={`/${lang}/projects`} element={<Projects />} />
                            <Route path={`/${lang}/projects/:slug`} element={<Projects />} />
                            <Route key={`${lang}-unity`} path={`/${lang}/unity`} element={<UnityPage />} />
                        </React.Fragment>
                    ))}
                </Routes>
            </Router>
        </>
    );
}

export default App;
