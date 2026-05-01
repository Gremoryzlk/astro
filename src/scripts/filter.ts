/**
 * scripts/filter.ts
 * Client-side project filter.
 * Reads filter state from chip/range UI → shows/hides cards via data-* attrs.
 * No server round-trips. Works with statically rendered Astro cards.
 */

'use strict';

interface FilterState {
  floors:   Set<string>;
  rooms:    Set<string>;
  baths:    Set<string>;
  areaMin:  number | null;
  areaMax:  number | null;
  priceMin: number | null;
  priceMax: number | null;
  sort:     'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'new';
}

interface CardData {
  el:       HTMLElement;
  floors:   number;
  area:     number;
  price:    number;
  rooms:    number;
  baths:    number;
  date:     number;
}

function initProjectFilter(): void {
  const grid    = document.getElementById('projectsGrid');
  const countEl = document.getElementById('projectCount');
  if (!grid) return;

  const state: FilterState = {
    floors:   new Set(['all']),
    rooms:    new Set(['all']),
    baths:    new Set(['all']),
    areaMin:  null, areaMax:  null,
    priceMin: null, priceMax: null,
    sort:     'price_asc',
  };

  // Collect all cards once
  const cards: CardData[] = [...grid.querySelectorAll<HTMLElement>('[data-project]')].map(el => ({
    el,
    floors:  parseInt(el.dataset.floors  ?? '1',  10),
    area:    parseInt(el.dataset.area    ?? '0',  10),
    price:   parseInt(el.dataset.price   ?? '0',  10),
    rooms:   parseInt(el.dataset.rooms   ?? '0',  10),
    baths:   parseInt(el.dataset.baths   ?? '0',  10),
    date:    parseInt(el.dataset.date    ?? '0',  10),
  }));

  // ── MATCHING ───────────────────────────────────────────────
  const matches = (c: CardData): boolean => {
    if (!state.floors.has('all') && !state.floors.has(String(c.floors))) return false;
    if (!state.rooms.has('all')) {
      const roomMatch = [...state.rooms].some(v => {
        if (v.endsWith('+')) return c.rooms >= parseInt(v, 10);
        return c.rooms === parseInt(v, 10);
      });
      if (!roomMatch) return false;
    }
    if (!state.baths.has('all')  && !state.baths.has(String(c.baths)))  return false;
    if (state.areaMin  !== null && c.area  < state.areaMin)  return false;
    if (state.areaMax  !== null && c.area  > state.areaMax)  return false;
    if (state.priceMin !== null && c.price < state.priceMin) return false;
    if (state.priceMax !== null && c.price > state.priceMax) return false;
    return true;
  };

  const sorted = (visible: CardData[]): CardData[] => [...visible].sort((a, b) => {
    switch (state.sort) {
      case 'price_asc':  return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'area_asc':   return a.area  - b.area;
      case 'area_desc':  return b.area  - a.area;
      case 'new':        return b.date  - a.date;
      default:           return 0;
    }
  });

  // ── RENDER ─────────────────────────────────────────────────
  function render(): void {
    const visible = cards.filter(matches);
    const ordered = sorted(visible);
    const hidden  = cards.filter(c => !visible.includes(c));

    grid!.classList.add('is-filtering');
    requestAnimationFrame(() => {
      ordered.forEach((c, i) => {
        c.el.style.order = String(i);
        c.el.hidden = false;
        c.el.classList.remove('is-visible');
        setTimeout(() => c.el.classList.add('is-visible'), i * 50);
      });
      hidden.forEach(c => { c.el.hidden = true; });

      if (countEl) countEl.textContent = String(visible.length);

      // No-results message
      const existing = grid!.querySelector<HTMLElement>('.no-results');
      if (visible.length === 0 && !existing) {
        const msg = document.createElement('div');
        msg.className = 'no-results';
        msg.innerHTML = `
          <div class="no-results__icon" aria-hidden="true">🏠</div>
          <p class="no-results__text">Проекты не найдены</p>
          <p class="no-results__hint">Попробуйте изменить параметры фильтра</p>`;
        grid!.appendChild(msg);
      } else if (visible.length > 0) {
        existing?.remove();
      }

      grid!.classList.remove('is-filtering');
      renderActiveTags();
    });
  }

  // ── CHIP GROUPS ────────────────────────────────────────────
  function bindChips(groupName: string, stateSet: Set<string>): void {
    document.querySelectorAll<HTMLButtonElement>(`[data-filter-group="${groupName}"] .filter-chip`).forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.value ?? 'all';
        if (val === 'all') { stateSet.clear(); stateSet.add('all'); }
        else {
          stateSet.delete('all');
          stateSet.has(val) ? stateSet.delete(val) : stateSet.add(val);
          if (!stateSet.size) stateSet.add('all');
        }
        syncChipUI(groupName, stateSet);
        render();
      });
    });
  }

  function syncChipUI(group: string, set: Set<string>): void {
    document.querySelectorAll<HTMLButtonElement>(`[data-filter-group="${group}"] .filter-chip`).forEach(c => {
      c.classList.toggle('is-active', set.has(c.dataset.value ?? ''));
    });
  }

  bindChips('floors', state.floors);
  bindChips('rooms',  state.rooms);
  bindChips('baths',  state.baths);

  // ── RANGE SLIDERS ──────────────────────────────────────────
  function bindRange(
    minId: string, maxId: string, fillId: string,
    onUpdate: (lo: number, hi: number, min: number, max: number) => void,
    fmt?: (v: number) => string,
  ): void {
    const minEl  = document.getElementById(minId)  as HTMLInputElement | null;
    const maxEl  = document.getElementById(maxId)  as HTMLInputElement | null;
    const fill   = document.getElementById(fillId);
    if (!minEl || !maxEl) return;

    const fmtFn = fmt ?? (v => v.toLocaleString('ru-RU'));
    const absMin = parseInt(minEl.min, 10);
    const absMax = parseInt(minEl.max, 10);

    const update = () => {
      const lo = parseInt(minEl.value, 10);
      const hi = parseInt(maxEl.value, 10);
      const range = absMax - absMin;
      if (fill && range > 0) {
        fill.style.left  = ((lo - absMin) / range * 100) + '%';
        fill.style.right = ((absMax - hi) / range * 100) + '%';
      }
      onUpdate(lo, hi, absMin, absMax);
      const loLabel = document.getElementById(minId + 'Label');
      const hiLabel = document.getElementById(maxId + 'Label');
      if (loLabel) loLabel.textContent = fmtFn(lo);
      if (hiLabel) hiLabel.textContent = fmtFn(hi);
    };

    const guard = () => {
      if (parseInt(minEl.value, 10) > parseInt(maxEl.value, 10)) minEl.value = maxEl.value;
      if (parseInt(maxEl.value, 10) < parseInt(minEl.value, 10)) maxEl.value = minEl.value;
    };

    minEl.addEventListener('input', () => { guard(); update(); render(); });
    maxEl.addEventListener('input', () => { guard(); update(); render(); });
    update();
  }

  bindRange('areaMin', 'areaMax', 'areaFill', (lo, hi, min, max) => {
    state.areaMin = lo <= min ? null : lo;
    state.areaMax = hi >= max ? null : hi;
  });

  bindRange('priceMin', 'priceMax', 'priceFill', (lo, hi, min, max) => {
    state.priceMin = lo <= min ? null : lo;
    state.priceMax = hi >= max ? null : hi;
  }, v => (v / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }));

  // ── SORT ───────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.sort-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.sort = chip.dataset.sort as FilterState['sort'];
      document.querySelectorAll('.sort-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      render();
    });
  });

  // ── CLEAR ──────────────────────────────────────────────────
  document.getElementById('filterClear')?.addEventListener('click', reset);

  function reset(): void {
    state.floors.clear();  state.floors.add('all');
    state.rooms.clear();   state.rooms.add('all');
    state.baths.clear();   state.baths.add('all');
    state.areaMin = state.areaMax = state.priceMin = state.priceMax = null;

    ['floors', 'rooms', 'baths'].forEach(g => syncChipUI(g, g === 'floors' ? state.floors : g === 'rooms' ? state.rooms : state.baths));

    (['areaMin','areaMax','priceMin','priceMax'] as const).forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) return;
      el.value = id.endsWith('Min') ? el.min : el.max;
    });

    // Re-run bindings to update fill + labels
    const reInitFill = (fillId: string, minId: string, maxId: string) => {
      const fill = document.getElementById(fillId);
      if (fill) { fill.style.left = '0%'; fill.style.right = '0%'; }
      const minEl = document.getElementById(minId) as HTMLInputElement | null;
      const maxEl = document.getElementById(maxId) as HTMLInputElement | null;
      const loL = document.getElementById(minId + 'Label');
      const hiL = document.getElementById(maxId + 'Label');
      if (loL && minEl) loL.textContent = minEl.min;
      if (hiL && maxEl) hiL.textContent = maxEl.max;
    };
    reInitFill('areaFill',  'areaMin',  'areaMax');

    const priceMinEl = document.getElementById('priceMin') as HTMLInputElement | null;
    const priceMaxEl = document.getElementById('priceMax') as HTMLInputElement | null;
    const pFill = document.getElementById('priceFill');
    if (pFill) { pFill.style.left = '0%'; pFill.style.right = '0%'; }
    const priceLoL = document.getElementById('priceMinLabel');
    const priceHiL = document.getElementById('priceMaxLabel');
    const fmt = (v: number) => (v / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
    if (priceLoL && priceMinEl) priceLoL.textContent = fmt(parseInt(priceMinEl.min, 10));
    if (priceHiL && priceMaxEl) priceHiL.textContent = fmt(parseInt(priceMaxEl.max, 10));

    render();
  }

  // ── ACTIVE TAGS ────────────────────────────────────────────
  function renderActiveTags(): void {
    const container = document.getElementById('activeTags');
    const row       = document.getElementById('activeTagsRow');
    if (!container) return;
    container.innerHTML = '';

    const tag = (label: string, onRemove: () => void) => {
      const t = document.createElement('span');
      t.className = 'active-filter-tag';
      t.innerHTML = `${label} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      t.addEventListener('click', onRemove);
      container.appendChild(t);
    };

    if (!state.floors.has('all')) [...state.floors].forEach(v => tag(`Этажей: ${v}`, () => { state.floors.delete(v); if (!state.floors.size) state.floors.add('all'); syncChipUI('floors', state.floors); render(); }));
    if (!state.rooms.has('all'))  [...state.rooms].forEach(v  => tag(`Комнат: ${v}`, () => { state.rooms.delete(v);  if (!state.rooms.size)  state.rooms.add('all');  syncChipUI('rooms',  state.rooms);  render(); }));
    if (state.areaMin !== null || state.areaMax !== null) {
      tag(`Площадь: ${state.areaMin ?? '—'}–${state.areaMax ?? '—'} м²`, () => { state.areaMin = null; state.areaMax = null; render(); });
    }
    if (state.priceMin !== null || state.priceMax !== null) {
      const lo = state.priceMin ? (state.priceMin / 1e6).toFixed(1) + ' млн' : '—';
      const hi = state.priceMax ? (state.priceMax / 1e6).toFixed(1) + ' млн' : '—';
      tag(`Цена: ${lo}–${hi}`, () => { state.priceMin = null; state.priceMax = null; render(); });
    }

    if (row) row.style.display = container.children.length ? 'flex' : 'none';
  }

  // ── INITIAL RENDER ─────────────────────────────────────────
  render();
}

document.addEventListener('DOMContentLoaded', initProjectFilter);
