import { nav } from "./navigate";
import { getSectionPosition as getLayoutSectionPosition, getScrollDuration } from "./scrollGeometry.mjs";

export function getSectionPosition(element, offset = 0) {
    // Offsets are calibrated against the layout before SceneManager pins Hero.
    // Pinning removes Hero from the flow, moving every section in main upward.
    // Use the same reference position whether navigation starts above or below Hero.
    const pinnedHero = element.closest(".skew-hero")
        ? document.querySelector(".hero-wrapper.hero-pinned")
        : null;
    return getLayoutSectionPosition(element, (Number(offset) || 0) + (pinnedHero?.offsetHeight || 0));
}

export function getTargetElement(hash) {
    if (!hash?.startsWith("#")) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return null; }
}

export function scrollToSection(hash, { offset, immediate = false } = {}) {
    const target = getTargetElement(hash);
    if (hash !== "#top" && !target) return false;
    const item = nav().find((entry) => entry.href === hash);
    const position = hash === "#top" ? 0 : getSectionPosition(target, offset ?? item?.offset ?? 0);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.lenis) {
        window.lenis.scrollTo(position, {
            duration: getScrollDuration(position - window.scrollY),
            easing: (t) => t,
            immediate: immediate || reducedMotion,
        });
    } else {
        window.scrollTo({ top: position, behavior: immediate || reducedMotion ? "instant" : "smooth" });
    }
    return true;
}
