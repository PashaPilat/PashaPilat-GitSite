import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../Home/Navigation";
import HeroStats from "../Home/HeroStats";
import GlowButton from "../Home/GlowButton";
import OtherProjectsBackground from "./OtherProjectsBackground";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/Other/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    const copy = t(lang, "other", "hero");
    const stats = useMemo(() => copy.directions.map((item, index) => ({
        id: `other-direction-${index}`,
        type: "text",
        value: item.title,
        label: item.description,
        icon: ["fa-solid fa-compass-drafting", "fa-solid fa-wrench", "fa-solid fa-flask-vial", "fa-solid fa-code-merge"][index],
    })), [copy]);
    const buttonTheme = {
        background: "#081517",
        frameColor: "rgba(255,255,255,0.72)",
        textColor: "#ffffff",
        glowColor: "rgba(151, 224, 227, 0.7)",
    };

    return <div className="hero-wrapper other-hero" id="top">
        <OtherProjectsBackground />
        <Navigation />
        <section className="other-hero__content">
            <p className="other-hero__subtitle">{copy.subtitle}</p>
            <h1>{copy.title}</h1>
            <p className="other-hero__description">{copy.description}</p>
            <div className="other-hero__buttons">
                <GlowButton href="#projects" {...buttonTheme}>{copy.btnProjects}</GlowButton>
                <GlowButton href="#philosophy" {...buttonTheme}>{copy.btnApproach}</GlowButton>
            </div>
            <div className="hero-bottom other-hero__bottom">
                <p className="hero-bottom-text">{t(lang, "common", "hero", "bottom", "scroll")}</p>
                <div className="hero-bottom-line" aria-hidden="true"></div>
                <div className="hero-bottom-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" focusable="false" color="rgb(255, 255, 255)">
                        <g color="rgb(255, 255, 255)" weight="duotone">
                            <path d="M200,80v96a56,56,0,0,1-56,56H112a56,56,0,0,1-56-56V80a56,56,0,0,1,56-56h32A56,56,0,0,1,200,80Z" opacity="0.2"></path>
                            <path d="M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16Zm48,160a48.05,48.05,0,0,1-48,48H112a48.05,48.05,0,0,1-48-48V80a48.05,48.05,0,0,1,48-48h32a48.05,48.05,0,0,1,48,48ZM136,64v48a8,8,0,0,1-16,0V64a8,8,0,0,1,16,0Z"></path>
                        </g>
                    </svg>
                </div>
                <div className="hero-bottom-line" aria-hidden="true"></div>
                <p className="hero-bottom-text">{t(lang, "common", "hero", "bottom", "projects")}</p>
            </div>
            <HeroStats stats={stats} className="other-directions" />
        </section>
    </div>;
}
