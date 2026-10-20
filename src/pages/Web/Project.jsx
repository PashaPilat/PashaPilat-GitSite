import React, { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { getProjects } from "../../data/projects";
import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";
import ProjectGallery from "../../components/ProjectGallery";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import NotFound from "../../components/NotFound";
import SmokeEffect from "../../components/Home/SmokeEffect";
import GlowButton from "../../components/Home/GlowButton";
import logo from "../../assets/images/logo 2.png";
import "../../styles/pages/projects.scss";

export default function Project() {
    const location = useLocation();
    const { slug } = useParams();
    const lang = getLangFromPath(location.pathname);
    const home = lang === "ru" ? "/" : `/${lang}`;
    const base = `${lang === "ru" ? "" : `/${lang}`}/projects`;
    const copy = t(lang, "projects", "ui");
    const projects = useMemo(() => getProjects(lang), [lang]);
    const project = projects.find(item => item.id === slug);
    return <div className="project-catalog">
        <div className="project-catalog__smoke" aria-hidden="true"><SmokeEffect /></div>
        <header className="project-catalog__nav">
            <Link className="project-catalog__brand" to={home}><img src={logo} alt="" />PashaPilat</Link>
            <nav aria-label={copy.title}><Link to={home}>{copy.home}</Link><Link to={`${home}#direct-contact`}>{t(lang, "common", "nav", "contact")}</Link><LanguageSwitcher /></nav>
        </header>
        <main className="project-catalog__main">
            <p className="project-catalog__eyebrow">PashaPilat / Web</p>
                {project ? <article className="project-detail">
                    <div className="project-detail__header">
                        <h1>{project.title}</h1>
                        <GlowButton to={`${base}${location.search}`} className="project-detail__back">← {copy.title}</GlowButton>
                    </div>
                    <p className="project-catalog__intro">{project.role}</p>
                    <dl className="project-detail__meta"><div><dt>{copy.year}</dt><dd>{project.year}{project.dateUncertain && <small> · {copy.dateNote}</small>}</dd></div><div><dt>{copy.stack}</dt><dd>{project.tech.join(" · ")}</dd></div></dl>
                    <ProjectGallery project={project} copy={copy} detail lightbox />
                    <h2>{copy.about}</h2>{project.body.split("\n\n").map((paragraph, i) => <p key={i} className="project-detail__text">{paragraph}</p>)}
                    <div className="project-detail__cta-wrapper"><GlowButton to={`${home}#contact`} className="project-detail__cta">{copy.contact} ↗</GlowButton></div>
                </article> : <NotFound />}
        </main>
    </div>;
}
