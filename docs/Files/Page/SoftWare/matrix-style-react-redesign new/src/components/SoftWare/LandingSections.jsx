import React, { useEffect, useRef, useState } from "react";
import Corners from "./Corners";
import MatrixDivider from "./MatrixDivider";
import Scramble from "./Scramble";
import SoftwareContactForm from "./SoftwareContactForm";
import { copy } from "../../data";

function Paragraph({ children }) {
    // Сохраняем инлайн-выделение **...** из исходника без рендера HTML.
    return <p>{children.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</p>;
}

/* ------------------------------------------------------------------ */
/*  Философия — изолированная «терминальная» зона со своим фоном,      */
/*  рамкой-консолью, sticky-оглавлением и прогрессом чтения.           */
/* ------------------------------------------------------------------ */

function Philosophy() {
    const p = copy.philosophy;
    const frameRef = useRef(null);
    const chaptersRef = useRef([]);
    const [active, setActive] = useState(0);
    const [progress, setProgress] = useState(0);

    // scrollspy по главам
    useEffect(() => {
        const els = chaptersRef.current.filter(Boolean);
        if (!("IntersectionObserver" in window)) return undefined;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const i = els.indexOf(entry.target);
                    if (i > -1) setActive(i);
                }
            });
        }, { rootMargin: "-28% 0px -62% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    // прогресс чтения
    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const el = frameRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                const total = r.height - window.innerHeight;
                const v = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
                setProgress(v);
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    }, []);

    return (
        <section id="philosophy" className="software-philosophy" aria-labelledby="software-philosophy-title">
            <span className="software-philosophy__watermark" aria-hidden="true">{p.label}</span>
            <span className="software-philosophy__rail software-philosophy__rail--l" aria-hidden="true" />
            <span className="software-philosophy__rail software-philosophy__rail--r" aria-hidden="true" />
            <div className="software-shell">
                <header className="software-landing__heading software-reveal">
                    <p className="software-eyebrow">{p.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                    <h2 id="software-philosophy-title"><Scramble text={p.title} duration={1050} /></h2>
                </header>

                <div className="software-philosophy__frame software-reveal" style={{ "--d": "120ms" }} ref={frameRef}>
                    <span className="software-philosophy__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
                    <div className="software-philosophy__termhead" aria-hidden="true">
                        <i className="software-card__dot" />
                        <i className="software-card__dot" />
                        <i className="software-card__dot software-card__dot--g" />
                        <span className="software-philosophy__termtitle">
                            <b>{p.termUser}</b>:{p.termPath} — reading
                        </span>
                        <Corners />
                    </div>

                    <div className="software-philosophy__layout">
                        <nav className="software-philosophy__toc" aria-label={p.contents}>
                            <p>{p.contents}</p>
                            <ol>
                                {p.sections.map((section, i) => (
                                    <li key={i}>
                                        <a href={`#philosophy-${i + 1}`} className={active === i ? "is-active" : ""}>
                                            <span className="software-philosophy__tocnum">{String(i + 1).padStart(2, "0")}</span>
                                            <span className="software-philosophy__toctext">{section.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <article className="software-philosophy__article">
                            <div className="software-philosophy__intro">
                                {p.intro.map((text, i) => <Paragraph key={i}>{text}</Paragraph>)}
                            </div>
                            {p.sections.map((section, i) => (
                                <section
                                    id={`philosophy-${i + 1}`}
                                    className="software-philosophy__chapter"
                                    key={i}
                                    aria-labelledby={`philosophy-title-${i + 1}`}
                                    ref={(el) => { chaptersRef.current[i] = el; }}
                                >
                                    <p className="software-eyebrow software-eyebrow--plain" aria-hidden="true">§ {String(i + 1).padStart(2, "0")}</p>
                                    <h3 id={`philosophy-title-${i + 1}`}>{section.title}</h3>
                                    {section.paragraphs.map((text, j) => <Paragraph key={j}>{text}</Paragraph>)}
                                </section>
                            ))}
                        </article>
                    </div>

                    <div className="software-philosophy__termfoot" aria-hidden="true">
                        <span>{p.termFooterA}</span>
                        <span>scroll ▸ {String(Math.round(progress * 100)).padStart(2, "0")}%</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  FAQ — терминальный аккордеон                                       */
/* ------------------------------------------------------------------ */

function Faq() {
    const f = copy.faq;
    const [open, setOpen] = useState(0);
    return (
        <section id="faq" className="software-faq" aria-labelledby="software-faq-title">
            <div className="software-shell">
                <header className="software-landing__heading software-reveal">
                    <p className="software-eyebrow">{f.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                    <h2 id="software-faq-title"><Scramble text={f.title} /></h2>
                </header>
                <div className="software-faq__list software-reveal" style={{ "--d": "100ms" }}>
                    {f.items.map((item, i) => {
                        const isOpen = open === i;
                        return (
                            <div className={`software-faq__item${isOpen ? " is-open" : ""}`} key={`${i}`}>
                                <button
                                    type="button"
                                    className="software-faq__q"
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-a-${i}`}
                                    onClick={() => setOpen(isOpen ? -1 : i)}
                                >
                                    <span className="software-faq__idx" aria-hidden="true">Q{String(i + 1).padStart(2, "0")}</span>
                                    <span className="software-faq__text">{item.question}</span>
                                    <span className="software-faq__mark" aria-hidden="true">+</span>
                                </button>
                                <div className="software-faq__a" id={`faq-a-${i}`}>
                                    <div><p>{item.answer}</p></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Контакт — фон и переход оформлены, структура не меняется           */
/* ------------------------------------------------------------------ */

function Contact() {
    const c = copy.contact;
    return (
        <section id="contact" className="software-contact" aria-labelledby="software-contact-title">
            <span className="software-contact__glow" aria-hidden="true" />
            <div className="software-shell">
                <div className="software-contact__grid">
                    <div className="software-contact__info software-reveal">
                        <p className="software-eyebrow">{c.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                        <h2 id="software-contact-title"><Scramble text={c.title} /></h2>
                        <p className="software-contact__desc">{c.description}</p>
                        <a className="software-btn software-btn--primary" href="#contact-form">{c.button}</a>
                        <ul className="software-contact__channels">
                            {c.channels.map((ch) => (
                                <li key={ch.label}>
                                    <span>{ch.label}</span>
                                    <a href="#contact">{ch.value}</a>
                                    <i aria-hidden="true">↗</i>
                                </li>
                            ))}
                        </ul>
                        <p className="software-contact__status" aria-hidden="true">{c.statusLine}</p>
                    </div>
                    <div className="software-contact__panel software-reveal" style={{ "--d": "120ms" }} id="contact-form">
                        <Corners />
                        <SoftwareContactForm />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function LandingSections() {
    return (
        <>
            <Philosophy />
            <MatrixDivider index="03" label={copy.faq.label} />
            <Faq />
            <MatrixDivider index="04" label={copy.contact.label} />
            <Contact />
        </>
    );
}
