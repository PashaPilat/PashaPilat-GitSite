import React from "react";
import HeroWrapper from "../components/Home/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import MainWrapper from "../components/Home/MainWrapper";
import SceneManager from "../components/SceneManager";
import ScrollTopButton from "../components/ScrollTopButton";

import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";
import { useLocation } from "react-router-dom";

function Home() {
    const lang = getLangFromPath(useLocation().pathname);
    return (
        <>
            <HeroWrapper />
            <SceneManager />
            <MainWrapper />
            <ScrollTopButton label={t(lang, "common", "backToTop")} threshold={1000} />
            <CursorFollower />
        </>
    );
}

export default Home;
