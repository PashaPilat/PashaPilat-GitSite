import React from "react";
import { useLocation, Link } from "react-router-dom";
import HeroWrapper from "../../components/GameDev/HeroWrapper";
import LandingSections from "../../components/SoftWare/LandingSections";
import CursorFollower from "../../components/CursorFollower";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/pages/gamedev.scss";
import "../../styles/pages/direction.scss";
import "../../styles/components/SoftWare/LandingSections.scss";

const directionIcons = ["fa-solid fa-cubes", "fa-solid fa-gears", "fa-solid fa-flask"];

export default function GameDev() {
    const lang = getLangFromPath(useLocation().pathname);
    const page = "gamedev";
    const base = lang === "ru" ? `/${page}` : `/${lang}/${page}`;
    const copy = t(lang, page, "catalog");
    return (
        <div className="gamedev-page direction-page direction-page--gamedev">
            <HeroWrapper />
            <main className="direction-landing">
                <section id="projects" className="direction-projects" aria-labelledby="direction-projects-title">
                    <p className="software-eyebrow">{copy.eyebrow}</p>
                    <h2 id="direction-projects-title">{copy.title}</h2>
                    <p className="direction-projects__intro">{copy.description}</p>
                    <p className="direction-projects__note">{copy.note}</p>
                    <div className="direction-projects__grid">
                        {copy.items.map((item, i) => (
                            <article className="direction-project-card" key={i}>
                                <Link className="direction-project-card__link" to={`${base}/${item.slug}`}>
                                    <div className="direction-project-card__visual" aria-hidden="true"><i className={directionIcons[i]} /></div>
                                    <div className="direction-project-card__body">
                                        <span className="direction-project-card__status">{copy.status}</span>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
                <LandingSections lang={lang} page={page} />
            </main>
            <CursorFollower />
        </div>
    );
}
