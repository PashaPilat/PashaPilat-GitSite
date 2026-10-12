import React from "react";
import { t } from "../i18n";
import LandingSections from "./SoftWare/LandingSections";
import "../styles/pages/direction.scss";

export default function DirectionLanding({ page, lang }) {
    const copy = t(lang, page, "catalog");
    return <main className="direction-landing">
        <section id="projects" className="direction-projects" aria-labelledby="direction-projects-title">
            <p className="software-eyebrow">{copy.eyebrow}</p><h2 id="direction-projects-title">{copy.title}</h2><p className="direction-projects__intro">{copy.description}</p>
            <p className="direction-projects__note">{copy.note}</p>
            <div className="direction-projects__grid">{copy.items.map((item, i) => <article className="direction-project-card" key={i}>
                <div className="direction-project-card__visual" aria-hidden="true"><i className={["fa-solid fa-cubes", "fa-solid fa-gears", "fa-solid fa-flask"][i]} /></div>
                <div className="direction-project-card__body"><span className="direction-project-card__status">{copy.status}</span><h3>{item.title}</h3><p>{item.description}</p></div>
            </article>)}</div>
        </section>
        <LandingSections lang={lang} page={page} />
    </main>;
}
