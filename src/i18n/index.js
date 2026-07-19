import translations from "./translations.json";

// список доступных языков
export const availableLangs = Object.keys(translations);

// универсальная функция перевода с поддержкой множественной вложенности
export const t = (lang, section, ...keys) => {
    if (!translations[lang]) {
        console.warn(`[i18n] Язык "${lang}" не найден`);
        return keys[keys.length - 1]; // дефолт — сам ключ
    }

    let result = translations[lang][section];
    if (!result) {
        console.warn(`[i18n] Секция "${section}" не найдена для языка "${lang}"`);
        return keys[keys.length - 1];
    }

    for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
            result = result[k];
        } else {
            console.warn(
                `[i18n] Ключ "${k}" не найден по пути: ${lang}.${section}.${keys.join(".")}`
            );
            return k; // дефолт — сам ключ
        }
    }

    return result;
};
