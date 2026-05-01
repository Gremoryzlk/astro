/**
 * scripts/core.ts
 * Core client-side logic — runs on every page.
 * Pure TypeScript, no frameworks.
 */

'use strict';

// ── HEADER SCROLL ────────────────────────────────────────────
function initHeaderScroll(): void {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── MOBILE MENU ──────────────────────────────────────────────
function initMobileMenu(): void {
  const burger = document.querySelector<HTMLButtonElement>('.burger');
  const menu   = document.getElementById('mobileMenu');
  if (!burger || !menu) return;

  const open  = () => { burger.setAttribute('aria-expanded', 'true');  menu.classList.add('is-open');    document.body.style.overflow = 'hidden'; };
  const close = () => { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); document.body.style.overflow = '';       };
  const toggle = () => burger.getAttribute('aria-expanded') === 'true' ? close() : open();

  burger.addEventListener('click', toggle);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

// ── ACTIVE NAV LINK ──────────────────────────────────────────
function initActiveNav(): void {
  const path = window.location.pathname;
  document.querySelectorAll<HTMLAnchorElement>('.site-nav__link').forEach(link => {
    const href = link.getAttribute('href') ?? '';
    if (href === '/') {
      link.classList.toggle('is-active', path === '/');
    } else if (href !== '/' && path.startsWith(href)) {
      link.classList.add('is-active');
    }
  });
}

// ── SCROLL REVEAL ────────────────────────────────────────────
function initScrollReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        (e.target as HTMLElement).classList.add('is-visible');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => io.observe(el));
}

// ── ANCHOR NAV (STICKY) ──────────────────────────────────────
function initAnchorNav(): void {
  const nav = document.getElementById('anchorNav');
  if (!nav) return;

  const btns: HTMLButtonElement[] = [...nav.querySelectorAll<HTMLButtonElement>('[data-target]')];

  // Sentinel for sticky detection
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'height:1px;width:100%;pointer-events:none';
  nav.parentElement?.insertBefore(sentinel, nav);

  new IntersectionObserver(
    ([e]) => nav.classList.toggle('is-sticky', !e.isIntersecting),
    { threshold: 1 }
  ).observe(sentinel);

  // Highlight active section
  const sections = btns
    .map(btn => ({ btn, el: document.getElementById(btn.dataset.target!) }))
    .filter(({ el }) => el != null) as { btn: HTMLButtonElement; el: HTMLElement }[];

  const activateBtn = (btn: HTMLButtonElement) => {
    btns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  };

  new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        const found = sections.find(s => s.el === entry.target);
        if (found) activateBtn(found.btn);
      }
    }),
    { threshold: 0.3, rootMargin: '-100px 0px -55% 0px' }
  ).observe(...sections.map(s => s.el));

  // Click → smooth scroll
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target!);
      if (!target) return;
      const offset = nav.offsetHeight + 8;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ── LIGHTBOX ─────────────────────────────────────────────────
