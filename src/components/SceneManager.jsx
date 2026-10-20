import React, { useEffect, useRef } from "react";

export default function SceneManager() {
    const placeholder = useRef(null);

    useEffect(() => {
        const hero = document.querySelector(".hero-wrapper");
        const main = document.querySelector(".skew-hero");

        const placeholderElement = placeholder.current;
        if (!hero || !main || !placeholderElement) return;
        let disposed = false;
        let heroHeight = hero.offsetHeight;
        const onScroll = () => {
            if (disposed || !placeholder.current) return;
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
        let raf = 0;
        const measure = () => {
            if (disposed || !placeholder.current) return;
            heroHeight = hero.offsetHeight;
            placeholderElement.style.height = `${heroHeight}px`;
            onScroll();
        };
        const debouncedMeasure = () => {
            if (typeof requestAnimationFrame !== "undefined") {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(measure);
            } else {
                measure();
            }
        };
        const observer = new ResizeObserver(debouncedMeasure);
        observer.observe(hero);
        measure();
        window.addEventListener("resize", debouncedMeasure);
        window.addEventListener("scroll", onScroll);
        return () => {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener("resize", debouncedMeasure);
            window.removeEventListener("scroll", onScroll);
            hero.classList.remove("hero-pinned");
        };
    }, []);

    return <div ref={placeholder} className="hero-placeholder"></div>;
}
