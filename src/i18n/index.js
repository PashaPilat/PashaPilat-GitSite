import translations from "./translations.json";

export const availableLangs = Object.keys(translations);

export const t = (lang, sectionOrKeys, ...rest) => {
  // Проверяем, не передали ли объект переменных
  let vars;
  if (
    rest.length > 0 &&
    typeof rest[rest.length - 1] === "object" &&
    !Array.isArray(rest[rest.length - 1])
  ) {
    vars = rest.pop();
  }

  if (!translations[lang]) {
    console.warn(`[i18n] Язык "${lang}" не найден`);
    return Array.isArray(sectionOrKeys)
      ? sectionOrKeys[sectionOrKeys.length - 1]
      : sectionOrKeys;
  }

  // Нормализуем путь
  let path;
  if (Array.isArray(sectionOrKeys)) {
    path = sectionOrKeys;
  } else if (
    typeof sectionOrKeys === "string" &&
    rest.length === 0 &&
    sectionOrKeys.includes(".")
  ) {
    path = sectionOrKeys.split(".");
  } else {
    path = [sectionOrKeys, ...rest];
  }

  // Достаём значение
  let result = translations[lang];
  for (const k of path) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      console.warn(
        `[i18n] Ключ "${k}" не найден по пути: ${lang}.${path.join(".")}`
      );
      return k;
    }
  }

  // Интерполяция {{var}}
  if (typeof result === "string" && vars) {
    result = result.replace(/{{\s*(\w+)\s*}}/g, (_, k) =>
      vars[k] != null ? String(vars[k]) : ""
    );
  }

  return result;
};
