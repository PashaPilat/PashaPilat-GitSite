import { nav } from "./navigate";
import { getElementPosition, getSectionPosition as getLayoutSectionPosition, getScrollDuration } from "./scrollGeometry.mjs";

export function getSectionPosition(element, offset = 0) {
    const divider = [...document.querySelectorAll("[data-scroll-section]")]
        .find(node => node.dataset.scrollSection === element.id);
    if (!divider) return getLayoutSectionPosition(element, offset);
    // Aim just below the divider, measuring its current responsive layout.
    let position = getElementPosition(divider) + divider.offsetHeight + 1;
    const hero = divider.closest(".skew-hero") ? document.querySelector(".hero-wrapper") : null;
    // Landing navigation ends below Hero, where it is fixed and out of flow.
    if (hero && !hero.classList.contains("hero-pinned")) position -= hero.offsetHeight;
    return Math.max(0, position);
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
        // Refresh scroll limits after responsive layout or accordion changes.
        window.lenis.resize();
        window.lenis.scrollTo(position, {
            duration: getScrollDuration(position - window.scrollY),
            easing: (t) => t,
            immediate: immediate || reducedMotion,
            onComplete: () => {
                const correctPosition = () => {
                    // Images, a resize or Hero pinning may have changed layout in flight.
                    const finalPosition = hash === "#top" ? 0 : getSectionPosition(target, offset ?? item?.offset ?? 0);
                    if (Math.abs(window.scrollY - finalPosition) > 1) {
                        window.lenis?.resize();
                        window.lenis?.scrollTo(finalPosition, { immediate: true });
                    }
                };
                correctPosition();
                // React updates Hero and responsive section heights after the scroll event.
                // Recheck after that layout has committed, including immediate navigation.
                if (window.requestAnimationFrame) window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(correctPosition);
                });
            },
        });
    } else {
        window.scrollTo({ top: position, behavior: immediate || reducedMotion ? "instant" : "smooth" });
    }
    return true;
}
