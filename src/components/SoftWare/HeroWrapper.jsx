import React from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../Home/Navigation";
import GlowButton from "../Home/GlowButton";
import SoftwareMatrixBackground from "./SoftwareMatrixBackground";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/SoftWare/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    return <div className="hero-wrapper software-hero" id="top">
        <SoftwareMatrixBackground />
        <Navigation />
        <section className="software-hero__content">
            <p>{t(lang, "software", "hero", "subtitle")}</p>
            <h1>{t(lang, "software", "hero", "title")}</h1>
            <p>{t(lang, "software", "hero", "description")}</p>
            <GlowButton href="#projects">{t(lang, "software", "hero", "btnProjects")}</GlowButton>
        </section>
    </div>;
}
