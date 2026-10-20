import React from "react";
import Corners from "./Corners";
import Scramble from "./Scramble";
import { copy, projects } from "../../data";

const href = (slug, sub = "") => `#/project/${slug}${sub ? `/${sub}` : ""}`;

function ProjectCard({ project, index }) {
    const c = copy.projects;
    return (
        <article className="software-card software-reveal" style={{ "--d": `${index * 110}ms` }}>
            <span className="software-card__ghost" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <Corners />
            <div className="software-card__termbar" aria-hidden="true">
                <i className="software-card__dot" />
                <i className="software-card__dot" />
                <i className="software-card__dot software-card__dot--g" />
                <span className="software-card__file">{c.filePrefix}{project.slug}</span>
            </div>
            <a className="software-card__image" href={href(project.slug)} aria-label={project.name}>
                <img src={project.preview} alt={`${project.name} — ${project.concept ? c.concept : "интерфейс"}`} loading="lazy" width="1600" height="900" />
                <span className="software-card__scan" aria-hidden="true" />
                {project.concept && <span className="software-card__caption">{c.concept}</span>}
            </a>
            <div className="software-card__body">
                <span className="software-status"><i aria-hidden="true" />{c.status}</span>
                <h3>{project.name}</h3>
                <p>{project.short}</p>
                <ul className="software-tags" aria-label={c.tags}>
                    {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                <div className="software-card__links">
                    <a className="software-link" href={href(project.slug)} aria-label={`${c.details} — ${project.name}`}>
                        {c.details} <span aria-hidden="true">↗</span>
                    </a>
                    <a className="software-link software-link--dim" href={href(project.slug, "roadmap")}>Roadmap</a>
                </div>
            </div>
        </article>
    );
}

export default function ProjectCatalog({ exclude }) {
    const c = copy.projects;
    const list = projects.filter((p) => p.slug !== exclude);
    return (
        <section id={exclude ? "other-projects" : "projects"} className="software-catalog" aria-labelledby="software-projects-title">
            <div className="software-shell">
                <header className="software-section-heading software-reveal">
                    <div>
                        <p className="software-eyebrow">{c.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                        <h2 id="software-projects-title"><Scramble text={exclude ? "Другие проекты" : c.heading} /></h2>
                    </div>
                    <div className="software-section-heading__meta" aria-hidden="true">
                        <span>ls ./projects — {String(list.length).padStart(2, "0")} модуля</span>
                        <span>{c.metaB}</span>
                    </div>
                </header>
                {!exclude && <p className="software-intro software-reveal" style={{ "--d": "90ms" }}>{c.description}</p>}
                <div className={`software-grid${list.length === 2 ? " software-grid--2" : ""}`}>
                    {list.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
                </div>
            </div>
        </section>
    );
}
