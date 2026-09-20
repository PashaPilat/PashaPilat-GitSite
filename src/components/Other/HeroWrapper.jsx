import React from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../Home/Navigation";
import GlowButton from "../Home/GlowButton";
import OtherProjectsBackground from "./OtherProjectsBackground";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/Other/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    return <div className="hero-wrapper other-hero" id="top">
        <OtherProjectsBackground />
        <Navigation />
        <section className="other-hero__content">
            <p>{t(lang, "other", "hero", "subtitle")}</p>
            <h1>{t(lang, "other", "hero", "title")}</h1>
            <p>{t(lang, "other", "hero", "description")}</p>
            <GlowButton href="#projects">{t(lang, "other", "hero", "btnProjects")}</GlowButton>
        </section>
    </div>;
}
