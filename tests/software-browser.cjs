// Real Chrome smoke check against the production build and GitHub Pages 404 flow.
// Run: node tests/software-browser.cjs (Chrome must be installed).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = '/PashaPilat-GitSite';
const origin = 'http://pashapilat.github.io:4173';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket;
let redirects = 0;
const errors = [];
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
    const relative = pathname.startsWith(base + '/') ? pathname.slice(base.length + 1) : '';
    let file = path.resolve(root, 'dist', relative || 'index.html');
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(root, 'dist', '404.html'); redirects++; res.statusCode = 404;
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.png') ? 'image/png' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
async function main() {
    fs.mkdirSync(path.join(root, 'logs'), { recursive: true });
    await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
    browser = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new', '--no-first-run', '--no-default-browser-check', '--no-proxy-server',
        '--host-resolver-rules=MAP pashapilat.github.io 127.0.0.1', '--remote-debugging-port=9225',
        `--user-data-dir=${path.join(root, 'logs', 'software-chrome-profile')}`, 'about:blank'
    ], { stdio: 'ignore', windowsHide: true });
    browser.on('error', error => errors.push(error.message));
    let target;
    for (let i = 0; i < 100; i++) {
        try { target = (await (await fetch('http://127.0.0.1:9225/json')).json()).find(t => t.type === 'page'); if (target) break; } catch {}
        await delay(100);
    }
    assert.ok(target, 'Chrome debugging endpoint');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let next = 0; const pending = new Map();
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
        if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || JSON.stringify(message.params.exceptionDetails));
        if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(JSON.stringify(message.params.args));
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++next; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
    const until = async expression => { for (let i = 0; i < 100; i++) { try { if (await evaluate(expression)) return; } catch (error) { if (error.code !== -32000) throw error; } await delay(100); } throw new Error(`Timed out: ${expression}`); };
    const go = async route => { await send('Page.navigate', { url: origin + base + route }); await until(`location.pathname === ${JSON.stringify(base + route.split(/[?#]/)[0])} && !!document.querySelector('h1')`); await delay(200); };
    const click = async selector => {
        await until(`!!document.querySelector(${JSON.stringify(selector)})`);
        await evaluate(`window.lenis?.stop(); document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
        await delay(100);
        const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getClientRects()[0];return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
        const hit = await evaluate(`(()=>{const e=document.elementFromPoint(${point.x},${point.y}); return {matches:!!e && (e.matches(${JSON.stringify(selector)}) || !!e.closest(${JSON.stringify(selector)})), tag:e?.tagName, className:e?.className, y:scrollY, point:${JSON.stringify(point)}}})()`);
        assert.ok(hit.matches, `Click target obscured for ${selector}: ${JSON.stringify(hit)}`);
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
        await evaluate('window.lenis?.start()');
    };
    const shot = async (name, selector) => {
        await delay(200);
        if (selector) { await evaluate(`window.lenis?.stop(); document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`); await delay(1200); }
        const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(root, 'logs', name + '.png'), Buffer.from(data, 'base64'));
        if (selector) await evaluate('window.lenis?.start()');
    };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await go('/software');
    const softwareRu = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/data/ru/software.json'), 'utf8'));
    assert.equal(await evaluate("document.querySelector('h1').textContent"), softwareRu.hero.title);
    assert.equal(await evaluate("document.querySelectorAll('.software-directions .hero-stats-item').length"), 4);
    assert.equal(await evaluate("document.querySelectorAll('.software-philosophy__chapter').length"), 6);
    const expectedParagraphs = [...softwareRu.philosophy.intro, ...softwareRu.philosophy.sections.flatMap(s => s.paragraphs)].map(p => p.replace(/\*\*/g, ''));
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.software-philosophy__intro > p, .software-philosophy__chapter > p:not(.software-eyebrow)')].map(p=>p.textContent)"), expectedParagraphs);
    assert.equal(await evaluate("document.querySelectorAll('.software-faq details').length"), 5);
    await shot('software-landing-1440');
    await click('.software-hero__buttons a[href="#philosophy"]');
    await until("location.hash === '#philosophy'");
    await evaluate("window.lenis?.scrollTo(document.querySelector('#philosophy'),{immediate:true})");
    await shot('software-philosophy-1440');
    await click('.software-philosophy__toc a[href="#philosophy-3"]');
    await until("location.hash === '#philosophy-3'");
    assert.ok(await evaluate("document.querySelector('#philosophy-3').textContent.includes('Искусственный интеллект')"));
    await evaluate("document.querySelector('.software-faq summary').focus()");
    assert.equal(await evaluate('document.activeElement.tagName'), 'SUMMARY');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await until("document.querySelector('.software-faq details').open");
    await evaluate("window.lenis?.scrollTo(document.querySelector('#faq'),{immediate:true})");
    await shot('software-faq-1440', '#faq');
    assert.equal(await evaluate("document.querySelectorAll('.site-footer').length"), 1);
    assert.equal(await evaluate("document.querySelectorAll('.navbar .nav-links a').length"), 4);
    assert.equal(await evaluate("document.querySelectorAll('.scroll-top__nav-link').length"), 4);
    await evaluate("window.lenis?.scrollTo(document.querySelector('#philosophy'),{immediate:true})");
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1366, y: 926 });
    await until("!!document.querySelector('.scroll-top.is-visible')");
    await delay(1600);
    const upPoint = await evaluate("(()=>{const r=document.querySelector('.scroll-top__btn').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...upPoint });
    await until("document.querySelector('.scroll-top__nav').getAttribute('aria-hidden') === 'false'");
    await delay(2100);
    await shot('software-scroll-navigation-1440');
    await click('.scroll-top__nav-link[href="#faq"]');
    await until("location.hash === '#faq'");
    await click('.burger-btn-open'); await until("!!document.querySelector('.nav-controls.open')");
    await click('.navbar .nav-links a[href="#contact"]');
    await until("location.hash === '#contact' && !!document.querySelector('.software-contact-form')");
    await until("!!document.querySelector('.nav-controls.close')");
    assert.equal(await evaluate("document.querySelectorAll('.software-contact-form select[name=topic] option:not([disabled])').length"), 5);
    await evaluate("(()=>{const f=document.querySelector('.software-contact-form');f.elements.name.value='Browser check';f.elements.email.value='test@example.com';f.elements.topic.value='sponsor';f.elements.message.value='Local validation only; no message will be sent.';f.elements.agree.checked=true;f.requestSubmit()})()");
    await until("!!document.querySelector('.software-contact-form [role=alert]')");
    assert.match(await evaluate("document.querySelector('.software-contact-form [role=alert]').textContent"), /робот/);
    await shot('software-contact-1440', '#contact');
    console.log('PASS full navigation, footer, contact form topics and CAPTCHA guard; no message sent');
    for (const [prefix, locale] of [['', 'ru'], ['/en', 'en'], ['/ua', 'ua']]) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false });
        await go(`${prefix}/software`);
        const resource = JSON.parse(fs.readFileSync(path.join(root, `src/i18n/data/${locale}/software.json`), 'utf8'));
        assert.equal(await evaluate("document.querySelector('h1').textContent"), resource.hero.title);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Landing mobile layout has no overflow');
        await shot(`software-landing-${locale}-390`);
        await evaluate("window.lenis?.scrollTo(document.querySelector('#philosophy'),{immediate:true})");
        await shot(`software-philosophy-${locale}-390`);
        await evaluate("window.lenis?.scrollTo(document.querySelector('#faq'),{immediate:true})");
        await shot(`software-faq-${locale}-390`, '#faq');
        assert.equal(await evaluate("document.querySelector('.software-contact-form select[name=topic] option[value=sponsor]').textContent"), resource.contactForm.topics[0].label);
        await shot(`software-contact-${locale}-390`, '#contact');
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Contact mobile layout has no overflow');
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await go('/software');
    assert.equal(await evaluate("document.querySelectorAll('.software-card').length"), 3);
    await click('.software-hero__content .glow-button');
    await until("location.hash === '#projects'");
    await click('.software-section-heading > a');
    await until("location.pathname.endsWith('/software/projects')");
    for (const [width, columns] of [[1440, 3], [900, 2], [390, 1]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        await evaluate('window.scrollTo(0,0)');
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.software-grid')).gridTemplateColumns.split(' ').length"), columns);
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No horizontal overflow');
        await until("[...document.querySelectorAll('.software-card img')].every(i=>i.complete && i.naturalWidth>0)");
        await shot(`software-catalog-${width}`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    for (const slug of ['jarvis-ii', 'media-center', 'creator-studio']) {
        await click(`.software-card__body a[href$='/${slug}']`);
        await until(`location.pathname.endsWith('/${slug}') && !!document.querySelector('.software-product-hero')`);
        assert.equal(await evaluate("document.querySelectorAll('.software-product-sections section').length"), 4);
        assert.equal(await evaluate("document.querySelectorAll('.site-footer').length"), 1);
        assert.equal(await evaluate("document.querySelectorAll('.scroll-top').length"), 0);
        await until("document.querySelector('.software-product-hero img').naturalWidth>0");
        await shot(`software-${slug}`);
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false });
        assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Product mobile layout has no overflow');
        await evaluate("document.querySelector('.software-gallery').scrollIntoView()");
        await until("[...document.querySelectorAll('.software-gallery img')].every(i=>i.complete && i.naturalWidth>0)");
        const galleryLinks = await evaluate("[...document.querySelectorAll('.software-gallery a')].map(a=>a.href)");
        for (const href of galleryLinks) assert.equal((await fetch(href.replace(origin, 'http://127.0.0.1:4173'))).status, 200);
        await shot(`software-${slug}-mobile-gallery`);
        await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
        await send('Page.reload');
        await until(`location.pathname.endsWith('/${slug}') && !!document.querySelector('.software-product-hero')`);
        await click('.software-page__content > .software-link');
        await until("location.pathname.endsWith('/software/projects') && document.querySelectorAll('.software-card').length === 3");
        console.log(`PASS card, details, reload, back: ${slug}`);
    }
    await go('/software/projects/jarvis-ii');
    await click('.burger-btn-open');
    await until("!!document.querySelector('.nav-controls.open')");
    // Select by text so locale discovery order does not determine the test.
    for (const [lang, prefix, heading] of [['EN', '/en', 'About the project'], ['UA', '/ua', 'Про проєкт'], ['RU', '', 'О проекте']]) {
        if (!await evaluate("!!document.querySelector('.nav-controls.open')")) { await click('.burger-btn-open'); await until("!!document.querySelector('.nav-controls.open')"); }
        await click('.lang-switcher .current');
        await evaluate(`document.querySelectorAll('.lang-switcher .dropdown li').forEach(li=>{if(li.textContent.trim()===${JSON.stringify(lang)})li.click()})`);
        await until(`location.pathname === ${JSON.stringify(base + prefix + '/software/projects/jarvis-ii')}`);
        assert.equal(await evaluate("document.querySelector('.software-product-sections h2').textContent"), heading);
        console.log(`PASS language switch retaining project: ${lang}`);
    }
    for (const prefix of ['', '/en', '/ua']) for (const slug of ['jarvis-ii', 'media-center', 'creator-studio']) {
        await go(`${prefix}/software/projects/${slug}?check=1#top`);
        assert.equal(await evaluate('location.search + location.hash'), '?check=1#top');
        assert.ok(await evaluate("!!document.querySelector('.software-product-hero')"));
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await go('/software');
    await evaluate("window.lenis?.scrollTo(document.querySelector('.software-directions'),{immediate:true})");
    await until("[...document.querySelectorAll('.software-directions .hero-stat-label')].every(el=>getComputedStyle(el).opacity==='1')");
    assert.equal(await evaluate("document.querySelectorAll('.software-directions .hero-stat-value').length"), 0);
    await shot('software-directions-1440', '.software-directions');
    console.log('PASS direction cards reveal, no numeric metrics');
    await go('/software/projects/unknown');
    assert.equal(await evaluate("document.querySelector('h1').textContent"), 'Проект не найден');
    for (const route of ['/', '/gamedev', '/radio', '/other', '/projects', '/software/projects']) {
        await go(route);
        assert.equal(await evaluate("document.querySelectorAll('.site-footer').length"), 1, `One footer: ${route}`);
        assert.equal(await evaluate("document.querySelectorAll('.scroll-top').length"), 1, `Scroll navigation: ${route}`);
        if (route === '/') {
            await shot('web-footer-1440', '.site-footer');
            await until("getComputedStyle(document.querySelector('.site-footer__brand')).opacity === '1'");
            assert.ok(await evaluate("(()=>{const el=document.querySelector('.site-footer__brand'),r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()"), 'Web footer visible above pinned hero');
        }
    }
    for (const page of ['gamedev', 'radio', 'other']) {
        for (const [prefix, locale] of [['', 'ru'], ['/en', 'en'], ['/ua', 'ua']]) {
            await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
            await go(`${prefix}/${page}`);
            const resource = JSON.parse(fs.readFileSync(path.join(root, `src/i18n/data/${locale}/${page}.json`), 'utf8'));
            assert.equal(await evaluate("document.querySelector('h1').textContent"), resource.hero.title);
            assert.equal(await evaluate("document.querySelectorAll('.direction-stats .hero-stats-item').length"), 4);
            assert.equal(await evaluate("document.querySelectorAll('.direction-project-card').length"), 3);
            assert.equal(await evaluate("document.querySelectorAll('.software-philosophy__chapter').length"), 3);
            assert.equal(await evaluate("document.querySelectorAll('.software-faq details').length"), 5);
            assert.equal(await evaluate("document.querySelectorAll('.software-contact-form select[name=topic] option:not([disabled])').length"), 5);
            assert.equal(await evaluate("document.querySelectorAll('.site-footer').length"), 1);
            assert.equal(await evaluate("document.querySelectorAll('.scroll-top').length"), 1);
            assert.ok(await evaluate("!!document.querySelector('.hero-wrapper canvas')"), 'Existing background retained');
            await click('.direction-hero-content .glow-button');
            await until("location.hash === '#projects'");
            if (locale === 'ru') {
                await shot(`${page}-projects-1440`, '#projects');
                await shot(`${page}-philosophy-1440`, '#philosophy');
                await shot(`${page}-contact-1440`, '#contact');
            }
            await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false });
            await shot(`${page}-${locale}-hero-390`, '#top');
            assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${page}/${locale} no mobile overflow`);
            if (locale === 'ru') {
                await shot(`${page}-projects-390`, '#projects');
                await shot(`${page}-contact-390`, '#contact');
                assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${page} contact no overflow`);
            }
            console.log(`PASS direction scaffold, contact, locale, desktop/mobile: ${page}/${locale}`);
        }
    }
    assert.ok(redirects >= 10, 'Actual Pages 404 redirect exercised');
    assert.deepEqual(errors, [], 'No browser exceptions or console errors');
    console.log(`PASS layout 3/2/1, screenshots, all locales, direct URLs, query/hash, unknown slug, Pages redirects=${redirects}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); await delay(200); socket.close(); }
    if (browser) browser.kill(); server.close(); server.closeAllConnections();
});
