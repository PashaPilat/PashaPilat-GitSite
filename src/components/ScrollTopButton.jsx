import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUp } from "@fortawesome/free-regular-svg-icons";
import { getTargetElement, getSectionPosition, scrollToSection } from "../navigation/scroll";
import { nav } from "../navigation/navigate";
import "../styles/components/ScrollTopButton.scss";

const RING_R = 47;
const RING_CIRC = 2 * Math.PI * RING_R;

const HOTSPOT = 240;

const NAV_ARC_START = 270;
const NAV_ARC_END_DESKTOP = 150;
const NAV_ARC_END_COMPACT = 160;

/*
  SVG единицы viewBox 100×100.
  Точка должна быть ~7–8px визуально,
  поэтому dash ~2–3, width ~7–8.
*/
const SHINE_DASH = 2.4;
const SHINE_STROKE_WIDTH = 7.2;

const getValue = (value, fallback) => {
  if (typeof value === "function") return value(fallback);
  return value ?? fallback;
};

const makeShortLabel = (label = "") => {
  const words = String(label)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "•";

  if (words.length === 1) {
    return [...words[0]][0]?.toUpperCase() || "•";
  }

  return words
    .slice(0, 2)
    .map((word) => [...word][0]?.toUpperCase() || "")
    .join("");
};

const normalizeNavigationItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const id = String(getValue(item.id, "") || "");
      const key = String(getValue(item.key, id || `nav-${index}`) || `nav-${index}`);
      const title = String(getValue(item.title, key) || key);
      const href = String(getValue(item.href, id ? `#${id}` : "") || "");
      const icon = getValue(item.icon, "");
      const offset = Number(getValue(item.offset, 0)) || 0;

      return {
        ...item,
        id,
        key,
        title,
        href,
        icon,
        offset,
        short: makeShortLabel(title),
      };
    })
    .filter((item) => item.href);
};

const getIconClassName = (iconClass) => {
  if (typeof iconClass !== "string" || !iconClass.trim()) return "";

  const normalized = iconClass
    .replace(/\bfa-solid\b/g, "fa-solid fas")
    .replace(/\bfa-regular\b/g, "fa-regular far")
    .replace(/\bfa-brands\b/g, "fa-brands fab");

  return `scroll-top__nav-icon ${normalized}`;
};

const getRadialPosition = (
  index,
  count,
  radius,
  startAngle = NAV_ARC_START,
  endAngle = NAV_ARC_END_DESKTOP
) => {
  const angle =
    count === 1
      ? (startAngle + endAngle) / 2
      : startAngle + ((endAngle - startAngle) / (count - 1)) * index;

  const rad = (angle * Math.PI) / 180;

  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
};

