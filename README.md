# Часть Души — Astro + JSON

Сайт строительной компании на Astro с данными в JSON.

---

## Стек

| Слой | Решение |
|------|---------|
| Фреймворк | [Astro 4](https://astro.build) — статическая генерация |
| Стили | Vanilla CSS (перенесены из оригинала без изменений) |
| Скрипты | TypeScript (компилируется в JS при сборке) |
| Данные | JSON-файлы в `src/data/` |
| Деплой | GitHub Pages через GitHub Actions |
| CMS-ready | Заменить `src/lib/getProjects.ts` на Sanity-клиент |

---

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/YOUR_ORG/chast-dushi.git
cd chast-dushi

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
# → http://localhost:4321

# Собрать статику
npm run build

# Предпросмотр сборки
npm run preview
```

---

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions: сборка + деплой
│
├── src/
│   ├── data/                   ← ВСЕ ДАННЫЕ ЗДЕСЬ
│   │   ├── projects.json       ← Каталог проектов
│   │   ├── portfolio.json      ← Портфолио объектов
│   │   └── site.json           ← Глобальные настройки (телефон, адрес, и т.д.)
│   │
│   ├── lib/
│   │   ├── types.ts            ← TypeScript-типы (схема данных)
│   │   ├── getProjects.ts      ← Слой доступа к данным проектов
│   │   └── getPortfolio.ts     ← Слой доступа к данным портфолио
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro    ← <html>, <head>, SEO
│   │   └── PageLayout.astro    ← Header + main + Footer + модалки
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SiteHeader.astro
│   │   │   └── SiteFooter.astro
│   │   ├── project/
│   │   │   ├── ProjectCard.astro     ← Карточка каталога
│   │   │   ├── ProjectFilter.astro   ← Панель фильтрации
│   │   │   └── CompareBar.astro      ← Полоска сравнения снизу
│   │   ├── portfolio/
│   │   │   └── PortfolioCard.astro   ← Карточка портфолио (ч/б → цвет)
│   │   └── ui/
│   │       ├── ContactModal.astro
│   │       └── Lightbox.astro
│   │
│   ├── pages/
│   │   ├── index.astro              ← Главная
│   │   ├── projects/
│   │   │   ├── index.astro          ← Каталог проектов
│   │   │   └── [slug].astro         ← Страница проекта (динамическая)
│   │   ├── portfolio/
│   │   │   ├── index.astro          ← Портфолио
│   │   │   └── [slug].astro         ← Страница объекта (динамическая)
│   │   └── compare/
│   │       └── index.astro          ← Сравнение проектов
│   │
│   └── scripts/
│       ├── core.ts            ← Шапка, меню, модалки, lightbox, формы, счётчики
│       ├── filter.ts          ← Фильтрация и сортировка каталога
│       ├── slider.ts          ← Слайдер рендеров
│       ├── compare.ts         ← Система сравнения проектов
│       └── calculators.ts     ← Ипотечный + проектный калькуляторы
│
├── public/
│   └── assets/
│       ├── images/
│       │   ├── projects/      ← Рендеры проектов
│       │   ├── portfolio/     ← Фото объектов
│       │   └── plans/         ← Планировки
│       ├── favicon.svg
│       └── og-image.jpg
│
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## Как добавить новый проект

Откройте `src/data/projects.json` и добавьте объект в массив:

```json
{
  "slug": "omega-3",
  "name": "Проект Омега-3",
  "floors": 1,
  "area": 135,
  "rooms": 3,
  "baths": 2,
  "price": 8200000,
  "material": "Газобетон",
  "badge": null,
  "promo": null,
  "image": "/assets/images/projects/omega-3.jpg",
  "renders": ["/assets/images/projects/omega-3.jpg"],
  "floorPlans": [
    { "label": "1 этаж", "area": 135, "image": "/assets/images/plans/omega-3-plan.jpg" }
  ],
  "descriptionShort": "Одноэтажный дом 135 м².",
  "descriptionFull": "Подробное описание...",
  "komplektatsiya": [
    {
      "name": "Газоблок",
      "price": 4500000,
      "items": ["Фундамент", "Стены", "Кровля", "Окна", "Двери"]
    }
  ],
  "timelinePhases": [
    { "name": "Фундамент", "durationMonths": 1.5, "color": "#0F3D2E" },
    { "name": "Стены",     "durationMonths": 2,   "color": "#1a6b4e" },
    { "name": "Кровля",    "durationMonths": 1,   "color": "#2d8a68" }
  ],
  "constructionMonths": 6,
  "seoTitle": null,
  "seoDescription": null,
  "status": "active",
  "publishedAt": "2025-05-01",
  "updatedAt": "2025-05-01"
}
```

**Больше ничего делать не нужно.** При следующей сборке:
- Проект появится в каталоге `/projects/`
- Создастся страница `/projects/omega-3/`
- Обновятся фильтры (min/max площади и цены)
- Проект попадёт в «Похожие проекты»

---

## Как добавить объект в портфолио

Откройте `src/data/portfolio.json` и добавьте:

```json
{
  "slug": "vsevolozhsk-2",
  "name": "Дом во Всеволожске",
  "location": "г. Всеволожск, ул. Лесная, 15",
  "projectSlug": "tk-2",
  "area": 143,
  "floors": 1,
  "foundation": "Монолитная плита",
  "walls": "Газобетон",
  "roof": "Двускатная",
  "constructionDays": 287,
  "coords": [60.021, 30.679],
  "heroImage": "/assets/images/portfolio/vsevolozhsk-2.jpg",
  "gallery": ["/assets/images/portfolio/vsevolozhsk-2.jpg"],
  "constructionPhotos": [],
  "reels": [],
  "descriptionShort": "Одноэтажный дом из газобетона.",
  "descriptionFull": "Подробное описание...",
  "worksPerformed": [],
  "status": "built",
  "completedAt": "2025-03-15",
  "publishedAt": "2025-04-01"
}
```

При следующей сборке создастся страница `/portfolio/vsevolozhsk-2/`.

---

## Обновление акции / цены

Найдите проект в `projects.json` и измените поле `promo`:

```json
"promo": {
  "text": "Цена зафиксирована до 01.09.2026",
  "expiresAt": "2026-09-01"
}
```

После `expiresAt` акция автоматически перестанет отображаться.  
Чтобы убрать акцию немедленно: `"promo": null`.

---

## Обновление контактов

Откройте `src/data/site.json` и обновите нужное поле:

```json
{
  "company": {
    "phone": "+79001234567",
    "phoneFormatted": "8 900 123-45-67",
    "email": "new@chast-dushi.ru"
  }
}
```

Телефон обновится автоматически в шапке, подвале и всех ссылках.

---

## Деплой на GitHub Pages

### Первый деплой

1. Создайте репозиторий на GitHub
2. В настройках репозитория: **Settings → Pages → Source → GitHub Actions**
3. Откройте `astro.config.mjs` и установите правильный URL:
   ```js
   site: 'https://YOUR_USERNAME.github.io',
   // или для кастомного домена:
   site: 'https://chast-dushi.ru',
   ```
4. Сделайте push в ветку `main` — деплой запустится автоматически

### Последующие обновления

```bash
# Изменили JSON, добавили фото
git add .
git commit -m "Добавлен проект Омега-3"
git push
# GitHub Actions соберёт и задеплоит автоматически (~2 мин)
```

### Кастомный домен

1. Добавьте файл `public/CNAME` с содержимым `chast-dushi.ru`
2. Настройте DNS у регистратора: A-записи на IP GitHub Pages

---

## Переход на Sanity CMS

Когда понадобится визуальный редактор для контент-менеджера:

1. Установите `@sanity/client`
2. Откройте `src/lib/getProjects.ts`
3. Замените импорт JSON на Sanity-клиент — раскомментируйте готовый код
4. Аналогично для `getPortfolio.ts`

**Компоненты и страницы менять не нужно** — они работают через абстракцию `getProjects()` / `getPortfolio()`.

---

## Переменные окружения

Создайте `.env` (не коммитьте в git):

```env
# Если добавите Sanity в будущем:
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production

# Для Formspree или другого провайдера форм:
PUBLIC_FORM_ENDPOINT=https://formspree.io/f/YOUR_ID
```

---

## Типичные задачи

| Задача | Файл |
|--------|------|
| Изменить телефон / адрес | `src/data/site.json` |
| Добавить проект | `src/data/projects.json` |
| Добавить объект портфолио | `src/data/portfolio.json` |
| Изменить цену / акцию | `src/data/projects.json`, поле `price` / `promo` |
| Добавить пункт в навигацию | `src/components/layout/SiteHeader.astro`, массив `NAV_ITEMS` |
| Изменить цвета | `src/styles/design-system.css`, блок `:root { --c-* }` |
| Подключить реальную отправку форм | `src/scripts/core.ts`, функция `initForms()` |
