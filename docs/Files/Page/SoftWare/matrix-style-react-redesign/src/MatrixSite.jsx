import React, { useRef } from "react";
import SoftwareMatrixBackground from "./components/SoftWare/SoftwareMatrixBackground";
import Navigation from "./components/SoftWare/Navigation";
import HeroWrapper from "./components/SoftWare/HeroWrapper";
import ProjectCatalog from "./components/SoftWare/ProjectCatalog";
import LandingSections from "./components/SoftWare/LandingSections";
import MatrixDivider from "./components/SoftWare/MatrixDivider";
import useReveal from "./components/SoftWare/useReveal";
import { copy } from "./data";

export default function MatrixSite() {
    const root = useRef(null);
    useReveal(root, []);

    return (
        <div className="software-page" id="top" ref={root}>
            <SoftwareMatrixBackground className="software-matrix-background--fixed" />
            <Navigation />
            <main>
                <HeroWrapper />
                <MatrixDivider index="01" label={copy.projects.label} />
                <ProjectCatalog />
                {/* Философия — усиленный разделитель: зона визуально изолирована */}
                <MatrixDivider index="02" label={copy.philosophy.label} variant="heavy" />
                <LandingSections />
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
