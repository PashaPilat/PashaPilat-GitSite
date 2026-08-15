import React from "react";
import "../../styles/components/Home/ContactsMarquee.scss";

const CONTACTS = [
  "Email", "Phone", "Telegram", "WhatsApp", "Viber",
  "Skype", "Zoom", "Discord", "Slack",
  "LinkedIn", "Facebook Messenger", "Instagram DM",
  "GitHub Issues", "Jira Tickets", "Support Portal"
];

export default function ContactsMarquee() {
  return (
    <div className="contacts__marquee" aria-hidden>
      <div className="contacts__marquee-track">
        {[0, 1].map((copy) => (
          <span key={copy} className="contacts__marquee-row">
            {CONTACTS.map((method) => (
              <span key={`${copy}-${method}`} className="contacts__marquee-item">
                {method}
                <i>✉</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
