import React, { useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableCellsLarge, faList } from "@fortawesome/free-solid-svg-icons";

import { getProjects } from "../../data/projects";
import { PAGE_SIZE, selectProjects } from "../../data/projectQuery.mjs";
import groups from "../../data/technologyGroups.json";

import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import SmokeEffect from "../../components/Home/SmokeEffect";
import logo from "../../assets/images/logo 2.png";
import "../../styles/pages/projects.scss";

const HighlightText = ({ text, query, className }) => {
    if (!query || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return <>{parts.map((part, i) => part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className={className || "project-highlight"}>{part}</mark>
        : <span key={i}>{part}</span>)}</>;
};

export default function Projects() {
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [openSections, setOpenSections] = useState({});
    const resultsRef = useRef(null);
    const lang = getLangFromPath(location.pathname);
    const home = lang === "ru" ? "/" : `/${lang}`;
    const base = `${lang === "ru" ? "" : `/${lang}`}/projects`;
    const copy = t(lang, "projects", "ui");
    const projects = useMemo(() => getProjects(lang), [lang]);
    const query = params.get("q") || "";
    const technologies = params.getAll("tech");
    const sort = ["newest", "oldest", "az", "za"].includes(params.get("sort")) ? params.get("sort") : "newest";
    const view = params.get("view") === "list" ? "list" : "grid";
    const filtered = selectProjects(projects, { query, technologies, sort, lang });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, parseInt(params.get("page"), 10) || 1));
    const change = (key, value) => {
        const next = new URLSearchParams(params);
        next.delete(key);
        (Array.isArray(value) ? value : [value]).filter(Boolean).forEach(item => next.append(key, item));
        if (key !== "page") next.delete("page");
        setParams(next, { replace: key === "q" });
        if (key === "page") requestAnimationFrame(() => {
            if (window.lenis) window.lenis.scrollTo(resultsRef.current, { immediate: true });
            else resultsRef.current?.scrollIntoView();
        });
    };
    const reset = () => { const next = new URLSearchParams(params); ["q", "tech", "page"].forEach(key => next.delete(key)); setParams(next); };
    return <div className="project-catalog">
        <div className="project-catalog__smoke" aria-hidden="true"><SmokeEffect /></div>
        <header className="project-catalog__nav">
            <Link className="project-catalog__brand" to={home}><img src={logo} alt="" />PashaPilat</Link>
            <nav aria-label={copy.title}><Link to={home}>{copy.home}</Link><Link to={`${home}#direct-contact`}>{t(lang, "common", "nav", "contact")}</Link><LanguageSwitcher /></nav>
        </header>
        <main className="project-catalog__main">
            <p className="project-catalog__eyebrow">PashaPilat / Web</p>
            <h1>{copy.title}<span className="project-catalog__count">{projects.length}</span></h1>
            <p className="project-catalog__intro">{copy.intro}</p>
            <div className="project-catalog__layout">
                <aside className="project-catalog__sidebar">
                    <button className="project-catalog__filter-toggle" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}>{filtersOpen ? copy.closeFilters : copy.openFilters} ({technologies.length})</button>
                    <div id="catalog-filters" className={`project-catalog__filters ${filtersOpen ? "is-open" : ""}`} data-lenis-prevent>
                        <label className="project-catalog__search"><span>{copy.search}</span><input type="search" value={query} onChange={event => change("q", event.target.value)} /></label>
                        <h2>{copy.filter}</h2><p>{copy.filterHint}</p>
                        <button className="project-catalog__reset" onClick={reset} disabled={!query && !technologies.length}>{copy.reset}</button>
                        {Object.entries(groups).map(([group, items]) => <fieldset key={group} className={openSections[group] ? "is-open" : ""}>
                            <button type="button" className="project-catalog__filter-group-toggle" aria-expanded={!!openSections[group]} onClick={() => setOpenSections(s => ({ ...s, [group]: !s[group] }))}>
                                <span className="project-catalog__filter-group-toggle__name">{copy[group]}</span>
                                <i className="project-catalog__filter-group-toggle__icon">{openSections[group] ? "−" : "+"}</i>
                                <span className="project-catalog__filter-group-toggle__count">{items.filter(t => technologies.includes(t)).length}</span>
                            </button>
                            {[...items].sort((a,b) => a.localeCompare(b, "en", { sensitivity: "base" })).map(tech => <label key={tech}><input type="checkbox" checked={technologies.includes(tech)} onChange={() => change("tech", technologies.includes(tech) ? technologies.filter(item => item !== tech) : [...technologies, tech])} /><span>{tech}</span></label>)}
                        </fieldset>)}
                    </div>
                </aside>
                <section className="project-catalog__results" ref={resultsRef} aria-label={copy.title}>
                    <div className="project-catalog__toolbar"><p role="status">{copy.shown}: {filtered.length}</p><label><span className="catalog-sr-only">{copy.sort}</span><select aria-label={copy.sort} value={sort} onChange={event => change("sort", event.target.value)}>{["newest", "oldest", "az", "za"].map(value => <option key={value} value={value}>{copy[value]}</option>)}</select></label><div className="project-catalog__views">{["grid", "list"].map(mode => <button key={mode} aria-label={copy[mode]} title={copy[mode]} aria-pressed={view === mode} onClick={() => change("view", mode)}><FontAwesomeIcon icon={mode === "grid" ? faTableCellsLarge : faList} /></button>)}</div></div>
                    <div className={`project-catalog__grid ${view === "list" ? "project-catalog__grid--list" : ""}`}>
                        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => {
                            const hasImage = Boolean(item.image);
                            return <Link key={item.id} to={`${base}/${item.id}${location.search}`} className="project-preview">
                                <div className="project-preview__media">
                                    {hasImage
                                        ? <img src={item.image} alt="" loading="lazy" aria-hidden="true" />
                                        : <div className="project-preview__placeholder" aria-hidden="true"><span>{item.title.slice(0, 2).toUpperCase()}</span><small>{item.title}</small></div>}
                                    {item.images && item.images.length > 1 && <span className="project-preview__photos" aria-hidden="true">{item.images.length} фото</span>}
                                </div>
                                <div className="project-preview__top">
                                    <h2 className="project-preview__title"><HighlightText text={item.title} query={query} /></h2>
                                    <span className="project-preview__year-badge" aria-label={item.year}>{item.year}</span>
                                </div>
                                <div className="project-preview__bottom">
                                    <p className="project-preview__desc"><HighlightText text={item.summary} query={query} /></p>
                                    {view === "list" && <p className="project-preview__role"><HighlightText text={item.role} query={query} className="media-highlight" /></p>}
                                    <ul className="project-preview__tech" aria-label={view === "list" ? copy.stack : copy.filter}>{(view === "list" ? item.tech : item.keyTech).map(tech => <li key={tech}><HighlightText text={tech} query={query} className="media-highlight" /></li>)}</ul>
                                </div>
                            </Link>;
                        })}
                    </div>
                    {!filtered.length && <div className="project-catalog__empty"><p>{copy.empty}</p><button onClick={reset}>{copy.reset}</button></div>}
                    {pages > 1 && <nav className="project-catalog__pagination" aria-label={copy.pages}><button disabled={page === 1} aria-label={copy.prev} onClick={() => change("page", String(page - 1))}>←</button>{Array.from({ length: pages }, (_, i) => <button key={i} aria-label={`${copy.page} ${i + 1}`} aria-current={page === i + 1 ? "page" : undefined} onClick={() => change("page", String(i + 1))}>{i + 1}</button>)}<button disabled={page === pages} aria-label={copy.next} onClick={() => change("page", String(page + 1))}>→</button></nav>}
                </section>
            </div>
        </main>
    </div>;
}
