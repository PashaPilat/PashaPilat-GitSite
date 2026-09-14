import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as geometry from '../src/navigation/scrollGeometry.mjs';

const require = createRequire(import.meta.url);
const config = JSON.parse(readFileSync(new URL('../src/navigation/navigation.json', import.meta.url)));
const { code } = require('@babel/core').transformSync(
    readFileSync(new URL('../src/navigation/scroll.js', import.meta.url), 'utf8'),
    { babelrc: false, configFile: false, presets: [['@babel/preset-env', { targets: { node: 'current' } }]] },
);

function setup({ lenis = true, reduced = false, pinnedHeroHeight = 0, insideMain = true } = {}) {
    const calls = [];
    const elements = Object.fromEntries(Object.values(config.web.home).map(item => [item.id, {
        offsetTop: 3000 - pinnedHeroHeight,
        offsetParent: { offsetTop: 1000, offsetParent: null },
        closest: () => insideMain ? {} : null,
        getBoundingClientRect() { throw new Error('Animated geometry must not be used'); },
    }]));
    const context = {
        exports: {},
        document: {
            getElementById: id => elements[id],
            querySelector: () => pinnedHeroHeight ? { offsetHeight: pinnedHeroHeight } : null,
        },
        window: {
            scrollY: 1500,
            matchMedia: () => ({ matches: reduced }),
            scrollTo: options => calls.push(options),
            lenis: lenis ? { scrollTo: (position, options) => calls.push({ position, ...options }) } : null,
        },
        require: name => name === './navigate'
            ? { nav: () => Object.values(config.web.home).map(item => ({ ...item, href: `#${item.id}` })) }
            : geometry,
    };
    vm.runInNewContext(code, context);
    return { ...context.exports, calls };
}

test('every configured landing section uses its offset and layout coordinates', () => {
    const app = setup();
    for (const item of Object.values(config.web.home)) {
        assert.equal(app.scrollToSection(`#${item.id}`), true);
        assert.equal(app.calls.at(-1).position, 4000 + item.offset);
    }
});

test('native fallback reaches the same section; reduced motion is immediate', () => {
    const app = setup({ lenis: false, reduced: true });
    app.scrollToSection('#services');
    assert.equal(app.calls[0].top, 4000 + config.web.home.services.offset);
    assert.equal(app.calls[0].behavior, 'instant');
    const animated = setup({ reduced: true });
    animated.scrollToSection('#contact');
    assert.equal(animated.calls[0].immediate, true);
});

test('missing or malformed anchors do not scroll; top always works', () => {
    const app = setup();
    assert.equal(app.scrollToSection('#missing'), false);
    assert.equal(app.scrollToSection('#%broken'), false);
    assert.equal(app.calls.length, 0);
    assert.equal(app.scrollToSection('#top'), true);
    assert.equal(app.calls[0].position, 0);
});

test('offset override accepts zero and coordinates never become negative', () => {
    const app = setup();
    app.scrollToSection('#projects', { offset: 0 });
    assert.equal(app.calls[0].position, 4000);
    assert.equal(geometry.getSectionPosition({ offsetTop: 10 }, -100), 0);
    assert.equal(geometry.getScrollDuration(20000), 6);
});

test('anchor interception respects GitHub Pages, language, queries and external links', () => {
    const current = 'https://pashapilat.github.io/PashaPilat-GitSite/en?preview=1';
    const anchor = (href, options = {}) => ({ href, target: '', hasAttribute: () => false, ...options });
    assert.equal(geometry.getSamePageHash(anchor('#contact'), current), '#contact');
    assert.equal(geometry.getSamePageHash(anchor(`${current}#projects`), current), '#projects');
    for (const href of ['/projects/demo#contact', '/PashaPilat-GitSite/ua#contact', 'https://example.com/#contact', '?other=1#contact']) {
        assert.equal(geometry.getSamePageHash(anchor(href), current), null);
    }
    assert.equal(geometry.getSamePageHash(anchor('#contact', { target: '_blank' }), current), null);
    assert.equal(geometry.getSamePageHash(anchor('#contact', { hasAttribute: () => true }), current), null);
});

test('header before Hero pinning and radial navigation inside projects reach the same positions', () => {
    const header = setup();
    for (const pinnedHeroHeight of [1836, 1474, 1909]) {
        const radial = setup({ pinnedHeroHeight });
        for (const item of Object.values(config.web.home)) {
            header.scrollToSection(`#${item.id}`);
            radial.scrollToSection(`#${item.id}`);
            assert.equal(radial.calls.at(-1).position, header.calls.at(-1).position);
        }
    }
});

test('Hero compensation does not affect top or elements outside the landing main', () => {
    const app = setup({ pinnedHeroHeight: 1836, insideMain: false });
    app.scrollToSection('#contact');
    assert.equal(app.calls.at(-1).position, 4000 - 1836 + config.web.home.contact.offset);
    app.scrollToSection('#top');
    assert.equal(app.calls.at(-1).position, 0);
});
