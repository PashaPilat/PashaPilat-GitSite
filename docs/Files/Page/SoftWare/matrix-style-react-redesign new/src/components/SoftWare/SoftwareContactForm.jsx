import React, { useState } from "react";
import { copy } from "../../data";

// Демо-версия формы. В вашем проекте остаётся SoftwareContactForm
// с ReCAPTCHA и emailjs — здесь только разметка и стили.
export default function SoftwareContactForm() {
    const f = copy.contactForm;
    const [state, setState] = useState("idle");

    function submit(e) {
        e.preventDefault();
        if (state === "sending") return;
        setState("sending");
        setTimeout(() => {
            e.target.reset();
            setState("success");
        }, 900);
    }

    return (
        <form className="cf software-contact-form" onSubmit={submit} aria-label={f.title}>
            <p className="software-contact-form__title">{f.title}</p>
            <div className="software-contact-form__grid">
                <label className="cf-field">
                    <span className="cf-label">{f.name}</span>
                    <input className="cf-input" name="name" required maxLength={120} autoComplete="name" />
                </label>
                <label className="cf-field">
                    <span className="cf-label">{f.email}</span>
                    <input className="cf-input" type="email" name="email" required maxLength={254} autoComplete="email" />
                </label>
                <label className="cf-field">
                    <span className="cf-label">{f.topic}</span>
                    <select className="cf-select-native" name="topic" required defaultValue="">
                        <option value="" disabled>{f.choose}</option>
                        {f.topics.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </label>
                <label className="cf-field">
                    <span className="cf-label">{f.project}</span>
                    <select className="cf-select-native" name="project" defaultValue={f.projectOptions[0]}>
                        {f.projectOptions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                </label>
            </div>
            <label className="cf-field">
                <span className="cf-label">{f.message}</span>
                <textarea className="cf-textarea" name="message" required minLength={10} maxLength={10000} rows={6} placeholder={f.placeholder} />
            </label>
            <label className="software-contact-form__consent">
                <input type="checkbox" name="agree" required />
                <span>{f.agree}</span>
            </label>
            <button type="submit" className="cf-submit" disabled={state === "sending"}>
                {state === "sending" ? f.sending : f.submit}
            </button>
            {state === "success" && <p className="software-contact-form__status" role="status">{f.success}</p>}
        </form>
    );
}
