import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { code } = require('@babel/core').transformSync(
    readFileSync(new URL('../src/components/SceneManager.jsx', import.meta.url), 'utf8'),
    { babelrc: false, configFile: false, presets: ['@babel/preset-react', ['@babel/preset-env', { targets: { node: 'current' } }]] },
);

test('scene ignores queued measurements during and after route unmount', () => {
    const element = { style: {} };
    const ref = { current: element };
    const listeners = new Map();
    let cleanup, measure, disconnected = false;
    const hero = { offsetHeight: 900, classList: { add() {}, remove() {} } };
    const react = { createElement() {}, useRef: () => ref, useEffect: effect => { cleanup = effect(); } };
    const context = {
        exports: {}, require: () => react,
        document: { querySelector: () => hero },
        window: {
            innerHeight: 600, scrollY: 0,
            addEventListener: (name, callback) => listeners.set(name, callback),
            removeEventListener: name => listeners.delete(name),
        },
        ResizeObserver: class {
            constructor(callback) { measure = callback; }
            observe() {}
            disconnect() { disconnected = true; }
        },
    };
    vm.runInNewContext(code, context);
    context.exports.default();
    assert.equal(element.style.height, '900px');
    hero.offsetHeight = 1000;
    measure();
    assert.equal(element.style.height, '1000px');
    ref.current = null;
    hero.offsetHeight = 1200;
    assert.doesNotThrow(() => { measure(); listeners.get('resize')(); });
    cleanup();
    assert.doesNotThrow(() => measure());
    assert.equal(element.style.height, '1000px');
    assert.equal(disconnected, true);
    assert.equal(listeners.size, 0);
});
