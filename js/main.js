/* ============================================================
   МОНОЛИТ · main.js
   Меню · Reveal · Scramble · Счётчики · Параллакс · Аккордеоны
   Кастомные селекты · Калькулятор · Маска · Форма · Лайтбокс · Курсор
   Фолбэки картинок
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM   = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  document.documentElement.classList.add('js');

  /* ---------- ФОЛБЭКИ КАРТИНОК (если основной CDN недоступен) ---------- */
  $$('img[data-fb]').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fbUsed) return;
      img.dataset.fbUsed = '1';
      img.src = img.dataset.fb;
    }, { once: true });
  });

  /* ---------- HEADER + ПРОГРЕСС ---------- */
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');

  const onHeader = () => {
    header.classList.toggle('solid', scrollY > 40);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };

  /* ---------- МОБИЛЬНОЕ МЕНЮ ---------- */
  const burger = $('#burger');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mnav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- HERO: ЗАГРУЗКА ЗАГОЛОВКА + СТРАХОВКА ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() =>
    document.documentElement.classList.add('is-ready')
  ));
  // если на каком-то устройстве rAF затроттлился — форсируем показ после load
  addEventListener('load', () => setTimeout(() =>
    document.documentElement.classList.add('is-ready'), 900
  ));

  /* ---------- SCROLL REVEAL ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); revealObs.unobserve(e.target); }
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => revealObs.observe(el));

  /* ---------- SCRAMBLE-ДЕКОДИРОВАНИЕ ---------- */
  const CHARS = 'ABCDEFGHKMNPRSTUVWXYZ0123456789·—/«»';
  const scramble = (el) => {
    const final = el.textContent;
    if (RM) return;
    const dur = 1000, start = performance.now();
    (function tick(now) {
      const p = clamp((now - start) / dur, 0, 1);
      const reveal = Math.floor(p * final.length);
      let out = final.slice(0, reveal);
      for (let i = reveal; i < final.length; i++) {
        out += final[i] === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
    })(start);
  };
  const scrObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { scramble(e.target); scrObs.unobserve(e.target); }
    });
  }, { threshold: .6 });
  $$('[data-scramble]').forEach(el => scrObs.observe(el));

  /* ---------- СЧЁТЧИКИ ---------- */
  const fmtNum = (v, d) => v.toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  const runCounter = (el) => {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.decimals || 0);
    if (RM) { el.textContent = fmtNum(to, dec); return; }
    const dur = 1700, start = performance.now();
    (function tick(now) {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmtNum(to * eased, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  };
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { runCounter(e.target); cntObs.unobserve(e.target); }
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => cntObs.observe(el));

  /* ---------- ПАРАЛЛАКС ---------- */
  const pEls = $$('[data-parallax]').map(el => ({ el, sp: parseFloat(el.dataset.parallax) || .1, base: 0, h: 0 }));
  const measure = () => pEls.forEach(o => {
    o.el.style.transform = '';
    const r = o.el.getBoundingClientRect();
    o.base = r.top + scrollY; o.h = r.height;
  });
  const parallax = () => {
    if (RM || !pEls.length) return;
    const mid = scrollY + innerHeight / 2;
    pEls.forEach(o => {
      const y = (o.base + o.h / 2 - mid) * o.sp;
      o.el.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
    });
  };

  /* ---------- ПРОЦЕСС: ЛИНИЯ И ИНДЕКС ---------- */
  const pSection = $('#process'), pFill = $('#processFill'), pIdx = $('#processIdx');
  const pSteps = $$('.p-step');
  const processTick = () => {
    if (!pSection) return;
    const r = pSection.getBoundingClientRect();
    const prog = clamp((innerHeight * .62 - r.top) / r.height, 0, 1);
    pFill.style.height = (prog * 100) + '%';
    let cur = 1;
    pSteps.forEach((s, i) => {
      const passed = s.getBoundingClientRect().top < innerHeight * .62;
      s.classList.toggle('passed', passed);
      if (passed) cur = i + 1;
    });
    pIdx.textContent = String(cur).padStart(2, '0');
  };

  /* ---------- ЕДИНЫЙ SCROLL-HANDLER (rAF-throttle) ---------- */
  let ticking = false;
  const onScrollFrame = () => {
    onHeader();
    parallax();
    processTick();
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  addEventListener('resize', () => { measure(); parallax(); onHeader(); });
  addEventListener('load', () => { measure(); onHeader(); processTick(); });
  measure(); onHeader();

  /* ---------- АККОРДЕОНЫ ---------- */
  $$('.acc-item').forEach(item => {
    const btn = $('.acc-btn', item);
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      const group = item.closest('[data-acc-single]');
      if (group && !isOpen) {
        $$('.acc-item.open', group).forEach(o => {
          o.classList.remove('open');
          $('.acc-btn', o).setAttribute('aria-expanded', 'false');
        });
      }
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- КАСТОМНЫЕ СЕЛЕКТЫ ---------- */
  class CustomSelect {
    constructor(root, onChange) {
      this.root = root;
      this.btn = $('.select-btn', root);
      this.valEl = $('.select-value', root);
      this.list = $('.select-list', root);
      this.opts = $$('[role="option"]', this.list);
      this.onChange = onChange;
      this.opened = false;

      const uid = 'sel-' + Math.random().toString(36).slice(2, 8);
      this.btn.id = uid;
      this.list.setAttribute('aria-labelledby', uid);
      this.opts.forEach((o, i) => o.id = uid + '-o' + i);

      let sel = this.opts.findIndex(o => o.classList.contains('selected'));
      if (sel < 0) sel = 0;
      this.selected = sel;
      this.apply(sel, false);

      this.btn.addEventListener('click', () => this.opened ? this.close() : this.open());
      this.btn.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); this.open(); }
      });
      this.list.addEventListener('keydown', (e) => this.onKey(e));
      this.opts.forEach((o, i) => {
        o.addEventListener('click', () => this.select(i));
        o.addEventListener('mousemove', () => this.moveActive(i, false));
      });
      document.addEventListener('click', (e) => {
        if (this.opened && !root.contains(e.target)) this.close(false);
      });
    }
    moveActive(i, scroll = true) {
      this.active = clamp(i, 0, this.opts.length - 1);
      this.opts.forEach((o, k) => o.classList.toggle('active', k === this.active));
      this.list.setAttribute('aria-activedescendant', this.opts[this.active].id);
      if (scroll) this.opts[this.active].scrollIntoView({ block: 'nearest' });
    }
    open() {
      this.opened = true;
      this.root.classList.add('open');
      this.btn.setAttribute('aria-expanded', 'true');
      this.moveActive(this.selected);
      this.list.focus();
    }
    close(focusBtn = true) {
      this.opened = false;
      this.root.classList.remove('open');
      this.btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) this.btn.focus();
    }
    onKey(e) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); this.moveActive(this.active + 1); break;
        case 'ArrowUp':   e.preventDefault(); this.moveActive(this.active - 1); break;
        case 'Home':      e.preventDefault(); this.moveActive(0); break;
        case 'End':       e.preventDefault(); this.moveActive(this.opts.length - 1); break;
        case 'Enter': case ' ': e.preventDefault(); this.select(this.active); break;
        case 'Escape':    e.preventDefault(); this.close(); break;
        case 'Tab':       this.close(false); break;
      }
    }
    select(i) {
      this.selected = i;
      this.apply(i, true);
      this.close();
    }
    apply(i, fire) {
      this.opts.forEach((o, k) => {
        o.classList.toggle('selected', k === i);
        o.setAttribute('aria-selected', String(k === i));
      });
      this.valEl.textContent = $('span', this.opts[i]).textContent;
      if (fire) this.onChange(this.opts[i].dataset, this.opts[i]);
    }
  }

  /* ---------- КАЛЬКУЛЯТОР ---------- */
  const calc = { price: 120, styleK: 1, styleName: 'Минимализм', typeName: 'Загородный дом', area: 240 };
  const areaRange = $('#areaRange'), areaVal = $('#areaVal');
  const elTotal = $('#calcTotal'), elM2 = $('#calcM2'), elTerm = $('#calcTerm');
  const bBase = $('#bBase'), bStyleK = $('#bStyleK'), bOpts = $('#bOpts');

  const money = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  const animateTotal = (to) => {
    const from = elTotal._cur ?? to;
    elTotal._cur = to;
    if (RM || from === to) { elTotal.textContent = money(to); return; }
    const dur = 480, start = performance.now();
    (function tick(now) {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      elTotal.textContent = money(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  };

  const totals = () => {
    const base = calc.price * calc.area;
    const styled = base * calc.styleK;
    const pct = $$('.opt-input:checked').reduce((s, i) => s + parseFloat(i.dataset.pct), 0);
    return { base, styled, pct, total: styled * (1 + pct / 100) };
  };

  const renderCalc = () => {
    const t = totals();
    animateTotal(t.total);
    bBase.textContent  = `$${calc.price} × ${calc.area} м²`;
    bStyleK.textContent = `×${calc.styleK.toFixed(2)} · ${calc.styleName}`;
    bOpts.textContent  = `+${t.pct}%`;
    elM2.textContent   = `$${money(t.total / calc.area)} / м²`;
    elTerm.textContent = `≈ ${Math.round(6 + calc.area / 120)} мес.`;
  };

  new CustomSelect($('[data-select="type"]'), (d, opt) => {
    calc.price = +d.price;
    calc.typeName = $('span', opt).textContent;
    renderCalc();
  });
  new CustomSelect($('[data-select="style"]'), (d, opt) => {
    calc.styleK = +d.k;
    calc.styleName = $('span', opt).textContent;
    renderCalc();
  });

  const setRangeFill = () => {
    const p = ((areaRange.value - areaRange.min) / (areaRange.max - areaRange.min)) * 100;
    areaRange.style.setProperty('--p', p + '%');
  };
  areaRange.addEventListener('input', () => {
    calc.area = +areaRange.value;
    areaVal.textContent = calc.area + ' м²';
    setRangeFill();
    renderCalc();
  });
  $$('.opt-input').forEach(i => i.addEventListener('change', () => {
    i.closest('.opt').classList.toggle('checked', i.checked);
    renderCalc();
  }));
  setRangeFill(); renderCalc();

  /* ---------- ТОСТ ---------- */
  const toastEl = $('#toast'); let toastT;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2800);
  };

  /* ---------- «ЗАФИКСИРОВАТЬ ЦЕНУ» ---------- */
  $('#lockPrice').addEventListener('click', () => {
    const t = totals();
    const optsList = $$('.opt-input:checked').map(i => i.dataset.name).join(', ');
    const summary = `${calc.typeName} · ${calc.area} м² · ${calc.styleName}` +
      (optsList ? ` · ${optsList}` : '') + ` — ≈ $${money(t.total)}`;
    $('#calcChip').textContent = 'ВАШ РАСЧЁТ: ' + summary;
    $('#calcChipWrap').hidden = false;
    toast('Расчёт прикреплён к заявке ↓');
    $('#contact').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  });

  /* ---------- МАСКА ТЕЛЕФОНА ---------- */
  const phoneInput = $('#fPhone');
  const formatPhone = (raw) => {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('1')) d = d.slice(1);
    d = d.slice(0, 10);
    if (!d.length) return '';
    let out = '+1 (' + d.slice(0, 3);
    if (d.length >= 4) out += ') ' + d.slice(3, 6);
    if (d.length >= 7) out += '-' + d.slice(6, 10);
    return out;
  };
  phoneInput.addEventListener('input', () => {
    phoneInput.value = formatPhone(phoneInput.value);
    phoneInput.closest('.field').classList.remove('invalid');
  });

  /* ---------- ФОРМА (ДЕМО) ---------- */
  const form = $('#leadForm'), fName = $('#fName');
  fName.addEventListener('input', () => fName.closest('.field').classList.remove('invalid'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true, firstBad = null;
    const check = (cond, input) => {
      const f = input.closest('.field');
      f.classList.toggle('invalid', !cond);
      if (!cond) {
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        ok = false; if (!firstBad) firstBad = input;
      }
    };
    check(fName.value.trim().length >= 2, fName);
    check(phoneInput.value.replace(/\D/g, '').length === 11, phoneInput);
    if (!ok) { firstBad.focus(); return; }
    form.classList.add('sent');
    toast('Заявка принята (демо-режим)');
  });

  /* ---------- ЛАЙТБОКС ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'),
        lbMeta = $('#lbMeta'), lbCount = $('#lbCount');
  const cards = $$('.work-card');
  const items = cards.map(c => ({
    full: c.dataset.full,
    fullFb: c.dataset.fullFb || '',
    title: $('.work-title', c).textContent,
    meta: $('.work-meta', c).textContent
  }));
  let lbIndex = 0, lastFocus = null;

  // фолбэк полноразмерной картинки в лайтбоксе
  lbImg.addEventListener('error', () => {
    const it = items[lbIndex];
    if (!it || !it.fullFb || lbImg.dataset.fbIdx === String(lbIndex)) return;
    lbImg.dataset.fbIdx = String(lbIndex);
    lbImg.src = it.fullFb;
  });

  const lbRender = () => {
    const it = items[lbIndex];
    lbImg.src = it.full;
    lbImg.alt = it.title;
    lbTitle.textContent = it.title;
    lbMeta.textContent = it.meta;
    lbCount.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  };
  const lbOpen = (i) => {
    lbIndex = i; lastFocus = document.activeElement;
    lbRender();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('open'));
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  };
  const lbClose = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 350);
    if (lastFocus) lastFocus.focus();
  };
  const lbNav = (dir) => { lbIndex = (lbIndex + dir + items.length) % items.length; lbRender(); };

  cards.forEach((c, i) => {
    c.addEventListener('click', () => lbOpen(i));
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(i); }
    });
  });
  $('#lbClose').addEventListener('click', lbClose);
  $('#lbPrev').addEventListener('click', () => lbNav(-1));
  $('#lbNext').addEventListener('click', () => lbNav(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
  });

  /* ---------- КАСТОМНЫЙ КУРСОР ---------- */
  if (FINE && !RM) {
    const dot = $('#cursorDot'), ring = $('#cursorRing');
    document.documentElement.classList.add('has-cursor');
    let mx = -100, my = -100, rx = -100, ry = -100, visible = false;

    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx; ry = my;
        dot.style.opacity = ring.style.opacity = 1;
      }
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
      const t = e.target.closest('a,button,.work-card,.opt,.select-btn,input[type=range],li[role=option]');
      ring.classList.toggle('is-hover', !!t);
    });
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = ring.style.opacity = 0; visible = false;
    });
    (function loop() {
      rx += (mx - rx) * .16;
      ry += (my - ry) * .16;
      const half = ring.offsetWidth / 2;
      ring.style.transform = `translate(${rx - half}px, ${ry - half}px)`;
      requestAnimationFrame(loop);
    })();
  } else {
    $('#cursorDot').remove(); $('#cursorRing').remove();
  }

  /* ---------- ГОД ---------- */
  $('#year').textContent = new Date().getFullYear();
})();