# Project Architecture — Technical Reference for AI Models

> Прицеленный технический справочник о внутренней архитектуре PashaPilat-GitSite.
> Документирует роутинг, i18n, слой данных, компоненты, тесты и сборку.
> Дополняется по мере необходимости.

---

## 1. Маршрутизация и роутинг (`src/App.js`, `src/navigation/`)

### 1.1 Общая схема

```mermaid
graph TD
    A[URL] --> B{Язык?}
    B -->|ru (default)| C[Web / gamedev / software / radio / other]
    B -->|en или ua| D[/lang/ + секция/]
    C --> E{Есть slug?}
    D --> E
    E -->|Да| F[Project страница]
    E -->|Нет| G[Landing страница]
    F --> H{Project найден?}
    H -->|Да| I[Отображение проекта]
    H -->|Нет| J[NotFound 404]
    A --> K{Пути не существует?}
    K -->|Да| J
```

### 1.2 Router и BASENAME

`src/config.js`:
```js
export const BASENAME = window.location.hostname === "localhost" ? "" : "/PashaPilat-GitSite";
```

- На `localhost` — пустой basename (`/`).
- На GitHub Pages — `/PashaPilat-GitSite`.

`src/App.js` использует `BrowserRouter` с `basename={BASENAME}`.

### 1.3 Режимы (directions)

`src/navigation/modes.mjs` определяет порядок режимов:

```js
export const modes = [
    { id: "web",     label: "Web",     path: "/" },
    { id: "gamedev", label: "GameDev", path: "/gamedev" },
    { id: "software",label: "SoftWare",path: "/software" },
    { id: "radio",   label: "Radio",   path: "/radio" },
    { id: "other",   label: "Other",   path: "/other" },
];
```

Порядок важен — он используется в `ToggleMode` и `modeIndexFromPath`.

### 1.4 Маршруты в App.js

#### Русский (без префикса)
```
/                          → WebHome
/projects                  → WebProjects
/projects/:slug            → WebProject
/gamedev                   → GameDevPage
/gamedev/:slug             → GameDevProject
/software                  → SoftwarePage
/software/:slug            → SoftwareProject
/radio                     → RadioPage
/radio/:slug               → RadioProject
/other                     → OtherPage
/other/:slug               → OtherProject
/unity                     → редирект на /gamedev (legacy)
/develop                   → редирект на /software (legacy)
*                          → NotFound (404)
```

#### Английский и украинский (циклом)
```
/{lang}                    → WebHome
/{lang}/projects           → WebProjects
/{lang}/projects/:slug     → WebProject
/{lang}/gamedev            → GameDevPage
/{lang}/gamedev/:slug      → GameDevProject
/{lang}/software           → SoftwarePage
/{lang}/software/:slug     → SoftwareProject
/{lang}/radio              → RadioPage
/{lang}/radio/:slug        → RadioProject
/{lang}/other              → OtherPage
/{lang}/other/:slug        → OtherProject
/{lang}/unity              → редирект на /{lang}/gamedev
/{lang}/develop            → редирект на /{lang}/software
```

#### Catch-all
```
* → NotFound
```

### 1.5 Языковая определение

`src/utils/getLangFromPath.js`:
```js
export function getLangFromPath(pathname) {
    // убираем BASENAME (для gh-pages)
    if (BASENAME && pathname.startsWith(BASENAME)) {
        pathname = pathname.slice(BASENAME.length);
    }
    const parts = pathname.split("/");
    const first = parts[1];
    // ru по умолчанию, en/ua по префиксу
    return availableLangs.includes(first) ? first : "ru";
}
```

- `part[0]` всегда пустая (потому что путь начинается с `/`).
- Если `part[1]` входит в `availableLangs` (`["ru", "en", "ua"]`), возвращает его, иначе `"ru"`.

### 1.6 404 обработка (актуально после доработки)

#### Неизвестный URL
- **`<Route path="*" element={<NotFound />} />`** в `App.js` — обрабатывает любые несуществующие пути.

#### Проект не найден по slug
Все 5 страниц проектов теперь используют компонент `NotFound`:

