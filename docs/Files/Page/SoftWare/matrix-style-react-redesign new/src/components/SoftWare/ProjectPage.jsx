import React, { useEffect, useMemo, useRef, useState } from "react";
import Corners from "./Corners";
import Scramble from "./Scramble";
import Markdown, { parseMarkdown } from "./Markdown";
import Lightbox from "./Lightbox";
import ProjectCatalog from "./ProjectCatalog";
import MatrixDivider from "./MatrixDivider";
import { projects } from "../../data";
import { details, projectCopy as c } from "../../projectDetails";

export const projectHref = (slug, sub = "") => `#/project/${slug}${sub ? `/${sub}` : ""}`;

function computeProgress(roadmap) {
    const sum = roadmap.reduce((acc, s) => acc + (s.status === "done" ? 100 : s.status === "progress" ? (s.progress || 50) : 0), 0);
    return Math.round(sum / roadmap.length);
}

/* ------------------------------ Hero ------------------------------ */

function ProjectHero({ project, info, tab, percent }) {
    return (
        <header className="pp-hero">
            <nav className="pp-crumbs software-reveal" aria-label="Хлебные крошки">
                <a href="#top">Software</a><i>/</i>
                <a href="#projects">Проекты</a><i>/</i>
                <span aria-current="page">{project.name}</span>
            </nav>
            <div className="pp-hero__grid">
                <div className="pp-hero__text software-reveal" style={{ "--d": "80ms" }}>
                    <p className="software-eyebrow">PlatP · Software<span className="mx-cursor" aria-hidden="true" /></p>
                    <h1><Scramble text={project.name} duration={800} /></h1>
                    <p className="pp-hero__lead">{project.short}</p>
                    <div className="pp-hero__row">
                        <span className="software-status"><i aria-hidden="true" />{c.inDevelopment}</span>
                        <ul className="software-tags">{project.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                    </div>
                    <dl className="pp-meta">
                        {info.meta.map((m) => <div key={m.k}><dt>{m.k}</dt><dd>{m.v}</dd></div>)}
                    </dl>
                    <a className="pp-progress-mini" href={projectHref(project.slug, "roadmap")}>
                        <span>{c.overall}</span>
                        <b>{percent}%</b>
                        <i><em style={{ width: `${percent}%` }} /></i>
                    </a>
                </div>
                <figure className="pp-hero__shot software-reveal" style={{ "--d": "160ms" }}>
                    <Corners />
                    <div className="software-card__termbar" aria-hidden="true">
                        <i className="software-card__dot" /><i className="software-card__dot" /><i className="software-card__dot software-card__dot--g" />
                        <span className="software-card__file">~/platp/{project.slug}/preview</span>
                    </div>
                    <img src={project.preview} alt={`${project.name} — ${project.concept ? "концепт" : "скриншот"}`} />
                    <figcaption>{project.concept ? "Визуальная концепция проекта. Это не скриншот готового приложения." : "Скриншот приложения в разработке."}</figcaption>
                </figure>
            </div>

            <div className="pp-tabs software-reveal" role="tablist" style={{ "--d": "220ms" }}>
                <a role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "is-active" : ""} href={projectHref(project.slug)}>
                    <span>01</span>{c.tabOverview}
                </a>
                <a role="tab" aria-selected={tab === "roadmap"} className={tab === "roadmap" ? "is-active" : ""} href={projectHref(project.slug, "roadmap")}>
                    <span>02</span>{c.tabRoadmap}
                </a>
            </div>
        </header>
    );
}

/* ---------------------------- Overview ---------------------------- */

function Gallery({ items }) {
    const [open, setOpen] = useState(-1);
    return (
        <section className="pp-gallery" aria-labelledby="pp-gallery-title">
            <div className="pp-section-head software-reveal">
                <p className="software-eyebrow">GALLERY</p>
                <h2 id="pp-gallery-title">{c.gallery}</h2>
                <p>{c.galleryNote}</p>
            </div>
            <div className={`pp-gallery__grid pp-gallery__grid--${Math.min(items.length, 3)}`}>
                {items.map((it, i) => (
                    <button type="button" key={it.src} className="pp-gallery__item software-reveal" style={{ "--d": `${i * 90}ms` }} onClick={() => setOpen(i)} aria-label={`Открыть: ${it.caption}`}>
                        <Corners />
                        <img src={it.src} alt={it.caption} loading="lazy" />
                        <span className="pp-gallery__cap"><b>{String(i + 1).padStart(2, "0")}</b>{it.caption}<i aria-hidden="true">⤢</i></span>
                    </button>
                ))}
            </div>
            <Lightbox items={items} index={open} onClose={() => setOpen(-1)} onIndex={setOpen} />
        </section>
    );
}

