import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ContactForm from "./ContactForm";
import ContactsMarquee from "./ContactsMarquee";
import DirectContacts from "./DirectContacts";

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
  const sectionRef = useRef(null);
  const location = useLocation();
  const currentLang = getLangFromPath(location.pathname);

  useReveal(sectionRef);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const maxAngle = 6;
    const distance = 420;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const setOffset = (angleDeg, width) => {
      const offset = Math.tan((angleDeg * Math.PI) / 180) * width;
      section.style.setProperty("--skew-offset", `${offset}px`);
    };

    const update = () => {
      const rect = section.getBoundingClientRect();
      if (motion.matches) {
        setOffset(maxAngle, rect.width);
        return;
      }

      let progress = (window.innerHeight - rect.top) / distance;
      progress = Math.max(0, Math.min(progress, 1));
      setOffset(progress * maxAngle, rect.width);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    motion.addEventListener?.("change", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      motion.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="contact-section"
      aria-label={t(currentLang, "contact", "title")}
    >
      <div className="hr-line-white" />

      <div className="contact-wrapper">
        <div className="contact-head">
          <span className="contact-eyebrow" data-reveal>
            {t(currentLang, "contact", "eyebrow")}
          </span>
          <h2 className="contact-title" data-reveal style={{ "--d": "0.05s" }}>
            {t(currentLang, "contact", "title")}{" "}
            <span className="contact-title__ghost">
              {t(currentLang, "contact", "titleGhost")}
            </span>
          </h2>
          <p className="contact-subtitle" data-reveal style={{ "--d": "0.1s" }}>
            {t(currentLang, "contact", "subtitle")}
          </p>
        </div>

        <div data-reveal style={{ "--d": "0.15s" }}>
          <ContactForm currentLang={currentLang} />
        </div>
      </div>
      <ContactsMarquee />
      <DirectContacts />
    </section>
  );
}
