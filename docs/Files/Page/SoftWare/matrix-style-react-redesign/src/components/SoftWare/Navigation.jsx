import React, { useEffect, useState } from "react";
import { copy } from "../../data";

export default function Navigation() {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <header className={`software-nav${scrolled ? " software-nav--scrolled" : ""}`}>
            <div className="software-nav__inner">
                <a className="software-nav__brand" href="#top" aria-label="PlatP Software — наверх">
                    {copy.nav.brand}
                    <span className="mx-cursor" aria-hidden="true" />
                </a>
                <nav className="software-nav__links" aria-label="Основная навигация">
                    {copy.nav.links.map((l) => (
                        <a key={l.href} href={l.href}>{l.label}</a>
                    ))}
                </nav>
                <span className="software-nav__lang" aria-hidden="true">RU ▾</span>
            </div>
        </header>
    );
}
