import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { availableLangs } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import "../styles/components/LanguageSwitcher.scss";

function LanguageSwitcher({burgerOpen = "close"}) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentLang = getLangFromPath(location.pathname);
    const [open, setOpen] = useState(false);

    const handleSelect = (lang) => {
        const path = location.pathname.replace(/^\/(ru|ua|en|de)/, "");
        if (lang === "ru") {
            navigate(path || "/");
        } else {
            navigate(`/${lang}${path}`);
        }
        setOpen(false);
    };

    return (
        <div className={`lang-switcher  ${burgerOpen}`}>
            <div className="current" onClick={() => setOpen(!open)}>
                <span className="lang-text">{currentLang.toUpperCase()}</span>
                <FontAwesomeIcon icon={faChevronDown} className="icon" />
            </div>
            {open && (
                <ul className="dropdown">
                    {availableLangs.map((lang) => (
                        <li
                            key={lang}
                            className={lang === currentLang ? "active" : ""}
                            onClick={() => handleSelect(lang)}
                        >
                            {lang.toUpperCase()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default LanguageSwitcher;
