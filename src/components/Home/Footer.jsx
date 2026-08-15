import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import "../../styles/components/Home/Footer.scss";
import logo from "../../assets/images/logo 2.png";

const navigationItems = ["projects", "services", "about", "contact"];

function Footer() {
    const location = useLocation();
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

    const scrollToSection = (event, targetId) => {
        const target = document.querySelector(targetId);

        // Если секции на странице нет — оставляем обычное поведение ссылки.
        if (!target) return;

        event.preventDefault();

        if (window.lenis) {
            window.lenis.scrollTo(target, {
                duration: 1.5,
                offset: -90,
            });

            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const scrollToTop = (event) => {
        event.preventDefault();

        if (window.lenis) {
            window.lenis.scrollTo(0, {
                duration: 1.6,
            });

            return;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

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
                        onClick={scrollToTop}
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
                                <li key={item}>
                                    <a href={`#${item}`} onClick={(event) => scrollToSection(event, `#${item}`)} >
                                        {t(currentLang, "nav", item)}
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