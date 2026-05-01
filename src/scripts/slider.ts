/**
 * scripts/slider.ts
 * Image slider for project renders and portfolio gallery.
 * Handles multiple sliders on one page independently.
 */

'use strict';

function initAllSliders(): void {
  document.querySelectorAll<HTMLElement>('.project-slider').forEach(initSlider);
}

function initSlider(wrapper: HTMLElement): void {
  const track  = wrapper.querySelector<HTMLElement>('.project-slider__track');
  const dots   = [...wrapper.querySelectorAll<HTMLButtonElement>('.project-slider__dot')];
  const prev   = wrapper.querySelector<HTMLButtonElement>('.project-slider__prev');
  const next   = wrapper.querySelector<HTMLButtonElement>('.project-slider__next');
  const slides = wrapper.querySelectorAll<HTMLElement>('.project-slider__slide');
  if (!track || !slides.length) return;

  let idx    = 0;
  let autoId = 0;

  const go = (n: number) => {
    idx = ((n % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.setAttribute('aria-selected', String(i === idx));
    });
    // Lazy-load next slide image
    const nextSlide = slides[(idx + 1) % slides.length];
    nextSlide?.querySelector<HTMLImageElement>('img')?.setAttribute('loading', 'eager');
  };

  // Stop auto-advance on user interaction
  const stopAuto = () => { if (autoId) { clearInterval(autoId); autoId = 0; } };

  prev?.addEventListener('click', e => { e.stopPropagation(); stopAuto(); go(idx - 1); });
  next?.addEventListener('click', e => { e.stopPropagation(); stopAuto(); go(idx + 1); });
  dots.forEach((d, i) => d.addEventListener('click', e => { e.stopPropagation(); stopAuto(); go(i); }));

  // Touch swipe
  let touchX = 0;
  wrapper.addEventListener('touchstart', e => { touchX = e.changedTouches[0]!.clientX; }, { passive: true });
  wrapper.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0]!.clientX - touchX;
    if (Math.abs(dx) > 40) { stopAuto(); go(idx + (dx < 0 ? 1 : -1)); }
  }, { passive: true });

  // Keyboard navigation (when slider is focused)
  wrapper.setAttribute('tabindex', '-1');
  wrapper.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { stopAuto(); go(idx - 1); }
    if (e.key === 'ArrowRight') { stopAuto(); go(idx + 1); }
  });

  // Auto-advance for hero/portfolio sliders (only if > 1 slide and not a project detail)
  if (slides.length > 1 && !document.getElementById('anchorNav')) {
    autoId = window.setInterval(() => go(idx + 1), 5000);
    wrapper.addEventListener('mouseenter', stopAuto);
    wrapper.addEventListener('mouseleave', () => {
      if (!autoId) autoId = window.setInterval(() => go(idx + 1), 5000);
    });
  }

  go(0);
}

document.addEventListener('DOMContentLoaded', initAllSliders);
