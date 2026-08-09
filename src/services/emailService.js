import emailjs from "emailjs-com";

const SERVICE_ID = "service_hwjrhc6";   // твой Gmail сервис
const TEMPLATE_ID = "template_8scpjd8";     // ID шаблона в EmailJS
const USER_ID = "ARjQIE8KJ8Bp1f_uW";    // твой Public Key

export async function sendContactForm(data) {
  // Формируем тему письма
  const subject =
    data.role === "Client"
      ? "Запрос на заказ с GitPage"
      : "Предложение о работе с GitPage";

  // Формируем тело письма
  const body =
    data.role === "Client"
      ? `
Новый запрос от клиента:

Имя: ${data.name}
Сайт: ${data.website}
Контакты: ${data.contacts.map((c) => `${c.type}: ${c.value}`).join(", ")}
Тип проекта: ${data.projectType.map((p) => p.value).join(", ")}
Бюджет: ${data.budget}
Описание: ${data.description}
Вложения: ${data.attachments.map((a) => `${a.platform}: ${a.url}`).join(", ")}
`
      : `
Новое предложение от работодателя:

Имя: ${data.name}
Сайт: ${data.website}
Контакты: ${data.contacts.map((c) => `${c.type}: ${c.value}`).join(", ")}
Формат занятости: ${data.projectType.map((p) => p.value).join(", ")}
Описание: ${data.description}
Вложения: ${data.attachments.map((a) => `${a.platform}: ${a.url}`).join(", ")}
`;

  // Отправляем готовые данные в шаблон
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      subject,
      body,
    },
    USER_ID
  );
}
