import React from "react";
import HeroWrapper from "../components/GameDev/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import { useLocation } from "react-router-dom";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";

import "../styles/pages/gamedev.scss";

function GameDev() {
    const lang = getLangFromPath(useLocation().pathname);
    return (
        <main className="gamedev-page">
            <HeroWrapper />
            {/* Секция проектов */}
            <section id="projects" className="gamedev-projects">
                <h2>{t(lang, "gamedev", "projectsTitle")}</h2>
                <p>{t(lang, "gamedev", "placeholder")}</p>
            </section>

            {/* Здесь можно добавить ещё секции */}

            <CursorFollower />
        </main>
    );
}

export default GameDev;
