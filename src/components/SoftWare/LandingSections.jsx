import React, { useEffect, useRef, useState } from "react";
import Corners from "./Corners";
import MatrixDivider from "./MatrixDivider";
import Scramble from "./Scramble";
import SoftwareContactForm from "./SoftwareContactForm";
import { t } from "../../i18n";
import qrCode from "../../assets/images/contact/qr_code.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faEnvelope, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { faTelegram, faLinkedinIn, faGithub } from "@fortawesome/free-brands-svg-icons";
import "../../styles/components/SoftWare/LandingSections.scss";

function Paragraph({ children }) {
    return <p>{children.split("**").map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part)}</p>;
}

function Philosophy({ lang, page = "software" }) {
    const p = t(lang, page, "philosophy");
    const frameRef = useRef(null);
    const chaptersRef = useRef([]);
    const [active, setActive] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const elements = chaptersRef.current.filter(Boolean);
        if (!("IntersectionObserver" in window)) return undefined;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = elements.indexOf(entry.target);
                    if (index > -1) setActive(index);
                }
            });
        }, { rootMargin: "-28% 0px -62% 0px" });

        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [lang, page]);

    useEffect(() => {
        let frameId = 0;
        const onScroll = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const frame = frameRef.current;
                if (!frame) return;
                const rect = frame.getBoundingClientRect();
                const total = rect.height - window.innerHeight;
                const value = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
                setProgress(value);
            });
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frameId); };
    }, []);

    return <section id="philosophy" className="software-philosophy" aria-labelledby="software-philosophy-title">
        <span className="software-philosophy__watermark" aria-hidden="true">{p.title}</span>
        <span className="software-philosophy__rail software-philosophy__rail--l" aria-hidden="true" />
        <span className="software-philosophy__rail software-philosophy__rail--r" aria-hidden="true" />
        <div className="software-shell">
            <header className="software-landing__heading software-reveal">
                <p className="software-eyebrow">{p.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                <h2 id="software-philosophy-title"><Scramble text={p.title} duration={1050} /></h2>
            </header>

            <div className="software-philosophy__frame software-reveal" ref={frameRef}>
                <span className="software-philosophy__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
                <div className="software-philosophy__termhead" aria-hidden="true">
                    <i className="software-card__dot" />
                    <i className="software-card__dot" />
                    <i className="software-card__dot software-card__dot--g" />
                    <span className="software-philosophy__termtitle"><b>{p.eyebrow}</b> / {p.contents}</span>
                    <Corners />
                </div>

                <div className="software-philosophy__layout">
                    <nav className="software-philosophy__toc" aria-label={p.contents}>
                        <p>{p.contents}</p>
                        <ol>
                            {p.sections.map((section, i) => <li key={i}><a href={`#philosophy-${i + 1}`} className={active === i ? "is-active" : ""}><span className="software-philosophy__tocnum">{String(i + 1).padStart(2, "0")}</span><span className="software-philosophy__toctext">{section.title}</span></a></li>)}
                        </ol>
                    </nav>

                    <article className="software-philosophy__article">
                        <div className="software-philosophy__intro">{p.intro.map((text, i) => <Paragraph key={i}>{text}</Paragraph>)}</div>
                        {p.sections.map((section, i) => <section id={`philosophy-${i + 1}`} className="software-philosophy__chapter" key={i} aria-labelledby={`philosophy-title-${i + 1}`} ref={el => { chaptersRef.current[i] = el; }}>
                            <p className="software-eyebrow software-eyebrow--plain" aria-hidden="true">§ {String(i + 1).padStart(2, "0")}</p>
                            <h3 id={`philosophy-title-${i + 1}`}>{section.title}</h3>
                            {section.paragraphs.map((text, j) => <Paragraph key={j}>{text}</Paragraph>)}
                        </section>)}
                    </article>
                </div>

                <div className="software-philosophy__termfoot" aria-hidden="true">
                    <span>{p.contents}</span>
                    <span>scroll ▸ {String(Math.round(progress * 100)).padStart(2, "0")}%</span>
                </div>
            </div>
        </div>
    </section>;
}

