import React from "react";
import HeroWrapper from "../components/GameDev/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import DirectionLanding from "../components/DirectionLanding";
import { useLocation } from "react-router-dom";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";

import "../styles/pages/gamedev.scss";

function GameDev() {
    const lang = getLangFromPath(useLocation().pathname);
    return (
        <div className="gamedev-page direction-page direction-page--gamedev">
            <HeroWrapper />
            {/* Секция проектов */}
            <DirectionLanding page="gamedev" lang={lang} />

            {/* Здесь можно добавить ещё секции */}

            <CursorFollower />
        </div>
    );
}

export default GameDev;