| Страница | Было | Стало |
|----------|------|-------|
| `Web/Project.jsx` | `<h1>{copy.missing}</h1>` (soft) | `<NotFound />` |
| `GameDev/Project.jsx` | `<h1>404</h1>` + note (inline) | `<NotFound />` |
| `Radio/Project.jsx` | `<h1>404</h1>` + note (inline) | `<NotFound />` |
| `Other/Project.jsx` | `<h1>404</h1>` + note (inline) | `<NotFound />` |
| `Software/Project.jsx` | `<h1>{label("notFound")}</h1>` | `<NotFound />` |

`NotFound` (`src/components/NotFound.jsx`) читает `t(lang, "common", "notFound")` → `{ message, back }` и рендерит:
```jsx
<div className="not-found">
    <h1>404</h1>
    <p>{copy.message}</p>
    <Link to={home}>{copy.back}</Link>
</div>
```

#### Legacy редиректы
`<Route path="/unity">` и `<Route path="/develop">` используют `LegacyDirection`, который сохраняет `search` и `hash` из текущего `useLocation()` и делает `Navigate ... replace`.

### 1.7 Тесты роутинга

`tests/slug404.test.mjs` проверяет:
1. `common.notFound` существует во всех языках с `message` и `back`.
2. Несуществующий slug (`no-such-project-slug`) не находит проект для всех 5 направлений.
3. Каждое направление имеет хотя бы один валидный slug.

---

## 2. Система локализации (i18n)

### 2.1 Структура

```
src/i18n/
├── index.js          # init i18next, загрузка translations
├── translator.mjs    # createTranslator (path-access + interpolation)
├── README.md         # правила локализации
└── data/
    ├── ru/
    │   ├── common.json    # навигация, toggle, notFound, ошибки
    │   ├── home.json      # главная страница
    │   ├── projects.json  # UI каталога + 18 проектов
    │   ├── gamedev.json
    │   ├── software.json
    │   ├── radio.json
    │   └── other.json
    ├── en/
    └── ua/
```

### 2.2 Доступ к переводам

`src/i18n/index.js`:
```js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// загрузка всех namespaces для каждого языка
const translations = {};
availableLangs.forEach(lang => {
    translations[lang] = {};
    const namespaces = ["common", "home", "projects", "gamedev", "software", "radio", "other"];
    namespaces.forEach(ns => {
        translations[lang][ns] = require(`./data/${lang}/${ns}.json`);
    });
});

i18n.use(initReactI18next).init({
    resources: translations,
    lng: "ru",
    fallbackLng: "ru",
    interpolation: { escapeValue: false },
});
```

Функция `t` (из `translator.mjs`):
```js
// Доступ по пути (массиву или строке с точкой)
t("ru", "common", "nav", "contact")
t("ru", "gamedev.hero.title")
// Интерполяция
t("ru", "common", "errors", "count_many", { count: 3 })
// Возврат объектов/массивов полной ветки
t("ru", "common", "notFound") // → { message: "...", back: "..." }
```

### 2.3 Языковые префиксы в URL

- `ru` — без префикса (корневые пути: `/`, `/projects`)
- `en`, `ua` — с префиксом (`/en/`, `/ua/`)

`availableLangs = ["ru", "en", "ua"]` в `src/i18n/index.js`.

---

## 3. Слой данных (`src/data/`)

### 3.1 projectCatalog.json (18 веб-проектов)

Структура одного проекта:
```json
{
    "id": "colortech-erp",
    "period": "2017–2021",
    "yearStart": 2017,
    "yearEnd": 2021,
    "dateUncertain": false,
    "tech": ["Ext JS", "Java", "PostgreSQL", "..."],
    "keyTech": ["Ext JS", "Java"],
    "imageFolder": "colortech-erp",
    "title": "ColorTech ERP/WMS",
    "role": "Full-stack Developer",
    "body": "Detailed project description...",
    "images": ["mockup.jpg", "ui.jpg", "..."]
}
```

