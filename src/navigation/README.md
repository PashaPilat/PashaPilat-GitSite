# Navigation

The site has Web and Unity branches, optionally prefixed by a language.
Russian uses `/`, English `/en`, Ukrainian `/ua`. GitHub Pages adds the
router basename `/PashaPilat-GitSite`.

Web Home is a landing page: `#projects`, `#services`, `#about`, `#contact`.
The contact section contains the form and `#direct-contact` contact details.
`/projects` (all projects) and `/projects/:slug` (English project slug) are
planned separate Web pages; their routes and content are not implemented yet.
Unity remains a placeholder.

`navigation.json` is the source of menu items and section offsets. Keep
offsets there, not in individual buttons. A negative offset scrolls above
the section's layout start. Existing values are preserved.

Use normal anchors such as `<a href="#contact">` or
`<GlowButton href="#projects">`. `SmoothScroll`, mounted inside the router,
handles same-page anchors, URL hashes and browser history. Modified clicks,
downloads, external links and links to other pages retain native behavior.
Do not preventDefault in section links: their local handlers may close menus,
but the central handler must receive the click.

`scroll.js` is the shared programmatic scroll API. `scrollGeometry.mjs`
provides layout coordinates without CSS transforms. `scroll.js` also restores
Hero's flow contribution after SceneManager pins it, keeping the same reference
position as navigation from the top of the page. Both scrolling and active-section
tracking use this calculation. Without Lenis, the native
fallback uses the same coordinates. Reduced motion disables scroll animation.

Run `npm test` for navigation checks and `npm run build` for production compilation.
