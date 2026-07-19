import React from "react";
import SmokeEffect from "../components/SmokeEffect";
import Navigation from "./Navigation";
import GlowButton from "./GlowButton";
import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";

import "../styles/components/HeroWrapper.scss";

function HeroWrapper({ page = "home" }) {
    const currentLang = getLangFromPath(window.location.pathname);

    return (
        <div className="hero-wrapper">
            <SmokeEffect />
            <Navigation />

            {/* Фото блок */}
            <section className="photo-block">
                <img
                    src="/assets/images/photo_home.png"
                    alt="Photo"
                    className="background-photo-img"
                />
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
                </div>
            </section>
        </div>
    );
}

export default HeroWrapper;
