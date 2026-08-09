import React, { useMemo, useState, useRef, useEffect } from "react";
import { useForm, Controller, useFieldArray, useWatch, useController } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { sendContactForm } from "../../services/emailService";
import Select from "react-select";
import ReCAPTCHA from "react-google-recaptcha";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faBriefcase, faGlobe, faCircleInfo, faPlus, faXmark, faPaperPlane,
  faCircleCheck, faPhone, faEnvelope, faCommentDots, faFileLines, faLink, faCloud,
  faChevronDown, faSpinner, faCircleExclamation, faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTelegram, faLinkedin, faDiscord, faGoogleDrive, faDropbox, faFigma,
} from "@fortawesome/free-brands-svg-icons";

import { t } from "../../i18n";
import "../../styles/components/Home/ContactForm.scss";

/* ── Константы ─────────────────────────────────────────── */

const CONTACT_TYPES = ["Email", "Telegram", "LinkedIn", "Phone", "Discord", "Other"];

const CONTACT_ICONS = {
  Email: faEnvelope,
  Telegram: faTelegram,
  LinkedIn: faLinkedin,
  Phone: faPhone,
  Discord: faDiscord,
  Other: faCommentDots,
};

const CONTACT_PLACEHOLDERS = {
  Email: "you@example.com",
  Telegram: "@username",
  LinkedIn: "linkedin.com/in/...",
  Phone: "+7 999 123-45-67",
  Discord: "username#0000",
  Other: "https://...",
};

const ATTACHMENT_PLATFORMS = ["Google Drive", "Dropbox", "OneDrive", "Figma", "Other"];

const ATTACHMENT_ICONS = {
  "Google Drive": faGoogleDrive,
  Dropbox: faDropbox,
  OneDrive: faCloud,
  Figma: faFigma,
  Other: faLink,
};

const CLIENT_PROJECT_TYPES = [
  "Landing", "Corporate Website", "Web Application", "E-commerce", "API",
  "Support", "Consulting", "Other",
];

const EMPLOYER_PROJECT_TYPES = [
  "Full-time", "Part-time", "Contract", "Freelance", "Remote", "Hybrid", "Office",
];

const PROJECT_LABEL_KEYS = {
  Landing: "landing",
  "Corporate Website": "corporateWebsite",
  "Web Application": "webApplication",
  "E-commerce": "ecommerce",
  API: "api",
  Support: "support",
  Consulting: "consulting",
  Other: "other",
  "Full-time": "fullTime",
  "Part-time": "partTime",
  Contract: "contract",
  Freelance: "freelance",
  Remote: "remote",
  Hybrid: "hybrid",
  Office: "office",
};

/* ── Утилиты / маски ───────────────────────────────────── */

