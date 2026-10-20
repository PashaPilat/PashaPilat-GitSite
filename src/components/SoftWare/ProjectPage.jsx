import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import Corners from "./Corners";
import Scramble from "./Scramble";
import Markdown, { parseMarkdown } from "./Markdown";
import Lightbox from "./Lightbox";
import ProjectCatalog from "./ProjectCatalog";
import MatrixDivider from "./MatrixDivider";
import useReveal from "./useReveal";
import { projects, softwarePath } from "./projects";
import { details } from "./projectDetails";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/pages/project.scss";

function computeProgress(roadmap) {
    const sum = roadmap.reduce((acc, s) => acc + (s.status === "done" ? 100 : s.status === "progress" ? (s.progress || 50) : 0), 0);
    return Math.round(sum / roadmap.length);
}

function ProjectHero({ project, info, tab, percent, lang, onPreviewClick }) {
    const c = (key) => t(lang, "software", key);
    const base = softwarePath(lang);
    const overviewTo = `/${lang === "ru" ? "" : `${lang}/`}software/${project.slug}`;
    const roadmapTo = `${overviewTo}?tab=roadmap`;

    return (
        <header className="pp-hero">
            <nav className="pp-crumbs software-reveal" aria-label={c("breadcrumbs")}>
                <Link to={base}>Software</Link><i>/</i>
                <a href={`${base}#projects`}>{c("catalogTitle")}</a><i>/</i>
                <span aria-current="page">{project.name}</span>
            </nav>
            <div className="pp-hero__grid">
                <div className="pp-hero__text software-reveal" style={{ "--d": "80ms" }}>
                    <p className="software-eyebrow">PlatP · Software<span className="mx-cursor" aria-hidden="true" /></p>
                    <h1><Scramble text={project.name} duration={800} as="span" /></h1>
                    <p className="pp-hero__lead">{project.short}</p>
                    <div className="pp-hero__row">
                        <span className="software-status"><i aria-hidden="true" />{c("inDevelopment")}</span>
                        <ul className="software-tags">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                    </div>
                    <dl className="pp-meta">
                        {info.meta.map((m) => (
                            <div key={m.k}><dt>{m.k}</dt><dd>{m.v}</dd></div>
                        ))}
                    </dl>
                    <Link className="pp-progress-mini" to={roadmapTo}>
                        <span>{c("overall")}</span>
                        <b>{percent}%</b>
                        <i><em style={{ width: `${percent}%` }} /></i>
                    </Link>
                </div>
                <figure className="pp-hero__shot software-reveal" style={{ "--d": "160ms" }} role="button" onClick={onPreviewClick} aria-label={c("openGallery")}>
                    <Corners />
                    <div className="software-card__termbar" aria-hidden="true">
                        <i className="software-card__dot" />
                        <i className="software-card__dot" />
                        <i className="software-card__dot software-card__dot--g" />
                        <span className="software-card__file">~/platp/{project.slug}/preview</span>
                    </div>
                    <img src={project.preview} alt={`${project.name} — ${project.concept ? c("concept") : c("screenshot")}`} />
                    <figcaption>{project.concept ? c("conceptNote") : c("screenshotNote")}</figcaption>
                </figure>
            </div>
            <div className="pp-tabs software-reveal" role="tablist" style={{ "--d": "220ms" }}>
                <Link role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "is-active" : ""} to={overviewTo}>
                    <span>01</span>{c("tabOverview")}
                </Link>
                <Link role="tab" aria-selected={tab === "roadmap"} className={tab === "roadmap" ? "is-active" : ""} to={roadmapTo}>
                    <span>02</span>{c("tabRoadmap")}
                </Link>
            </div>
        </header>
    );
}

