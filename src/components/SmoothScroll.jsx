import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { getTargetElement, scrollToSection } from "../navigation/scroll";
import { getSamePageHash } from "../navigation/scrollGeometry.mjs";

export default function SmoothScroll() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.4, smoothWheel: true, wheelMultiplier: 0.9,
            touchMultiplier: 1.2, easing: (t) => 1 - Math.pow(1 - t, 5),
        });
        let frame;
        const raf = (time) => {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
        window.lenis = lenis;
        return () => {
            cancelAnimationFrame(frame);
            delete window.lenis;
            lenis.destroy();
        };
    }, []);

    // All same-page anchors share section offsets, including ordinary links.
    useEffect(() => {
        const onClick = (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
                event.metaKey || event.shiftKey || event.altKey) return;
            const anchor = event.target.closest?.("a[href]");
            if (!anchor) return;
            const hash = getSamePageHash(anchor, window.location.href);
            if (!hash || (hash !== "#top" && !getTargetElement(hash))) return;
            event.preventDefault();
            if (location.hash === hash) scrollToSection(hash);
            else navigate({ pathname: location.pathname, search: location.search, hash });
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, [location.pathname, location.search, location.hash, navigate]);

    useEffect(() => {
        if (!location.hash) return;
        const frame = requestAnimationFrame(() => scrollToSection(location.hash));
        // Initial deep links need a second measurement once images have loaded.
        const onLoad = () => scrollToSection(location.hash, { immediate: true });
        const cancelLoad = () => window.removeEventListener("load", onLoad);
        if (document.readyState !== "complete") window.addEventListener("load", onLoad, { once: true });
        window.addEventListener("wheel", cancelLoad, { passive: true, once: true });
        window.addEventListener("pointerdown", cancelLoad, { once: true });
        window.addEventListener("keydown", cancelLoad, { once: true });
        return () => {
            cancelAnimationFrame(frame);
            cancelLoad();
            window.removeEventListener("wheel", cancelLoad);
            window.removeEventListener("pointerdown", cancelLoad);
            window.removeEventListener("keydown", cancelLoad);
        };
    }, [location.pathname, location.hash, location.key]);

    return null;
}