export default function ScrollTopButton({
  label,
  icon = faCircleUp,
  threshold = 480,
  autoHideDelay = 5000,
}) {
  const location = useLocation();

  const navigationItems = useMemo(() => {
    return normalizeNavigationItems(nav("", [], location.pathname));
  }, [location.pathname]);

  const [visible, setVisible] = useState(false);
  const [idle, setIdle] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navRadius, setNavRadius] = useState(92);

  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 640 || window.innerHeight <= 620;
  });

  const [passedKeys, setPassedKeys] = useState({});
  const [activeKey, setActiveKey] = useState("");
  const [programmaticScrolling, setProgrammaticScrolling] = useState(false);

  const rootRef = useRef(null);
  const barRef = useRef(null);
  const shineRef = useRef(null);

  const rafRef = useRef(0);
  const hideTimerRef = useRef(0);

  const visibleRef = useRef(false);
  const shownRef = useRef(false);
  const menuOpenRef = useRef(false);
  const isCoarsePointerRef = useRef(false);
  const inHotspotRef = useRef(false);

  const progressRef = useRef(0);

  const programmaticScrollingRef = useRef(false);
  const programmaticEndTimerRef = useRef(0);
  const programmaticMaxTimerRef = useRef(0);

  const shinePauseTimerRef = useRef(0);
  const shineRunTimerRef = useRef(0);

  const hasNavigation = navigationItems.length > 0;

  /*
    visible — страница ниже threshold.
    programmaticScrolling — активен программный smooth scroll.
  */
  const shown = (visible || programmaticScrolling) && !idle;
  const menuActive = shown && menuOpen && hasNavigation;

  const navArcEnd = isCompactViewport
    ? NAV_ARC_END_COMPACT
    : NAV_ARC_END_DESKTOP;

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");

    const update = () => {
      setIsCoarsePointer(query.matches);
      isCoarsePointerRef.current = query.matches;
    };

    update();

    query.addEventListener?.("change", update);

    return () => {
      query.removeEventListener?.("change", update);
    };
  }, []);

  const startHideTimer = () => {
    clearTimeout(hideTimerRef.current);

    if (isCoarsePointerRef.current || programmaticScrollingRef.current) {
      return;
    }

    hideTimerRef.current = setTimeout(() => {
      if (
        visibleRef.current &&
        !inHotspotRef.current &&
        !menuOpenRef.current &&
        !programmaticScrollingRef.current
      ) {
        setIdle(true);
      }
    }, autoHideDelay);
  };

  const openMenu = () => {
    if ((!visibleRef.current && !programmaticScrollingRef.current) || !hasNavigation) {
      return;
    }

    clearTimeout(hideTimerRef.current);
    setIdle(false);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);

    if (
      (visibleRef.current || programmaticScrollingRef.current) &&
      !inHotspotRef.current
    ) {
      startHideTimer();
    }
  };

  const handlePointerEnter = () => {
    if (isCoarsePointerRef.current) return;
    openMenu();
  };

  const handlePointerLeave = () => {
    if (isCoarsePointerRef.current) return;
    closeMenu();
  };

  useEffect(() => {
    const updateRadius = () => {
      const count = Math.max(navigationItems.length, 1);
      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;

      setIsCompactViewport(vw <= 640 || vh <= 620);

      const itemSize = Math.min(Math.max(vw * 0.07, 34), 42);

      const minByCount =
        count <= 1 ? 72 : ((count - 1) * (itemSize + 12)) / (Math.PI / 2);

      const maxSafe = Math.max(72, Math.min(vw - 74, vh - 88, 184));

      const calculated = Math.min(Math.max(82, minByCount), maxSafe);
      const nextRadius = Math.round(Math.max(72, calculated - 20));

      setNavRadius(nextRadius);
    };

    updateRadius();

    window.addEventListener("resize", updateRadius, { passive: true });

    return () => {
      window.removeEventListener("resize", updateRadius);
    };
  }, [navigationItems.length]);

  const finishProgrammaticScroll = () => {
    clearTimeout(programmaticEndTimerRef.current);
    clearTimeout(programmaticMaxTimerRef.current);

    if (!programmaticScrollingRef.current) return;

    programmaticScrollingRef.current = false;

    setProgrammaticScrolling(false);
    setMenuOpen(false);
    setIdle(true);
  };

  const scheduleProgrammaticScrollEnd = () => {
    if (!programmaticScrollingRef.current) return;

    clearTimeout(programmaticEndTimerRef.current);

    programmaticEndTimerRef.current = setTimeout(() => {
      finishProgrammaticScroll();
    }, 260);
  };

  const beginProgrammaticScroll = (maxDuration = 8000) => {
    clearTimeout(hideTimerRef.current);
    clearTimeout(programmaticEndTimerRef.current);
    clearTimeout(programmaticMaxTimerRef.current);

    programmaticScrollingRef.current = true;

    setProgrammaticScrolling(true);
    setIdle(false);

    programmaticMaxTimerRef.current = setTimeout(() => {
      finishProgrammaticScroll();
    }, maxDuration);
  };

  const updatePassedSections = () => {
    if (!navigationItems.length) return;

    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const nextPassed = {};
    let nextActive = "";

    navigationItems.forEach((item) => {
      if (!item.href?.startsWith("#")) return;

      const target = getTargetElement(item.href);
      if (!target) return;

      const offset = Number(item.offset ?? 0) || 0;

      const trigger = getSectionPosition(target, offset) - window.innerHeight * 0.12;

      if (y >= trigger) {
        nextPassed[item.key] = true;
        nextActive = item.key;
      }
    });

    setPassedKeys((prev) => {
      const previous = Object.keys(prev).join("|");
      const next = Object.keys(nextPassed).join("|");

      return previous === next ? prev : nextPassed;
    });

    setActiveKey((prev) => (prev === nextActive ? prev : nextActive));
  };

  useEffect(() => {
    if (!visible && !programmaticScrollingRef.current) {
      clearTimeout(hideTimerRef.current);
      setMenuOpen(false);
      setIdle(true);
    }
  }, [visible]);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const y = window.scrollY || doc.scrollTop || 0;
      const max = doc.scrollHeight - window.innerHeight;

      setVisible(y > threshold);

      const progress = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      progressRef.current = progress;

      if (barRef.current) {
        barRef.current.style.strokeDashoffset = (
          RING_CIRC * (1 - progress)
        ).toFixed(2);
      }

      updatePassedSections();
    };

    const onScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;

        update();
        scheduleProgrammaticScrollEnd();
      });
    };

    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);

      clearTimeout(programmaticEndTimerRef.current);
      clearTimeout(programmaticMaxTimerRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, navigationItems]);

  /*
    БЛИК — точка, ЯРКАЯ и ЧЁТКО ВИДИМАЯ.
    
    Алгоритм:
    1. pause 3–5s;
    2. сброс;
    3. пробег (opacity:1, яркий);
    4. soft-fade в конце пути;
    5. снова pause.
    
    stroke-width: SHINE_STROKE_WIDTH (~7.2) даёт видимую точку.
    stroke-dasharray: SHINE_DASH (~2.4) — короткая черта, 
      округлённая linecap даёт кружочек ≈7px.
    НЕТ ПРОЗРАЧНОСТИ во время пробега (opacity:1).
    Мощный белый+желтый glow.
  */
  useEffect(() => {
    let disposed = false;

    const clearTimers = () => {
      clearTimeout(shinePauseTimerRef.current);
      clearTimeout(shineRunTimerRef.current);
    };

    const resetShine = () => {
      const shine = shineRef.current;
      if (!shine) return;

      shine.style.transition = "none";
      shine.style.opacity = "0";
      
      /*
        Стартовая позиция: скрыта перед началом дуги прогресса.
        patternLength = circumference + gap.
        startPos = patternLength - dotRadius.
      */
      const patternLength = RING_CIRC + SHINE_DASH;
      const startPos = patternLength - SHINE_STROKE_WIDTH / 2;
      shine.style.strokeDashoffset = `${startPos}`;
    };

    const scheduleNext = () => {
      if (disposed) return;

      const pause = 3000 + Math.random() * 2000;

      shinePauseTimerRef.current = setTimeout(() => {
        runShine();
      }, pause);
    };

    const runShine = () => {
      if (disposed) return;

      const shine = shineRef.current;
      const progress = progressRef.current;

      if (!shine || !shownRef.current || progress <= 0.02) {
        resetShine();
        scheduleNext();
        return;
      }

      const progressLength = RING_CIRC * progress;

      /*
        Конечная позиция: точка не выходит за пределы заполненной части.
        
        finalPosStart = место где начинается видимая часть "черты".
        dashOffset для circle вычисляется от начала дуги.
        
        Конец пробега должен совпадать с концом progressLength.
      */
      const finalPosStart = Math.max(
        SHINE_STROKE_WIDTH / 2,
        progressLength - SHINE_STROKE_WIDTH / 2 - SHINE_DASH / 2
      );

      const patternLength = RING_CIRC + SHINE_DASH;

      const startOffset = patternLength - SHINE_STROKE_WIDTH / 2;
      const endOffset = patternLength - finalPosStart;

      /*
        Длительность: 100% → 1.2s, пропорционально прогрессу.
      */
      const runMs = Math.max(160, 1200 * progress);

      /*
        Сброс перед стартом анимации.
        Critical: force reflow.
      */
      shine.style.transition = "none";
      shine.style.opacity = "0";
      shine.style.strokeDashoffset = `${startOffset}`;

      shine.getBoundingClientRect(); // force reflow

      requestAnimationFrame(() => {
        if (disposed) return;

        /*
          ГЛАВНОЕ ИСПРАВЛЕНИЕ:
          opacity: 1 — полный, без прозрачности!
          Как в первом варианте, только форма точечная.
        */
        shine.style.transition = `
          stroke-dashoffset ${runMs}ms cubic-bezier(0.33, 0, 0.2, 1),
          opacity 140ms ease-out
        `;

        shine.style.opacity = "1"; // ← ЗДЕСЬ: 1 (не 0.88, не 0.58!)
        shine.style.strokeDashoffset = `${endOffset}`;

        /*
          В конце пробега мягко гасим, как в первом варианте.
        */
        shineRunTimerRef.current = setTimeout(() => {
          if (disposed) return;

          shine.style.transition = "opacity 200ms ease-in";
          shine.style.opacity = "0";

          scheduleNext();
        }, runMs + 60);
      });
    };

    resetShine();
    scheduleNext();

    return () => {
      disposed = true;
      clearTimers();
      resetShine();
    };
  }, []);

  useEffect(() => {
    const isInHotspot = (x, y) =>
      x > window.innerWidth - HOTSPOT &&
      y > window.innerHeight - HOTSPOT;

    const onMouseMove = (event) => {
      if (isCoarsePointerRef.current) return;

      const inZone = isInHotspot(event.clientX, event.clientY);
      const wasInZone = inHotspotRef.current;

      inHotspotRef.current = inZone;

      if (!visibleRef.current) return;

      if (inZone && !wasInZone) {
        clearTimeout(hideTimerRef.current);
        setIdle(false);
      }

      if (
        !inZone &&
        wasInZone &&
        !menuOpenRef.current &&
        !programmaticScrollingRef.current
      ) {
        startHideTimer();
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoHideDelay]);

  useEffect(() => {
    const isInHotspot = (x, y) =>
      x > window.innerWidth - HOTSPOT &&
      y > window.innerHeight - HOTSPOT;

    const onPointerDown = (event) => {
      if (!isCoarsePointerRef.current) return;
      if (!visibleRef.current && !programmaticScrollingRef.current) return;

      if (rootRef.current?.contains(event.target)) return;

      const inZone = isInHotspot(event.clientX, event.clientY);
      if (!inZone) return;

      clearTimeout(hideTimerRef.current);

      setIdle((previous) => !previous);
      setMenuOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const scrollToTop = () => {
    clearTimeout(hideTimerRef.current);
    setMenuOpen(false);

    beginProgrammaticScroll(9000);

    scrollToSection("#top");
  };

  const handleMainButtonClick = (event) => {
    if (isCoarsePointer && hasNavigation && !menuOpen) {
      event.preventDefault();
      openMenu();
      return;
    }

    scrollToTop();
  };

  const handleNavClick = (event, item) => {
    /*
      Если это текущая секция — блокируем клик.
      Если user захочет "обновить" страницу — пусть тапает elsewhere.
    */
    if (item.key === activeKey) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (item.href?.startsWith("#")) {
      // SmoothScroll handles the anchor and URL with the shared section offset.
      beginProgrammaticScroll(8000);
    }

    closeMenu();
  };

  const handleRootBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeMenu();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);

      event.currentTarget
        .querySelector(".scroll-top__btn")
        ?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={[
        "scroll-top",
        shown ? "is-visible" : "",
        menuActive ? "is-menu-open" : "",
        isCoarsePointer ? "is-touch" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={() => {
        // Touch focuses before click. Opening here makes that same tap look
        // like a second tap and sends the user to the top instead of the menu.
        if (!isCoarsePointerRef.current) openMenu();
      }}
      onBlur={handleRootBlur}
      onKeyDown={handleKeyDown}
    >
      <span className="scroll-top__pulse" aria-hidden />
      <span className="scroll-top__glow" aria-hidden />

      <div className="scroll-top__ring" aria-hidden>
        <svg viewBox="0 0 100 100">
          <circle
            className="scroll-top__ring-track"
            cx="50"
            cy="50"
            r={RING_R}
          />

          <circle
            className="scroll-top__ring-bar"
            cx="50"
            cy="50"
            r={RING_R}
            ref={barRef}
          />

          <circle
            className="scroll-top__ring-shine"
            cx="50"
            cy="50"
            r={RING_R}
            ref={shineRef}
          />
        </svg>
      </div>

      <button
        type="button"
        className="scroll-top__btn"
        onClick={handleMainButtonClick}
        aria-label={label || "Scroll to top"}
        aria-haspopup={hasNavigation ? "menu" : undefined}
        aria-expanded={hasNavigation ? menuActive : undefined}
      >
        <FontAwesomeIcon icon={icon} className="scroll-top__icon" />
      </button>

      {label && (
        <span className="scroll-top__label" aria-hidden>
          {label}
        </span>
      )}

      {hasNavigation && (
        <nav
          className="scroll-top__nav"
          aria-label="Быстрая навигация"
          aria-hidden={!menuActive}
          style={{ "--st-nav-radius": `${navRadius}px` }}
        >
          <ul className="scroll-top__nav-list" role="menu">
            {navigationItems.map((item, index) => {
              const { x, y } = getRadialPosition(
                index,
                navigationItems.length,
                navRadius,
                NAV_ARC_START,
                navArcEnd
              );

              const iconClassName = getIconClassName(item.icon);

              const isCurrent = item.key === activeKey;

              return (
                <li
                  className={[
                    "scroll-top__nav-item",
                    passedKeys[item.key] ? "is-passed" : "",
                    isCurrent ? "is-active is-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="none"
                  key={item.key || item.id || item.href}
                  style={{
                    "--st-nav-x": `${x.toFixed(1)}px`,
                    "--st-nav-y": `${y.toFixed(1)}px`,
                  }}
                >
                  <a
                    className={[
                      "scroll-top__nav-link",
                      isCurrent ? "is-current-link" : "",
                    ]
                      .join(" ")}
                    href={item.href}
                    role="menuitem"
                    aria-label={item.title}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-disabled={isCurrent ? "true" : undefined}

                    /*
                      Текущая секция не доступна через tab/click.
                      Она просто показывает "вы здесь".
                    */
                    tabIndex={menuActive && !isCurrent ? 0 : -1}

                    onClick={(event) => handleNavClick(event, item)}
                  >
                    {iconClassName ? (
                      <i className={iconClassName} aria-hidden />
                    ) : (
                      <span className="scroll-top__nav-fallback" aria-hidden>
                        {item.short}
                      </span>
                    )}

                    <span className="scroll-top__nav-caption" aria-hidden>
                      {item.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
