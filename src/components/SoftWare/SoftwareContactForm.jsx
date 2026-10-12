import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { t } from "../../i18n";
import { sendContactForm } from "../../services/emailService";
import GlowButton from "./SoftwareButton";
import "../../styles/components/SoftWare/ContactSection.scss";

export default function SoftwareContactForm({ currentLang, page = "software" }) {
    const copy = t(currentLang, page, "contactForm");
    const projectOptions = page === "software" ? ["PlatP Software", "Jarvis II", "PlatP Media Center", "PlatP Creator Studio"] : copy.projects;
    const [captcha, setCaptcha] = useState(null);
    const [state, setState] = useState("idle");
    const [captchaKey, setCaptchaKey] = useState(0);
    async function submit(event) {
        event.preventDefault();
        if (state === "sending") return;
        if (!captcha) { setState("captcha"); return; }
        const form = event.currentTarget;
        const data = new FormData(form);
        const topic = copy.topics.find(item => item.value === data.get("topic"));
        setState("sending");
        try {
            await sendContactForm({
                role: "Software", direction: page === "software" ? "PlatP Software" : page === "gamedev" ? "GameDev" : page === "radio" ? "Radio" : "Other", topic: topic.label, name: data.get("name"),
                contacts: [{ type: "Email", value: data.get("email") }],
                projectType: [{ value: data.get("project") }, { value: topic.label }],
                description: data.get("message"), attachments: [], captchaToken: captcha,
            });
            form.reset(); setState("success");
        } catch { setState("error"); }
        finally { setCaptcha(null); setCaptchaKey(key => key + 1); }
    }
    return <form className="software-contact-form" onSubmit={submit} aria-label={copy.title}>
        <p className="software-contact-form__title">{copy.title}</p>
        <div className="software-contact-form__grid cf">
            <label className="cf-field"><span className="cf-label">{copy.name}</span><input className="cf-input" name="name" required maxLength={120} autoComplete="name" /></label>
            <label className="cf-field"><span className="cf-label">{copy.email}</span><input className="cf-input" type="email" name="email" required maxLength={254} autoComplete="email" /></label>
            <label className="cf-field"><span className="cf-label">{copy.topic}</span><select className="cf-select-native" name="topic" required defaultValue=""><option value="" disabled>{copy.choose}</option>{copy.topics.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="cf-field"><span className="cf-label">{copy.project}</span><select className="cf-select-native" name="project" defaultValue={projectOptions[0]}>{projectOptions.map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label className="cf-field"><span className="cf-label">{copy.message}</span><textarea className="cf-textarea" name="message" required minLength={10} maxLength={10000} rows={7} placeholder={copy.placeholder} /></label>
        <label className="software-contact-form__consent"><input type="checkbox" name="agree" required /><span>{copy.agree}</span></label>
        <div className="software-contact-form__captcha" data-lenis-prevent>
            <ReCAPTCHA key={captchaKey} sitekey="6LcjOX0tAAAAAOo-JtLgvhnjTaNAF5Ih088MAZCP" theme="dark" hl={currentLang === "ua" ? "uk" : currentLang} onChange={setCaptcha} onExpired={() => setCaptcha(null)} />
            <GlowButton type="submit" className="cf-submit" disabled={state === "sending"}>{state === "sending" ? copy.sending : copy.submit}</GlowButton>
        </div>
        
        {state !== "idle" && state !== "sending" && <p className="software-contact-form__status" role={state === "success" ? "status" : "alert"}>{copy[state]}</p>}
    </form>;
}
