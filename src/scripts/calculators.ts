/**
 * scripts/calculators.ts
 * Mortgage calculator + Design (project cost) calculator.
 */

'use strict';

// ── MORTGAGE CALCULATOR ───────────────────────────────────────

function initMortgageCalc(): void {
  const wrap = document.getElementById('mortgageCalc');
  if (!wrap) return;

  const priceIn   = wrap.querySelector<HTMLInputElement>('#mortgagePrice');
  const downIn    = wrap.querySelector<HTMLInputElement>('#mortgageDown');
  const downPct   = wrap.querySelector<HTMLElement>('#mortgageDownPct');
  const rateIn    = wrap.querySelector<HTMLInputElement>('#mortgageRate');
  const termIn    = wrap.querySelector<HTMLInputElement>('#mortgageTerm');

  const monthlyEl  = wrap.querySelector<HTMLElement>('#mortgageMonthly');
  const totalEl    = wrap.querySelector<HTMLElement>('#mortgageTotalPay');
  const overpayEl  = wrap.querySelector<HTMLElement>('#mortgageOverpay');
  const loanEl     = wrap.querySelector<HTMLElement>('#mortgageLoan');
  const downAmtEl  = wrap.querySelector<HTMLElement>('#mortgageDownAmt');

  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');

  const compute = () => {
    const price  = parseFloat(priceIn?.value  ?? '0') * 1_000_000 || 0;
    const down   = parseFloat(downIn?.value   ?? '0') * 1_000_000 || 0;
    const rate   = parseFloat(rateIn?.value   ?? '8.5') / 100 / 12;
    const months = parseInt(termIn?.value     ?? '20', 10) * 12;
    const loan   = price - down;

    if (loan <= 0 || months <= 0 || rate <= 0) return;

    const monthly  = loan * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
    const totalPay = monthly * months;
    const overpay  = totalPay - loan;

    if (monthlyEl)  monthlyEl.textContent  = fmt(monthly)  + ' ₽/мес';
    if (totalEl)    totalEl.textContent    = fmt(totalPay) + ' ₽';
    if (overpayEl)  overpayEl.textContent  = fmt(overpay)  + ' ₽';
    if (loanEl)     loanEl.textContent     = fmt(loan)     + ' ₽';
    if (downAmtEl)  downAmtEl.textContent  = fmt(down)     + ' ₽';
    if (downPct && price > 0) downPct.textContent = Math.round(down / price * 100) + '%';
  };

  [priceIn, downIn, rateIn, termIn].forEach(el => el?.addEventListener('input', compute));
  compute();
}

// ── DESIGN CALCULATOR ─────────────────────────────────────────

const BASE_TIERS = [
  { max: 80,       price: 1800 },
  { max: 120,      price: 1500 },
  { max: 200,      price: 1300 },
  { max: Infinity, price: 1100 },
];

const ADDON_PRICES: Record<string, number | ((area: number) => number)> = {
  '3d-model':    45000,
  'struct-lsts': (area: number) => area * 180,
  'struct-gaz':  (area: number) => area * 220,
  'audit':       15000,
  'design':      (area: number) => area * 350,
  'binding':     12000,
  'visit':       8000,
};

function initDesignCalc(): void {
  const calc = document.getElementById('designCalc');
  if (!calc) return;

  const areaInput = calc.querySelector<HTMLInputElement>('#calcArea');
  const baseEl    = calc.querySelector<HTMLElement>('#calcBasePrice');
  const addEl     = calc.querySelector<HTMLElement>('#calcAddPrice');
  const totalEl   = calc.querySelector<HTMLElement>('#calcTotal');

  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU') + ' ₽';

  const getBasePrice = (area: number) => {
    const tier = BASE_TIERS.find(t => area <= t.max)!;
    return area * tier.price;
  };

  const getAddPrice = (area: number) => {
    let total = 0;
    calc.querySelectorAll<HTMLInputElement>('.calc-addon:checked').forEach(cb => {
      const fn = ADDON_PRICES[cb.dataset.addon ?? ''];
      if (fn === undefined) return;
      total += typeof fn === 'function' ? fn(area) : fn;
    });
    return total;
  };

  const update = () => {
    const raw  = parseInt(areaInput?.value ?? '100', 10);
    const area = Math.max(30, Math.min(2000, isNaN(raw) ? 100 : raw));
    if (areaInput) areaInput.value = String(area);

    const base = getBasePrice(area);
    const add  = getAddPrice(area);

    if (baseEl)  baseEl.textContent  = fmt(base);
    if (addEl)   addEl.textContent   = add > 0 ? fmt(add) : '0 ₽';
    if (totalEl) totalEl.textContent = fmt(base + add);

    // Update per-addon price labels
    calc.querySelectorAll<HTMLInputElement>('.calc-addon').forEach(cb => {
      const fn    = ADDON_PRICES[cb.dataset.addon ?? ''];
      const prEl  = cb.closest('.form-checkbox')?.querySelector<HTMLElement>('.form-checkbox__price');
      if (prEl && fn !== undefined) {
        const p = typeof fn === 'function' ? fn(area) : fn;
        prEl.textContent = Math.round(p).toLocaleString('ru-RU') + ' ₽';
      }
    });
  };

  areaInput?.addEventListener('input', update);
  calc.querySelectorAll<HTMLInputElement>('.calc-addon').forEach(cb => cb.addEventListener('change', update));
  update();
}

// ── INIT ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMortgageCalc();
  initDesignCalc();
});