function Overview({ project, info }) {
    const { blocks, toc } = useMemo(() => parseMarkdown(info.description), [info.description]);
    const [active, setActive] = useState(toc[0]?.id);
    const articleRef = useRef(null);

    useEffect(() => {
        if (!("IntersectionObserver" in window)) return undefined;
        const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean);
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
        }, { rootMargin: "-25% 0px -65% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [toc]);

    const chars = info.description.length;
    const minutes = Math.max(1, Math.round(chars / 1200));

    return (
        <>
            <Gallery items={info.gallery} />
            <section className="pp-doc" aria-label="Описание проекта">
                <div className="pp-doc__frame software-reveal">
                    <div className="software-philosophy__termhead" aria-hidden="true">
                        <i className="software-card__dot" /><i className="software-card__dot" /><i className="software-card__dot software-card__dot--g" />
                        <span className="software-philosophy__termtitle"><b>cat</b> ./{project.slug}/README.md</span>
                        <span className="pp-doc__read">~{minutes} мин чтения</span>
                    </div>
                    <div className="pp-doc__layout">
                        <aside className="pp-doc__aside">
                            <nav className="software-philosophy__toc pp-doc__toc" aria-label={c.contents}>
                                <p>{c.contents}</p>
                                <ol>
                                    {toc.map((t, i) => (
                                        <li key={t.id}>
                                            <a href={`#${t.id}`} className={active === t.id ? "is-active" : ""} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                                                <span className="software-philosophy__tocnum">{String(i + 1).padStart(2, "0")}</span>
                                                <span className="software-philosophy__toctext">{t.text}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                            <div className="pp-stack">
                                <p>{c.stack}</p>
                                <ul>{info.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                            </div>
                            <a className="software-btn software-btn--ghost pp-doc__cta" href={projectHref(project.slug, "roadmap")}>{c.toRoadmap} →</a>
                        </aside>
                        <article className="md" ref={articleRef}>
                            <Markdown blocks={blocks} />
                        </article>
                    </div>
                </div>
            </section>
        </>
    );
}

/* ----------------------------- Roadmap ---------------------------- */

function Roadmap({ project, info, percent }) {
    const counts = info.roadmap.reduce((a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }), {});
    return (
        <section className="pp-roadmap" aria-labelledby="pp-roadmap-title">
            <div className="pp-section-head software-reveal">
                <p className="software-eyebrow">{c.roadmapEyebrow}</p>
                <h2 id="pp-roadmap-title"><Scramble text={c.roadmapTitle} /></h2>
                <p>{c.roadmapNote}</p>
            </div>

            <div className="pp-summary software-reveal" style={{ "--d": "80ms" }}>
                <Corners />
                <div className="pp-summary__big">
                    <span>{c.overall}</span>
                    <b>{percent}<small>%</small></b>
                </div>
                <div className="pp-summary__bar" aria-label={`${c.overall}: ${percent}%`}>
                    <div className="pp-summary__track">
                        {info.roadmap.map((s, i) => (
                            <i key={i} className={`is-${s.status}`} title={s.title}>
                                {s.status === "progress" && <em style={{ height: `${s.progress || 50}%` }} />}
                            </i>
                        ))}
                    </div>
                    <ul className="pp-legend">
                        <li className="is-done"><i />{c.done} · {counts.done || 0}</li>
                        <li className="is-progress"><i />{c.progress} · {counts.progress || 0}</li>
                        <li className="is-planned"><i />{c.planned} · {counts.planned || 0}</li>
                    </ul>
                </div>
            </div>

            <ol className="pp-timeline">
                {info.roadmap.map((s, i) => (
                    <li key={i} className={`pp-step is-${s.status} software-reveal`} style={{ "--d": `${(i % 4) * 70}ms` }}>
                        <span className="pp-step__node" aria-hidden="true">{s.status === "done" ? "✓" : s.status === "progress" ? "▶" : "·"}</span>
                        <div className="pp-step__card">
                            <div className="pp-step__head">
                                <span className="pp-step__num">STEP {s.step}</span>
                                <span className="pp-step__badge">{c[s.status]}{s.status === "progress" && ` · ${s.progress}%`}</span>
                            </div>
                            <h3>{s.title}</h3>
                            <p>{s.text}</p>
                            {s.status === "progress" && <div className="pp-step__bar"><i style={{ width: `${s.progress}%` }} /></div>}
                            <ul className="software-tags">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="pp-roadmap__back software-reveal">
                <a className="software-btn software-btn--ghost" href={projectHref(project.slug)}>← {c.toOverview}</a>
            </div>
        </section>
    );
}

/* ------------------------------ Page ------------------------------ */

export default function ProjectPage({ slug, tab }) {
    const project = projects.find((p) => p.slug === slug);
    const info = details[slug];

    if (!project || !info) {
        return (
            <section className="pp-page"><div className="software-shell pp-notfound">
                <p className="software-eyebrow">ERROR 404</p>
                <h1>{c.notFound}</h1>
                <a className="software-btn software-btn--primary" href="#projects">{c.back}</a>
            </div></section>
        );
    }
    const percent = computeProgress(info.roadmap);

    return (
        <>
            <section className="pp-page">
                <div className="software-shell">
                    <ProjectHero project={project} info={info} tab={tab} percent={percent} />
                    {tab === "roadmap"
                        ? <Roadmap project={project} info={info} percent={percent} />
                        : <Overview project={project} info={info} />}
                </div>
            </section>
            <MatrixDivider index="++" label={c.otherProjects} />
            <ProjectCatalog exclude={slug} />
        </>
    );
}
