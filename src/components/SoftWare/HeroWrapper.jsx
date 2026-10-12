import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../Home/Navigation";
import GlowButton from "./SoftwareButton";
import HeroStats from "./HeroStats";
import SoftwareMatrixBackground from "./SoftwareMatrixBackground";
import { getLangFromPath } from "../../utils/getLangFromPath";

import { t } from "../../i18n";
import "../../styles/components/SoftWare/HeroWrapper.scss";

export default function HeroWrapper() {
    const lang = getLangFromPath(useLocation().pathname);
    const directions = useMemo(() => t(lang, "software", "hero", "directions").map((item, index) => ({
        id: `direction-${index}`, type: "text", value: item.title, label: item.description,
        icon: ["fa-solid fa-cubes", "fa-brands fa-windows", "fa-solid fa-brain", "fa-solid fa-puzzle-piece"][index],
    })), [lang]);
    
    return <div className="hero-wrapper software-hero" id="top">
        <SoftwareMatrixBackground />
        <Navigation />
        <section className="software-hero__content">
            <p className="software-hero__subtitle"><span aria-hidden="true" />{t(lang, "software", "hero", "subtitle")}</p>
            <h1>{t(lang, "software", "hero", "title")}</h1>
            <p className="software-hero__description">{t(lang, "software", "hero", "description")}</p>
            <div className="software-hero__buttons">
                <GlowButton href="#projects">{t(lang, "software", "hero", "btnProjects")}</GlowButton>
                <GlowButton href="#philosophy">{t(lang, "software", "hero", "btnApproach")}</GlowButton>
            </div>
            <div className="hero-bottom software-hero__bottom">
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
            <HeroStats stats={directions} className="software-directions" />
        </section>
    </div>;
}
