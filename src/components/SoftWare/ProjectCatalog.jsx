import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "../../i18n";
import Corners from "./Corners";
import MatrixDivider from "./MatrixDivider";
import Scramble from "./Scramble";
import useReveal from "./useReveal";
import { projects, softwarePath } from "./projects";
import "../../styles/components/SoftWare/LandingSections.scss";

export function ProjectCard({ project, lang, index = 0 }) {
    const text = t(lang, "software", "items", project.slug);
    const to = softwarePath(lang, `/${project.slug}`);
    const gallery = (project.gallery?.length ? project.gallery : [project.preview]);
    const [current, setCurrent] = useState(0);
    const maxDots = 10;
    const dotCount = Math.min(gallery.length, maxDots);
    const prev = (e) => { e.preventDefault(); e.stopPropagation(); setCurrent((c) => (c - 1 + gallery.length) % gallery.length); };
    const next = (e) => { e.preventDefault(); e.stopPropagation(); setCurrent((c) => (c + 1) % gallery.length); };

    return <Link className="software-card software-reveal" to={to} style={{ "--d": `${index * 110}ms` }} aria-label={project.name}>
        <span className="software-card__ghost" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <Corners />
        <div className="software-card__termbar" aria-hidden="true">            
            {gallery.length > 1 && (
                <span className="software-card__screenshots" aria-hidden="true">
                    {Array.from({ length: dotCount }).map((_, i) => (
                        <i key={i} className={`software-card__dot${i === current ? " software-card__dot--g" : ""}`} />
                    ))}
                </span>
            )}
            <span className="software-card__file">platp/{project.slug}</span>
        </div>
        <div className="software-card__image" aria-hidden="true">
            <img src={gallery[current]} alt={`${project.name} — ${t(lang, "software", project.concept ? "concept" : "screenshot")}`} loading="lazy" width="1600" height="900" />
            <span className="software-card__scan" aria-hidden="true" />
            {project.concept && <span className="software-card__caption">{t(lang, "software", "concept")}</span>}
            {gallery.length > 1 && (
                <>
                    <button type="button" className="software-card__nav software-card__nav--prev" onClick={prev} aria-label="Предыдущий скриншот">‹</button>
                    <button type="button" className="software-card__nav software-card__nav--next" onClick={next} aria-label="Следующий скриншот">›</button>
                </>
            )}
        </div>
        <div className="software-card__body">
            <span className="software-status"><i aria-hidden="true" />{t(lang, "software", "inDevelopment")}</span>
            <h3>{project.name}</h3>
            <p>{text.short}</p>
            <ul className="software-tags" aria-label={t(lang, "software", "tags")}>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </div>
    </Link>;
}

export default function ProjectCatalog({ lang, embedded = false, exclude, titleAs: Heading = "h2" }) {
    const rootRef = useRef(null);
    useReveal(rootRef, [lang, embedded, exclude]);

    return <section ref={rootRef} id="projects" className={`software-catalog${embedded ? " software-catalog--embedded" : ""}`} aria-labelledby="software-projects-title">
        <div className="software-shell">
            <header className="software-section-heading software-reveal">
                <div>
                    <p className="software-eyebrow">{t(lang, "software", "catalogEyebrow")}<span className="mx-cursor" aria-hidden="true" /></p>
                    <Heading id="software-projects-title"><Scramble text={t(lang, "software", exclude ? "otherProjects" : embedded ? "catalogHeading" : "catalogTitle")} /></Heading>
                </div>
                {embedded && <div className="software-section-heading__meta" aria-hidden="true"><span>{t(lang, "software", "catalogDescription")}</span></div>}
            </header>
            {!exclude && <p className="software-intro software-reveal">{t(lang, "software", "catalogDescription")}</p>}
            
            <div className="software-grid">{projects.filter(p => p.slug !== exclude).map((project, index) => <ProjectCard key={project.slug} project={project} lang={lang} index={index} />)}</div>
        </div>
    </section>;
}
