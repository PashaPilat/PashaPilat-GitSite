import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navigation from "../components/Home/Navigation";
import SoftwareMatrixBackground from "../components/SoftWare/SoftwareMatrixBackground";
import CursorFollower from "../components/CursorFollower";
import ProjectCatalog from "../components/SoftWare/ProjectCatalog";
import { projects, softwarePath } from "../components/SoftWare/projects";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";

export default function Software() {
    const lang = getLangFromPath(useLocation().pathname);
    const { slug } = useParams();
    const project = projects.find(p => p.slug === slug);
    const text = project && t(lang, "software", "items", project.slug);
    const label = key => t(lang, "software", key);
    return <div className="hero-wrapper software-page" id="top">
        <SoftwareMatrixBackground />
        <Navigation />
        <main className="software-page__content">
            <nav className="software-breadcrumbs" aria-label={label("breadcrumbs")}>
                <ol>
                    <li><Link to={softwarePath(lang)}>Software</Link></li>
                    <li>{slug ? <Link to={softwarePath(lang, "/projects")}>{label("catalogTitle")}</Link> : <span aria-current="page">{label("catalogTitle")}</span>}</li>
                    {slug && <li aria-current="page">{project?.name || label("notFound")}</li>}
                </ol>
            </nav>
            {slug && <Link className="software-link" to={softwarePath(lang, "/projects")}>← {label("backToCatalog")}</Link>}
            {!slug ? <ProjectCatalog lang={lang} titleAs="h1" /> : !project ? <h1>{label("notFound")}</h1> : <>
                <section className="software-product-hero" aria-label={project.name}><div>
                    <p className="software-eyebrow">PlatP · Software</p>
                    <h1>{project.name}</h1><p className="software-intro">{text.short}</p>
                    <span className="software-status">{label("inDevelopment")}</span>
                    <ul className="software-tags" aria-label={label("tags")}>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
                </div><figure><img src={project.preview} alt={`${project.name} — ${label(project.concept ? "concept" : "screenshot")}`} width="1600" height="900" /><figcaption>{label(project.concept ? "conceptNote" : "screenshotNote")}</figcaption></figure></section>
                <div className="software-product-sections">
                    <section><h2>{label("about")}</h2>{text.about.map(p => <p key={p}>{p}</p>)}</section>
                    <section><h2>{label("features")}</h2><p>{label("directionsNote")}</p><ul>{text.features.map(item => <li key={item}>{item}</li>)}</ul></section>
                    <section><h2>{label("technologies")}</h2><p>{text.technologies}</p></section>
                    <section><h2>{label("developmentStatus")}</h2><p>{text.status}</p></section>
                </div>
                <section className="software-gallery" aria-labelledby="software-gallery-title"><h2 id="software-gallery-title">{label("gallery")}</h2><p>{label("galleryNote")}</p>
                    <div>{project.gallery.map((src, i) => <figure key={src}><a href={src} target="_blank" rel="noopener noreferrer" aria-label={`${label("openScreenshot")} — ${project.name} ${i + 1}`}><img src={src} alt={`${project.name} — ${label("screenshot")} ${i + 1}`} loading="lazy" /></a><figcaption>{label("screenshot")} {i + 1} · {label("openScreenshot")} ↗</figcaption></figure>)}</div>
                </section>
                <ProjectCatalog lang={lang} exclude={project.slug} />
            </>}
        </main><CursorFollower />
    </div>;
}