function initLightbox(): void {
  const lightbox  = document.getElementById('lightbox');
  const imgEl     = document.getElementById('lightboxImg') as HTMLImageElement | null;
  const counterEl = document.getElementById('lightboxCounter');
  const prevBtn   = lightbox?.querySelector<HTMLButtonElement>('.lightbox__prev');
  const nextBtn   = lightbox?.querySelector<HTMLButtonElement>('.lightbox__next');
  const closeBtn  = lightbox?.querySelector<HTMLButtonElement>('.lightbox__close');
  if (!lightbox || !imgEl) return;

  let sources: string[] = [];
  let idx = 0;

  const render = () => {
    imgEl.src = sources[idx] ?? '';
    if (counterEl) counterEl.textContent = `${idx + 1} / ${sources.length}`;
    if (prevBtn) prevBtn.style.display = sources.length > 1 ? '' : 'none';
    if (nextBtn) nextBtn.style.display = sources.length > 1 ? '' : 'none';
  };

  const openLightbox = (srcs: string[], startIdx = 0) => {
    sources = srcs; idx = startIdx;
    render();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  prevBtn?.addEventListener('click', () => { idx = (idx - 1 + sources.length) % sources.length; render(); });
  nextBtn?.addEventListener('click', () => { idx = (idx + 1) % sources.length;                  render(); });
  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  { idx = (idx - 1 + sources.length) % sources.length; render(); }
    if (e.key === 'ArrowRight') { idx = (idx + 1) % sources.length;                  render(); }
  });

  // Touch swipe
  let touchX = 0;
  lightbox.addEventListener('touchstart', e => { touchX = e.changedTouches[0]!.clientX; }, { passive: true });
  lightbox.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0]!.clientX - touchX;
    if (Math.abs(dx) > 50) { idx = dx < 0 ? (idx + 1) % sources.length : (idx - 1 + sources.length) % sources.length; render(); }
  }, { passive: true });

  // Auto-hook data-lightbox groups
  document.querySelectorAll<HTMLElement>('[data-lightbox]').forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      const group = el.dataset.lightbox!;
      const srcs  = [...document.querySelectorAll<HTMLElement>(`[data-lightbox="${group}"]`)]
        .map(e => e.dataset.src ?? (e as HTMLImageElement).src ?? '')
        .filter(Boolean);
      const start = [...document.querySelectorAll<HTMLElement>(`[data-lightbox="${group}"]`)].indexOf(el);
      openLightbox(srcs, Math.max(0, start));
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') el.click(); });
  });

  // Expand button on project slider
  document.querySelectorAll<HTMLElement>('[data-lightbox-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const srcs = JSON.parse(btn.dataset.lightboxSources ?? '[]') as string[];
        openLightbox(srcs, 0);
      } catch {}
    });
  });

  // Expose globally
  (window as any).openLightbox = openLightbox;
}

// ── MODALS ───────────────────────────────────────────────────
function initModals(): void {
  const openModal = (id: string) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector<HTMLElement>('input:not([type=checkbox]):not([type=radio]), button:not(.modal__close)')?.focus();
  };

  const closeModal = (id: string) => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    // Open
    const openTrigger = target.closest<HTMLElement>('[data-modal-open]');
    if (openTrigger) { openModal(openTrigger.dataset.modalOpen!); return; }
    // Close X button
    const closeTrigger = target.closest<HTMLElement>('[data-modal-close], .modal__close');
    if (closeTrigger) {
      const overlay = closeTrigger.closest<HTMLElement>('.modal-overlay');
      if (overlay) { overlay.classList.remove('is-open'); document.body.style.overflow = ''; }
      return;
    }
    // Click on overlay backdrop
    if ((target as HTMLElement).classList.contains('modal-overlay')) {
      (target as HTMLElement).classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll<HTMLElement>('.modal-overlay.is-open').forEach(o => {
      o.classList.remove('is-open'); document.body.style.overflow = '';
    });
  });

  // Expose for inline calls (e.g. onclick="closeModal('contactModal')")
  (window as any).openModal  = openModal;
  (window as any).closeModal = closeModal;
}

// ── TABS ─────────────────────────────────────────────────────
function initTabs(): void {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach(container => {
    const tabs   = [...container.querySelectorAll<HTMLElement>('[data-tab]')];
    const panels = [...container.querySelectorAll<HTMLElement>('[data-tab-panel]')];
    if (!tabs.length) return;

    const activate = (idx: number) => {
      tabs.forEach((t, i) => {
        t.classList.toggle('is-active', i === idx);
        t.setAttribute('aria-selected', String(i === idx));
        t.setAttribute('tabindex', i === idx ? '0' : '-1');
      });
      panels.forEach((p, i) => { p.hidden = i !== idx; });
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { activate((i + 1) % tabs.length); tabs[(i + 1) % tabs.length]!.focus(); }
        if (e.key === 'ArrowLeft')  { activate((i - 1 + tabs.length) % tabs.length); tabs[(i - 1 + tabs.length) % tabs.length]!.focus(); }
      });
    });

    activate(0);
  });
}

