import React from "react";
import { useLocation } from "react-router-dom";
import Footer from "./Home/Footer";
import ScrollTopButton from "./ScrollTopButton";
import { getLangFromPath } from "../utils/getLangFromPath";
import { modeIndexFromPath, modes } from "../navigation/modes.mjs";
import { t } from "../i18n";
import "../styles/components/PageChrome.scss";

export default function PageChrome() {
    const { pathname } = useLocation();
    const lang = getLangFromPath(pathname);
    const mode = modes[modeIndexFromPath(pathname)].id;
    const isProject = /\/projects\/[^/]+\/?$/.test(pathname);
    return <div className={`page-chrome page-chrome--${mode}`}>
        <Footer tagline={mode !== "web" ? t(lang, mode, "footerTagline") : undefined} />
        {!isProject && <ScrollTopButton label={t(lang, "common", "backToTop")} threshold={480} />}
    </div>;
}
