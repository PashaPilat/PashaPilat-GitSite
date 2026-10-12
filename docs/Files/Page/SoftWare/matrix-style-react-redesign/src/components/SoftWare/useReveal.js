import { useEffect } from "react";

// Появление блоков: добавляет .is-in всем .software-reveal внутри root.
// Логика повторяет вашу из LandingSections — просто вынесена в хук.
export default function useReveal(rootRef, deps = []) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return undefined;
        const elements = root.querySelectorAll(".software-reveal");
        if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            elements.forEach((el) => el.classList.add("is-in"));
            return undefined;
        }
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                observer.unobserve(entry.target);
            }
        }), { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
