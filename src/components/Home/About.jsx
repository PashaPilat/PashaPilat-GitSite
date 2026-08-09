import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCheck } from "@fortawesome/free-solid-svg-icons";
import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";
import photo from "../../assets/images/photo_home.png";

import "../../styles/components/Home/About.scss";

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function About() {
  const sectionRef = useRef(null);

  const currentLang = getLangFromPath(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reveals = section.querySelectorAll(".about-reveal");

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const ariaLabel = t(currentLang, "about", "ariaLabel") || "About";
  const titleMain = t(currentLang, "about", "titleMain") || "";
  const titleGhost = t(currentLang, "about", "titleGhost") || "";
  const paragraphs = asArray(t(currentLang, "about", "paragraphs"));
  const note = t(currentLang, "about", "note") || "";
  const asideTitle = t(currentLang, "about", "asideTitle") || "";
  const highlights = asArray(t(currentLang, "about", "highlights"));
  const stats = asArray(t(currentLang, "about", "stats"));
  const cta = t(currentLang, "about", "cta") || "";

  return (
    <section
      ref={sectionRef}
      id="about"
      className="about"
      aria-label={ariaLabel}
    >
      <div className="about__skew-inner">
        <div className="about__photo-bg" aria-hidden="true">
          <img src={photo} alt="" loading="lazy" decoding="async" />
        </div>

        <div className="about__grid">
          <header className="about__header about-reveal">
            <p className="about__eyebrow">
              {t(currentLang, "about", "eyebrow")}
            </p>

            <h2 className="about__title">
              <span className="about__title-line">{titleMain}</span>
              {titleGhost && (
                <span className="about__title-line about__title-ghost">
                  {titleGhost}
                </span>
              )}
            </h2>
          </header>

          <div className="about__layout">
            <article
              className="about__article about-reveal"
              style={{ "--d": "120ms" }}
            >
              <div className="about__text">
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={index === 0 ? "about__lead" : undefined}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {note && (
                <blockquote className="about__note">
                  <p>{note}</p>
                </blockquote>
              )}
            </article>

            <aside
              className="about__aside about-reveal"
              style={{ "--d": "240ms" }}
            >
              <div className="about__aside-card">
                {asideTitle && (
                  <p className="about__aside-title">{asideTitle}</p>
                )}

                {highlights.length > 0 && (
                  <ul className="about__list">
                    {highlights.map((item, index) => (
                      <li
                        key={item.key || item.label || index}
                        className="about__item"
                      >
                        <span className="about__check" aria-hidden="true">
                          <FontAwesomeIcon icon={faCheck} />
                        </span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <a href="#contact" className="about__cta">
                  <span>{cta}</span>
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </a>
              </div>
            </aside>
          </div>

          {stats.length > 0 && (
            <dl
              className="about__stats about-reveal"
              style={{ "--d": "360ms" }}
            >
              {stats.map((stat, index) => (
                <div
                  key={stat.key || stat.label || index}
                  className="about__stat"
                >
                  <dt className="about__num">{stat.num}</dt>
                  <dd className="about__label">{stat.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="about__bottom-edge" aria-hidden="true" />
    </section>
  );
}