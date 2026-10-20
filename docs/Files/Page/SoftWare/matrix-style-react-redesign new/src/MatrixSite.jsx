import React, { useEffect, useRef, useState } from "react";
import SoftwareMatrixBackground from "./components/SoftWare/SoftwareMatrixBackground";
import Navigation from "./components/SoftWare/Navigation";
import HeroWrapper from "./components/SoftWare/HeroWrapper";
import ProjectCatalog from "./components/SoftWare/ProjectCatalog";
import LandingSections from "./components/SoftWare/LandingSections";
import MatrixDivider from "./components/SoftWare/MatrixDivider";
import ProjectPage from "./components/SoftWare/ProjectPage";
import useReveal from "./components/SoftWare/useReveal";
import { copy } from "./data";
import "./styles/project.scss";

// Хеш-роутинг для превью:
//   #/project/<slug>          — обзор проекта
//   #/project/<slug>/roadmap  — дорожная карта
//   #<anchor> / пусто         — лендинг (+ скролл к якорю)
// В основном проекте: react-router, /software/projects/:slug и /software/projects/:slug/roadmap
function parseHash() {
    const h = window.location.hash;
    const m = h.match(/^#\/project\/([^/]+)(?:\/(roadmap))?/);
    if (m) return { page: "project", slug: m[1], tab: m[2] || "overview" };
    return { page: "landing", anchor: h.slice(1) };
}

export default function MatrixSite() {
    const root = useRef(null);
    const [route, setRoute] = useState(parseHash);
    const key = route.page === "project" ? `${route.slug}/${route.tab}` : "landing";

    useEffect(() => {
        const onHash = () => setRoute(parseHash());
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);

    useEffect(() => {
        if (route.page === "project") {
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
        }
        if (route.anchor) {
            requestAnimationFrame(() => document.getElementById(route.anchor)?.scrollIntoView({ block: "start" }));
        }
    }, [key, route.anchor]);

    useReveal(root, [key]);

    return (
        <div className="software-page" id="top" ref={root}>
            <SoftwareMatrixBackground className="software-matrix-background--fixed" />
            <Navigation />
            <main key={key}>
                {route.page === "project" ? (
                    <ProjectPage slug={route.slug} tab={route.tab} />
                ) : (
                    <>
                        <HeroWrapper />
                        <MatrixDivider index="01" label={copy.projects.label} />
                        <ProjectCatalog />
                        <MatrixDivider index="02" label={copy.philosophy.label} variant="heavy" />
                        <LandingSections />
                    </>
                )}
            </main>
            <footer className="software-footer">
                <div className="software-shell">
                    <p>{copy.footer.tagline}</p>
                    <p>{copy.footer.copyright}</p>
                    <p className="software-footer__sign">{copy.footer.sign}</p>
                </div>
            </footer>
        </div>
    );
}
