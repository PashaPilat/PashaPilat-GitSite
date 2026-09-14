import navigation from "./navigation.json";
import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";
import getPageFromPath from "../utils/getPageFromPath";

const getContext = (pathname = window.location.pathname) => ({
    pathname,
    lang: getLangFromPath(pathname),
    ...getPageFromPath(pathname),
});

const buildItem = (key, item, lang) => {
    if (!item || typeof item !== "object") return item;

    const result = {
        key,
        ...item,
    };

    if (!result.href && result.id) {
        result.href = `#${result.id}`;
    }

    if (!result.title) {
        result.title = t(lang, "nav", key);
    }

    return result;
};

const buildNavigation = (data, lang) => {
    if (!data || typeof data !== "object") {
        return [];
    }

    return Object.entries(data).map(([key, item]) =>
        buildItem(key, item, lang)
    );
};

const getByPath = (path, source) => {
    const keys = path.split(".").filter(Boolean);

    let result = source;

    for (const key of keys) {
        if (
            result &&
            typeof result === "object" &&
            Object.prototype.hasOwnProperty.call(result, key)
        ) {
            result = result[key];
        } else {
            return undefined;
        }
    }

    return result;
};

const createItemProxy = (item) => ({
    ...item,

    title: (fallback = "") => item.title ?? fallback,
    href: (fallback = "") => item.href ?? fallback,
    icon: (fallback = "") => item.icon ?? fallback,
    id: (fallback = "") => item.id ?? fallback,
    offset: (fallback = 0) => item.offset ?? fallback,
});

export const nav = (
    path = "",
    fallback = undefined,
    pathname = window.location.pathname
) => {
    const { lang, type, page } = getContext(pathname);

    if (!path) {
        const currentNavigation = navigation?.[type]?.[page];

        if (!currentNavigation) {
            console.warn(`[navigation] Навигация не найдена: ${type}.${page}`);
            return fallback ?? [];
        }
        return buildNavigation(currentNavigation, lang);
    }

    let targetPath = path;

    if (!path.includes(".")) {
        targetPath = `${type}.${page}.${path}`;
    }

    const result = getByPath(targetPath, navigation);

    if (result === undefined) {
        console.warn(`[navigation] Путь не найден: ${targetPath}`);
        return fallback;
    }

    if (
        result &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        !("id" in result)
    ) {
        return buildNavigation(result, lang);
    }

    const key = targetPath.split(".").pop();

    const item = buildItem(key, result, lang);

    return createItemProxy(item);
};

export default nav;