// ── EXPANDABLES ──────────────────────────────────────────────
function initExpandables(): void {
  document.querySelectorAll<HTMLElement>('.expandable').forEach(el => {
    const trigger = el.querySelector<HTMLElement>('.expandable__trigger');
    if (!trigger) return;

    const toggle = () => {
      const open = el.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(open));
    };
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // Vacancy accordion (same pattern)
  document.querySelectorAll<HTMLElement>('.vacancy-item').forEach(el => {
    const header = el.querySelector<HTMLElement>('.vacancy-item__header');
    header?.addEventListener('click', () => el.classList.toggle('is-open'));
  });
}

// ── FORMS ────────────────────────────────────────────────────
function initForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-form]').forEach(form => {
    // Phone mask
    const phone = form.querySelector<HTMLInputElement>('[type="tel"]');
    if (phone) {
      phone.addEventListener('input', () => {
        let v = phone.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (v.startsWith('7') && v.length > 1) {
          const p = (s: string, n: number) => v.length > n ? s : '';
          v = `+7 (${v.slice(1, 4)}${p(') ', 4)}${v.slice(4, 7)}${p('-', 7)}${v.slice(7, 9)}${p('-', 9)}${v.slice(9, 11)}`;
        }
        phone.value = v;
      });
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      let valid = true;

      // Clear old errors
      form.querySelectorAll('.form-error-msg').forEach(m => m.remove());
      form.querySelectorAll('.is-error').forEach(f => f.classList.remove('is-error'));

      // Validate required
      form.querySelectorAll<HTMLInputElement>('[required]').forEach(field => {
        if (field.type === 'checkbox' && !field.checked) { markError(field, 'Необходимо согласие'); valid = false; return; }
        if (field.type !== 'checkbox' && !field.value.trim()) { markError(field, 'Обязательное поле'); valid = false; }
      });

      // Validate phone
      if (phone && phone.value.trim() && phone.value.replace(/\D/g, '').length < 10) {
        markError(phone, 'Введите корректный номер'); valid = false;
      }

      if (!valid) return;

      const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
      if (btn) { btn.classList.add('is-loading'); btn.disabled = true; }

      // Simulate / replace with real endpoint
      await new Promise(r => setTimeout(r, 800));

      if (btn) { btn.classList.remove('is-loading'); btn.disabled = false; }

      // Show success
      const success = form.parentElement?.querySelector<HTMLElement>('.form-success');
      if (success) { form.style.display = 'none'; success.classList.add('is-visible'); }
      else { alert('Заявка принята! Мы свяжемся с вами в ближайшее время.'); form.reset(); }
    });
  });

  function markError(field: HTMLElement, msg: string) {
    field.classList.add('is-error');
    const span = document.createElement('span');
    span.className = 'form-error-msg';
    span.textContent = msg;
    field.parentElement?.appendChild(span);
  }
}

// ── COUNTER ANIMATION ────────────────────────────────────────
function initCounters(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-counter]');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target as HTMLElement;
      const end = parseInt(el.dataset.counter!, 10);
      let start: number | null = null;

      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / 1400, 1);
        el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * end));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(end);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => io.observe(el));
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg: string, type: 'info' | 'error' = 'info'): void {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, {
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%)', zIndex: '5000',
      display: 'flex', flexDirection: 'column',
      gap: '8px', alignItems: 'center', pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: type === 'error' ? 'var(--c-accent)' : 'var(--c-text)',
    color: 'var(--c-white)', padding: '10px 20px',
    borderRadius: '6px', fontSize: '14px',
    fontFamily: 'var(--ff-body)', boxShadow: '0 4px 20px rgba(0,0,0,.2)',
    opacity: '1', transition: 'opacity .3s', whiteSpace: 'nowrap',
    animation: 'toastIn .3s cubic-bezier(.16,1,.3,1)',
  });
  toast.textContent = msg;
  container.appendChild(toast);

  if (!document.getElementById('toastKf')) {
    const s = document.createElement('style');
    s.id = 'toastKf';
    s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
  }

  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2800);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initActiveNav();
  initScrollReveal();
  initAnchorNav();
  initLightbox();
  initModals();
  initTabs();
  initExpandables();
  initForms();
  initCounters();
});

// Export for other scripts
(window as any).showToast = showToast;
