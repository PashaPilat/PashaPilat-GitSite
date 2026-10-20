# AGENTS.md — PashaPilat-GitSite

## Overview

A React-based portfolio website for Pasha Pilat, deployed on GitHub Pages at
`https://PashaPilat.github.io/PashaPilat-GitSite/`. Built with Webpack 5,
Babel, SCSS, and Node.js test runner. The site is organized into five
"directions" (sections): Web, GameDev, SoftWare, Radio, and Other. Each
direction has a landing page and individual project pages. The UI is primarily
in Russian, with English and Ukrainian localizations available via URL prefixes.

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework    | React 19, React DOM, React Router v7|
| Build        | Webpack 5, Babel, SCSS              |
| Styling      | Sass (SCSS), CSS Modules via webpack |
| i18n         | Custom translation system (i18next-style `t()` helper), JSON resources |
| 3D           | Three.js, @react-three/fiber          |
| Forms        | react-hook-form, yup, @hookform/resolvers |
| UI Icons     | @fortawesome/fontawesome-free          |
| Animation    | GSAP-like custom hooks, IntersectionObserver, Lenis (smooth scroll) |
| Contact      | @emailjs/browser (email via EmailJS) |
| Deploy       | gh-pages (`npm run deploy`)          |
| Tests        | Node.js built-in test runner         |

## Project Structure

