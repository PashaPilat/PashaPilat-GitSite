import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { code } = require('@babel/core').transformSync(readFileSync(new URL('../src/services/emailService.js', import.meta.url), 'utf8'), { babelrc: false, configFile: false, presets: [['@babel/preset-env', { targets: { node: 'current' } }]] });

test('Software inquiries use their own subject, include project and CAPTCHA, and escape message HTML', async () => {
    let sent;
    const sdk = { init() {}, async send(...args) { sent = args; } };
    const context = { exports: {}, console: { log() {} }, require: () => sdk };
    vm.runInNewContext(code, context);
    await context.exports.sendContactForm({ role: 'Software', topic: 'Спонсорство', name: 'Test', contacts: [{ type: 'Email', value: 'test@example.com' }], projectType: [{ value: 'Jarvis II' }, { value: 'Спонсорство' }], description: '<script>example</script>', captchaToken: 'local-test-token' });
    const params = sent[2];
    assert.equal(params.subject, 'PlatP Software — Спонсорство');
    assert.equal(params['g-recaptcha-response'], 'local-test-token');
    assert.match(params.body, /PLATP SOFTWARE/);
    assert.match(params.body, /Jarvis II/);
    assert.match(params.body, /&lt;script&gt;example&lt;\/script&gt;/);
    assert.doesNotMatch(params.body, /РАБОТОДАТЕЛЬ/);
    await context.exports.sendContactForm({ role: 'Client' });
    assert.equal(sent[2].subject, 'Запрос на заказ с GitPage');
    assert.ok(!Object.hasOwn(sent[2], 'g-recaptcha-response'));
});
