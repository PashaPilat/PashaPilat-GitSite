# PashaPilat-GitSite — Описание проекта

## Обзор

**PashaPilat-GitSite** — личное портфолио-одностраничное приложение (SPA) веб-разработчика Пашас Пилатона. Сайт служит презентацией инженера: демонстрирует проекты, услуги, опыт и контакты. Деплойится на GitHub Pages через `gh-pages`.

- **Хостинг**: GitHub Pages (`https://PashaPilat.github.io/PashaPilat-GitSite`)
- **ЦА**: потенциальные заказчики, работодатели, партнёры
- **Философия**: «Главная работает как презентация инженера: кто я → результаты → чем помогу → почему доверяют → как связаться»

---

## Технологический стек

### Основа
| Категория | Технология | Версия |
|-----------|-----------|--------|
| Фреймворк | React | 19.2.7 |
| Сборка | Webpack | 5.108.4 |
| Транспилятор | Babel | 7.29.7 |
| Маршрутизация | react-router-dom | 7.18.1 |
| Стайлинг | Sass/SCSS | 1.101.0 |
| Тесты | node:test (встроенный) | — |

### Анимация и скролл
- **Lenis** — плавный скролл с кастомным easing
- **react-scroll-parallax / CSS** — skew-эффекты, анимации по скроллу
- **Intersection Observer** — reveal-анимации элементов

### Графика и визуализация
- **Three.js** + **@react-three/fiber** — 3D-сцена на странице Other (PCB-дизайн с Canvas-текстурами, billboard-кольцами, waveform и equalizer)
- **WebGL2** — шейдерный fluid background на странице GameDev (симуляция жидкости с pigment channels, vorticity, pressure solve)

### UI и компоненты
- **Font Awesome** 7 — иконки (solid, regular, brands)
- **react-hook-form** + **Yup** — валидация форм
- **react-google-recaptcha** — защита от ботов
- **@emailjs/browser** — отправка форм без бэкенда

### Локализация
- **i18next** + **react-i18next** — инфраструктура
- Кастомный загрузчик `src/i18n/index.js` через `require.context`
- 3 языка: `ru` (по умолчанию), `ua`, `en`

---

## Архитектура и структура проекта

