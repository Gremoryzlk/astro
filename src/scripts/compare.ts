/**
 * scripts/compare.ts
 * Compare up to 4 projects.
 * State lives in sessionStorage so it survives page navigation.
 */

'use strict';

const MAX_COMPARE = 4;
const STORAGE_KEY = 'chast-dushi-compare';

interface ComparedItem {
  id:   string;
  name: string;
}

type ComparedList = ComparedItem[];

// ── STORAGE ───────────────────────────────────────────────────

function getCompared(): ComparedList {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function setCompared(list: ComparedList): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ── COMPARE BAR ───────────────────────────────────────────────

function renderCompareBar(): void {
  const bar      = document.getElementById('compareBar');
  const itemsEl  = document.getElementById('compareBarItems');
  const slotsEl  = document.getElementById('compareBarSlots');
  const countEl  = document.getElementById('compareBarCount');
  if (!bar || !itemsEl) return;

  const compared = getCompared();
  bar.classList.toggle('is-visible', compared.length > 0);
  if (!compared.length) return;

  // Items
  itemsEl.innerHTML = compared.map(item => `
    <div class="compare-bar__item">
      <span class="compare-bar__item-name">${item.name}</span>
      <button class="compare-bar__item-remove" data-remove-id="${item.id}" aria-label="Убрать ${item.name}" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');

  // Empty slots
  if (slotsEl) {
    slotsEl.innerHTML = Array.from({ length: MAX_COMPARE - compared.length }).map(() => `
      <div class="compare-bar__slot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
        Добавить
      </div>`
    ).join('');
  }

  if (countEl) countEl.textContent = `${compared.length} из ${MAX_COMPARE}`;

  // Remove handlers
  bar.querySelectorAll<HTMLButtonElement>('[data-remove-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = getCompared().filter(c => c.id !== btn.dataset.removeId);
      setCompared(next);
      syncButtonStates();
      renderCompareBar();
    });
  });
}

// ── BUTTON STATES ─────────────────────────────────────────────

function syncButtonStates(): void {
  const compared = getCompared();
  document.querySelectorAll<HTMLElement>('[data-compare-id]').forEach(el => {
    const active = compared.some(c => c.id === el.dataset.compareId);
    el.classList.toggle('is-active', active);
    el.setAttribute('title', active ? 'Убрать из сравнения' : 'Добавить к сравнению');
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
      el.setAttribute('aria-pressed', String(active));
    }
  });
}

// ── ADD / REMOVE ──────────────────────────────────────────────

function addToCompare(id: string, name: string): void {
  const compared = getCompared();
  if (compared.length >= MAX_COMPARE) {
    (window as any).showToast?.(`Максимум ${MAX_COMPARE} проекта для сравнения`, 'error');
    return;
  }
  if (!compared.some(c => c.id === id)) {
    setCompared([...compared, { id, name }]);
    (window as any).showToast?.(`«${name}» добавлен к сравнению`);
    syncButtonStates();
    renderCompareBar();
  }
}

function removeFromCompare(id: string): void {
  setCompared(getCompared().filter(c => c.id !== id));
  syncButtonStates();
  renderCompareBar();
}

// ── EVENT DELEGATION ──────────────────────────────────────────

function initCompareButtons(): void {
  document.addEventListener('click', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-compare-id]');
    if (!el) return;
    // Ignore if it's inside the compare bar remove button (handled separately)
    if (el.closest('.compare-bar__item-remove')) return;
    e.preventDefault();
    const id   = el.dataset.compareId!;
    const name = el.dataset.compareName ?? 'Проект';
    if (getCompared().some(c => c.id === id)) removeFromCompare(id);
    else addToCompare(id, name);
  });
}

function initCompareBarActions(): void {
  document.getElementById('compareBarClear')?.addEventListener('click', () => {
    setCompared([]);
    syncButtonStates();
    renderCompareBar();
  });

  document.getElementById('compareBarGo')?.addEventListener('click', () => {
    const compared = getCompared();
    if (compared.length < 2) {
      (window as any).showToast?.('Добавьте минимум 2 проекта', 'error');
      return;
    }
    window.location.href = `/compare/`;
  });
}

// ── COMPARE PAGE ──────────────────────────────────────────────

function initComparePage(): void {
  const tableEl  = document.getElementById('compareTable');
  const emptyEl  = document.getElementById('compareEmpty');
  const catalogEl = document.getElementById('compareCatalog');
  const hintEl   = document.getElementById('compareHint');
  if (!tableEl) return;

  const compared = getCompared();
  const allProjects: any[] = (window as any).__PROJECTS__ ?? [];

  const projects = compared
    .map(item => allProjects.find(p => p.id === item.id || p.slug === item.id))
    .filter(Boolean);

  if (!projects.length) {
    emptyEl && (emptyEl.style.display = 'block');
    tableEl.style.display = 'none';
    // Show catalog for picking
    if (catalogEl) {
      catalogEl.style.display = 'block';
      const grid = document.getElementById('compareCatalogGrid');
      if (grid) {
        grid.innerHTML = allProjects.map(p => `
          <article class="project-card" onclick="location.href='${p.url}'" role="button" tabindex="0">
            <div class="project-card__image-wrap">
              <div class="project-card__image-placeholder"></div>
              <button class="project-card__compare-btn"
                data-compare-id="${p.id}" data-compare-name="${p.name}"
                onclick="event.stopPropagation()" type="button"
                aria-label="Добавить к сравнению">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="3" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="5" width="4" height="16"/></svg>
              </button>
            </div>
            <div class="project-card__body">
              <h3 class="project-card__name">${p.name}</h3>
              <div class="project-card__meta">
                <span class="project-card__meta-item">${p.area} м²</span>
                <span class="project-card__meta-item">${p.rooms} ком.</span>
              </div>
            </div>
            <div class="project-card__footer">
              <div class="project-card__price">
                <span class="project-card__price-value">${p.priceLabel}</span>
              </div>
            </div>
          </article>`
        ).join('');
      }
    }
    return;
  }

  emptyEl && (emptyEl.style.display = 'none');
  if (catalogEl) catalogEl.style.display = 'none';
  tableEl.style.display = 'block';
  if (hintEl) hintEl.textContent = `Сравниваются ${projects.length} из ${MAX_COMPARE} проектов`;

  const cols     = projects.length;
  const colTpl   = `200px repeat(${cols}, 1fr)`;
  const headEl   = document.getElementById('compareHead')!;
  const bodyEl   = document.getElementById('compareBody')!;
  headEl.style.gridTemplateColumns = colTpl;
  bodyEl.style.gridTemplateColumns = colTpl;

  headEl.innerHTML = '<div></div>' + projects.map((p: any) => `
    <div class="compare-col-header">
      <div class="compare-col-header__image">
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a5240,#0d3527);display:flex;align-items:center;justify-content:center">
          <span style="font-family:var(--ff-display);font-size:1.5rem;color:rgba(255,255,255,.15)">${p.name}</span>
        </div>
      </div>
      <div class="compare-col-header__body">
        <div class="compare-col-header__name">${p.name}</div>
        <div class="compare-col-header__price">${p.priceLabel}</div>
        <a href="${p.url}" class="btn btn--outline btn--sm" style="margin-top:8px;display:inline-flex">Открыть проект</a>
      </div>
      <button class="compare-col-header__remove" data-remove-id="${p.id}" type="button" title="Убрать из сравнения">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  `).join('');

  const FIELDS = [
    { section: 'Параметры', rows: [
      { label: 'Площадь',       key: 'area',     fmt: (v: any) => `${v} м²` },
      { label: 'Этажность',     key: 'floors',   fmt: (v: any) => `${v} эт.` },
      { label: 'Жилые комнаты', key: 'rooms',    fmt: (v: any) => v },
      { label: 'Санузлы',       key: 'baths',    fmt: (v: any) => v },
    ]},
    { section: 'Стоимость', rows: [
      { label: 'Цена',          key: 'priceLabel', fmt: (v: any) => v, hl: true },
      { label: 'Материал стен', key: 'material',   fmt: (v: any) => v },
    ]},
  ];

  bodyEl.innerHTML = FIELDS.map(s => `
    <div class="compare-section__title" style="grid-column:1/-1">${s.section}</div>
    ${s.rows.map(row => `
      <div class="compare-row" style="grid-template-columns:${colTpl}">
        <div class="compare-row__label">${row.label}</div>
        ${projects.map((p: any) => `
          <div class="compare-row__value${(row as any).hl ? ' compare-row__value--highlight' : ''}">
            ${p[row.key] !== undefined ? row.fmt(p[row.key]) : '—'}
          </div>`).join('')}
      </div>`
    ).join('')}
  `).join('');

  // Remove from compare on this page
  headEl.querySelectorAll<HTMLButtonElement>('[data-remove-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCompare(btn.dataset.removeId!);
      initComparePage(); // re-render
    });
  });

  document.getElementById('clearCompare')?.addEventListener('click', () => {
    setCompared([]);
    syncButtonStates();
    initComparePage();
  });
}

// ── INIT ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initCompareButtons();
  initCompareBarActions();
  syncButtonStates();
  renderCompareBar();

  // If we're on the compare page, initialize the table directly.
  // This avoids the race condition of the window.initComparePage pattern.
  if (document.getElementById('compareTable')) {
    initComparePage();
  }
});

// Keep the window export for any legacy inline callers
(window as any).initComparePage = initComparePage;
