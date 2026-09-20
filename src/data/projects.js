import catalog from "./projectCatalog.json";
import { t } from "../i18n";
const files = require.context("../assets/images/projects", true, /\.(png|jpe?g|webp)$/i);
const galleries = Object.fromEntries(catalog.map(project => {
    const prefix = `./${project.imageFolder || project.id}/`;
    const images = files.keys().filter(key => key.startsWith(prefix))
        .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
        .map(key => files(key));
    return [project.id, images];
}));
export const projectImages = Object.fromEntries(Object.entries(galleries).map(([id, images]) => [id, images[0]]));
export const getProjects = (lang) => catalog.map(project => ({
    ...project,
    ...t(lang, "projects", "items", project.id),
    images: galleries[project.id],
    image: galleries[project.id][0],
    year: project.period,
    description: t(lang, "projects", "items", project.id).summary,
}));
