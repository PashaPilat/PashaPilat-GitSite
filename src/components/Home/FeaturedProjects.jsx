import React, { useEffect, useRef, useMemo } from "react";
import GlowButton from "./GlowButton";
import "../../styles/components/Home/FeaturedProjects.scss";

import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import hmhExpert from "../../assets/images/projects/hmh-expert/1.png";
import serviceMarket from "../../assets/images/projects/service-market/1.png";
import smartmag from "../../assets/images/projects/smartmag/1.png";
import tcars from "../../assets/images/projects/tcars/1.png";
import antoshCo from "../../assets/images/projects/other/antosh&co.png";
import fishMeat from "../../assets/images/projects/fish&meat/1.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

const projectImages = {
    "hmh-expert": hmhExpert,
    "service-market": serviceMarket,
    "smartmag": smartmag,
    "tcars": tcars,
    "antosh-co": antoshCo,
    "fish-meat": fishMeat,
};

const STAGE_TOP = 50; // px — потолок

// Metrics: seg, stageH, base, gap, shift, scale
function getMetrics() {
    const mobile = window.innerWidth < 768;
    return {
        seg: window.innerHeight,
        stageH: window.innerHeight - STAGE_TOP,
        base: mobile ? 12 : 24,
        gap: mobile ? 24 : 40,
        shift: mobile ? 10 : 20,
        scale: mobile ? 0.055 : 0.045,
    };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function FeaturedProjects() {
    const sectionRef = useRef(null);
    const headRef = useRef(null);
    const cardRefs = useRef([]);
    const dotRefs = useRef([]);
    const countRef = useRef(null);

    const currentLang = getLangFromPath(window.location.pathname);
    const projects = t(currentLang, "projectsFeatured");
    const preparedProjects = useMemo(() => projects.map((p) => ({ ...p, image: projectImages[p.id] })), [projects]);

    const total = preparedProjects.length;

    useEffect(() => {
        const section = sectionRef.current;
        const head = headRef.current;
        if (!section || !head) return;

        let raf = 0;
        let m = getMetrics();
        let headH = 0;
        let pinDistance = 0;

        const layout = () => {
            m = getMetrics();
            headH = head.offsetHeight;
            pinDistance = (total - 1) * m.seg;
            section.style.height = `${headH + m.stageH + pinDistance}px`;
            section.style.setProperty("--fp-base", `${m.base}px`);
            section.style.setProperty("--fp-gap", `${m.gap}px`);
            section.style.setProperty("--fp-count", String(total));
        };

        const paint = () => {
            raf = 0;
            const rect = section.getBoundingClientRect();
            const p = Math.min(Math.max(STAGE_TOP - rect.top - headH, 0), pinDistance);

            for (let i = 0; i < total; i++) {
                const card = cardRefs.current[i];
                if (!card) continue;

                const enterT = i === 0 ? 1 : clamp01(p / m.seg - (i - 1));
                const enter = 1 - Math.pow(1 - enterT, 3);

                let depth = 0;
                for (let j = i + 1; j < total; j++) depth += clamp01(p / m.seg - (j - 1));

                const pin = m.base + i * m.gap;
                const y = pin + (1 - enter) * (m.stageH + 80) - depth * m.shift;
                const s = Math.max(1 - depth * m.scale, 0.72);

                card.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
                card.style.zIndex = String(i + 1);
                card.style.setProperty("--depth", depth.toFixed(3));
            }

            const active = Math.min(total - 1, Math.round(p / m.seg));
            if (countRef.current)
                countRef.current.textContent = String(active + 1).padStart(2, "0");
            dotRefs.current.forEach((dot, i) => {
                dot?.classList.toggle("is-active", i === active);
            });
        };

        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(paint);
        };
        const onReflow = () => {
            layout();
            schedule();
        };

        onReflow();
        document.fonts?.ready.then(onReflow);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", onReflow);
        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", onReflow);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [total]);

    return (
        <section id="projects" ref={sectionRef} className="fp" aria-label="Избранные проекты">
            <div ref={headRef} className="fp-head">
                <div className="fp-head__left">
                    <p className="fp-eyebrow">( Кейсы — стопка )</p>
                    <h2 className="fp-title">
                        {t(currentLang, "projectsFeaturedTitle")}
                        <br />
                        <span className="fp-title__ghost">{t(currentLang, "projectsFeaturedGhost")}</span>
                    </h2>
                </div>
                <div className="fp-head__right">
                    <FontAwesomeIcon icon={faLayerGroup} size="sm" />
                    <p>{total} {t(currentLang, "projectsCount")} · {t(currentLang, "projectsScrollHint")}
                        <br className="hidden md:block" />
                        {t(currentLang, "projectsScrollHintExtra")}
                    </p>
                </div>
            </div>

            <div className="fp-stage">
                {preparedProjects.map((project, i) => (
                    <article key={project.id} ref={(el) => { cardRefs.current[i] = el; }}
                        className="fp-card" style={{ "--accent": project.accent }}>
                        <div className="fp-card__media">
                            <img src={project.image} alt={project.title} loading={i === 0 ? "eager" : "lazy"}
                                draggable={false} />
                        </div>
                        <div className="fp-card__body">
                            <div className="fp-card__toprow">
                                <span className="fp-card__num">{String(i + 1).padStart(2, "0")}.</span>
                                <span className="fp-card__year">{project.year}</span>
                            </div>
                            <h3 className="fp-card__title">{project.title}</h3>
                            <p className="fp-card__desc">{project.description}</p>
                            <div className="fp-card__tech">
                                {project.tech.map((item) => (
                                    <span key={item} className="fp-card__chip">{item}</span>
                                ))}
                            </div>
                            <a className="fp-card__link" href={`/projects/${project.id}`}>
                                <span>{t(currentLang, "projectButton")}</span>
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} size="sm" />
                            </a>
                        </div>
                        <span className="fp-card__shade" aria-hidden />
                    </article>
                ))}
                {/* HUD: счётчик и точки прогресса */}
                <div className="fp-hud" aria-hidden>
                    <span className="fp-hud__count">
                        <span ref={countRef}>01</span>
                        <span className="fp-hud__sep">/</span>
                        <span>{String(total).padStart(2, "0")}</span>
                    </span>
                    <span className="fp-hud__dots">
                        {preparedProjects.map((p, i) => (
                            <span key={p.id} ref={(el) => { dotRefs.current[i] = el; }} className="fp-hud__dot" />
                        ))}
                    </span>
                </div>
            </div>
            <div className="fp-outro">
                <div className="fp-outro__glow" aria-hidden="true"></div>
                <p className="fp-outro__eyebrow">{t(currentLang, "fpOutro", "eyebrow")}</p>
                <h2 className="fp-outro__title">
                    {t(currentLang, "fpOutro", "title")}
                    <br />
                    <span className="hero__outline">{t(currentLang, "fpOutro", "subtitle")}</span>
                </h2>
                <div className="fp-outro__actions">
                    {/* Кнопка "Все проекты" */}
                    <GlowButton href="#projects">{t(currentLang, "fpOutro", "btnAllProjects")}</GlowButton>
                    {/* Кнопка "Сделать заказ" */}
                    <GlowButton onClick={() => console.log("clicked btnStart")} href="#" >
                        {t(currentLang, "fpOutro", "btnOrder")}
                    </GlowButton>
                </div>
            </div>
        </section>
    );
}
