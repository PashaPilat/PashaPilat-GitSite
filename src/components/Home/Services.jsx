import React, { useEffect, useRef, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight,faPlus, faGlobe, faServer, faCode, faDiagramProject, faBolt, faScrewdriverWrench,} from "@fortawesome/free-solid-svg-icons";

import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import img_webDev from "../../assets/images/services/web-dev.png";
import img_backEngin from "../../assets/images/services/backend.png";
import img_frontDev from "../../assets/images/services/frontend.png";
import img_sysArch from "../../assets/images/services/architecture.png";
import img_realSys from "../../assets/images/services/real-time-systems.png";
import img_projSupp from "../../assets/images/services/project-support.png";

import "../../styles/components/Home/Services.scss";

const currentLang = getLangFromPath(window.location.pathname);

const serviceIcons = {
    "web-development": faGlobe,
    "backend-engineering": faServer,
    "frontend-development": faCode,
    "system-architecture": faDiagramProject,
    "realtime-systems": faBolt,
    "project-support": faScrewdriverWrench,
};

const serviceImages = {
    "web-development": img_webDev,
    "backend-engineering": img_backEngin,
    "frontend-development": img_frontDev,
    "system-architecture": img_sysArch,
    "realtime-systems": img_realSys,
    "project-support": img_projSupp,
};

export default function Services() {
    const sectionRef = useRef(null);
    const [openIds, setOpenIds] = useState([]);
    const [transitionAngle, setTransitionAngle] = useState(6);

    const toggle = (id) => { 
        setOpenIds((prev) => prev.includes(id) ? 
        prev.filter((x) => x !== id) : [...prev, id] ); };

    useEffect(() => {
        const root = sectionRef.current;
        if (!root) return;

        const els = Array.from(root.querySelectorAll(".svc-reveal"));
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-in");
                        io.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

      // Dynamic skew effect
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frameId = null;

    const updateAngle = () => {
      if (frameId) return;

      frameId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // расстояние от нижней границы секции до верха окна
        const bottomToTop = rect.bottom;

        /*
        * В начале секции угол = 6deg.
        * Когда нижняя граница секции доходит до верха окна (bottom ≈ 0),
        * угол становится 0deg.
        */
        let progress = 1 - bottomToTop / viewportHeight;
        progress = Math.max(0, Math.min(progress, 1));

        const angle = 6 * (1 - progress);
        setTransitionAngle(angle);

        frameId = null;
        });
    };

    updateAngle();

    window.addEventListener("scroll", updateAngle, { passive: true });
    window.addEventListener("resize", updateAngle);

    return () => {
      window.removeEventListener("scroll", updateAngle);
      window.removeEventListener("resize", updateAngle);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

    const services = t(currentLang, "servicesFeatured");
    const preparedServices = useMemo(
        () => services.map((s) => ({ ...s, 
                icon: serviceIcons[s.id],
                image: serviceImages[s.id], 
            })),
        [services],
    );

    return (
        <section ref={sectionRef} id="services" className="svc" 
        style={{"--transition-angle": `${transitionAngle}deg`,}}
        aria-label={t(currentLang, "services", "ariaLabel")}>
            <div className="svc__inner">
                <header className="svc-head svc-reveal">
                    <div>
                        <p className="svc-eyebrow">{t(currentLang, "services", "eyebrow")}</p>
                        <h2 className="svc-title">
                            {t(currentLang, "services", "titleMain")}
                            <br />
                            <span className="svc-title__ghost"> {t(currentLang, "services", "titleGhost")} </span>
                        </h2>
                    </div>
                    <div className="svc-head__right">
                        <p className="svc-head__meta">{t(currentLang, "services", "meta")}</p>
                        <a href="#contact" className="svc-cta">
                            <span>{t(currentLang, "services", "cta")}</span>
                            <FontAwesomeIcon icon={faArrowRight} aria-hidden />
                        </a>
                    </div>
                </header>

                <div className="svc-list">
                    {preparedServices.map((s, i) => { 
                        const open = openIds.includes(s.id);
                        return (
                                <article key={s.id} ref={(el) => {
                                                if (!el) return;
                                                if (open) el.classList.add("is-open");
                                                else el.classList.remove("is-open");
                                                }}  className="svc-row svc-reveal"
                                        style={{ "--accent": s.accent, "--d": `${140 + i * 70}ms` }}>
                                <FontAwesomeIcon icon={s.icon} className="svc-row__ghost" aria-hidden />
                                <h3 className="svc-row__heading">
                                    <button type="button" className="svc-row__head" aria-expanded={open} aria-controls={`svc-body-${s.id}`} onClick={() => toggle(s.id)}>
                                        <div className="svc-row__iconbox_plate" aria-hidden><FontAwesomeIcon icon={s.icon} className="svc-iconbox_plate__icon"/></div>
                                        <span className="svc-row__title">{s.title}</span>
                                        <span className="svc-row__plus" aria-hidden> <FontAwesomeIcon icon={faPlus} /></span>
                                    </button>
                                </h3>
                                <div className="svc-row__body" id={`svc-body-${s.id}`}>
                                    <div className="svc-row__inner">
                                        <div className="svc-row__cols">
                                            <div className="svc-row__content">
                                                <p className="svc-row__desc"> {s.description}</p>
                                                <div className="svc-row__chips">
                                                    {s.tech.map((tch) => (<span key={tch} className="svc-row__chip" >{tch}</span> ))}
                                                </div>
                                                <a className="svc-row__link" href="#contact">
                                                    <span> {t( currentLang,"services", "link",)}</span>
                                                    <FontAwesomeIcon icon={faArrowRight} aria-hidden />
                                                </a>
                                            </div>
                                            <div className="svc-plate" aria-hidden>
                                                 <img className="svc-plate__image" src={s.image} alt={s.title} loading="lazy" draggable={false} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
