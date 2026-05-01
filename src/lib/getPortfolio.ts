/**
 * СЛОЙ ДОСТУПА К ДАННЫМ — Портфолио
 *
 * Аналогично getProjects.ts — при переходе на Sanity
 * меняется только этот файл.
 */

import type { PortfolioObject } from './types';
import portfolioJson from '../data/portfolio.json';

// const PORTFOLIO_QUERY = groq`*[_type=="portfolioObject" && status=="built"] | order(completedAt desc)`;

const allObjects = portfolioJson as PortfolioObject[];

/** Все построенные объекты */
export async function getAllPortfolioObjects(): Promise<PortfolioObject[]> {
  return allObjects
    .filter(o => o.status === 'built')
    .sort((a, b) => {
      const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return db - da;
    });
}

/** Один объект по slug */
export async function getPortfolioObjectBySlug(slug: string): Promise<PortfolioObject | null> {
  return allObjects.find(o => o.slug === slug) ?? null;
}

/** Slugs всех опубликованных объектов */
export async function getAllPortfolioSlugs(): Promise<string[]> {
  return allObjects
    .filter(o => o.status === 'built')
    .map(o => o.slug);
}

/**
 * Объекты, построенные по конкретному проекту.
 * Используется на странице проекта для блока «Уже построено».
 */
export async function getPortfolioByProjectSlug(projectSlug: string): Promise<PortfolioObject[]> {
  return allObjects.filter(o => o.projectSlug === projectSlug && o.status === 'built');
}

/**
 * Точки для карты: только slug, name, coords, image.
 * Минимальный payload для Leaflet/Яндекс.Карты.
 */
export async function getPortfolioMapPoints() {
  const objects = await getAllPortfolioObjects();
  return objects.map(o => ({
    slug:    o.slug,
    name:    o.name,
    coords:  o.coords,
    image:   o.heroImage,
    walls:   o.walls,
  }));
}