function Gallery({ items, lang, onLightboxIndex }) {
    const c = (key) => t(lang, "software", key);

    return (
        <section className="pp-gallery" aria-labelledby="pp-gallery-title">
            <div className="pp-section-head software-reveal">
                <p className="software-eyebrow">{c("gallery")}</p>
                <h2 id="pp-gallery-title">{c("gallery")}</h2>
                <p>{c("galleryNote")}</p>
            </div>
            <div className={`pp-gallery__grid pp-gallery__grid--${Math.min(items.length, 3)}`}>
                {items.map((it, i) => (
                    <button type="button" key={it.src} className="pp-gallery__item software-reveal" style={{ "--d": `${i * 90}ms` }} onClick={() => onLightboxIndex(i + 1)} aria-label={`Открыть: ${it.caption}`}>
                        <Corners />
                        <img src={it.src} alt={it.caption} loading="lazy" />
                        <span className="pp-gallery__cap"><b>{String(i + 1).padStart(2, "0")}</b>{it.caption}<i aria-hidden="true">⤢</i></span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function Overview({ project, info, lang, onLightboxIndex }) {
    const c = (key) => t(lang, "software", key);
    const { blocks, toc } = useMemo(() => parseMarkdown(info.description), [info.description]);
    const [active, setActive] = useState(toc[0]?.id);

    useEffect(() => {
        if (!("IntersectionObserver" in window)) return undefined;
        const els = toc.map((entry) => document.getElementById(entry.id)).filter(Boolean);
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
        }, { rootMargin: "-25% 0px -65% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [toc]);

    const chars = info.description.length;
    const minutes = Math.max(1, Math.round(chars / 1200));
    const roadmapTo = `/${lang === "ru" ? "" : `${lang}/`}software/${project.slug}?tab=roadmap`;

    return (
        <>
            <Gallery items={info.gallery} lang={lang} onLightboxIndex={onLightboxIndex} />
            <section className="pp-doc" aria-label={c("about")}>
                <div className="pp-doc__frame software-reveal">
                    <div className="software-philosophy__termhead" aria-hidden="true">
                        <i className="software-card__dot" />
                        <i className="software-card__dot" />
                        <i className="software-card__dot software-card__dot--g" />
                        <span className="software-philosophy__termtitle"><b>cat</b> ./{project.slug}/README.md</span>
                        <span className="pp-doc__read">~{minutes} мин чтения</span>
                    </div>
                    <div className="pp-doc__layout">
                        <aside className="pp-doc__aside">
                            <nav className="pp-doc__toc software-philosophy__toc" aria-label={c("contents")}>
                                <p>{c("contents")}</p>
                                <ol>
                                    {toc.map((entry, i) => (
                                        <li key={entry.id}>
                                            <a href={`#${entry.id}`} className={active === entry.id ? "is-active" : ""} onClick={(e) => { e.preventDefault(); document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                                                <span className="software-philosophy__tocnum">{String(i + 1).padStart(2, "0")}</span>
                                                <span className="software-philosophy__toctext">{entry.text}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                            <div className="pp-stack">
                                <p>{c("technologies")}</p>
                                <ul>{info.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                            </div>
                            <Link className="pp-doc__cta software-btn software-btn--ghost" to={roadmapTo}>{c("toRoadmap")} →</Link>
                        </aside>
                        <article className="md">
                            <Markdown blocks={blocks} />
                        </article>
                    </div>
                </div>
            </section>
        </>
    );
}

function Roadmap({ project, info, percent, lang }) {
    const c = (key) => t(lang, "software", key);
    const counts = info.roadmap.reduce((a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }), {});
    const overviewTo = `/${lang === "ru" ? "" : `${lang}/`}software/${project.slug}`;

    return (
        <section className="pp-roadmap" aria-labelledby="pp-roadmap-title">
            <div className="pp-section-head software-reveal">
                <p className="software-eyebrow">{c("roadmapEyebrow")}</p>
                <h2 id="pp-roadmap-title"><Scramble text={c("roadmapTitle")} /></h2>
                <p>{c("roadmapNote")}</p>
            </div>

            <div className="pp-summary software-reveal" style={{ "--d": "80ms" }}>
                <Corners />
                <div className="pp-summary__big">
                    <span>{c("overall")}</span>
                    <b>{percent}<small>%</small></b>
                </div>
                <div className="pp-summary__bar" aria-label={`${c("overall")}: ${percent}%`}>
                    <div className="pp-summary__track">
                        {info.roadmap.map((s, i) => (
                            <i key={i} className={`is-${s.status}`} title={s.title}>
                                {s.status === "progress" && <em style={{ height: `${s.progress || 50}%` }} />}
                            </i>
                        ))}
                    </div>
                    <ul className="pp-legend">
                        <li className="is-done"><i />{c("done")} · {counts.done || 0}</li>
                        <li className="is-progress"><i />{c("progress")} · {counts.progress || 0}</li>
                        <li className="is-planned"><i />{c("planned")} · {counts.planned || 0}</li>
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
                                <span className="pp-step__badge">{c(s.status)}{s.status === "progress" && ` · ${s.progress}%`}</span>
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
                <Link className="software-btn software-btn--ghost" to={overviewTo}>{c("toOverview")} ←</Link>
            </div>
        </section>
    );
}

export default function ProjectPage() {
    const rootRef = useRef(null);
    const location = useLocation();
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [lightboxOpen, setLightboxOpen] = useState(-1);

    const lang = getLangFromPath(location.pathname);
    const slug = params.slug;
    const tab = searchParams.get("tab") === "roadmap" ? "roadmap" : "overview";

    const project = projects.find((p) => p.slug === slug);
    const info = details[slug];

    useReveal(rootRef, [lang, slug, tab]);

    useEffect(() => {
        const target = document.getElementById("pp-page-top");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [tab]);

    if (!project || !info) {
        return (
            <section className="pp-page">
                <div className="software-shell pp-notfound">
                    <p className="software-eyebrow">ERROR 404</p>
                    <h1>{t(lang, "software", "notFound")}</h1>
                    <Link className="software-btn software-btn--primary" to={softwarePath(lang)}>{t(lang, "software", "backToCatalog")} →</Link>
                </div>
            </section>
        );
    }

    const percent = computeProgress(info.roadmap);
    const combinedItems = useMemo(
        () => [{ src: project.preview, caption: project.name }, ...info.gallery],
        [project, info]
    );

    return (
        <div ref={rootRef}>
            <section className="pp-page" id="pp-page-top">
                <div className="software-shell">
                    <ProjectHero project={project} info={info} tab={tab} percent={percent} lang={lang}
                        onPreviewClick={() => setLightboxOpen(0)} />
                    {tab === "roadmap"
                        ? <Roadmap project={project} info={info} percent={percent} lang={lang} />
                        : <Overview project={project} info={info} lang={lang}
                            onLightboxIndex={setLightboxOpen} />}
                </div>
            </section>
            <div className="software-reveal" style={{ "--d": "120ms" }}>
                <MatrixDivider index="++" label={t(lang, "software", "otherProjects")} />
            </div>
            <ProjectCatalog lang={lang} exclude={slug} />
            <Lightbox items={combinedItems} index={lightboxOpen} onClose={() => setLightboxOpen(-1)} onIndex={setLightboxOpen} />
        </div>
    );
}
