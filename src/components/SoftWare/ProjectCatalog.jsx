import React, { useRef } from "react";
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
    return <article className="software-card software-reveal" style={{ "--d": `${index * 110}ms` }}>
        <span className="software-card__ghost" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <Corners />
        <div className="software-card__termbar" aria-hidden="true">
            <i className="software-card__dot" />
            <i className="software-card__dot" />
            <i className="software-card__dot software-card__dot--g" />
            <span className="software-card__file">platp/{project.slug}</span>
        </div>
        <Link className="software-card__image" to={softwarePath(lang, `/projects/${project.slug}`)} aria-label={project.name}>
            <img src={project.preview} alt={`${project.name} — ${t(lang, "software", project.concept ? "concept" : "screenshot")}`} loading="lazy" width="1600" height="900" />
            <span className="software-card__scan" aria-hidden="true" />
            {project.concept && <span className="software-card__caption">{t(lang, "software", "concept")}</span>}
        </Link>
        <div className="software-card__body">
            <span className="software-status"><i aria-hidden="true" />{t(lang, "software", "inDevelopment")}</span>
            <h3>{project.name}</h3>
            <p>{text.short}</p>
            <ul className="software-tags" aria-label={t(lang, "software", "tags")}>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            <Link className="software-link" to={softwarePath(lang, `/projects/${project.slug}`)} aria-label={`${t(lang, "software", "details")} — ${project.name}`}>{t(lang, "software", "details")} <span aria-hidden="true">↗</span></Link>
        </div>
    </article>;
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
