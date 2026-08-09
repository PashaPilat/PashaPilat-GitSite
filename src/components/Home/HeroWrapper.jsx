import React from "react";
import SmokeEffect from "./SmokeEffect";
import Navigation from "./Navigation";
import GlowButton from "./GlowButton";
import HeroStats from "./HeroStats";
import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import "../../styles/components/Home/HeroWrapper.scss";
import photo_home from "../../assets/images/photo_home.png";

function HeroWrapper({ page = "home" }) {
    const currentLang = getLangFromPath(window.location.pathname);
    const stats = [
        { id: "years", type: "number", value: 10, label: t(currentLang,"hero","home","stats","years") },
        { id: "backend", type: "text", value: "Laravel, PHP", icon: "fa-brands fa-laravel", label: t(currentLang,"hero","home","stats","backend") },
        { id: "api", type: "text", value: "REST API", icon: "fa-solid fa-network-wired", label: t(currentLang,"hero","home","stats","api") },
        { id: "projects", type: "number", value: 50, label: t(currentLang,"hero","home","stats","projects") },
        { id: "frontend", type: "text", value: "React", icon: "fa-brands fa-react", label: t(currentLang,"hero","home","stats","frontend") },
        { id: "performance", type: "text", value: "Performance", icon: "fa-solid fa-gauge-high", label: t(currentLang,"hero","home","stats","performance") }
    ];

    const statsCms = [
        { id: "cms", type: "text", value: "CMS", icon: "fa-solid fa-database", label: t(currentLang,"hero","home","stats","cmsList") }
    ];

    return (
        <div className="hero-wrapper">
            <SmokeEffect />
            <Navigation />

            {/* Фото блок */}
            <section className="photo-block">
                <img src={photo_home} alt="Photo" className="background-photo-img" />
            </section>

            {/* Hero блок */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-subtitle-container">
                        <div className="hero-subtitle-block">
                            <div className="hero-subtitle-inner">
                                <span className="hero-subtitle-point">
                                    <span className="hero-subtitle-point-glow"></span>
                                    <span className="hero-subtitle-point-dot"></span>
                                </span>
                                <span className="hero-subtitle-text">
                                    {t(currentLang, "hero", page, "subtitle")}
                                </span>
                            </div>
                        </div>
                    </div>
                    <h1 className="hero-title">
                        {t(currentLang, "hero", page, "title")}
                    </h1>
                    <p className="hero-text">
                        {t(currentLang, "hero", page, "description")}
                    </p>
                    <div className="hero-buttons">
                        <GlowButton onClick={() => console.log("clicked btnStart")} href="#"  >
                            {t(currentLang, "hero", page, "btnStart")}
                        </GlowButton>
                        
                        <GlowButton className="" >
                            {t(currentLang, "hero", page, "btnProjects")}
                        </GlowButton>
                    </div>
                    <div className="hero-bottom">
                        <p className="hero-bottom-text">
                            {t(currentLang, "hero", "home", "bottom", "scroll")}
                        </p>
                        <div className="hero-bottom-line"></div>
                        <div className="hero-bottom-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" focusable="false" color="rgb(255, 255, 255)">
                                <g color="rgb(255, 255, 255)" weight="duotone">
                                    <path d="M200,80v96a56,56,0,0,1-56,56H112a56,56,0,0,1-56-56V80a56,56,0,0,1,56-56h32A56,56,0,0,1,200,80Z" opacity="0.2"></path>
                                    <path d="M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16Zm48,160a48.05,48.05,0,0,1-48,48H112a48.05,48.05,0,0,1-48-48V80a48.05,48.05,0,0,1,48-48h32a48.05,48.05,0,0,1,48,48ZM136,64v48a8,8,0,0,1-16,0V64a8,8,0,0,1,16,0Z"></path>
                                </g>
                            </svg>
                        </div>
                        <div className="hero-bottom-line"></div>
                        <p className="hero-bottom-text">
                            {t(currentLang, "hero", "home", "bottom", "projects")}
                        </p>
                    </div>
                    <div className="horo-bottom-counter">
                        <HeroStats stats={stats} />
                        <HeroStats stats={statsCms} className="cms" />
                    </div>


                </div>
            </section>

        </div>
    );
}

export default HeroWrapper;
