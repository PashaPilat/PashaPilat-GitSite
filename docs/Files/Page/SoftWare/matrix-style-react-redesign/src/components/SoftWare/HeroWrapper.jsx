import React from "react";
import Scramble from "./Scramble";
import { copy } from "../../data";

const ICONS = {
    cubes: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
    ),
    windows: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3.5" y="3.5" width="17" height="17" />
            <path d="M12 3.5v17M3.5 12h17" />
        </svg>
    ),
    brain: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="6" y="6" width="12" height="12" />
            <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
            <circle cx="12" cy="12" r="2.4" />
        </svg>
    ),
    puzzle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9 4h6v4.2a2 2 0 1 0 0 3.6V16H10.8a2 2 0 1 1-3.6 0H4V9h5V4z" />
        </svg>
    ),
};

export default function HeroWrapper() {
    const h = copy.hero;
    return (
        <section className="software-hero" aria-label="PlatP Software">
            <div className="software-hero__content">
                <p className="software-hero__subtitle software-reveal">
                    <span aria-hidden="true" />
                    {h.subtitle}
                </p>
                <h1 className="software-reveal" style={{ "--d": "80ms" }}>
                    <Scramble text={h.title} duration={1100} />
                </h1>
                <p className="software-hero__description software-reveal" style={{ "--d": "160ms" }}>{h.description}</p>
                <div className="software-hero__buttons software-reveal" style={{ "--d": "240ms" }}>
                    <a className="software-btn software-btn--primary" href="#projects">{h.btnProjects}</a>
                    <a className="software-btn software-btn--ghost" href="#philosophy">{h.btnApproach}</a>
                </div>
                <div className="software-hero__bottom software-reveal" style={{ "--d": "320ms" }}>
                    <p className="software-hero__scroll">{h.scroll}</p>
                    <span className="software-hero__line" aria-hidden="true" />
                    <span className="software-hero__mouse" aria-hidden="true">
                        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                            <path d="M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16Zm48,160a48.05,48.05,0,0,1-48,48H112a48.05,48.05,0,0,1-48-48V80a48.05,48.05,0,0,1,48-48h32a48.05,48.05,0,0,1,48,48ZM136,64v48a8,8,0,0,1-16,0V64a8,8,0,0,1,16,0Z" />
                        </svg>
                    </span>
                    <span className="software-hero__line" aria-hidden="true" />
                    <p className="software-hero__scroll">{h.projectsLabel}</p>
                </div>
                <ul className="software-hero__directions software-reveal" style={{ "--d": "400ms" }}>
                    {h.directions.map((d, i) => (
                        <li key={d.title}>
                            <span className="software-hero__dnum">{String(i + 1).padStart(2, "0")}</span>
                            <span className="software-hero__dicon" aria-hidden="true">{ICONS[d.icon]}</span>
                            <span>
                                <strong>{d.title}</strong>
                                <em>{d.description}</em>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
