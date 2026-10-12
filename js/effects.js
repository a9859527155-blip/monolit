/* ============================================================
   МОНОЛИТ · effects.js
   «Бронзовая пыль» на canvas первого экрана.
   Автостоп вне вьюпорта, пауза при скрытой вкладке,
   полный отказ при prefers-reduced-motion.
   ============================================================ */
(() => {
  'use strict';

  const cv = document.getElementById('heroFx');
  if (!cv) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cv.remove(); return; }

  const ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let particles = [];
  let running = false, rafId = null;

  const seed = () => {
    const count = Math.min(110, Math.round((w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: .5 + Math.random() * 1.5,
      vy: -(.06 + Math.random() * .2),      // медленный дрейф вверх
      ph: Math.random() * Math.PI * 2,       // фаза мерцания
      sw: .2 + Math.random() * .7,           // амплитуда покачивания
      a: .2 + Math.random() * .5             // базовая яркость
    }));
  };

  const resize = () => {
    const rect = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const tick = (t) => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y += p.vy;
      p.x += Math.sin(t / 1800 + p.ph) * p.sw * .16;
      if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
      if (p.x < -12) p.x = w + 12;
      if (p.x > w + 12) p.x = -12;

      const alpha = p.a * (.55 + .45 * Math.sin(t / 900 + p.ph * 2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,162,95,${alpha.toFixed(3)})`;
      ctx.fill();
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => { if (!running) { running = true; rafId = requestAnimationFrame(tick); } };
  const stop  = () => { running = false; cancelAnimationFrame(rafId); ctx.clearRect(0, 0, w, h); };

  // рисуем, только пока герой на экране
  new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop(), { threshold: .04 })
    .observe(cv);

  document.addEventListener('visibilitychange', () =>
    document.hidden ? stop() : start()
  );

  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 200); });

  resize();
})();