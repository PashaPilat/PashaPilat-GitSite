import React from "react";
import { useLocation } from "react-router-dom";
import SoftWareHero from "../components/SoftWare/HeroWrapper";
import RadioHero from "../components/Radio/HeroWrapper";
import OtherHero from "../components/Other/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import ProjectCatalog from "../components/SoftWare/ProjectCatalog";
import LandingSections from "../components/SoftWare/LandingSections";
import MatrixDivider from "../components/SoftWare/MatrixDivider";
import DirectionLanding from "../components/DirectionLanding";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";
import "../styles/pages/category.scss";

const heroes = { software: SoftWareHero, radio: RadioHero, other: OtherHero };

export default function Category({ page }) {
    const lang = getLangFromPath(useLocation().pathname);
    const HeroWrapper = heroes[page];
    const label = key => t(lang, "software", key);
    return <div className={page === "software" ? "software-category" : `direction-page direction-page--${page}`}>
        <HeroWrapper />
        {page === "software" ? 
        <main className="software-landing">
            <MatrixDivider index="01" label={t(lang, "software", "catalog", "max_title")} />
            <ProjectCatalog lang={lang} embedded />
            <MatrixDivider index="02" label={t(lang, "software", "philosophy", "max_title")} variant="heavy" />
            <LandingSections lang={lang} />
        </main> : <DirectionLanding page={page} lang={lang} />}
        <CursorFollower />
    </div>;
}
