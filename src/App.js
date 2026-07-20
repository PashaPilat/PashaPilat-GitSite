import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UnityPage from "./pages/Unity";
import { availableLangs } from "./i18n";
import { BASENAME } from "./config";

import "./styles/main.scss";

function App() {
    return (
        <Router basename={BASENAME}>
            <Routes>
                {/* дефолтный русский */}
                <Route path="/" element={<Home />} />
                <Route path="/unity" element={<UnityPage />} />

                {/* остальные языки циклом */}
                {availableLangs.filter(l => l !== "ru").map(lang => (
                    <>
                        <Route key={`${lang}-home`} path={`/${lang}`} element={<Home />} />
                        <Route key={`${lang}-unity`} path={`/${lang}/unity`} element={<UnityPage />} />
                    </>
                ))}
            </Routes>
        </Router>
    );
}

export default App;
