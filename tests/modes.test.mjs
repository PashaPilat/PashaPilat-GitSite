import test from 'node:test';
import assert from 'node:assert/strict';
import { modes, modeIndexFromPath, modePath } from '../src/navigation/modes.mjs';

test('five directions retain their order and language when navigating', () => {
    assert.deepEqual(modes.map(mode => mode.label), ['Web', 'GameDev', 'SoftWare', 'Radio', 'Other']);
    assert.deepEqual(modes.map((_, index) => modePath(index)), ['/', '/gamedev', '/software', '/radio', '/other']);
    for (const lang of ['ru', 'ua', 'en']) {
        modes.forEach((mode, index) => {
            const path = modePath(index, lang);
            assert.equal(modeIndexFromPath(path), index);
            assert.equal(modeIndexFromPath('/PashaPilat-GitSite' + path), index);
            assert.equal(modeIndexFromPath(path + '/'), index);
        });
    }
});

test('Web project pages do not accidentally select a direction by substring', () => {
    assert.equal(modeIndexFromPath('/en/projects/radio-tool'), 0);
    assert.equal(modeIndexFromPath('/projects'), 0);
});
