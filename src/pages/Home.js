import React, { useEffect, useState } from "react";
import HeroWrapper from "../components/HeroWrapper";
import CursorFollower from "../components/CursorFollower";

import "../styles/pages/home.scss";

function Home() {
    const [skew, setSkew] = useState(0);
    const [offset, setOffset] = useState(550); // стартовый отступ

    useEffect(() => {
        const handleScroll = () => {
        const scrollY = window.scrollY;

        // появление блока: смещаем вверх
        const newOffset = Math.max(450 - scrollY, 0);
        setOffset(newOffset);

        // угол скоса: растёт при скролле
        const angle = Math.min(scrollY / 100, 10); // ограничим до 10°
        setSkew(angle);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <HeroWrapper page="home" />
            
            <div className="skew-hero1" style={{transform: `translateY(${offset}px) skewY(-${skew}deg)`, }}>
                {/* Секция проектов */}
                <section id="projects" className="projects">
                    <p className="scroll-text">Прокрутите вниз, чтобы увидеть проекты</p>
                    <div className="project-list">
                        <div className="project-item">Dune</div>
                        <div className="project-item">Oasis</div>
                        <div className="project-item">Asterisk</div>
                        <div className="project-item">Eooks</div>
                    </div>
                </section>
                <section id="projects2" className="projects">
                    <p className="scroll-text">Прокрутите вниз, чтобы увидеть проекты</p>
                    <div className="project-list">
                        <div className="project-item">Dune</div>
                        <div className="project-item">Oasis</div>
                        <div className="project-item">Asterisk</div>
                        <div className="project-item">Eooks</div>
                    </div>
                </section>
                <section id="projects3" className="projects">
                    <p className="scroll-text">Прокрутите вниз, чтобы увидеть проекты</p>
                    <div className="project-list">
                        <div className="project-item">Dune</div>
                        <div className="project-item">Oasis</div>
                        <div className="project-item">Asterisk</div>
                        <div className="project-item">Eooks</div>
                    </div>
                </section>
                <section id="projects4" className="projects">
                    <p className="scroll-text">Прокрутите вниз, чтобы увидеть проекты</p>
                    <div className="project-list">
                        <div className="project-item">Dune</div>
                        <div className="project-item">Oasis</div>
                        <div className="project-item">Asterisk</div>
                        <div className="project-item">Eooks</div>
                    </div>
                </section>
                {/* Здесь можно добавить ещё секции */}
            </div>
            <CursorFollower />
        </>
    );
}

export default Home;
