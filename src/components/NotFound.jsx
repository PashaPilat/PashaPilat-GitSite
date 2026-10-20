import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getLangFromPath } from "../utils/getLangFromPath";
import { t } from "../i18n";
import "../styles/components/NotFound.scss";

export default function NotFound() {
    const lang = getLangFromPath(useLocation().pathname);
    const home = lang === "ru" ? "/" : `/${lang}`;
    const copy = t(lang, "common", "notFound");
    return (
        <div className="not-found">
            <h1>404</h1>
            <p>{copy.message}</p>
            <Link to={home}>{copy.back}</Link>
        </div>
    );
}
