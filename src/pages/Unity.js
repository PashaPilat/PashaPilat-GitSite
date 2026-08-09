import React from "react";
import HeroWrapper from "../components/Home/HeroWrapper";
import CursorFollower from "../components/CursorFollower";

import "../styles/pages/unity.scss";

function Unity() {
    return (
        <>
            <HeroWrapper page="unity" />
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

            {/* Здесь можно добавить ещё секции */}

            <CursorFollower />
        </>
    );
}

export default Unity;
