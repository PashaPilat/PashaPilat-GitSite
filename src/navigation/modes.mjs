export const modes = [
    { id: "web", label: "Web", path: "/" },
    { id: "gamedev", label: "GameDev", path: "/gamedev" },
    { id: "software", label: "SoftWare", path: "/software" },
    { id: "radio", label: "Radio", path: "/radio" },
    { id: "other", label: "Other", path: "/other" },
];
export function modeIndexFromPath(pathname) {
    const segments = pathname.split("/").filter(Boolean);
    return Math.max(0, modes.findIndex(mode => mode.id !== "web" && segments.includes(mode.id)));
}
export function modePath(index, lang = "ru") {
    return (lang === "ru" ? "" : "/" + lang) + modes[index].path;
}
