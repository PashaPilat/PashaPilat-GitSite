import React, { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      easing: t => 1 - Math.pow(1 - t, 5)
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // глобально для вызовов из навигации и консоли
    window.lenis = lenis;
    window.scrollTop = (duration = 2.0) => {
      lenis.scrollTo(0, { duration, easing: (t) => t });
    };

    return () => {
      lenis.destroy();
    };
  }, []);
}
