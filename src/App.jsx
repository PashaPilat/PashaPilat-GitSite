import React from "react";
import SmoothScroll from "./components/SmoothScroll";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import WebHome from "./pages/Web/Home";
import WebProjects from "./pages/Web/Projects";
import WebProject from "./pages/Web/Project";
import GameDevPage from "./pages/GameDev/GameDev";
import GameDevProject from "./pages/GameDev/Project";
import SoftwarePage from "./pages/Software/Software";
import SoftwareProject from "./pages/Software/Project";
import RadioPage from "./pages/Radio/Radio";
import RadioProject from "./pages/Radio/Project";
import OtherPage from "./pages/Other/Other";
import OtherProject from "./pages/Other/Project";
import NotFound from "./components/NotFound";
import PageChrome from "./components/PageChrome";
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
                    <Route path="/" element={<WebHome />} />
                    <Route path="/projects" element={<WebProjects />} />
                    <Route path="/projects/:slug" element={<WebProject />} />
                    <Route path="/gamedev" element={<GameDevPage />} />
                    <Route path="/gamedev/:slug" element={<GameDevProject />} />
                    <Route path="/software" element={<SoftwarePage />} />
                    <Route path="/software/:slug" element={<SoftwareProject />} />
                    <Route path="/radio" element={<RadioPage />} />
                    <Route path="/radio/:slug" element={<RadioProject />} />
                    <Route path="/other" element={<OtherPage />} />
                    <Route path="/other/:slug" element={<OtherProject />} />
                    <Route path="/unity" element={<LegacyDirection to="/gamedev" />} />
                    <Route path="/develop" element={<LegacyDirection to="/software" />} />

                    {/* остальные языки циклом */}
                    {availableLangs.filter(l => l !== "ru").map(lang => (
                        <React.Fragment key={lang}>
                            <Route key={`${lang}-home`} path={`/${lang}`} element={<WebHome />} />
                            <Route key={`${lang}-projects`} path={`/${lang}/projects`} element={<WebProjects />} />
                            <Route key={`${lang}-project`} path={`/${lang}/projects/:slug`} element={<WebProject />} />
                            <Route key={`${lang}-gamedev`} path={`/${lang}/gamedev`} element={<GameDevPage />} />
                            <Route key={`${lang}-gamedev-project`} path={`/${lang}/gamedev/:slug`} element={<GameDevProject />} />
                            <Route key={`${lang}-software`} path={`/${lang}/software`} element={<SoftwarePage />} />
                            <Route key={`${lang}-software-project`} path={`/${lang}/software/:slug`} element={<SoftwareProject />} />
                            <Route key={`${lang}-radio`} path={`/${lang}/radio`} element={<RadioPage />} />
                            <Route key={`${lang}-radio-project`} path={`/${lang}/radio/:slug`} element={<RadioProject />} />
                            <Route key={`${lang}-other`} path={`/${lang}/other`} element={<OtherPage />} />
                            <Route key={`${lang}-other-project`} path={`/${lang}/other/:slug`} element={<OtherProject />} />
                            <Route key={`${lang}-unity`} path={`/${lang}/unity`} element={<LegacyDirection to={`/${lang}/gamedev`} />} />
                            <Route key={`${lang}-develop`} path={`/${lang}/develop`} element={<LegacyDirection to={`/${lang}/software`} />} />
                        </React.Fragment>
                    ))}
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <PageChrome />
            </Router>
        </>
    );
}

export default App;

