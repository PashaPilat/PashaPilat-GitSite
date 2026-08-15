import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "../../styles/components/Home/DirectContacts.scss";

import qrCode from "../../assets/images/contact/qr_code.png";

import { t } from "../../i18n";
import { getLangFromPath } from "../../utils/getLangFromPath";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPhone,
    faEnvelope,
    faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import {
    faTelegram,
    faLinkedinIn,
    faGithub,
} from "@fortawesome/free-brands-svg-icons";

const contactItems = [
    {
        key: "telegram",
        icon: faTelegram,
        value: "@PlatP79",
        href: "https://t.me/PlatP79",
    },
    {
        key: "phone",
        icon: faPhone,
        value: "+380994651601",
        href: "tel:+380994651601",
    },
    {
        key: "email",
        icon: faEnvelope,
        value: "pir.pilat.pasha@gmail.com",
        href: "mailto:pir.pilat.pasha@gmail.com",
    },
    {
        key: "linkedin",
        icon: faLinkedinIn,
        value: "linkedin.com/in/паша-платонов-02236a23b",
        href: "https://www.linkedin.com/in/паша-платонов-02236a23b/",
    },
    {
        key: "github",
        icon: faGithub,
        value: "github.com/PashaPilat",
        href: "https://github.com/PashaPilat",
    },
];

export default function DirectContacts() {
    const currentLang = getLangFromPath(window.location.pathname);

    return (
        <section className="direct-contact" id="direct-contact">
            <div className="direct-contact__bg" aria-hidden="true" />

            <div className="direct-contact__container">
                <div className="contact-head direct-contact__head">
                    <span className="contact-eyebrow" data-reveal>
                        {t(currentLang, "directContact", "eyebrow")}
                    </span>

                    <h2
                        className="contact-title direct-contact__title"
                        data-reveal
                        style={{ "--d": "0.05s" }}
                    >
                        {t(currentLang, "directContact", "title")}{" "}
                        <span className="contact-title__ghost">
                            {t(currentLang, "directContact", "titleGhost")}
                        </span>
                    </h2>

                    <p
                        className="contact-subtitle direct-contact__subtitle"
                        data-reveal
                        style={{ "--d": "0.1s" }}
                    >
                        {t(currentLang, "directContact", "subtitle")}
                    </p>
                </div>

                <div
                    className="direct-contact__body"
                    data-reveal
                    style={{ "--d": "0.15s" }}
                >
                    <div className="direct-contact__qr-card">
                        <div
                            className="direct-contact__qr-glow"
                            aria-hidden="true"
                        />

                        <div className="direct-contact__qr-frame">
                            <img
                                src={qrCode}
                                alt={t(currentLang, "directContact", "qrAlt")}
                                className="direct-contact__qr-img"
                                loading="lazy"
                            />
                        </div>

                        <div className="direct-contact__qr-info">
                            <span className="direct-contact__qr-label">
                                {t(currentLang, "directContact", "qrLabel")}
                            </span>

                            <a
                                href="https://t.me/PlatP79"
                                target="_blank"
                                rel="noreferrer"
                                className="direct-contact__qr-link"
                            >
                                @PlatP79
                                <FontAwesomeIcon
                                    icon={faArrowUpRightFromSquare}
                                />
                            </a>
                        </div>
                    </div>

                    <div className="direct-contact__list">
                        {contactItems.map((item, index) => (
                            <a
                                key={item.key}
                                href={item.href}
                                target={
                                    item.key === "phone" || item.key === "email"
                                        ? undefined
                                        : "_blank"
                                }
                                rel={
                                    item.key === "phone" || item.key === "email"
                                        ? undefined
                                        : "noreferrer"
                                }
                                className="direct-contact__item"
                                style={{ "--i": index }}
                            >
                                <span className="direct-contact__icon">
                                    <FontAwesomeIcon icon={item.icon} />
                                </span>

                                <span className="direct-contact__content">
                                    <span className="direct-contact__label">
                                        {t(
                                            currentLang,
                                            "directContact",
                                            item.key,
                                        )}
                                    </span>

                                    <span className="direct-contact__value">
                                        {item.value}
                                    </span>
                                </span>

                                <span className="direct-contact__arrow">
                                    <FontAwesomeIcon
                                        icon={faArrowUpRightFromSquare}
                                    />
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