```
PashaPilat-GitSite/
├── package.json              # Конфиг (React, Webpack, Babel)
├── webpack.config.js         # Webpack: dev/prod, SCSS, assets, gh-pages
├── .babelrc                  # Babel presets
├── .gitignore
├── README.md                 # ТЗ/концепция сайта (описание секций)
├── public/
│   ├── index.html            # Точка входа (root div)
│   └── 404.html              # Редирект для SPA на gh-pages
├── src/
│   ├── index.js              # React 19 createRoot
│   ├── App.js                # Маршруты (BrowserRouter, 5 режимов, 3 языка)
│   ├── config.js             # BASENAME (для gh-pages)
│   ├── components/           # Переиспользуемые компоненты
│   │   ├── Navigation.jsx    # Хедер меню (Web only)
│   │   ├── ToggleMode.jsx    # Переключатель режимов (Web/GameDev/Software/Radio/Other)
│   │   ├── LanguageSwitcher.jsx # Переключатель языков
│   │   ├── CursorFollower.jsx  # Кастомный курсор
│   │   ├── SmoothScroll.jsx    # Lenis, обработка якорей
│   │   ├── SceneManager.jsx    # Hero pinning при скролле
│   │   ├── ScrollTopButton.jsx # Кольцо прогресса + радиальная навигация
│   │   ├── PageChrome.jsx      # Footer + ScrollTopButton
│   │   ├── ProjectGallery.jsx  # Галерея изображений проекта
│   │   ├── NotFound.jsx        # 404 страница
│   │   ├── GlowButton.jsx      # Анимированная кнопка
│   │   ├── HeroStats.jsx       # Статистика/направления
│   │   ├── ContactForm.jsx     # Форма обратной связи (Web)
│   │   ├── Home/               # Секции главной: Hero, About, Services, FeaturedProjects, ContactSection, Footer, etc.
│   │   ├── SoftWare/           # Компоненты раздела Software (matrix bg, philosophy, faq, contact forms)
│   │   ├── GameDev/            # WebGL2 fluid background
│   │   ├── Radio/              # Radio hero + engineering bg
│   │   └── Other/              # 3D сцена (Three.js + fiber)
│   ├── pages/                # Страницы (роуты)
│   │   ├── Web/Home.jsx      # Главная
│   │   ├── Web/Projects.jsx  # Каталог (поиск, фильтры, пагинация)
│   │   ├── Web/Project.jsx   # Деталь проекта
│   │   ├── GameDev/GameDev.jsx
│   │   ├── GameDev/Project.jsx
│   │   ├── Software/Software.jsx
│   │   ├── Software/Project.jsx
│   │   ├── Radio/Radio.jsx
│   │   ├── Radio/Project.jsx
│   │   ├── Other/Other.jsx
│   │   └── Other/Project.jsx
│   ├── i18n/                 # Система локализации
│   │   ├── index.js          # Загрузчик translations
│   │   ├── translator.mjs    # createTranslator (path-доступ, интерполяция)
│   │   └── data/<lang>/      # JSON-файлы: common, home, projects, gamedev, software, radio, other
│   ├── navigation/           # Навигация и прокрутка
│   │   ├── navigation.json   # Меню по секциям
│   │   ├── modes.mjs         # 5 режимов (web/gamedev/software/radio/other)
│   │   ├── navigate.js       # nav() — построение меню с переводами
│   │   ├── scroll.js         # scrollToSection с offset
│   │   └── scrollGeometry.mjs # layout координаты, getSamePageHash
│   ├── data/                 # Данные
│   │   ├── projectCatalog.json  # 18 веб-проектов (id, period, tech, keyTech)
│   │   ├── technologyGroups.json # Группы технологий для фильтров
│   │   ├── projectQuery.mjs     # selectProjects (search, filter, sort)
│   │   ├── projects.js          # getProjects (объединение catalog + i18n)
│   │   └── README.md
│   ├── styles/               # SCSS (main, variables, animations, компонентные)
│   │   ├── main.scss         # Глобальные стили, цвета, body
│   │   ├── variables.scss    # Цвета, шрифты, брейкпоинты, миксины respond-to/respond-from
│   │   ├── animations.scss
│   │   ├── components/       # По компонентам
│   │   └── pages/            # По страницам
│   ├── utils/                # getLangFromPath.js, getPageFromPath.js
│   └── assets/               # Изображения, иконки
├── tests/                    # Тесты (node:test)
│   ├── i18n.test.mjs         # Структура переводов одинакова
│   ├── navigation.test.mjs   # Позиционирование секций
│   ├── modes.test.mjs        # Режимы и языки
│   ├── projects.test.mjs     # selectProjects, пагинация
│   ├── slug404.test.mjs      # Slug-валидация и 404
│   ├── sceneManager.test.mjs # SceneManager cleanup
│   └── softwareContact.test.mjs # emailService
└── docs/                     # Документация и справочные материалы
    ├── PROJECT.md            # Этот файл
    ├── project-source-notes.txt  # Исходные заметки автора
    ├── Codex-Software-Projects-Spec.md # Спецификация для Software
    ├── projects/             # Markdown + изображения проектов
    └── Files/                # Ссылки, справочные файлы
```

---

## Маршруты и режимы

### 5 режимов (mode toggle)
| Режим | URL (RU) | URL (EN/UA) | Описание |
|-------|----------|-------------|----------|
| Web | `/` | `/en/`, `/ua/` | Главная, каталог проектов |
| GameDev | `/gamedev` | `/en/gamedev` | WebGL2 fluid background |
| SoftWare | `/software` | `/en/software` | Matrix-фон, собственные проекты |
| Radio | `/radio` | `/en/radio` | Анимированный фон |
| Other | `/other` | `/en/other` | 3D сцена (Three.js) |

### Языковые префиксы
- RU — корневые пути (`/`, `/projects`)
- EN/UA — префикс (`en`, `ua`)
- GitHub Pages добавляет `/PashaPilat-GitSite` (через `BASENAME` в `config.js`)

### Legacy-редиректы
- `/unity` → `/gamedev`
- `/develop` → `/software`