function formatBudget(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function formatPhone(raw) {
  return (raw || "").replace(/[^\d+\-\s()]/g, "");
}

const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([\/?#].*)?$/i;

/* Плюрализация — только механика выбора суффикса one/few/many, строки в JSON */
function pluralSlavic(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
  return "many";
}
const pluralEn = (n) => (n === 1 ? "one" : "many");
const PLURAL = { ru: pluralSlavic, ua: pluralSlavic, en: pluralEn };

/* ── react-select ──────────────────────────────────────── */

const NO_INDICATORS_SINGLE = {
  DropdownIndicator: () => null,
  IndicatorSeparator: () => null,
  LoadingIndicator: () => null,
};

function IconSelect({ icon, open, children }) {
  return (
    <div className="cf-select-wrap">
      <FontAwesomeIcon icon={icon} className="cf-select-ico" />
      {children}
      <FontAwesomeIcon icon={faChevronDown} className={`cf-select-caret ${open ? "is-open" : ""}`} />
    </div>
  );
}

/* ── Схема валидации ───────────────────────────────────── */

function buildSchema(lang) {
  return yup.object().shape({
    role: yup.string().required(),
    name: yup.string().required(t(lang, "contact", "errors", "required")),
    website: yup.string().nullable().test("website", t(lang, "contact", "errors", "url"), (value) => {
      if (!value) return true;
      return URL_RE.test(value.trim());
    }),
    contacts: yup.array().of(
      yup.object().shape({
        type: yup.string().required(),
        value: yup.string()
          .required(t(lang, "contact", "errors", "required"))
          .test("contact-valid", t(lang, "contact", "errors", "contactInvalid"), function (value) {
            if (!value) return false;
            const v = value.trim();
            switch (this.parent.type) {
              case "Email":    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
              case "Phone":    return /^\+?[\d\s\-()]{7,20}$/.test(v);
              case "Telegram": return /^@?[a-zA-Z0-9_]{4,32}$/.test(v);
              case "LinkedIn": return v.length > 2;
              case "Discord":  return v.length > 1;
              default:         return v.length > 0;
            }
          }),
      })
    ).min(1, t(lang, "contact", "errors", "contactRequired")),
    projectType: yup.array().min(1, t(lang, "contact", "errors", "projectType")),
    budget: yup.string().nullable(),
    description: yup.string().nullable(),
    attachments: yup.array().of(
      yup.object().shape({
        platform: yup.string(),
        url: yup.string().test("url", t(lang, "contact", "errors", "url"), (value) => {
          if (!value) return true;
          return URL_RE.test(value.trim());
        }),
      })
    ).nullable(),
    agree: yup.bool().oneOf([true], t(lang, "contact", "errors", "agreeRequired")),
  });
}

/* ── Вспомогательные компоненты ────────────────────────── */

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="cf-field-error">
      <FontAwesomeIcon icon={faCircleInfo} /> {message}
    </span>
  );
}

/*
 * Общий класс состояния для обёртки полей:
 *   mode === 'error' → красная рамка + текст ошибки
 *   mode === 'hint'  → лаймовая засветка, БЕЗ текста ошибки
 *   hasErr           → есть ли ошибка на поле
 */
function fieldStateClass(mode, hasErr) {
  if (!hasErr) return "";
  if (mode === "error") return "has-error";
  if (mode === "hint")  return "has-hint";
  return "";
}

function ContactRow({ index, control, currentLang, onRemove, mode }) {
  const type = useWatch({ control, name: `contacts.${index}.type` }) || "Email";
  const [menuOpen, setMenuOpen] = useState(false);
  const contactOptions = useMemo(() => CONTACT_TYPES.map((tp) => ({ value: tp, label: tp })), []);

  // Получаем ошибку значения контакта, чтобы подсветить и селект тоже
  const { fieldState: valueFieldState } = useController({ control, name: `contacts.${index}.value` });
  const valueHasErr = !!valueFieldState.error;
  const wrapCls = fieldStateClass(mode, valueHasErr);

  return (
    <div className="cf-contact-row">
      <Controller
        name={`contacts.${index}.type`}
        control={control}
        render={({ field }) => (
          <div className={`cf-select-wrap ${wrapCls}`}>
            <FontAwesomeIcon icon={CONTACT_ICONS[field.value] || faCommentDots} className="cf-select-ico" />
            <Select
              unstyled classNamePrefix="cf-select"
              isSearchable={false} blurInputOnSelect captureMenuScroll={false}
              className={`cf-select-single ${wrapCls}`}
              components={NO_INDICATORS_SINGLE}
              options={contactOptions}
              value={contactOptions.find((o) => o.value === field.value) || null}
              onChange={(opt) => field.onChange(opt ? opt.value : "Email")}
              onBlur={field.onBlur}
              placeholder="—" aria-label="contact type"
              menuIsOpen={menuOpen}
              onMenuOpen={() => setMenuOpen(true)}
              onMenuClose={() => setMenuOpen(false)}
            />
            <FontAwesomeIcon icon={faChevronDown} className={`cf-select-caret ${menuOpen ? "is-open" : ""}`} />
          </div>
        )}
      />

      <Controller
        name={`contacts.${index}.value`}
        control={control}
        render={({ field, fieldState }) => {
          const hasErr = !!fieldState.error;
          return (
            <div className={`cf-contact-value ${fieldStateClass(mode, hasErr)}`}>
              <input
                {...field}
                type="text"
                className={`cf-input ${fieldStateClass(mode, hasErr)}`}
                placeholder={CONTACT_PLACEHOLDERS[type]}
                onChange={(e) => {
                  const v = type === "Phone" ? formatPhone(e.target.value) : e.target.value;
                  field.onChange(v);
                }}
              />
              {mode === "error" && <FieldError message={fieldState.error?.message} />}
            </div>
          );
        }}
      />

      <button type="button" className="cf-remove-btn" onClick={onRemove} aria-label="remove">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

function AttachmentRow({ index, control, currentLang, onRemove, mode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const platformOptions = useMemo(() => ATTACHMENT_PLATFORMS.map((p) => ({ value: p, label: p })), []);

  const { field: platField } = useController({ control, name: `attachments.${index}.platform`, defaultValue: "Google Drive" });
  const { fieldState: urlFieldState } = useController({ control, name: `attachments.${index}.url` });
  const urlHasErr = !!urlFieldState.error;
  const wrapCls = fieldStateClass(mode, urlHasErr);

  return (
    <div className="cf-attachment-row">
      <div className={`cf-select-wrap ${wrapCls}`}>
        <FontAwesomeIcon icon={ATTACHMENT_ICONS[platField.value] || faLink} className="cf-select-ico" />
        <Controller
          name={`attachments.${index}.platform`}
          control={control}
          render={({ field }) => (
            <Select
              unstyled classNamePrefix="cf-select"
              isSearchable={false} blurInputOnSelect captureMenuScroll={false}
              className={`cf-select-single ${wrapCls}`}
              components={NO_INDICATORS_SINGLE}
              options={platformOptions}
              value={platformOptions.find((o) => o.value === field.value) || null}
              onChange={(opt) => field.onChange(opt ? opt.value : "Google Drive")}
              onBlur={field.onBlur}
              placeholder="—" aria-label="attachment platform"
              menuIsOpen={menuOpen}
              onMenuOpen={() => setMenuOpen(true)}
              onMenuClose={() => setMenuOpen(false)}
            />
          )}
        />
        <FontAwesomeIcon icon={faChevronDown} className={`cf-select-caret ${menuOpen ? "is-open" : ""}`} />
      </div>

      <Controller
        name={`attachments.${index}.url`}
        control={control}
        render={({ field, fieldState }) => {
          const hasErr = !!fieldState.error;
          return (
            <div className={`cf-contact-value ${fieldStateClass(mode, hasErr)}`}>
              <input
                {...field}
                type="text"
                className={`cf-input ${fieldStateClass(mode, hasErr)}`}
                placeholder={t(currentLang, "contact", "attachmentPlaceholder")}
              />
              {mode === "error" && <FieldError message={fieldState.error?.message} />}
            </div>
          );
        }}
      />

      <button type="button" className="cf-remove-btn" onClick={onRemove} aria-label="remove">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

/* ── Подсчёт ошибок ────────────────────────────────────── */

function countErrors(errors, missingCaptcha) {
  let n = 0;
  if (!errors) return missingCaptcha ? 1 : 0;
  if (errors.name) n++;
  if (errors.website) n++;
  if (errors.projectType) n++;
  if (errors.agree) n++;
  if (errors.contacts) {
    if (Array.isArray(errors.contacts)) {
      errors.contacts.forEach((c) => { if (c && c.value) n++; });
    } else { n++; }
  }
  if (errors.attachments && Array.isArray(errors.attachments)) {
    errors.attachments.forEach((a) => { if (a && a.url) n++; });
  }
  if (missingCaptcha) n++;
  return n;
}

/* ── Основной компонент ────────────────────────────────── */

export default function ContactForm({ currentLang = "ru" }) {
  const [captchaToken, setCaptchaToken] = useState(null);
  // капча считается заполненной когда есть captchaToken
  const [submitState, setSubmitState] = useState("idle"); // idle | sending | success | error
  // errorMode: 'none' | 'hint' (лайм, без текста) | 'error' (красный + текст)
  const [errorMode, setErrorMode] = useState("none");

  const formRef = useRef(null);

  const schema = useMemo(() => buildSchema(currentLang), [currentLang]);

  const {
    control, handleSubmit, watch, trigger, reset, setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "firstError",
    shouldFocusError: false,
    defaultValues: {
      role: "Client",
      name: "",
      website: "",
      contacts: [],
      projectType: [],
      budget: "",
      description: "",
      attachments: [],
      agree: false,
    },
  });

  const role = watch("role");

  // Инициализируем errors при первом рендере, чтобы isValid был корректным
  // с первого же рендера (иначе RHF держит isValid=true до первого blur/change).
  useEffect(() => {
    trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control, name: "contacts",
  });
  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } =
    useFieldArray({ control, name: "attachments" });

  const projectOptions = useMemo(() => {
    const list = role === "Client" ? CLIENT_PROJECT_TYPES : EMPLOYER_PROJECT_TYPES;
    return list.map((value) => ({
      value,
      label: t(currentLang, "contact", "projectOptions", PROJECT_LABEL_KEYS[value]),
    }));
  }, [role, currentLang]);

  const formReallyValid = isValid && !!captchaToken;
  const errorCount = useMemo(() => countErrors(errors, !captchaToken), [errors, captchaToken]);

  // Сброс режима ошибок когда всё ок
  useEffect(() => {
    if (formReallyValid) setErrorMode("none");
  }, [formReallyValid]);

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const root = formRef.current;
      if (!root) return;
      const first = root.querySelector('.has-error, .has-hint, [data-cf-error="true"]');
      if (first && first.scrollIntoView) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = first.querySelector('input, textarea, button, [tabindex]') || first;
        if (focusable && typeof focusable.focus === "function") {
          try { focusable.focus({ preventScroll: true }); } catch (_) { focusable.focus(); }
        }
      }
    });
  };

  // Наведение на зону сабмита — мягкий лаймовый hint.
  // Обязательно ждём trigger(), чтобы errors успели посчитаться до показа подсказки.
  const [hoveringSubmit, setHoveringSubmit] = useState(false);

  const handleSubmitEnter = () => {
    if (formReallyValid || submitState === "sending") return;
    setHoveringSubmit(true);
    trigger().then(() => {
      // после триггера errors обновились — включаем лаймовую подсветку
      setErrorMode("hint");
    });
  };
  const handleSubmitLeave = () => {
    setHoveringSubmit(false);
    if (errorMode === "hint") setErrorMode("none");
  };

  // Клик по кнопке, когда форма невалидна — жёсткая ошибка + скролл
  const handleDisabledClick = async (e) => {
    e.preventDefault();
    const ok = await trigger();
    setErrorMode("error");
    if (!ok || !captchaToken) {
      setTimeout(scrollToFirstError, 50);
    }
  };

  // Универсальная функция отправки формы, вынесена в emailService.js
  const onSubmit = async (data) => {
    if (!captchaToken) {
      setErrorMode("error");
      setTimeout(scrollToFirstError, 50);
      return;
    }
    setSubmitState("sending");

    try {
      await sendContactForm(data);
      setSubmitState("success");
      reset();
      setCaptchaToken(null);
      setErrorMode("none");
    } catch (err) {
      setSubmitState("error");
    }
  };

/*  const onSubmit = async (data) => {
    if (!captchaToken) {
      setErrorMode("error");
      setTimeout(scrollToFirstError, 50);
      return;
    }
    setSubmitState("sending");

    try {
      await emailjs.send(
        "service_id", "template_id",
        {
          role: data.role,
          name: data.name,
          website: data.website,
          contacts: data.contacts.map((c) => `${c.type}: ${c.value}`).join(", "),
          projectType: data.projectType.map((p) => p.value).join(", "),
          budget: data.budget,
          description: data.description,
          attachments: data.attachments.map((a) => `${a.platform}: ${a.url}`).join(", "),
          agree: data.agree ? "yes" : "no",
        },
        "user_id"
      );
      setSubmitState("success");
      reset();
      setCaptchaToken(null);
      setErrorMode("none");
    } catch (err) {
      setSubmitState("error");
    }
  }; */
 
  // Если форма успешно отправлена — показываем сообщение об успехе вместо формы
  if (submitState === "success") {
    return (
      <div className="cf-success">
        <FontAwesomeIcon icon={faCircleCheck} className="cf-success__icon" />
        <h3>{t(currentLang, "contact", "successTitle")}</h3>
        <p>{t(currentLang, "contact", "successText")}</p>
      </div>
    );
  }

  const canSubmit = formReallyValid && submitState !== "sending";
  // Показываем подсказку и при наведении (hoveringSubmit) — даже если trigger() ещё резолвится,
  // но раз уж мы попали в hover и форма невалидна — пользователь должен видеть плашку.
  const shouldShowHint = errorMode !== "none" || (hoveringSubmit && !formReallyValid);
  const showTip = !formReallyValid && submitState !== "sending" && shouldShowHint && errorCount > 0;
  // Класс подсказки на полях: если явно "hint"/"error" или просто hover на кнопке — всегда подсвечиваем
  // (даже до того, как trigger() отрезолвился, т.к. errorCount>0 из-за неотмеченной капчи на пустой форме).
  const highlightMode = errorMode === "error"
    ? "error"
    : (errorMode === "hint" || hoveringSubmit)
      ? "hint"
      : "none";
  const pluralKey = `count_${(PLURAL[currentLang] || pluralEn)(errorCount)}`;

  // вспомогательные className для полей
  const nameErr      = !!errors.name;
  const websiteErr   = !!errors.website;
  const contactsErr  = !!errors.contacts;
  const projectErr   = !!errors.projectType;
  const agreeErr     = !!errors.agree;
  const hintOrErrCls = (has) => fieldStateClass(highlightMode, has);

  return (
    <form ref={formRef} className="cf" onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* Роль */}
      <div className="cf-field cf-field--role">
        <label className="cf-label">{t(currentLang, "contact", "roleLabel")}</label>
        <Controller name="role" control={control}
          render={({ field }) => (
            <div className="cf-role-toggle">
              <button type="button"
                className={`cf-role-btn ${field.value === "Client" ? "is-active" : ""}`}
                onClick={() => {
                  field.onChange("Client");
                  setValue("projectType", [], { shouldValidate: true });
                }}>
                <FontAwesomeIcon icon={faUser} /> {t(currentLang, "contact", "roleClient")}
              </button>
              <button type="button"
                className={`cf-role-btn ${field.value === "Employer" ? "is-active" : ""}`}
                onClick={() => {
                  field.onChange("Employer");
                  setValue("projectType", [], { shouldValidate: true });
                }}>
                <FontAwesomeIcon icon={faBriefcase} /> {t(currentLang, "contact", "roleEmployer")}
              </button>
            </div>
          )} />
      </div>

      {/* Имя */}
      <div data-grid="name" className={`cf-field ${hintOrErrCls(nameErr)}`}>
        <Controller name="name" control={control}
          render={({ field }) => (
            <input {...field} type="text"
              className={`cf-input ${hintOrErrCls(nameErr)}`}
              placeholder={role === "Client"
                ? t(currentLang, "contact", "namePlaceholderClient")
                : t(currentLang, "contact", "namePlaceholderEmployer")} />
          )} />
        {highlightMode === "error" && <FieldError message={errors.name?.message} />}
      </div>

      {/* Website */}
      <div data-grid="website" className={`cf-field ${hintOrErrCls(websiteErr)}`}>
        <div className="cf-input-icon">
          <FontAwesomeIcon icon={faGlobe} className="cf-input-icon__ico" />
          <Controller name="website" control={control}
            render={({ field }) => (
              <input {...field} type="text"
                className={`cf-input cf-input--icon ${hintOrErrCls(websiteErr)}`}
                placeholder={role === "Client"
                  ? t(currentLang, "contact", "websitePlaceholderClient")
                  : t(currentLang, "contact", "websitePlaceholderEmployer")} />
            )} />
          <span className="cf-tooltip-trigger" tabIndex={0}>
            <FontAwesomeIcon icon={faCircleInfo} />
            <span className="cf-tooltip">{t(currentLang, "contact", "websiteHint")}</span>
          </span>
        </div>
        {highlightMode === "error" && <FieldError message={errors.website?.message} />}
      </div>

      {/* Контакты */}
      <div
        data-grid="contacts"
        className={
          `cf-field cf-field--contacts ` +
          (contactsErr && !Array.isArray(errors.contacts) ? hintOrErrCls(true) : "") +
          (contactFields.length === 0 && contactsErr && highlightMode !== "none" ? " is-empty" : "")
        }
        data-cf-error={contactsErr && highlightMode !== "none" ? "true" : "false"}
      >
        <label className="cf-label">{t(currentLang, "contact", "contactsLabel")}</label>
        <div className="cf-contacts">
          {contactFields.map((field, index) => (
            <ContactRow
              key={field.id} index={index}
              control={control} currentLang={currentLang}
              onRemove={() => removeContact(index)}
              mode={highlightMode}
            />
          ))}
        </div>
        <button type="button" className="cf-add-btn"
          onClick={() => appendContact({ type: "Email", value: "" })}>
          <FontAwesomeIcon icon={faPlus} />
          {contactFields.length === 0
            ? t(currentLang, "contact", "addContact")
            : t(currentLang, "contact", "addAnotherContact")}
        </button>
        {highlightMode === "error" && contactsErr && !Array.isArray(errors.contacts) && (
          <FieldError message={errors.contacts.message} />
        )}
      </div>

      {/* Тип проекта / занятости */}
      <div data-grid="project" className={`cf-field ${hintOrErrCls(projectErr)}`}>
        <label className="cf-label">
          {role === "Client"
            ? t(currentLang, "contact", "projectTypeLabelClient")
            : t(currentLang, "contact", "projectTypeLabelEmployer")}
        </label>
        <div
          data-cf-error={projectErr && highlightMode !== "none" ? "true" : "false"}
          className={`cf-select-wrapper ${hintOrErrCls(projectErr)}`}
        >
          <Controller name="projectType" control={control}
            render={({ field }) => (
              <Select {...field} unstyled classNamePrefix="cf-select"
                isMulti options={projectOptions}
                placeholder="—" noOptionsMessage={() => "—"} />
            )} />
        </div>
        {highlightMode === "error" && <FieldError message={errors.projectType?.message} />}
      </div>

      {/* Бюджет */}
      <div data-grid="budget" className="cf-field">
        <label className="cf-label">
          {role === "Client"
            ? t(currentLang, "contact", "budgetLabelClient")
            : t(currentLang, "contact", "budgetLabelEmployer")}
        </label>
        <div className="cf-input-icon">
          <span className="cf-input-icon__ico cf-input-icon__ico--prefix">$</span>
          <Controller name="budget" control={control}
            render={({ field }) => (
              <input type="text" inputMode="numeric"
                className="cf-input cf-input--icon"
                placeholder={t(currentLang, "contact", "budgetPlaceholder")}
                value={field.value || ""}
                onChange={(e) => field.onChange(formatBudget(e.target.value))} />
            )} />
        </div>
      </div>

      {/* Описание */}
      <div data-grid="description" className="cf-field">
        <label className="cf-label">{t(currentLang, "contact", "descriptionLabel")}</label>
        <Controller name="description" control={control}
          render={({ field }) => (
            <textarea {...field} rows={5} className="cf-textarea"
              placeholder={t(currentLang, "contact", "descriptionPlaceholder")} />
          )} />
      </div>

      {/* Вложения */}
      <div data-grid="attachments" className="cf-field">
        <label className="cf-label">
          <FontAwesomeIcon icon={faFileLines} /> {t(currentLang, "contact", "attachmentsLabel")}
        </label>
        <div className="cf-attachments">
          {attachmentFields.map((field, index) => (
            <AttachmentRow
              key={field.id} index={index}
              control={control} currentLang={currentLang}
              onRemove={() => removeAttachment(index)}
              mode={highlightMode}
            />
          ))}
        </div>
        <button type="button" className="cf-add-btn"
          onClick={() => appendAttachment({ platform: "Google Drive", url: "" })}>
          <FontAwesomeIcon icon={faPlus} /> {t(currentLang, "contact", "addAttachment")}
        </button>
      </div>

      {/* Чекбокс согласия */}
      <div
        data-grid="agree"
        className={`cf-field cf-field--agree ${hintOrErrCls(agreeErr)}`}
        data-cf-error={agreeErr && highlightMode !== "none" ? "true" : "false"}
      >
        <Controller name="agree" control={control}
          render={({ field }) => (
            <label className={`cf-checkbox ${hintOrErrCls(agreeErr)}`}>
              <input type="checkbox" className="cf-checkbox__input"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur} />
              <span className={`cf-checkbox__box ${field.value ? "is-checked" : ""} ${hintOrErrCls(agreeErr)}`}>
                {field.value && <FontAwesomeIcon icon={faCheck} />}
              </span>
              <span className="cf-checkbox__label">{t(currentLang, "contact", "agreeLabel")}</span>
            </label>
          )} />
        {highlightMode === "error" && (
          <FieldError message={errors.agree?.message || t(currentLang, "contact", "errors", "agreeRequired")} />
        )}
      </div>

      {/* Капча */}
      <div data-grid="captcha" className={`cf-field cf-field--captcha ${!captchaToken ? hintOrErrCls(true) : ""}`}
        data-cf-error={!captchaToken && highlightMode !== "none" ? "true" : "false"} >
        <ReCAPTCHA sitekey="6LcjOX0tAAAAAOo-JtLgvhnjTaNAF5Ih088MAZCP" theme="dark" onChange={setCaptchaToken} />
        {highlightMode === "error" && !captchaToken && (
          <FieldError message={t(currentLang, "contact", "errors", "captcha")} />
        )}
      </div>

      {/* Сабмит + тултип ошибок
          Важно: обёртка .cf-submit-area ловит hover/click, даже когда сама кнопка визуально "заблокирована".
          На время отправки кнопка реально disabled, но тогда и смысла в hover нет. */}
      <div
        data-grid="submit"
        className="cf-submit-area"
        onMouseEnter={handleSubmitEnter}
        onMouseLeave={handleSubmitLeave}
        onFocus={handleSubmitEnter}
        onBlur={handleSubmitLeave}
      >
        <button
          type="submit"
          className={`cf-submit ${!canSubmit ? "is-disabled" : ""}`}
          disabled={submitState === "sending"}
          onClick={!canSubmit ? handleDisabledClick : undefined}
        >
          <FontAwesomeIcon
            icon={submitState === "sending" ? faSpinner : faPaperPlane}
            spin={submitState === "sending"}
          />
          {submitState === "sending"
            ? t(currentLang, "contact", "sending")
            : t(currentLang, "contact", "submit")}
        </button>

        {showTip && (
          <div className="cf-submit-tip" role="status" aria-live="polite">
            <FontAwesomeIcon icon={faCircleExclamation} />
            <span>
              {t(currentLang, "contact", "errors", pluralKey, { count: errorCount })}
              {" · "}
              {!captchaToken
                ? t(currentLang, "contact", "errors", "captcha")
                : t(currentLang, "contact", "fillRequired")}
            </span>
          </div>
        )}
      </div>

      {submitState === "error" && (
        <p className="cf-error-text">{t(currentLang, "contact", "errors", "sendFailed")}</p>
      )}
    </form>
  );
}
