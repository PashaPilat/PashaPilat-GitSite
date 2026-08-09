import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUp } from "@fortawesome/free-regular-svg-icons";
import "../styles/components/ScrollTopButton.scss";

/* длина кольца прогресса (r = 47 внутри viewBox 100) */
const RING_R = 47;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 295.31

/* зона возврата кнопки: квадрат 240×240px в правом нижнем углу */
const HOTSPOT = 240;

/**
 * Кнопка «прокрутить вверх».
 *
 * Поведение:
 *  - после 480px скролла показывается (плавный подъём, 1.5s);
 *  - через autoHideDelay (5s) бездействия прячется (плавно вниз, 1.5s);
 *  - курсор в правом нижнем углу — возвращает кнопку (1.5s);
 *  - любой скролл сбрасывает таймер автопрятания;
 *  - прокрутка выше 480px — кнопка прячется окончательно.
 *
 * Пропсы:
 *  - label           — текст тултипа (например "Наверх")
 *  - icon            — иконка FontAwesome, по умолчанию fa-regular fa-circle-up
 *  - threshold       — через сколько px скролла показывать (по умолчанию 480)
 *  - autoHideDelay   — через сколько мс прятать при бездействии (по умолчанию 5000)
 */
export default function ScrollTopButton({
  label,
  icon = faCircleUp,
  threshold = 480,
  autoHideDelay = 5000,
}) {
  const [visible, setVisible] = useState(false); // порог скролла пройден
  const [idle, setIdle] = useState(true);        // скрыта из-за бездействия
  const barRef = useRef(null);
  const rafRef = useRef(0);
  const hideTimerRef = useRef(0);
  const inHotspotRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const startHideTimer = () => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (visibleRef.current && !inHotspotRef.current) setIdle(true);
    }, autoHideDelay);
  };

  /* показ/скрытие при пересечении порога скролла */
  useEffect(() => {
    if (!visible) {
      clearTimeout(hideTimerRef.current);
      setIdle(true);
      return;
    }
    // только появилась — показываем и запускаем таймер автопрятания
    setIdle(false);
    if (!inHotspotRef.current) startHideTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /* прогресс скролла + порог видимости */
  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const y = window.scrollY || doc.scrollTop || 0;
      const max = doc.scrollHeight - window.innerHeight;

      setVisible(y > threshold);

      const progress = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      if (barRef.current) {
        barRef.current.style.strokeDashoffset = (RING_CIRC * (1 - progress)).toFixed(2);
      }
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        update();
        // пользователь активно скроллит — возвращаем кнопку и сбрасываем таймер
        // if (visibleRef.current && !inHotspotRef.current) {
        //   setIdle(false);
        //   startHideTimer();
        // }
      });
    };

    update(); // на случай перезагрузки страницы в середине скролла
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold]);

  /* возврат кнопки, когда курсор заходит в правый нижний угол */
  useEffect(() => {
    const isInHotspot = (x, y) =>
      x > window.innerWidth - HOTSPOT && y > window.innerHeight - HOTSPOT;

    const onMove = (e) => {
      const inZone = isInHotspot(e.clientX, e.clientY);
      const wasIn = inHotspotRef.current;
      inHotspotRef.current = inZone;

      if (!visibleRef.current) return;

      if (inZone && !wasIn) {
        // курсор вошёл в зону кнопки — показать
        clearTimeout(hideTimerRef.current);
        setIdle(false);
      } else if (!inZone && wasIn) {
        // курсор покинул зону — снова таймер автопрятания
        startHideTimer();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoHideDelay]);

  const scrollToTop = () => {
    clearTimeout(hideTimerRef.current);
    // если на сайте SmoothScroll (Lenis) — используем его, иначе нативный скролл
    const lenis = window.lenis || window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(0, { duration: 6 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const shown = visible && !idle;

  return (
    <div className={`scroll-top${shown ? " is-visible" : ""}`}>
      {/* сонар-пульс (круговой) */}
      <span className="scroll-top__pulse" aria-hidden />

      {/* ореол — чисто круговое свечение радиальным градиентом */}
      <span className="scroll-top__glow" aria-hidden />

      {/* кольцо прогресса прокрутки */}
      <div className="scroll-top__ring" aria-hidden>
        <svg viewBox="0 0 100 100">
          <circle className="scroll-top__ring-track" cx="50" cy="50" r={RING_R} />
          <circle className="scroll-top__ring-bar" cx="50" cy="50" r={RING_R} ref={barRef} />
        </svg>
      </div>

      <button
        type="button"
        className="scroll-top__btn"
        onClick={scrollToTop}
        aria-label={label || "Scroll to top"}
      >
        <FontAwesomeIcon icon={icon} className="scroll-top__icon" />
      </button>

      {label && (
        <span className="scroll-top__label" aria-hidden>
          {label}
        </span>
      )}
    </div>
  );
}
