import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navigation from "../../components/Home/Navigation";
import CursorFollower from "../../components/CursorFollower";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import NotFound from "../../components/NotFound";
import "../../styles/pages/direction.scss";

export default function Project() {
    const lang = getLangFromPath(useLocation().pathname);
    const { slug } = useParams();
    const page = "other";
    const base = lang === "ru" ? `/${page}` : `/${lang}/${page}`;
    const copy = t(lang, page, "catalog");
    const item = copy.items.find(it => it.slug === slug);
    return (
        <div className="direction-page direction-page--other">
            <Navigation />
            <main className="direction-landing" id="projects">
                {!item ? <NotFound /> : (
                    <section className="direction-projects" aria-labelledby="direction-projects-title">
                        <p className="software-eyebrow">{copy.eyebrow}</p>
                        <h1 id="direction-projects-title">{item.title}</h1>
                        <span className="direction-project-card__status">{copy.status}</span>
                        <p className="direction-projects__intro">{item.description}</p>
                        <p className="direction-projects__note">{copy.note}</p>
                        <Link to={base}>← {copy.title}</Link>
                    </section>
)}
            </main>
            <CursorFollower />
        </div>
    );
}