function Faq({ lang, page = "software" }) {
    const f = t(lang, page, "faq");
    const [open, setOpen] = useState(0);

    return <section id="faq" className="software-faq" aria-labelledby="software-faq-title">
        <div className="software-shell">
            <header className="software-landing__heading software-reveal">
                <p className="software-eyebrow">{f.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                <h2 id="software-faq-title"><Scramble text={f.title} /></h2>
            </header>
            <div className="software-faq__list software-reveal">
                {f.items.map((item, i) => {
                    const isOpen = open === i;
                    return <div className={`software-faq__item${isOpen ? " is-open" : ""}`} key={`${lang}-${i}`}>
                        <button type="button" className="software-faq__q" aria-expanded={isOpen} aria-controls={`faq-a-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                            <span className="software-faq__idx" aria-hidden="true">Q{String(i + 1).padStart(2, "0")}</span>
                            <span className="software-faq__text">{item.question}</span>
                            <span className="software-faq__mark" aria-hidden="true">+</span>
                        </button>
                        <div className="software-faq__a" id={`faq-a-${i}`}>
                            <div><p>{item.answer}</p></div>
                        </div>
                    </div>;
                })}
            </div>
        </div>
    </section>;
}

function Contact({ lang, page = "software" }) {
    const c = t(lang, page, "contact");
    const channels = c.channels?.length ? c.channels : [
        { label: "telegram", value: "@PlatP79", href: "https://t.me/PlatP79" },
        { label: "phone", value: "+380994651601", href: "tel:+380994651601" },
        { label: "email", value: "pir.pilat.pasha@gmail.com", href: "mailto:pir.pilat.pasha@gmail.com" },
        { label: "linkedin", value: "linkedin.com/in/паша-платонов-02236a23b", href: "https://www.linkedin.com/in/паша-платонов-02236a23b/" },
        { label: "github", value: "github.com/PashaPilat", href: "https://github.com/PashaPilat" },
    ];
    const statusLine = c.statusLine || "connection.ready — waiting for input";
    const iconMap = {
        telegram: faTelegram,
        phone: faPhone,
        email: faEnvelope,
        linkedin: faLinkedinIn,
        github: faGithub,
    };

    return <section id="contact" className="software-contact" aria-labelledby="software-contact-title">
        <span className="software-contact__glow" aria-hidden="true" />
        <div className="software-shell">
            <div className="software-contact__grid">
                <div className="software-contact__info software-reveal">
                    <div className="software-contact__copy">
                        <p className="software-eyebrow">{c.eyebrow}<span className="mx-cursor" aria-hidden="true" /></p>
                        <h2 id="software-contact-title"><Scramble text={c.title} /></h2>
                        <p className="software-contact__desc">{c.description}</p>
                    </div>

                    <div className="software-contact__qr-card" aria-label={c.qrAlt || "Telegram QR code"}>
                        <div className="software-contact__qr-frame">
                            <img src={qrCode} alt={c.qrAlt || "Telegram QR code"} loading="lazy" />
                        </div>
                    </div>

                    <ul className="software-contact__channels">
                        {channels.map((channel) => (
                            <li key={channel.label}>
                                <span>{t(lang, "software", "contact", channel.label)}</span>
                                <a href={channel.href || "#contact"} target={channel.href?.startsWith("http") ? "_blank" : undefined} rel={channel.href?.startsWith("http") ? "noreferrer" : undefined}>{channel.value}</a>
                                <i aria-hidden="true"><FontAwesomeIcon icon={iconMap[channel.label] || faArrowUpRightFromSquare} /></i>
                            </li>
                        ))}
                    </ul>
                    <p className="software-contact__status" aria-hidden="true">{statusLine}</p>
                </div>
                <div className="software-contact__panel software-reveal" id="contact-form">
                    <Corners />
                    <SoftwareContactForm currentLang={lang} page={page} />
                </div>
            </div>
        </div>
    </section>;
}

export default function LandingSections({ lang, page = "software" }) {
    const root = useRef(null);

    useEffect(() => {
        const elements = root.current ? root.current.querySelectorAll(".software-reveal") : [];
        if (!elements.length) return undefined;
        if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            elements.forEach(el => el.classList.add("is-in"));
            return undefined;
        }

        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add("is-in"); observer.unobserve(entry.target); }
        }), {
            threshold: 0.05,
            rootMargin: "0px 0px 18% 0px"
        });

        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [lang, page]);

    return <div ref={root} className="software-landing__sections">
        <Philosophy lang={lang} page={page} />
        <MatrixDivider index="03" label={t(lang, "software", "faq", "max_title")} note="core" />
        <Faq lang={lang} page={page} />
        <MatrixDivider index="04" label={t(lang, "software", "contact", "max_title")} note="contact" />
        <Contact lang={lang} page={page} />
    </div>;
}
