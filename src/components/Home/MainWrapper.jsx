import React, { useEffect, useState } from "react";
import "../../styles/components/Home/MainWrapper.scss";
import FeaturedProjects from "./FeaturedProjects";
import HeroMarquee from "./HeroMarquee";
import Services from "./Services";
import About from "./About";
import ContactSection from "./ContactSection";
import Footer from "./Footer";

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
            <Footer />
        </main>
    );
}

export default MainWrapper;
