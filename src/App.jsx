import React from "react";
import SmoothScroll from "./components/SmoothScroll";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import GameDevPage from "./pages/GameDev";
import CategoryPage from "./pages/Category";
import Software from "./pages/Software";
import PageChrome from "./components/PageChrome";
import { modes } from "./navigation/modes.mjs";
import { availableLangs } from "./i18n";
import { BASENAME } from "./config";

import "./styles/main.scss";

function LegacyDirection({ to }) {
    const { search, hash } = useLocation();
    return <Navigate to={{ pathname: to, search, hash }} replace />;
}

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
                    <Route path="/gamedev" element={<GameDevPage />} />
                    <Route path="/software/projects" element={<Software />} />
                    <Route path="/software/projects/:slug" element={<Software />} />
                    <Route path="/unity" element={<LegacyDirection to="/gamedev" />} />
                    <Route path="/develop" element={<LegacyDirection to="/software" />} />
                    {modes.slice(2).map(mode => <Route key={mode.id} path={mode.path} element={<CategoryPage page={mode.id} />} />)}

                    {/* остальные языки циклом */}
                    {availableLangs.filter(l => l !== "ru").map(lang => (
                        <React.Fragment key={lang}>
                            <Route key={`${lang}-home`} path={`/${lang}`} element={<Home />} />
                            <Route path={`/${lang}/projects`} element={<Projects />} />
                            <Route path={`/${lang}/projects/:slug`} element={<Projects />} />
                            <Route key={`${lang}-gamedev`} path={`/${lang}/gamedev`} element={<GameDevPage />} />
                            <Route path={`/${lang}/software/projects`} element={<Software />} />
                            <Route path={`/${lang}/software/projects/:slug`} element={<Software />} />
                            <Route path={`/${lang}/unity`} element={<LegacyDirection to={`/${lang}/gamedev`} />} />
                            <Route path={`/${lang}/develop`} element={<LegacyDirection to={`/${lang}/software`} />} />
                            {modes.slice(2).map(mode => <Route key={`${lang}-${mode.id}`} path={`/${lang}${mode.path}`} element={<CategoryPage page={mode.id} />} />)}
                        </React.Fragment>
                    ))}
                </Routes>
                <PageChrome />
            </Router>
        </>
    );
}

export default App;
