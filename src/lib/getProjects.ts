/**
 * СЛОЙ ДОСТУПА К ДАННЫМ — Проекты
 *
 * Сейчас читает из JSON. При переходе на Sanity:
 *   1. Удалить импорт projectsJson
 *   2. Раскомментировать Sanity-клиент
 *   3. Заменить тела функций на sanityClient.fetch(groq`...`)
 *   4. Компоненты НЕ МЕНЯЮТСЯ
 */

import type { Project } from './types';
import { isPromoActive } from './types';
import projectsJson from '../data/projects.json';

// ── При переходе на Sanity раскомментировать ──────────────────
// import { createClient } from '@sanity/client';
// const sanityClient = createClient({
//   projectId: import.meta.env.SANITY_PROJECT_ID,
//   dataset: 'production',
//   apiVersion: '2024-01-01',
//   useCdn: true,
// });

// ── Приводим JSON к типу ──────────────────────────────────────
const allProjects = projectsJson as Project[];

// ─────────────────────────────────────────────────────────────
// ПУБЛИЧНОЕ API
// ─────────────────────────────────────────────────────────────

/** Все активные проекты, отсортированные по дате (новые первыми) */
export async function getAllProjects(): Promise<Project[]> {
  // Sanity: return sanityClient.fetch(groq`*[_type=="project" && status=="active"] | order(publishedAt desc)`)
  return allProjects
    .filter(p => p.status === 'active')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Один проект по slug */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  // Sanity: return sanityClient.fetch(groq`*[_type=="project" && slug.current==$slug][0]`, { slug })
  return allProjects.find(p => p.slug === slug) ?? null;
}

/**
 * Slugs всех активных проектов.
 * Нужен для Astro getStaticPaths() в [slug].astro
 */
export async function getAllProjectSlugs(): Promise<string[]> {
  // Sanity: return (await sanityClient.fetch(groq`*[_type=="project" && status=="active"].slug.current`))
  return allProjects
    .filter(p => p.status === 'active')
    .map(p => p.slug);
}

/**
 * Похожие проекты (по близости площади и цены).
 * Исключает текущий проект.
 */
export async function getSimilarProjects(current: Project, limit = 3): Promise<Project[]> {
  const all = await getAllProjects();
  return all
    .filter(p => p.slug !== current.slug)
    .map(p => ({
      project: p,
      score:
        Math.abs(p.area - current.area) / 50 +
        Math.abs(p.price - current.price) / 1_000_000 +
        (p.floors !== current.floors ? 2 : 0),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ project }) => project);
}

/**
 * Флаги для фронтенда фильтрации.
 * Извлекает уникальные значения из всего каталога для построения чипов.
 */
export async function getProjectFilterOptions() {
  const projects = await getAllProjects();
  return {
    floors:    [...new Set(projects.map(p => p.floors))].sort(),
    materials: [...new Set(projects.map(p => p.material))].sort(),
    areaMin:   Math.min(...projects.map(p => p.area)),
    areaMax:   Math.max(...projects.map(p => p.area)),
    priceMin:  Math.min(...projects.map(p => p.price)),
    priceMax:  Math.max(...projects.map(p => p.price)),
    roomsMax:  Math.max(...projects.map(p => p.rooms)),
    bathsMax:  Math.max(...projects.map(p => p.baths)),
  };
}

/**
 * Сериализует проект в плоский объект для data-атрибутов карточки.
 * Нужен для клиентского JS-фильтра (filter.ts).
 */
export function serializeProjectForFilter(p: Project) {
  return {
    slug:     p.slug,
    floors:   p.floors,
    area:     p.area,
    price:    p.price,
    rooms:    p.rooms,
    baths:    p.baths,
    material: p.material,
    date:     p.publishedAt.replace(/-/g, ''),
    promoActive: isPromoActive(p.promo) ? '1' : '0',
  };
}

// ── RE-EXPORTS from types.ts for convenient single-import ────
export { formatPrice, isPromoActive } from './types';
