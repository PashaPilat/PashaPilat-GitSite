// src/utils/getLangFromPath.js
import { availableLangs } from "../i18n";
import { BASENAME } from "../config";

export function getLangFromPath(pathname) {
    if (BASENAME && pathname.startsWith(BASENAME)) { pathname = pathname.slice(BASENAME.length); }
    const parts = pathname.split("/");
    const first = parts[1];
    return availableLangs.includes(first) ? first : "ru"; // дефолт русский
}
