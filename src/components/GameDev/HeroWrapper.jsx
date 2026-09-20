import React from "react";
import { useLocation } from "react-router-dom";
import FluidBackground from "./FluidBackground";
import Navigation from "../Home/Navigation";
import GlowButton from "../Home/GlowButton";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/GameDev/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    return <div className="hero-wrapper gamedev-hero" id="top">
        <FluidBackground />
        <Navigation />
        <section className="gamedev-hero__content">
            <p className="gamedev-hero__subtitle">{t(lang, "gamedev", "hero", "subtitle")}</p>
            <h1>{t(lang, "gamedev", "hero", "title")}</h1>
            <p className="gamedev-hero__description">{t(lang, "gamedev", "hero", "description")}</p>
            <GlowButton href="#projects">{t(lang, "gamedev", "hero", "btnProjects")}</GlowButton>
        </section>
    </div>;
}
