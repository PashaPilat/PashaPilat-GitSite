import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ContactForm from "./ContactForm";

import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import "../../styles/components/Home/ContactSection.scss";

function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref]);
}

export default function ContactSection() {
  const [angle, setAngle] = useState(0);
  const sectionRef = useRef(null);
  const location = useLocation();
  const currentLang = getLangFromPath(location.pathname);

  useReveal(sectionRef);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const sectionHeight = section.offsetHeight;
      const start = sectionHeight - window.innerHeight;
      const distance = 220;

      let progress = (window.scrollY - start) / distance;
      progress = Math.max(0, Math.min(progress, 1));
      setAngle(progress * 6);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="contact-section"
      aria-label={t(currentLang, "contact","title")}
      style={{ "--skew-angle": `${angle}deg` }}
    >
      <div className="hr-line" />

      <div className="contact-wrapper">
        <div className="contact-head">
          <span className="contact-eyebrow" data-reveal>
            {t(currentLang, "contact","eyebrow")}
          </span>
          <h2 className="contact-title" data-reveal style={{ "--d": "0.05s" }}>
            {t(currentLang, "contact","title")}{" "}
            <span className="contact-title__ghost">
              {t(currentLang, "contact","titleGhost")}
            </span>
          </h2>
          <p className="contact-subtitle" data-reveal style={{ "--d": "0.1s" }}>
            {t(currentLang, "contact","subtitle")}
          </p>
        </div>

        <div data-reveal style={{ "--d": "0.15s" }}>
          <ContactForm currentLang={currentLang} />
        </div>
      </div>
    </section>
  );
}