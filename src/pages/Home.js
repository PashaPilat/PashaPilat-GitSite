import React from "react";
import HeroWrapper from "../components/Home/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import MainWrapper from "../components/Home/MainWrapper";
import SceneManager from "../components/SceneManager";
import SmoothScroll from "../components/SmoothScroll";
import ScrollTopButton from "../components/ScrollTopButton";

import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";

function Home() {
    return (
        <>
            <SmoothScroll />
            <HeroWrapper page="home" />
            <SceneManager />
            <MainWrapper />
            <ScrollTopButton label="Наверх" threshold={1000} />
            <CursorFollower />
        </>
    );
}

export default Home;