```
src/
├── App.jsx              # Root component: Router, Routes, Pages, PageChrome
├── index.js             # Entry point; creates React root, restores 404 redirect path
├── config.js            # BASENAME (GitHub Pages vs localhost)
├── i18n/
│   ├── index.js         # Loads all translations via require.context, exports t()
│   ├── translator.mjs   # createTranslator: path-access + {{var}} interpolation
│   ├── README.md        # i18n documentation
│   └── data/{ru,en,ua}/ # 7 JSON namespaces per language
├── navigation/
│   ├── modes.mjs        # modes array + modeIndexFromPath + modePath
│   ├── navigate.js      # nav() function: builds nav items from navigation.json + translations
│   ├── navigation.json  # Navigation structure (ids, icons, offsets per direction)
│   ├── scroll.js        # scrollToSection: Lenis-powered scroll with corrections
│   └── scrollGeometry.mjs
├── data/
│   ├── projectCatalog.json   # Web project metadata (18 projects)
│   ├── technologyGroups.json # 7 tech categories with colors
│   └── projects.js          # getProjects(lang): merges catalog + i18n
├── components/
│   ├── SoftWare/         # Software direction: catalog, project pages, lightbox
│   ├── Home/             # Home page sections: Hero, Navigation, About, Services, Contact
│   ├── GameDev/          # GameDev Hero + FluidBackground
│   ├── Radio/            # Radio Hero + 3D backgrounds
│   ├── Other/            # Other Hero + 3D backgrounds
│   ├── NotFound.jsx      # 404 page
│   ├── PageChrome.jsx    # Footer + ScrollTopButton (renders outside routes)
│   ├── SmoothScroll.jsx  # Lenis initialization
│   ├── SceneManager.jsx  # Hero pinning + skew on scroll
│   ├── LanguageSwitcher.jsx
│   ├── ToggleMode.jsx    # Direction switcher
│   └── ...
├── pages/
│   ├── Web/   Home.jsx, Projects.jsx, Project.jsx
│   ├── GameDev/ GameDev.jsx, Project.jsx
│   ├── Software/ Software.jsx, Project.jsx
│   ├── Radio/ Radio.jsx, Project.jsx
│   └── Other/ Other.jsx, Project.jsx
├── services/
│   └── emailService.js   # EmailJS contact form (Client/Employer/Software roles)
├── styles/
│   ├── main.scss          # Global styles
│   ├── variables.scss     # Colors, fonts, breakpoints, mixins
│   ├── animations.scss    # Keyframe animations
│   ├── pages/             # Page-level styles (software.scss, projects.scss, etc.)
│   └── components/        # Component-scoped styles
├── utils/
│   ├── getLangFromPath.js  # Extracts lang from URL path
│   └── getPageFromPath.js # Maps path to direction/page type
└── assets/icons/           # Favicons and icons

## Key Concepts

### Routing (src/App.jsx)

- BrowserRouter with `basename={BASENAME}` (empty on localhost, `/PashaPilat-GitSite` on GitHub Pages)
- Three directions rendered explicitly + lang-prefixed versions via loop for `ru`, `en`, `ua`
- `ru` uses no URL prefix (root paths); `en` and `ua` use `/{lang}/` prefix
- Catch-all `*` route renders `NotFound`
- Legacy redirects: `/unity` → `/gamedev`, `/develop` → `/software`

### i18n

- 3 languages: `ru`, `en`, `ua` (defined in `src/i18n/index.js`)
- 7 namespaces: `common`, `home`, `projects`, `gamedev`, `software`, `radio`, `other`
- Translation files auto-discovered via `require.context` in `src/i18n/index.js`
- Access translations: `t(lang, namespace, ...keys)` or `t(lang, "namespace.key.path")`
- Test `tests/i18n.test.mjs` enforces structural parity across all languages and validates
  that all `t()` call sites in components resolve in every language

### Data Layer

- `projectCatalog.json`: 18 web projects with ids, period, yearStart/End, tech, keyTech
- `technologyGroups.json`: 7 technology groups with colors
- `projectQuery.mjs`: `selectProjects()` with search, tech filter, sort (PAGE_SIZE=4)
- `src/components/SoftWare/projects.js`: 3 software projects with screenshots from `docs/projects/`
- `src/components/SoftWare/projectDetails.js`: Detailed per-project data (gallery, roadmap, stack, markdown descriptions)
- Per-direction catalogs (gamedev, radio, other) live in i18n JSON `catalog.items[]`

### Pages

| Section   | Landing Page     | Project Page     | Data Source                    |
|-----------|------------------|------------------|--------------------------------|
| Web       | pages/Web/Home   | pages/Web/Project | projectCatalog.json + i18n  |
| GameDev   | pages/GameDev     | pages/GameDev/Project | i18n/gamedev.json         |
| Software  | pages/Software    | pages/Software/Project | projects.js + projectDetails.js |
| Radio     | pages/Radio       | pages/Radio/Project   | i18n/radio.json             |
| Other     | pages/Other       | pages/Other/Project   | i18n/other.json             |

## Development

```bash
npm start        # webpack serve --mode development (port 3000)
npm run build    # webpack --mode production → dist/
npm run deploy   # gh-pages deploy (runs build first)
npm test         # node --test tests/*.test.mjs
```

### Build Configuration

- Webpack config: `webpack.config.js` (function form for env/argv access)
- Output: `dist/bundle.js` with `publicPath` set per environment
- Loaders: babel-loader (JS/JSX), sass-loader, css-loader, style-loader, asset/resource (images/fonts)
- HtmlWebpackPlugin generates `index.html` from `public/index.html`
- 404.html copied to dist for SPA routing on GitHub Pages
- PostCSS not used; pure SCSS imports

### Code Conventions

- Components are named function components exported as default
- Language is derived per-page: `const lang = getLangFromPath(useLocation().pathname)`
- Translation access pattern: `t(lang, "namespace", "key1", "key2")` or dot-notation string
- All `t()` call sites are verified by `tests/i18n.test.mjs` — if you add a translation key, run tests
- SCSS uses `@use` for variables/animations and `@import` inside variables.scss for Google Fonts
- Responsive: `@include respond-to($breakpoint)` for down-breakpoints, `@include respond-from($breakpoint)` for up
- Breakpoints: ultrawide (1920), fullhd (1600), laptop-large (1480), laptop-medium (1280), tablet-large (1024), tablet-small (768), mobile (480)
- Prefers-reduced-motion: always check and disable animations when set
- No comments in code unless required for complex logic
- JSX files use `.jsx` extension; JS files use `.js`

### Testing

Tests live in `tests/` and use Node.js built-in `test` runner:

| Test | Covers |
|------|--------|
| `i18n.test.mjs` | Translation structure parity; all `t()` call sites resolve |
| `modes.test.mjs` | Direction ordering, language prefixes, modePath/modeIndexFromPath |
| `navigation.test.mjs` | Scroll positioning, dividers, resize corrections |
| `projects.test.mjs` | selectProjects search/filter/sort, PAGE_SIZE=4 |
| `slug404.test.mjs` | Invalid slug handling for all 5 directions |
| `sceneManager.test.mjs` | SceneManager cleanup on unmount |
| `softwareContact.test.mjs` | emailService role-based formatting + HTML escaping |
| `otherBackground.test.mjs` | 3D RingConnectors geometry |