`src/data/projects.js` — функция `getProjects(lang)`:
- Загружает `projectCatalog.json` (статические данные)
- Загружает переводы из `i18n/data/<lang>/projects.json` → `items[id]`
- Объединяет: `{ id, title, role, year, dateUncertain, tech, body, images, gallery }`

### 3.2 technologyGroups.json (7 групп)

```json
[
    { id: "frontend", label: "Frontend", color: "#7c6cff" },
    { id: "backend",  label: "Backend",  color: "#d6fc05" },
    { id: "cms",      label: "CMS",      color: "#c9f31d" },
    { id: "data",     label: "Data",     color: "#ff6b6b" },
    { id: "realtime", label: "Realtime", color: "#4ecdc4" },
    { id: "infrastructure", label: "Infra", color: "#ffd166" },
    { id: "integrations", label: "Integrations", color: "#a78bfa" }
]
```

### 3.3 projectQuery.mjs — поиск, фильтр, сортировка

Функция `selectProjects({ projects, query, techFilter, activeGroupId, activeSort })` возвращает:
```js
{
    items: [...],       // отфильтрованные + отсортированные
    total: number,      // общее количество
    visible: number,    // количество показанных
    pageCount: number,  // PAGE_SIZE = 4 → max 5 страниц
}
```

- `query` — строка поиска (в title, role, tech, body)
- `techFilter` — выбранные технологии (мультивыбор)
- `activeSort` — `"period-desc"`, `"period-asc"`, `"title"`
- `PAGE_SIZE = 4` (жёстко заданная константа)

### 3.4 SoftWare projects (`src/components/SoftWare/projects.js`)

Содержит 3 проекта:
```js
export const projects = [
    { slug: "jarvis-ii", name: "Jarvis II", tags: [...], preview: "...", gallery: [...], concept: false },
    { slug: "platp-media-center", name: "PlatP Media Center", ... },
    { slug: "creator-studio", name: "Creator Studio", ... },
];
export function softwarePath(lang) {
    return lang === "ru" ? "/software" : `/${lang}/software`;
}
```

Per-project переводы находятся в `i18n/data/<lang>/software.json` → `items.<slug>`.

### 3.5 GameDev / Radio / Other catalogs

Каталоги находятся в `i18n/data/<lang>/<gamedev|radio|other>.json` → `catalog.items[]` с полями `slug`, `title`, `description`.

---

## 4. Компонентная архитектура

### 4.1 App Shell

```
App
├── SmoothScroll (Lenis)
├── Router
│   └── Routes
│       ├── WebHome / WebProjects / WebProject
│       ├── GameDevPage / GameDevProject
│       ├── SoftwarePage / SoftwareProject
│       ├── RadioPage / RadioProject
│       ├── OtherPage / OtherProject
│       ├── LegacyDirection (redirects)
│       └── NotFound (*)
├── PageChrome (вне роутов)
│   ├── Footer
│   └── ScrollTopButton
```

### 4.2 PageChrome

`src/components/PageChrome.jsx` рендерится на всех страницах (вне зависимости от роута) и состоит из:
- **Footer** — соц-ссылки, язык, тема
- **ScrollTopButton** — SVG-кольцо с прогрессом прокрутки, радиальная навигация по секциям (Web only)

### 4.3 SmoothScroll

`src/components/SmoothScroll.jsx`:
- Инициализирует Lenis
- Обрабатывает клик по якорям `a[href^="#"]`
- Поддерживает `prefers-reduced-motion` (отключает анимацию)
- Очищает scroll на unmount

### 4.4 SceneManager

`src/components/SceneManager.jsx`:
- Управляет pinning Hero секции при скролле
- Skew Hero и MainWrapper на основе scroll-позиции
- Вызывается через `useStore`-подобный интерфейс

---

## 5. Тесты (`tests/`)

Все тесты используют `node:test` (встроенный Node.js test runner).

