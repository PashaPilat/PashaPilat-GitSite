export const PAGE_SIZE = 4;
export function selectProjects(projects, { query = "", technologies = [], sort = "newest", lang = "en" } = {}) {
    const locale = lang === "ua" ? "uk" : lang;
    const needle = query.trim().toLocaleLowerCase(locale);
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
    const result = projects.filter(project => technologies.every(tech => project.tech.includes(tech)) &&
        `${project.title} ${project.summary} ${project.body} ${project.tech.join(" ")}`.toLocaleLowerCase(locale).includes(needle));
    return result.sort((a, b) => {
        const names = collator.compare(a.title, b.title);
        if (sort === "az") return names;
        if (sort === "za") return -names;
        const years = a.yearStart - b.yearStart;
        return (sort === "oldest" ? years : -years) || names;
    });
}
