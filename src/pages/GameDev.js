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
                <p className="scroll-text">{t(lang, "gamedev", "scrollProjects")}</p>
                <div className="project-list">
                    <div className="project-item">Dune</div>
                    <div className="project-item">Oasis</div>
                    <div className="project-item">Asterisk</div>
                    <div className="project-item">Eooks</div>
                </div>
            </section>

            {/* Здесь можно добавить ещё секции */}

            <CursorFollower />
        </main>
    );
}

export default GameDev;