| Тест | Описание |
|------|----------|
| `i18n.test.mjs` | Структура переводов одинакова во всех языках |
| `navigation.test.mjs` | Позиционирование секций (divider-based scroll), resize, completion |
| `modes.test.mjs` | Порядок режимов, языковые префиксы, `modePath` |
| `projects.test.mjs` | `selectProjects` (search/filter/sort), `PAGE_SIZE=4` |
| `slug404.test.mjs` | Slug-валидация для всех 5 направлений + наличие `common.notFound` |
| `sceneManager.test.mjs` | Cleanup SceneManager при unmount |
| `softwareContact.test.mjs` | `emailService` (Software vs Client/Employer, HTML escaping, CAPTCHA) |
| `otherBackground.test.mjs` | 3D RingConnectors (THREE.js BufferGeometry) |

---

## 6. Сборка и деплой

### 6.1 Webpack (`webpack.config.js`)

| Параметр | Значение |
|----------|----------|
| Entry | `./src/index.js` |
| Output | `dist/bundle.js` |
| publicPath | `/PashaPilat-GitSite/` (prod), `/` (dev) |
| Loaders | babel-loader, sass-loader, css-loader, style-loader, asset/resource |
| Plugins | HtmlWebpackPlugin, CopyPlugin (404.html) |
| DevServer | port 3000, historyApiFallback, статика из `public/` |

### 6.2 Скрипты (`package.json`)

| Команда | Описание |
|---------|----------|
| `npm run start` | Webpack Dev Server (порт 3000, HMR) |
| `npm run build` | Production сборка → `dist/` |
| `npm run deploy` | gh-pages деплой (`gh-pages -d dist`) |
| `npm test` | `node --test tests/*.test.mjs` |

### 6.3 404.html для SPA на GitHub Pages

`public/404.html` сохраняет путь в `sessionStorage` и редиректит на `/PashaPilat-GitSite/`. `src/index.js` восстанавливает путь после редиректа.

---

## 7. Конфигурация

### 7.1 Цвета (`.variables.scss`)

| Переменная | Значение |
|-----------|----------|
| `$background` | `#000000` |
| `$text` | `#ffffff` |
| `$accent-yellow` | `#d6fc05` |
| `$accent-purple` | `#7c6cff` |

### 7.2 Брейкпоинты

```scss
$breakpoint-fullhd: 1600px;
$breakpoint-laptop-large: 1480px;
$breakpoint-laptop-medium: 1280px;
$breakpoint-tablet-large: 1024px;
$breakpoint-tablet-small: 768px;
$breakpoint-mobile: 480px;
```

Миксины: `respond-to($breakpoint)`, `respond-from($breakpoint)`.

---

## 8. Полезные паттерны для AI-моделей

### 8.1 Добавить новое направление (direction)

1. Добавить в `modes.mjs`: `{ id: "newdir", label: "NewDir", path: "/newdir" }`
2. Добавить маршруты в `App.js` (RU + цикл для EN/UA)
3. Создать папку `src/pages/NewDir/Project.jsx` (наследник шаблона GameDev/Radio/Other Project)
4. Добавить i18n namespace `src/i18n/data/{ru,en,ua}/newdir.json` со структурой: `{ title, catalog: { title, eyebrow, status, note, items: [{ slug, title, description }] } }`
5. Добавить локаль `t(lang, "newdir", ...)` в компоненты

### 8.2 Добавить новый проект в Web каталог

1. Добавить в `src/data/projectCatalog.json`: `{ id, period, yearStart, yearEnd, tech, keyTech, imageFolder, ... }`
2. Добавить перевод в `src/i18n/data/{ru,en,ua}/projects.json` → `items[id]`: `{ title, role, year, body, gallery }`
3. Добавить изображения в `src/assets/images/projects/<imageFolder>/`

### 8.3 Добавить перевод на новый язык

1. Добавить язык в `availableLangs` в `src/i18n/index.js`
2. Создать папку `src/i18n/data/<new-lang>/` с 7 JSON-файлами (common, home, projects, gamedev, software, radio, other)
3. Запустить `npm test` (проверит структурную одинаковость ключей)

### 8.4 Добавить новый роут

1. Добавить `<Route>` в `App.js` в нужное место (RU и/или цикл для EN/UA)
2. Создать страницу в `src/pages/`
3. Добавить соответствующие i18n-ключи при необходимости
4. Добавить тест в `tests/` при необходимости
