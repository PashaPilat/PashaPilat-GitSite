import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_hwjrhc6";
const TEMPLATE_ID = "template_8scpjd8";
const PUBLIC_KEY = "W0L-9FOoiUVYgp4ES";

// Экранирование пользовательского текста перед вставкой в HTML
const escapeHtml = (value) => {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Безопасный URL
const normalizeUrl = (value) => {
    if (!value) return "";

    const url = String(value).trim();

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return "";
};

// Ссылка для контакта
const getContactHref = (type, value) => {
    if (!value) return "#";

    const normalizedType = String(type || "").toLowerCase();
    const normalizedValue = String(value).trim();

    if (normalizedType.includes("email") || normalizedValue.includes("@")) {
        return `mailto:${normalizedValue}`;
    }

    if (
        normalizedType.includes("phone") ||
        normalizedType.includes("телефон") ||
        /^\+?[\d\s\-()]+$/.test(normalizedValue)
    ) {
        return `tel:${normalizedValue.replace(/[^\d+]/g, "")}`;
    }

    if (
        normalizedType.includes("telegram") ||
        normalizedType.includes("телеграм")
    ) {
        const username = normalizedValue
            .replace(/^https?:\/\/t\.me\//i, "")
            .replace(/^@/, "");

        return `https://t.me/${username}`;
    }

    if (
        normalizedType.includes("linkedin") ||
        normalizedType.includes("website") ||
        normalizedType.includes("сайт")
    ) {
        return normalizeUrl(normalizedValue) || "#";
    }

    return normalizeUrl(normalizedValue) || "#";
};

// Контакты
const renderContacts = (contacts) => {
    if (!Array.isArray(contacts) || contacts.length === 0) {
        return `
            <p style="color: #88888e; margin: 0; font-size: 14px;">
                Не указаны
            </p>
        `;
    }

    return contacts
        .map((contact) => {
            const type = escapeHtml(contact?.type || "Контакт");
            const value = escapeHtml(contact?.value || "Не указан");
            const href = escapeHtml(
                getContactHref(contact?.type, contact?.value)
            );

            const isLink = href !== "#";

            return `
                <div style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">
                    <span style="color: #b5b5be; font-weight: bold;">
                        ${type}:
                    </span>

                    ${
                        isLink
                            ? `
                                <a
                                    href="${href}"
                                    style="color: #D4FF00; text-decoration: none; border-bottom: 1px dashed rgba(212, 255, 0, 0.4);"
                                >
                                    ${value}
                                </a>
                            `
                            : `
                                <span style="color: #ffffff;">
                                    ${value}
                                </span>
                            `
                    }
                </div>
            `;
        })
        .join("");
};

// Вложения / ссылки
const renderAttachments = (attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return `
            <p style="color: #88888e; font-style: italic; margin: 0; font-size: 14px;">
                Вложенные ссылки отсутствуют
            </p>
        `;
    }

    return `
        <div style="margin-top: 10px;">
            ${attachments
                .map((attachment) => {
                    const platform = escapeHtml(
                        attachment?.platform || "Ссылка"
                    );

                    const url = normalizeUrl(attachment?.url);
                    const safeUrl = escapeHtml(url);

                    if (!url) {
                        return `
                            <div style="margin-bottom: 10px; font-size: 14px; line-height: 1.5;">
                                <span style="color: #D4FF00; font-size: 15px;">
                                    📎
                                </span>

                                <strong style="color: #ffffff;">
                                    ${platform}
                                </strong>
                            </div>
                        `;
                    }

                    return `
                        <div style="margin-bottom: 10px; font-size: 14px; line-height: 1.5;">
                            <span style="color: #D4FF00; font-size: 15px;">
                                📎
                            </span>

                            <strong style="color: #ffffff;">
                                ${platform}
                            </strong>

                            <br>

                            <a
                                href="${safeUrl}"
                                target="_blank"
                                rel="noopener noreferrer"
                                style="color: #D4FF00; text-decoration: none; font-size: 13px; word-break: break-all;"
                            >
                                ${escapeHtml(url)}
                            </a>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
};

export async function sendContactForm(data) {
    emailjs.init({
        publicKey: PUBLIC_KEY,
    });
    console.log("Initializing emailjs with public key:", PUBLIC_KEY);
    console.log("Sending email with data:", data);
    const isClient = data.role === "Client";

    const subject = isClient
        ? "Запрос на заказ с GitPage"
        : "Предложение о работе с GitPage";

    const badgeText = isClient ? "ЗАКАЗЧИК" : "РАБОТОДАТЕЛЬ";
    const badgeColor = isClient ? "#D4FF00" : "#38BDF8";
    const badgeTextColor = isClient ? "#000000" : "#ffffff";

    const projectTypeLabel = isClient
        ? "Тип проекта"
        : "Формат занятости";

    const projectTypes =
        Array.isArray(data.projectType) && data.projectType.length > 0
            ? data.projectType
                  .map((item) => escapeHtml(item?.value || ""))
                  .filter(Boolean)
                  .join(", ")
            : "Не выбрано";

    const budgetOrFormat = isClient
        ? `
            <td style="padding: 15px; border-bottom: 1px solid #27272a;">
                <span
                    style="
                        color: #88888e;
                        font-size: 12px;
                        display: block;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    "
                >
                    Бюджет
                </span>

                <strong style="color: #ffffff; font-size: 16px;">
                    ${escapeHtml(data.budget || "Не указан")}
                </strong>
            </td>
        `
        : "";

    const website = normalizeUrl(data.website);

    const websiteBlock = website
        ? `
            <a
                href="${escapeHtml(website)}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                    color: #D4FF00;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 15px;
                    word-break: break-all;
                "
            >
                ${escapeHtml(website)}
            </a>
        `
        : `
            <span
                style="
                    color: #71717a;
                    font-style: italic;
                    font-size: 15px;
                "
            >
                Не указан
            </span>
        `;

    const description = escapeHtml(
        data.description || "Без описания"
    );

    const name = escapeHtml(data.name || "Не указано");

    const htmlBody = `
<div style="
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #09090b;
    font-family: Arial, Helvetica, sans-serif;
">

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            border-collapse: collapse;
            background-color: #121214;
        "
    >

        <!-- HEADER -->
        <tr>
            <td
                align="center"
                style="
                    padding: 30px 20px 20px 20px;
                    background-color: #121214;
                    border-bottom: 1px solid #27272a;
                "
            >
                <img
                    src="https://pashapilat.github.io/PashaPilat-GitSite/images/904c683bcf3a9fe5c817.png"
                    alt="PashaPilat Logo"
                    style="
                        display: block;
                        height: auto;
                        max-height: 40px;
                        width: auto;
                    "
                />
            </td>
        </tr>

        <!-- HERO -->
        <tr>
            <td style="padding: 30px 30px 10px 30px;">

                <span
                    style="
                        display: inline-block;
                        padding: 4px 10px;
                        background-color: ${badgeColor};
                        color: ${badgeTextColor};
                        font-size: 11px;
                        font-weight: bold;
                        border-radius: 4px;
                        letter-spacing: 1px;
                        margin-bottom: 15px;
                    "
                >
                    ${badgeText}
                </span>

                <h1
                    style="
                        color: #ffffff;
                        font-size: 24px;
                        font-weight: 700;
                        margin: 0 0 10px 0;
                        letter-spacing: -0.5px;
                    "
                >
                    Новое обращение от ${name}
                </h1>

                <p
                    style="
                        color: #a1a1aa;
                        font-size: 14px;
                        margin: 0;
                    "
                >
                    Письмо отправлено с формы обратной связи вашего портфолио.
                </p>

            </td>
        </tr>

        <!-- DETAILS -->
        <tr>
            <td style="padding: 20px 30px;">

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="border-collapse: collapse;"
                >

                    <tr>

                        <td
                            style="
                                padding: 15px;
                                border-bottom: 1px solid #27272a;
                                border-top: 1px solid #27272a;
                            "
                        >

                            <span
                                style="
                                    color: #88888e;
                                    font-size: 12px;
                                    display: block;
                                    text-transform: uppercase;
                                    margin-bottom: 4px;
                                "
                            >
                                Сайт / Портфолио
                            </span>

                            ${websiteBlock}

                        </td>

                        ${budgetOrFormat}

                    </tr>

                    <tr>

                        <td
                            colspan="2"
                            style="
                                padding: 15px;
                                border-bottom: 1px solid #27272a;
                            "
                        >

                            <span
                                style="
                                    color: #88888e;
                                    font-size: 12px;
                                    display: block;
                                    text-transform: uppercase;
                                    margin-bottom: 4px;
                                "
                            >
                                ${projectTypeLabel}
                            </span>

                            <strong
                                style="
                                    color: #ffffff;
                                    font-size: 15px;
                                "
                            >
                                ${projectTypes}
                            </strong>

                        </td>

                    </tr>

                </table>

            </td>
        </tr>

        <!-- DESCRIPTION -->
        <tr>
            <td style="padding: 0 30px 20px 30px;">

                <div
                    style="
                        background-color: #18181b;
                        border: 1px solid #27272a;
                        border-radius: 8px;
                        padding: 20px;
                    "
                >

                    <span
                        style="
                            color: #88888e;
                            font-size: 12px;
                            display: block;
                            text-transform: uppercase;
                            margin-bottom: 8px;
                        "
                    >
                        Сообщение / Описание задачи
                    </span>

                    <p
                        style="
                            color: #f4f4f5;
                            font-size: 14px;
                            line-height: 1.6;
                            margin: 0;
                            white-space: pre-wrap;
                        "
                    >
                        ${description}
                    </p>

                </div>

            </td>
        </tr>

        <!-- CONTACTS -->
        <tr>
            <td style="padding: 0 30px 20px 30px;">

                <div
                    style="
                        border: 1px solid #27272a;
                        border-radius: 8px;
                        padding: 20px;
                    "
                >

                    <span
                        style="
                            color: #88888e;
                            font-size: 12px;
                            display: block;
                            text-transform: uppercase;
                            margin-bottom: 12px;
                        "
                    >
                        Способы связи
                    </span>

                    ${renderContacts(data.contacts)}

                </div>

            </td>
        </tr>

        <!-- ATTACHMENTS -->
        <tr>
            <td style="padding: 0 30px 30px 30px;">

                <div
                    style="
                        border: 1px solid #27272a;
                        border-radius: 8px;
                        padding: 20px;
                    "
                >

                    <span
                        style="
                            color: #88888e;
                            font-size: 12px;
                            display: block;
                            text-transform: uppercase;
                            margin-bottom: 8px;
                        "
                    >
                        Вложенные ссылки
                    </span>

                    ${renderAttachments(data.attachments)}

                </div>

            </td>
        </tr>

        <!-- FOOTER -->
        <tr>
            <td
                align="center"
                style="
                    padding: 20px;
                    background-color: #18181b;
                    border-top: 1px solid #27272a;
                "
            >

                <p
                    style="
                        color: #71717a;
                        font-size: 12px;
                        margin: 0;
                    "
                >
                    © ${new Date().getFullYear()} PashaPilat.
                    Все права защищены.
                    <br>

                    <a
                        href="https://pashapilat.github.io/PashaPilat-GitSite/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            color: #88888e;
                            text-decoration: underline;
                            margin-top: 5px;
                            display: inline-block;
                        "
                    >
                        Перейти на сайт
                    </a>

                </p>

            </td>
        </tr>

    </table>

</div>
`;

    return emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
            subject,
            body: htmlBody,
            email: "pir.pilat.pasha@gmail.com"
        }
    );
}