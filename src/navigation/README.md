# Navigation

Web Home is a landing page: `#projects`, `#services`, `#about`, `#contact`.
Russian uses `/`, English `/en`, Ukrainian `/ua`; GitHub Pages adds
`/PashaPilat-GitSite`. Unity remains a separate placeholder branch.
`/projects` is the searchable Web catalog; `/projects/:slug` is a project page.
Both routes support the same language prefixes. Their content comes from
`getProjects()` in `src/data/projects.js`, shared with the Home cards.

`navigation.json` defines menu items. Web landing sections use automatic
positions, not fixed pixel offsets. Mark the divider for a section with
`data-scroll-section="section-id"`. The divider may be inside the section
or immediately before it (for example the services marquee).

`scroll.js` measures the divider's layout bottom and scrolls it just above
the viewport, excluding animated transforms. It accounts for Hero leaving
the flow when pinned and remeasures after scrolling. Responsive widths,
font sizes, divider heights and accordion changes require no offset tuning.
The same calculation drives header/footer links and radial active-section
tracking. Unmarked sections can still use ordinary layout offsets.

Use `<a href="#contact">` or `<GlowButton href="#projects">` without
preventDefault. `SmoothScroll` handles same-page anchors, hashes and history.
Modified clicks, downloads, external links and other routes retain native
behavior. Reduced motion disables scrolling animation.

Run `npm test` and `npm run build` for module checks and production compilation.

Ссылки меню «Контакты» ведут на `#direct-contact`: целью прокрутки служит нижний край `ContactsMarquee`. CTA «Начать», «Сделать заказ», «Обсудить» ведут на `#contact`, к форме после разделителя ContactSection. Эти назначения разделены и используют одну функцию измерения текущего положения разделителя.
