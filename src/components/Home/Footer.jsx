import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { nav } from "../../navigation/navigate";
import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import "../../styles/components/Home/Footer.scss";
import logo from "../../assets/images/logo 2.png";



function Footer() {
    const location = useLocation();
    const navigationItems = nav("", [], location.pathname);
    const currentLang = getLangFromPath(location.pathname);

    const footerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const footer = footerRef.current;

        if (!footer) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.18,
            }
        );

        observer.observe(footer);

        return () => observer.disconnect();
    }, []);

    return (
        <footer
            ref={footerRef}
            className={`site-footer ${isVisible ? "site-footer--visible" : ""}`}
        >
            <div className="site-footer__top-line" aria-hidden="true" />

            <div className="site-footer__container">
                <div className="site-footer__main">
                    <a
                        href="#top"
                        className="site-footer__brand"
                        aria-label={t(currentLang, "footer", "goToTop")}
                    >
                        <img
                            src={logo}
                            alt=""
                            className="site-footer__logo-img"
                        />

                        <span className="site-footer__logo-text">PashaPilat</span>
                    </a>

                    <p className="site-footer__tagline">
                        {t(currentLang, "footer", "tagline")}
                    </p>

                    <nav
                        className="site-footer__nav"
                        aria-label={t(currentLang, "footer", "navigation")}
                    >
                        <ul className="site-footer__nav-list">
                            {navigationItems.map((item) => (
                                <li key={item.key}>
                                    <a href={item.href}>
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="site-footer__bottom">
                    <p className="site-footer__copyright">{t(currentLang, "footer", "copyright")}</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
