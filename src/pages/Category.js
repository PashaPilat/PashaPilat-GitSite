import React from "react";
import { useLocation } from "react-router-dom";
import SoftWareHero from "../components/SoftWare/HeroWrapper";
import RadioHero from "../components/Radio/HeroWrapper";
import OtherHero from "../components/Other/HeroWrapper";
import CursorFollower from "../components/CursorFollower";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";
import "../styles/pages/category.scss";

const heroes = { software: SoftWareHero, radio: RadioHero, other: OtherHero };

export default function Category({ page }) {
    const lang = getLangFromPath(useLocation().pathname);
    const HeroWrapper = heroes[page];
    return <>
        <HeroWrapper />
        <section id="projects" className="category-projects">
            <h2>{t(lang, page, "hero", "btnProjects")}</h2>
            <p>{t(lang, page, "placeholder")}</p>
        </section>
        <CursorFollower />
    </>;
}
