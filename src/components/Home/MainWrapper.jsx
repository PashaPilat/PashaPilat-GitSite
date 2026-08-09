import React, { useEffect, useState } from "react";
import "../../styles/components/Home/MainWrapper.scss";
import FeaturedProjects from "./FeaturedProjects";
import HeroMarquee from "./HeroMarquee";
import Services from "./Services";
import About from "./About";
import ContactSection from "./ContactSection";

function MainWrapper() {
    const [angle, setAngle] = useState(0);

    useEffect(() => {
        const hero = document.querySelector(".hero-wrapper");
        if (!hero) return;

        const handleScroll = () => {
            const heroHeight = hero.offsetHeight;
            const start = heroHeight - window.innerHeight;
            const distance = 220; // участок изменения угла

            let progress = (window.scrollY - start) / distance;
            progress = Math.max(0, Math.min(progress, 1));
            setAngle(progress * 6); // 0° → 6°
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <main className="skew-hero" style={{ "--skew-angle": `${angle}deg` }}>
            <div className="hr-line"></div>
            <FeaturedProjects />
            <HeroMarquee />
            <Services />
            <About />
            <ContactSection />
            <section id="projects4" className="projects">
                <p className="scroll-text">
                    Прокрутите вниз, чтобы увидеть проекты
                </p>
                <div className="project-list">
                    <div className="project-item">Dune</div>
                    <div className="project-item">Oasis</div>
                    <div className="project-item">Asterisk</div>
                    <div className="project-item">Eooks</div>
                </div>
            </section>
        </main>
    );
}

export default MainWrapper;