### Маршруты страниц
| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | WebHome | Главная страница |
| `/projects` | WebProjects | Каталог 18 проектов |
| `/projects/:slug` | WebProject | Деталь проекта |
| `/gamedev` | GameDevPage | GameDev landing |
| `/gamedev/:slug` | GameDevProject | Деталь GameDev проекта |
| `/software` | SoftwarePage | Software landing |
| `/software/:slug` | SoftwareProject | Jarvis II, Media Center, Creator Studio |
| `/radio` | RadioPage | Radio landing |
| `/radio/:slug` | RadioProject | Деталь проекта |
| `/other` | OtherPage | Other landing |
| `/other/:slug` | OtherProject | Деталь проекта |
| `*` | NotFound | 404 страница |

---

## Данные

### projectCatalog.json (18 проектов)
Структура каждого проекта: `id`, `period`, `yearStart`, `yearEnd`, `tech` (полный стек), `keyTech`, `dateUncertain`, `imageFolder`.

Проекты включают:
- **Web-разработка**: Joomla 3, PlatCMS, WordPress
- **E-commerce**: ServiceMarket, SmartMag, TCarService
- **Enterprise**: ColorTech ERP/WMS (Ext JS)
- **Real-time**: Call-center модуль (WebSocket)
- **B2B**: HMH Expert (Next.js, Matrix Synapse)

### technologyGroups.json
7 групп технологий для фильтров в каталоге: frontend, backend, cms, data, realtime, infrastructure, integrations.

### i18n данные (3 языка × 7 namespaces)
| Namespace | Содержание |
|-----------|-----------|
| `common` | Навигация, toggle, hero stats, 404, back-to-top |
| `home` | Главная: hero, featured projects, services, about, contact, footer |
| `projects` | UI каталога + items (описания 18 проектов) |
| `gamedev` | GameDev страница |
| `software` | SoftWare страница + items (3 проекта) |
| `radio` | Radio страница |
| `other` | Other страница |

### i18n переводчик (`translator.mjs`)
- Поддержка пути как массива: `t(lang, ['projects', 'items', slug, 'title'])`
- Точечная нотация: `t(lang, 'gamedev.hero.title')`
- Интерполяция: `t(lang, 'errors', 'count_many', { count: 3 })`
- Возврат объектов и массивов
- Предупреждения в консоль для неизвестных ключей

---

## Ключевые компоненты

### App (`/`)
- `SmoothScroll` — инициализирует Lenis, обрабатывает якоря
- `Routes` — 5 режимов × 3 языка + legacy редиректы
- `PageChrome` — Footer + ScrollTopButton (вне зависимости от роута)

### Главная страница (Web)
1. **HeroWrapper** — фото, заголовок, CTA кнопки, scroll indicator, HeroStats
2. **SceneManager** — pinning Hero при скролле, skew-эффект
3. **MainWrapper** (skew-hero) — skew-анимация основного контента:
   - FeaturedProjects — вертикальный слайдер с 6 карточками проектов
   - HeroMarquee — бегущая строка
   - Services — 6 услуг с раскрывающимися карточками
   - About — опыт, архитектура, хайлайты с reveal-анимацией
   - ContactSection — форма + прямые контакты

### ScrollTopButton
- SVG-кольцо с progress-полосой
- Радиальная навигация по секциям (только в Web mode)
- Shine-эффект (точечный блик по окружности)
- Поддержка touch-устройств, keyboard navigation

### ToggleMode
- Слайдер с 5 позициями (Web/GameDev/SoftWare/Radio/Other)
- Swipe-жесты, keyboard (стрелки, Home/End/Enter)
- Live preview при перетаскивании

### SoftWare страница
- Matrix-фон (цифровой дождь)
- Philosophy (с прогресс-баром, scramble-эффектом заголовков)
- FAQ (аккордеон)
- Contact (QR-код, каналы связи)

### GameDev страница
- WebGL2 fluid simulation (crimson/black pigment streams)
- Camera-facing billboard rings
- Mouse-reactive

### Other страница
- Three.js сцена (via @react-three/fiber)
- PCB-дизайн с Canvas-текстурами
- 3D waveform, equalizer, gauge

---

## Тестирование

Тесты запускаются через `npm test` (Node.js `node:test`):

