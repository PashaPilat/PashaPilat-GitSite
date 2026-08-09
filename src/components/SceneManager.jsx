import React, { useEffect, useRef } from "react";

export default function SceneManager() {
    const placeholder = useRef(null);

    useEffect(() => {
        const hero = document.querySelector(".hero-wrapper");
        const main = document.querySelector(".skew-hero");

        if (!hero || !main) return;
        const heroHeight = hero.offsetHeight;
        placeholder.current.style.height = `${heroHeight}px`;
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
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); };
    }, []);

    return <div ref={placeholder} className="hero-placeholder"></div>;
}