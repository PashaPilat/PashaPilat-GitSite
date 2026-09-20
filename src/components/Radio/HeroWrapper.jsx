import React from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../Home/Navigation";
import GlowButton from "../Home/GlowButton";
import RadioEngineeringBackground from "./RadioEngineeringBackground";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/Radio/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    return <div className="hero-wrapper radio-hero" id="top">
        <RadioEngineeringBackground />
        <Navigation />
        <section className="radio-hero__content">
            <p>{t(lang, "radio", "hero", "subtitle")}</p>
            <h1>{t(lang, "radio", "hero", "title")}</h1>
            <p>{t(lang, "radio", "hero", "description")}</p>
            <GlowButton href="#projects">{t(lang, "radio", "hero", "btnProjects")}</GlowButton>
        </section>
    </div>;
}
