import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createTranslator } from '../src/i18n/translator.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseSync, traverse } = require('@babel/core');

const root = new URL('../src/i18n/data/', import.meta.url);
const resources = Object.fromEntries(readdirSync(root).map(lang => [lang,
  Object.fromEntries(readdirSync(new URL(`${lang}/`, root)).map(file => [file.slice(0, -5),
    JSON.parse(readFileSync(new URL(`${lang}/${file}`, root), 'utf8'))]))
]));
const t = createTranslator(resources);
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, shape(value[k])]));
  assert.notEqual(value, '', 'Empty translation');
  if (typeof value === 'string') assert.ok(!/\?{3}/.test(value), 'Damaged translation encoding');
  return typeof value;
}
test('all languages have the same pages, keys and value types', () => {
  for (const resource of Object.values(resources)) assert.deepEqual(shape(resource), shape(resources.en));
});
test('literal translation paths used by components exist in every language', () => {
  function scan(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) { scan(url); continue; }
      if (!/\.(js|jsx)$/.test(entry.name)) continue;
      const ast = parseSync(readFileSync(url, 'utf8'), { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
      traverse(ast, { CallExpression({ node }) {
        if (node.callee.name !== 't') return;
        const keys = [];
        for (const arg of node.arguments.slice(1)) {
          if (arg.type !== 'StringLiteral') break;
          keys.push(...arg.value.split('.'));
        }
        if (!keys.length) return;
        for (const [lang, resource] of Object.entries(resources)) {
          let value = resource;
          for (const key of keys) {
            assert.ok(value != null && Object.hasOwn(value, key), `${url.pathname}: ${lang}.${keys.join('.')}`);
            value = value[key];
          }
        }
      } });
    }
  }
  scan(new URL('../src/', import.meta.url));
});
test('page namespaces resolve strings, arrays, objects and interpolation', () => {
  assert.equal(t('en', 'gamedev.hero.title'), resources.en.gamedev.hero.title);
  assert.equal(t('ua', 'home', 'projectsFeaturedTitle'), resources.ua.home.projectsFeaturedTitle);
  assert.equal(t('ru', ['projects', 'items']), resources.ru.projects.items);
  assert.equal(t('en', 'home', 'projectsFeatured'), resources.en.home.projectsFeatured);
  assert.equal(t('en', 'home', 'contact', 'errors', 'count_many', { count: 3 }), '3 required fields left');
});
