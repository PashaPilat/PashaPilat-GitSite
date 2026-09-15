import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectProjects, PAGE_SIZE } from '../src/data/projectQuery.mjs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const catalog = read('../src/data/projectCatalog.json');
const groups = read('../src/data/technologyGroups.json');
const en = read('../src/data/projects/en.json');
const projects = catalog.map(p => ({ ...p, ...en[p.id] }));
test('every project has complete translations, categorized technologies and key stack', () => {
 assert.equal(new Set(catalog.map(p=>p.id)).size, 18);
 for (const lang of ['ru','ua','en']) { const content = read(`../src/data/projects/${lang}.json`); assert.deepEqual(Object.keys(content).sort(),catalog.map(p=>p.id).sort()); for(const p of catalog) for(const key of ['title','summary','body','role']) assert.ok(content[p.id][key]?.length > 0); }
 for(const p of catalog) { for(const tech of p.tech) assert.ok(Object.values(groups).flat().includes(tech), tech); for(const tech of p.keyTech) assert.ok(p.tech.includes(tech), `${p.id}: ${tech}`); }
});
test('search is trimmed and case insensitive; technology selections intersect', () => {
 assert.equal(selectProjects(projects,{query:'  HMH  '})[0].id,'hmh-expert');
 const result=selectProjects(projects,{technologies:['Laravel','React']}); assert.deepEqual(result.map(p=>p.id),['hmh-expert']);
 assert.equal(selectProjects(projects,{query:'no-such-project-123'}).length,0);
});
test('year and alphabet sorts preserve complete result set; four items per page', () => {
 const oldest=selectProjects(projects,{sort:'oldest'}); assert.equal(oldest[0].id,'fifth-ocean');
 const newest=selectProjects(projects); assert.equal(newest[0].id,'hmh-expert');
 const az=selectProjects(projects,{sort:'az'}); assert.deepEqual(selectProjects(projects,{sort:'za'}).map(p=>p.id),az.map(p=>p.id).reverse());
 assert.equal(PAGE_SIZE,4); assert.equal(Math.ceil(projects.length/PAGE_SIZE),5); assert.equal(newest.slice(4*PAGE_SIZE).length,2);
});
