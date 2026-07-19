// src/utils/getLangFromPath.js
import { availableLangs } from "../i18n";

export function getLangFromPath(pathname) {
    const parts = pathname.split("/");
    const first = parts[1];
    return availableLangs.includes(first) ? first : "ru"; // дефолт русский
}
