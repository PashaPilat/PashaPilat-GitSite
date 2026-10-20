import React from "react";
import { useLocation } from "react-router-dom";
import SoftWareHero from "../../components/SoftWare/HeroWrapper";
import ProjectCatalog from "../../components/SoftWare/ProjectCatalog";
import MatrixDivider from "../../components/SoftWare/MatrixDivider";
import LandingSections from "../../components/SoftWare/LandingSections";
import CursorFollower from "../../components/CursorFollower";
import { getLangFromPath } from "../../utils/getLangFromPath";
import { t } from "../../i18n";
import "../../styles/components/SoftWare/LandingSections.scss";

export default function Software() {
    const lang = getLangFromPath(useLocation().pathname);
    return <div className="software-category">
        <SoftWareHero />
        <main className="software-landing">
            <MatrixDivider index="01" label={t(lang, "software", "catalog", "max_title")} />
            <ProjectCatalog lang={lang} embedded />
            <MatrixDivider index="02" label={t(lang, "software", "philosophy", "max_title")} variant="heavy" />
            <LandingSections lang={lang} />
        </main>
        <CursorFollower />
    </div>;
}
