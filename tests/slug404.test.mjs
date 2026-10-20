import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = new URL("../src/i18n/data/", import.meta.url);
const read = (lang, ns) =>
    JSON.parse(readFileSync(new URL(`${lang}/${ns}.json`, ROOT), "utf8"));
const catalog = JSON.parse(
    readFileSync(new URL("../src/data/projectCatalog.json", import.meta.url), "utf8")
);

const LANG = ["ru", "en", "ua"];
const BOGUS = "no-such-project-slug";

// Directions whose projects live in i18n <ns>.catalog.items[] (match by .slug)
// — pages/{GameDev,Radio,Other}/Project.jsx
const CATALOG_DIRECTIONS = ["gamedev", "radio", "other"];

test("unknown URL has a wired 404 message and back link in every language", () => {
    // NotFound.jsx reads t(lang, "common", "notFound") => { message, back }
    for (const lang of LANG) {
        const notFound = read(lang, "common").notFound;
        assert.ok(notFound, `common.notFound missing for ${lang}`);
        assert.equal(typeof notFound.message, "string");
        assert.equal(typeof notFound.back, "string");
        assert.ok(notFound.message.length > 0, `empty notFound.message for ${lang}`);
        assert.ok(notFound.back.length > 0, `empty notFound.back for ${lang}`);
    }
});

test("invalid slug yields no project for every direction (triggers the 404 branch)", () => {
    for (const lang of LANG) {
        // GameDev / Radio / Other: items.find(it => it.slug === slug)  -> undefined on miss
        for (const ns of CATALOG_DIRECTIONS) {
            const items = read(lang, ns).catalog.items;
            assert.ok(items.length > 0, `${lang}/${ns} catalog is empty`);
            assert.equal(
                items.find((it) => it.slug === BOGUS),
                undefined,
                `${lang}/${ns} matched a bogus slug`
            );
            for (const { slug } of items) {
                assert.equal(items.find((it) => it.slug === slug).slug, slug);
            }
        }

        // Software: projects.find(p => p.slug === slug); slugs are keys of software.<lang>.items
        // — see src/components/SoftWare/projects.js + src/pages/Software/Project.jsx
        const sw = Object.keys(read(lang, "software").items);
        assert.ok(sw.length > 0, `${lang}/software has no items`);
        assert.equal(sw.find((slug) => slug === BOGUS), undefined, `${lang}/software matched a bogus slug`);
        for (const slug of sw) assert.equal(sw.find((s) => s === slug), slug);

        // Web: projects.find(item => item.id === slug); ids come from the shared catalog
        // — see src/data/projects.js (getProjects) + src/pages/Web/Project.jsx
        const web = catalog.map((p) => p.id);
        assert.ok(web.length > 0);
        assert.equal(web.find((id) => id === BOGUS), undefined, `${lang}/web matched a bogus slug`);
        for (const id of web) {
            assert.equal(catalog.find((p) => p.id === id).id, id);
        }
    }
});

test("each direction exposes at least one valid slug that resolves to a project", () => {
    const gamedev = read("ru", "gamedev").catalog.items.map((it) => it.slug);
    const radio = read("ru", "radio").catalog.items.map((it) => it.slug);
    const other = read("ru", "other").catalog.items.map((it) => it.slug);
    const software = Object.keys(read("ru", "software").items);
    const web = catalog.map((p) => p.id);
    for (const [name, slugs] of [
        ["gamedev", gamedev], ["radio", radio], ["other", other],
        ["software", software], ["web", web],
    ]) {
        assert.ok(slugs.length > 0, `${name} has no slugs`);
        for (const slug of slugs) assert.ok(!BOGUS.includes(slug));
    }
});
