// Webpack emits only referenced local assets and applies the deployment publicPath.
const screenshots = require.context("../../../docs/projects", false, /\.png$/);
const image = name => screenshots(`./${name}.png`);
export const softwarePath = (lang, suffix = "") => `${lang === "ru" ? "" : `/${lang}`}/software${suffix}`;
export const projects = [
    { slug: "jarvis-ii", name: "Jarvis II", tags: ["AI", "Windows", "Assistant"],
      preview: image("Jarvis-II"), concept: true,
      gallery: [1, 2, 3, 4, 5].map(n => image(`Jarvis-II ${n}`)) },
    { slug: "media-center", name: "PlatP Media Center", tags: ["Media", "Desktop", "Library"],
      preview: image("PlatP-Media-Center 2"),
      gallery: ["", " 2", " 3", " 4", " 5", " 6"].map(n => image(`PlatP-Media-Center${n}`)) },
    { slug: "creator-studio", name: "PlatP Creator Studio", tags: ["YouTube", "AI", "Creator Tools"],
      preview: image("PlatP-Creator-Studio 1"),
      gallery: ["", " 1", " 2", " 3"].map(n => image(`PlatP-Creator-Studio${n}`)) },
];