| Тест | Проверка |
|------|----------|
| `i18n.test.mjs` | Одинаковая структура ключей и типов во всех языках |
| `navigation.test.mjs` | Позиционирование секций (divider-based scroll), resize, completion |
| `modes.test.mjs` | Порядок режимов, языковые префиксы, modePath |
| `projects.test.mjs` | selectProjects (search/filter/sort), PAGE_SIZE=4, 5 страниц |
| `slug404.test.mjs` | Slug-валидация для всех 5 направлений + 404 |
| `sceneManager.test.mjs` | Cleanup SceneManager при unmount |
| `softwareContact.test.mjs` | emailService (Software vs Client/Employer, HTML escaping, CAPTCHA) |
| `otherBackground.test.mjs` | 3D RingConnectors (THREE.js BufferGeometry) |

---

## Сборка и деплой

### Скрипты (`package.json`)
| Команда | Описание |
|---------|----------|
| `npm run start` | Webpack Dev Server (порт 3000, hot reload) |
| `npm run build` | Production сборка (output: `dist/`) |
| `npm run deploy` | Деплой на GitHub Pages (`gh-pages -d dist`) |
| `npm test` | Запуск тестов |

### Webpack конфигурация
- Entry: `./src/index.js`
- Output: `dist/bundle.js`, `publicPath: /PashaPilat-GitSite/` (prod)
- Loaders: babel-loader, sass-loader, css-loader, style-loader, asset/resource
- Plugins: HtmlWebpackPlugin, CopyPlugin (404.html)
- DevServer: статика из `public/`, historyApiFallback, порт 3000

### 404.html (GitHub Pages SPA fallback)
- Сохраняет путь в sessionStorage
- Редиректит на `/PashaPilat-GitSite/`
- `index.js` восстанавливает путь после редиректа

---

## Стиль и дизайн

### Цветовая палитра
- Фон: `#000000` (чёрный)
- Текст: `#ffffff` (белый)
- Акценты: `#d6fc05` (лимонный жёлтый), `#7c6cff` (фиолетовый), `#c9f31d`
- Переходы: чёрный → белый градиент (`$background-skew-white`)

### Шрифты (Google Fonts)
- **Display**: Unbounded (заголовки)
- **Body**: Manrope (основной текст)
- **Mono**: JetBrains Mono (UI-элементы, код)

### Брейкпоинты
| Алиас | Размер |
|-------|--------|
| ultrawide | 1920px+ |
| fullhd | 1600px |
| laptop-large | 1480px |
| laptop-medium | 1280px |
| tablet-large | 1024px |
| tablet-small | 768px |
| mobile | 480px |

### Фиче-флаги
- `prefers-reduced-motion` — отключает анимацию, ускоренный скролл
- `prefers-reduced-motion` — отключает Lenis и WebGL анимацию

---

## Безопасность

- **EmailJS** — отправка форм с client-side API ключом (виден в открытом JS)
- **reCAPTCHA v2** — защита форм от ботов
- **HTML escaping** в `emailService.js` — защита от XSS в email-теле
- **URL validation** — `normalizeUrl()` только http(s) ссылки

---

## Особенности реализации

### Skew-эффект
- Hero и MainWrapper используют CSS-skew с динамическим углом (0°–6°)
- Угол рассчитывается на основе скролла и viewport
- `SceneManager` управляет pinning Hero при скролле

### Позиционирование секций
- `data-scroll-section="section-id"` — отметка dividers
- Прокрутка измеряет реальную позицию divider, а не фиксированный offset
- Поддержка Hero pinning и responsive layout changes

### FeaturedProjects
- Вертикальный слайдер с parallax-эффектом
- Карточки масштабируются и смещаются при скролле
- HUD с счётчиком и точками прогресса

### Software MatrixBackground
- Canvas-эффект цифрового дождя
- Matrix-символы с зелёным glow

---

## Документация в проекте

| Файл | Описание |
|------|----------|
| `README.md` | Концепция сайта, структура секций Home (10 секций) |
| `src/i18n/README.md` | Правила локализации |
| `src/navigation/README.md` | Навигация, прокрутка, якоря |
| `src/data/README.md` | Структура данных проектов |
| `docs/project-source-notes.txt` | Исходные заметки автора (периоды, стек, роли) |
| `docs/Codex-Software-Projects-Spec.md` | Спецификация создания catalog + project pages для Software |
| `docs/projects/*.md` | Описания отдельных проектов (Jarvis-II, PlatP-Media-Center, etc.) |
