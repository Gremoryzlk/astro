// ============================================================
// ТИПЫ ДАННЫХ — Часть Души
//
// Схема спроектирована так, чтобы при переходе на Sanity CMS
// компоненты не менялись — меняется только src/lib/getProjects.ts
// ============================================================

// ── ВСПОМОГАТЕЛЬНЫЕ ─────────────────────────────────────────

/** ISO 8601 дата строкой: "2024-03-01" */
export type ISODate = string;

/** Путь к изображению относительно /public */
export type ImagePath = string;

/** Координаты [широта, долгота] */
export type Coords = [number, number];

// ── ПРОЕКТ ──────────────────────────────────────────────────

export type BadgeType = 'new' | 'promo' | null;
export type MaterialType = 'Газобетон' | 'Кирпич' | 'Керамоблок' | 'Клеёный брус + Кирпич';
export type ProjectStatus = 'active' | 'archived';

/** Акция / ограниченное предложение */
export interface ProjectPromo {
  /** Текст акции, например "Фиксируем цену до 10.03.2026" */
  text: string;
  /** ISO дата окончания акции — используется для автоматического скрытия */
  expiresAt: ISODate | null;
}

/** Один вариант комплектации (по материалу стен) */
export interface KomplektatsiyaVariant {
  /** Название варианта: "Газоблок", "Керамоблок", "Кирпич" */
  name: string;
  /** Стоимость этой комплектации в рублях */
  price: number;
  /** Список работ/позиций, входящих в стоимость */
  items: string[];
}

/** Этаж в планировке */
export interface FloorPlan {
  /** Метка: "1 этаж", "2 этаж" */
  label: string;
  /** Площадь этажа в м² */
  area: number;
  /** Путь к изображению планировки */
  image: ImagePath;
}

/** Этап в графике строительства */
export interface TimelinePhase {
  /** Название этапа */
  name: string;
  /** Длительность в месяцах */
  durationMonths: number;
  /** CSS-переменная цвета из design-system: "--c-forest", "--c-accent" и т.п. */
  color: string;
}

/**
 * Полная схема проекта.
 *
 * При миграции на Sanity:
 *   - slug.current → slug
 *   - image → urlFor(image).url()
 *   - renders → renders.map(r => urlFor(r).url())
 */
export interface Project {
  // ── Идентификация ──────────────────────────────────────────
  /** Уникальный slug — используется в URL /projects/[slug] */
  slug: string;

  // ── Основные характеристики ────────────────────────────────
  name: string;
  floors: number;
  /** Площадь по осям несущих стен, м² */
  area: number;
  rooms: number;
  baths: number;
  /** Базовая цена в рублях — используется для фильтрации и сортировки */
  price: number;
  /**
   * Основной материал стен.
   * Используется для фильтрации и метки на карточке.
   */
  material: MaterialType;

  // ── Маркетинг ──────────────────────────────────────────────
  /**
   * Тип бейджа на карточке.
   * "new" → зелёный «Новый», "promo" → красный с promо-текстом, null → нет
   */
  badge: BadgeType;
  /**
   * Акция. null = нет акции.
   * Компонент ProjectCard автоматически скрывает акцию, если expiresAt в прошлом.
   */
  promo: ProjectPromo | null;

  // ── Медиа ──────────────────────────────────────────────────
  /** Главное изображение для карточки каталога */
  image: ImagePath;
  /** Массив рендеров для слайдера на странице проекта */
  renders: ImagePath[];
  /** Планировки этажей */
  floorPlans: FloorPlan[];

  // ── Контент ────────────────────────────────────────────────
  /** Короткое описание для карточки и мета-тега */
  descriptionShort: string;
  /** Полное описание для страницы проекта */
  descriptionFull: string;

  // ── Комплектации ───────────────────────────────────────────
  /**
   * Массив вариантов комплектации по материалам.
   * Каждый вариант — отдельная вкладка в секции "Комплектация".
   */
  komplektatsiya: KomplektatsiyaVariant[];

  // ── График строительства ───────────────────────────────────
  /** Этапы строительства. Сумма durationMonths = общий срок. */
  timelinePhases: TimelinePhase[];
  /** Общий срок строительства в месяцах (может отличаться от суммы фаз при параллельных работах) */
  constructionMonths: number;

  // ── SEO / Мета ─────────────────────────────────────────────
  /** SEO title — если null, генерируется из name */
  seoTitle: string | null;
  /** SEO description — если null, используется descriptionShort */
  seoDescription: string | null;

  // ── Системные ─────────────────────────────────────────────
  status: ProjectStatus;
  /** ISO дата публикации */
  publishedAt: ISODate;
  /** ISO дата последнего обновления */
  updatedAt: ISODate;
}

// ── ПОРТФОЛИО ───────────────────────────────────────────────

export type PortfolioStatus = 'built' | 'in_progress';

/** Фото этапа строительства */
export interface ConstructionPhoto {
  label: string;
  image: ImagePath;
}

/** Видео-рилс с объекта */
export interface Reel {
  thumbnail: ImagePath;
  /** Ссылка на Telegram/ВК/YouTube */
  url: string;
}

/** Раздел произведённых работ */
export interface WorksPerformed {
  title: string;
  description: string;
}

/**
 * Построенный объект из портфолио.
 *
 * projectId — связь с Project.slug.
 * При переходе на Sanity заменяется на reference().
 */
export interface PortfolioObject {
  // ── Идентификация ──────────────────────────────────────────
  slug: string;

  // ── Основное ───────────────────────────────────────────────
  name: string;
  /** Краткое описание локации: "д. Вырицы" */
  location: string;
  /** Ссылка на slug проекта, по которому построен объект */
  projectSlug: string | null;

  // ── Технические характеристики ─────────────────────────────
  area: number;
  floors: number;
  foundation: string;
  walls: string;
  roof: string;
  constructionDays: number;

  // ── Гео ────────────────────────────────────────────────────
  coords: Coords;

  // ── Медиа ──────────────────────────────────────────────────
  heroImage: ImagePath;
  /** Галерея рендеров/финальных фото */
  gallery: ImagePath[];
  constructionPhotos: ConstructionPhoto[];
  reels: Reel[];

  // ── Контент ────────────────────────────────────────────────
  descriptionShort: string;
  descriptionFull: string;
  worksPerformed: WorksPerformed[];

  // ── Системные ─────────────────────────────────────────────
  status: PortfolioStatus;
  completedAt: ISODate | null;
  publishedAt: ISODate;
}

// ── САЙТ (глобальные настройки) ──────────────────────────────

export interface SiteConfig {
  company: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    workingHours: string;
    foundedYear: number;
  };
  socials: {
    telegram: string | null;
    vk: string | null;
    youtube: string | null;
  };
  stats: {
    builtHomes: number;
    yearsOnMarket: number;
    projectsInCatalog: number;
    warrantyYears: number;
  };
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    ogImage: string;
  };
}

// ── ХЕЛПЕР: ФОРМАТИРОВАНИЕ ──────────────────────────────────

/** Форматирует цену: 8750000 → "8,75 МЛН ₽" */
export function formatPrice(price: number): string {
  const mlns = price / 1_000_000;
  return `${mlns.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} МЛН ₽`;
}

/** Возвращает true если акция ещё активна */
export function isPromoActive(promo: ProjectPromo | null): boolean {
  if (!promo) return false;
  if (!promo.expiresAt) return true;
  return new Date(promo.expiresAt) > new Date();
}
