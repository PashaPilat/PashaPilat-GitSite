import React, { useEffect, useRef } from "react";

export default function SceneManager() {
    const placeholder = useRef(null);

    useEffect(() => {
        const hero = document.querySelector(".hero-wrapper");
        const main = document.querySelector(".skew-hero");

        if (!hero || !main) return;
        let heroHeight = hero.offsetHeight;
        const onScroll = () => {
            const heroBottom = heroHeight - window.innerHeight;
            // Hero дошел до конца
            if (window.scrollY >= heroBottom) {
                hero.classList.add("hero-pinned");
            } else {
                hero.classList.remove("hero-pinned");
            }
            // Main полностью перекрыл Hero
            // if (window.scrollY >= heroHeight) {
            //     hero.classList.remove("hero-pinned");
            // }
        };
        const measure = () => {
            heroHeight = hero.offsetHeight;
            placeholder.current.style.height = `${heroHeight}px`;
            onScroll();
        };
        const observer = new ResizeObserver(measure);
        observer.observe(hero);
        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", onScroll);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", onScroll);
            hero.classList.remove("hero-pinned");
        };
    }, []);

    return <div ref={placeholder} className="hero-placeholder"></div>;
}
