import navigation from "./navigation.json";
import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";
import getPageFromPath from "../utils/getPageFromPath";
import { BASENAME } from "../config";

const getContext = (pathname = window.location.pathname) => ({
    pathname,
    lang: getLangFromPath(pathname),
    ...getPageFromPath(pathname),
});

const buildItem = (key, item, lang, namespace = "common") => {
    if (!item || typeof item !== "object") return item;

    const result = {
        key,
        ...item,
    };

    if (!result.href && result.id) {
        result.href = `#${result.id}`;
    }

    if (!result.title) {
        result.title = namespace !== "common" ? t(lang, namespace, "navigation", key) : t(lang, "common", "nav", key);
    }

    return result;
};

const buildNavigation = (data, lang, namespace = "common") => {
    if (!data || typeof data !== "object") {
        return [];
    }

    return Object.entries(data).map(([key, item]) =>
        buildItem(key, item, lang, namespace)
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
        const items = buildNavigation(currentNavigation, lang, type !== "web" ? type : "common");
        // Nested catalogs/details keep navigation pointing at existing sections.
        if (pathname.includes("/projects")) {
            const home = `${BASENAME}${lang === "ru" ? "" : `/${lang}`}${type === "software" ? "/software" : "/"}`;
            return items.map(item => type === "software" && item.key === "projects" ? item : { ...item, href: `${home}${item.href}` });
        }
        return items;
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
        return buildNavigation(result, lang, type !== "web" ? type : "common");
    }

    const key = targetPath.split(".").pop();

    const item = buildItem(key, result, lang, type !== "web" ? type : "common");

    return createItemProxy(item);
};

export default nav;
