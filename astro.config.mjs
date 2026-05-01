// astro.config.mjs
import { defineConfig } from 'astro/config';

// Имя репозитория на GitHub Pages.
// Если сайт деплоится на корень домена (chast-dushi.ru) — base: '/'
// Если на username.github.io/chast-dushi — base: '/chast-dushi'
const REPO_NAME = process.env.GITHUB_REPOSITORY
  ? '/' + process.env.GITHUB_REPOSITORY.split('/')[1]
  : '/';

export default defineConfig({
  // ── Деплой ────────────────────────────────────────────────
  output: 'static',          // Полностью статичный сайт
  site:   'https://chast-dushi.ru',  // Заменить на реальный URL
  base:   REPO_NAME,

  // ── Сборка ────────────────────────────────────────────────
  build: {
    // Генерирует /projects/tk-2/index.html вместо /projects/tk-2.html
    format: 'directory',
    // Инлайнит стили < 4kb для ускорения первого рендера
    inlineStylesheets: 'auto',
    assets: '_assets',
  },

  // ── Ссылки ────────────────────────────────────────────────
  // Генерирует /projects/tk-2/ (с трейлинг-слэшем) — важно для GitHub Pages
  trailingSlash: 'always',

  // ── Vite ──────────────────────────────────────────────────
  vite: {
    resolve: {
      alias: {
        '@scripts':    '/src/scripts',
        '@styles':     '/src/styles',
        '@components': '/src/components',
        '@layouts':    '/src/layouts',
        '@lib':        '/src/lib',
        '@data':       '/src/data',
      },
    },
    build: {
      // Чанки > 500kb предупреждают — это нормально для нашего ванильного JS
      chunkSizeWarningLimit: 600,
    },
    // Позволяет импортировать JSON с типами
    json: {
      stringify: false,
    },
  },
});
