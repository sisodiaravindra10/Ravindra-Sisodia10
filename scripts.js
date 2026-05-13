/* ===================================================
   Ravindra Sisodia — shared motion + interactions
   =================================================== */

(function () {
  // ===== preloader =====
  const pre = document.getElementById('preloader');
  if (pre) {
    const num = pre.querySelector('[data-pre-num]');
    let count = 0;
    const dur = 900;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const v = Math.round(p * 100);
      if (num) num.textContent = String(v).padStart(2, '0');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(() => {
      pre.classList.add('done');
      document.body.classList.remove('loading');
      document.querySelectorAll('.hero-name').forEach(el => el.classList.add('in'));
      document.querySelectorAll('.dp-title .clip-reveal, .dp-eye, .dp-meta').forEach(el => el.classList.add('in'));
      kickoffReveals();
    }, 1100);
  } else {
    kickoffReveals();
  }

  // ===== hero · generative each visit (light bg, no spotlight) =====
  function initHeroGen() {
    const hero = document.querySelector('.hero.hero-gen');
    if (!hero) return;
    const eyebrow = document.getElementById('heroEyebrow');
    const pointers = document.getElementById('heroPointers');
    const variantOut = document.getElementById('heroVariant');
    const rollBtn = document.getElementById('heroRoll');

    // Accent colors that read on cream paper. No dark bg flips — hero stays light.
    const accents = [
      'oklch(0.68 0.197 42)',   // signature orange
      'oklch(0.58 0.20 28)',    // vermilion
      'oklch(0.54 0.22 12)',    // crimson
      'oklch(0.62 0.18 145)',   // forest green
      'oklch(0.55 0.20 250)',   // electric blue
      'oklch(0.58 0.20 305)',   // magenta
      'oklch(0.60 0.18 88)',    // mustard
    ];

    const eyebrows = [
      'Senior Product Designer · Bengaluru, IN',
      'Sr. Product Designer · Open for 2026',
      'Designer at Zop.Dev · Sr.',
      'Sr. Designer · Figma MCP · Claude Code',
      'Product Designer · B2B SaaS · FinTech',
      '5 years · 4 companies · 1 thesis',
    ];

    const pointerSets = [
      [
        '→ Open for senior product design roles in 2026.',
        '→ Designing in Figma + Claude Code at Zop.Dev.',
        '→ Bridging high-fidelity design and production code.',
        '→ Bengaluru, India.',
      ],
      [
        '→ 5 years across B2B SaaS, FinTech, and enterprise.',
        '→ Pioneered an AI-augmented design-in-code workflow.',
        '→ $53.5K+ in annualised savings, 20+ feature modules.',
        '→ Available for new work in 2026.',
      ],
      [
        '→ Tokens are the contract.',
        '→ Markdown is the API.',
        '→ The shortest path is the kindest.',
        '→ Compliance is the floor, not the ceiling.',
      ],
      [
        '→ Currently at Zop.Dev, Bengaluru.',
        '→ Previously: ScreenRoot, ArtWorksIT, FirstCry.',
        '→ Specialty: design systems + AI-augmented workflows.',
        '→ Reach: sisodia.ravindra10@gmail.com',
      ],
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function roll() {
      const accent = pick(accents);
      const weight = [700, 800, 900, 900][Math.floor(Math.random() * 4)];
      const track = [-0.06, -0.055, -0.05, -0.045][Math.floor(Math.random() * 4)];
      const marqDur = (22 + Math.random() * 14).toFixed(1) + 's';
      const marqDir = Math.random() < 0.5 ? 'normal' : 'reverse';
      const eb = pick(eyebrows);
      const pset = pick(pointerSets);

      hero.style.setProperty('--gen-accent', accent);
      hero.style.setProperty('--gen-weight', weight);
      hero.style.setProperty('--gen-track', track + 'em');
      hero.style.setProperty('--gen-marq-dur', marqDur);
      hero.style.setProperty('--gen-marq-dir', marqDir);

      if (eyebrow) eyebrow.textContent = eb;
      if (pointers) {
        pointers.innerHTML = pset.map((line) => {
          const stripped = line.replace(/^→\s*/, '');
          return `<li class="hero-pointer"><span class="ar">→</span> ${stripped}</li>`;
        }).join('');
      }
      if (variantOut) {
        const seed = Math.floor(1000 + Math.random() * 9000);
        variantOut.textContent = '#' + seed;
      }
    }
    roll();
    if (rollBtn) rollBtn.addEventListener('click', roll);
  }

  // ===== manifesto · spotlight reveal =====
  function initSpotlightManifesto() {
    const sec = document.querySelector('.philo.philo-spot');
    if (!sec) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      sec.classList.add('no-cursor');
      return;
    }
    sec.classList.add('no-cursor');
    const lines = sec.querySelectorAll('.ma-row');
    let armed = false;

    sec.addEventListener('mousemove', (e) => {
      const r = sec.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      sec.style.setProperty('--mx', x + 'px');
      sec.style.setProperty('--my', y + 'px');
      if (!armed) { sec.classList.remove('no-cursor'); armed = true; }

      // cumulative reveal: once a line is within the spotlight, stay revealed
      lines.forEach((line) => {
        if (line.classList.contains('revealed')) return;
        const lr = line.getBoundingClientRect();
        const cx = lr.left + lr.width / 2;
        const cy = lr.top + lr.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < 180) line.classList.add('revealed');
      });
    });
    sec.addEventListener('mouseleave', () => {
      sec.classList.add('no-cursor');
      armed = false;
    });
  }

  // ===== pixelate hero portrait =====
  function pixelatePortrait() {
    document.querySelectorAll('canvas[data-pixelate]').forEach((canvas) => {
      const src = canvas.getAttribute('data-src');
      const grid = parseInt(canvas.getAttribute('data-grid') || '56', 10);
      const display = parseInt(canvas.getAttribute('data-display') || '380', 10);
      if (!src) return;

      // Draw an immediate placeholder so the canvas is never invisible
      canvas.width = display;
      canvas.height = display;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#E2DAC6';
      ctx.fillRect(0, 0, display, display);

      const img = new Image();
      img.onload = () => {
        const tmp = document.createElement('canvas');
        tmp.width = grid; tmp.height = grid;
        const tctx = tmp.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        const min = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - min) / 2;
        const sy = (img.naturalHeight - min) / 2;
        tctx.drawImage(img, sx, sy, min, min, 0, 0, grid, grid);

        canvas.width = display;
        canvas.height = display;
        const ctx2 = canvas.getContext('2d');
        ctx2.imageSmoothingEnabled = false;
        ctx2.drawImage(tmp, 0, 0, display, display);
      };
      img.onerror = () => {
        // Visible orange-on-cream fallback so the area is never an empty hole
        canvas.width = display;
        canvas.height = display;
        const ctx2 = canvas.getContext('2d');
        ctx2.imageSmoothingEnabled = false;
        // big square chunks that look pixel-arty
        const block = display / 8;
        const palette = ['#1C1D1E', '#FF5A1F', '#E2DAC6', '#F5F0E5'];
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            ctx2.fillStyle = palette[(x * 3 + y * 7) % palette.length];
            ctx2.fillRect(x * block, y * block, block, block);
          }
        }
        ctx2.fillStyle = '#1C1D1E';
        ctx2.font = `bold ${display * 0.22}px Inter, sans-serif`;
        ctx2.textAlign = 'center';
        ctx2.fillText('RS', display / 2, display / 2 + display * 0.08);
        console.warn('pixelate: failed to load', src, '— showing pattern fallback');
      };
      img.src = src;
    });
  }

  // ===== "now" widget: IST clock + rotating activity =====
  function initNowWidget() {
    const timeEl = document.getElementById('nowTime');
    const doingEl = document.getElementById('nowDoing');
    if (!timeEl && !doingEl) return;

    const activities = [
      'Editing → Figma · Recommendation',
      'Pairing → Claude Code · onboarding',
      'Reviewing → MCP token sync',
      'Sketching → Banking · transfer flow',
      'Writing → Markdown · component spec',
      'Iterating → Tailwind tokens',
      'Mocking → AWS re:Invent collateral',
    ];

    function updateTime() {
      if (!timeEl) return;
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + 5.5 * 3600000);
      const hh = String(ist.getHours()).padStart(2, '0');
      const mm = String(ist.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}`;
    }

    let idx = Math.floor(Math.random() * activities.length);
    function updateActivity() {
      if (!doingEl) return;
      doingEl.style.opacity = '0';
      setTimeout(() => {
        idx = (idx + 1) % activities.length;
        doingEl.textContent = activities[idx];
        doingEl.style.opacity = '1';
      }, 360);
    }

    updateTime();
    if (doingEl) doingEl.textContent = activities[idx];
    setInterval(updateTime, 30000);
    setInterval(updateActivity, 6500);
  }

  // ===== cursor-tracked project preview =====
  function initProjectPreview() {
    const preview = document.getElementById('projPreview');
    if (!preview) return;
    if (window.matchMedia('(hover: none)').matches || window.innerWidth < 720) return;

    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.5;
    let cx = tx, cy = ty;
    const offsetX = 30;
    const offsetY = -110;
    const pad = 12;
    const w = 320;
    const h = 210;

    document.addEventListener('mousemove', (e) => {
      let nx = e.clientX + offsetX;
      let ny = e.clientY + offsetY;
      if (nx + w > window.innerWidth - pad) nx = e.clientX - w - offsetX;
      if (ny < pad) ny = e.clientY + 30;
      if (ny + h > window.innerHeight - pad) ny = window.innerHeight - h - pad;
      tx = nx; ty = ny;
    });

    document.querySelectorAll('.proj').forEach((proj) => {
      const src = proj.querySelector('.proj-preview svg');
      if (!src) return;
      proj.addEventListener('mouseenter', () => {
        preview.innerHTML = '';
        preview.appendChild(src.cloneNode(true));
        preview.classList.add('show');
      });
      proj.addEventListener('mouseleave', () => {
        preview.classList.remove('show');
      });
    });

    function tick() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      preview.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===== reveals =====
  function kickoffReveals() {
    initHeroGen();
    initSpotlightManifesto();
    pixelatePortrait();
    initNowWidget();
    initProjectPreview();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .clip-reveal').forEach((el) => io.observe(el));
    initCounters();
    initStrokeDraw();
    initTickProgress();
  }

  // ===== animated counters =====
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const dur = 1500;
        const t0 = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 4);
        function step(now) {
          const p = Math.min((now - t0) / dur, 1);
          const v = target * ease(p);
          el.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.35 });
    els.forEach((el) => io.observe(el));
  }

  // ===== svg stroke draw on scroll =====
  function initStrokeDraw() {
    const paths = document.querySelectorAll('[data-draw]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const path = entry.target;
        try {
          const length = path.getTotalLength();
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)';
          requestAnimationFrame(() => {
            path.style.strokeDashoffset = '0';
          });
        } catch (e) {}
        io.unobserve(path);
      });
    }, { threshold: 0.3 });
    paths.forEach((p) => io.observe(p));
  }

  // ===== side tick progress =====
  function initTickProgress() {
    const ticks = document.querySelectorAll('.tick');
    if (!ticks.length) return;
    const targets = Array.from(ticks).map((t) => {
      const id = t.getAttribute('data-target');
      return { tick: t, el: id ? document.getElementById(id) : null };
    }).filter((x) => x.el);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const m = targets.find((x) => x.el === entry.target);
        if (!m) return;
        if (entry.isIntersecting) {
          targets.forEach((x) => x.tick.classList.remove('active'));
          m.tick.classList.add('active');
        }
      });
    }, { threshold: 0, rootMargin: '-40% 0px -55% 0px' });
    targets.forEach((x) => io.observe(x.el));
  }

  // ===== header hide-on-scroll =====
  let lastY = 0;
  const headerEl = document.getElementById('shellTop');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 200 && y > lastY) headerEl.classList.add('hidden');
      else headerEl.classList.remove('hidden');
      lastY = y;
    }, { passive: true });
  }

  // ===== nav dropdown =====
  const hamb = document.getElementById('hamburger');
  const nav = document.getElementById('shellNav');
  if (hamb && nav) {
    hamb.addEventListener('click', () => {
      hamb.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      hamb.classList.remove('open'); nav.classList.remove('open');
    }));
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !hamb.contains(e.target)) {
        hamb.classList.remove('open'); nav.classList.remove('open');
      }
    });
  }

  // ===== theme toggle (light / dark) =====
  function applyTheme(theme) {
    if (theme === 'midnight') document.documentElement.setAttribute('data-theme', 'midnight');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('rs-theme', theme); } catch (e) {}
  }
  try {
    const saved = localStorage.getItem('rs-theme');
    if (saved === 'midnight') applyTheme('midnight');
  } catch (e) {}
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'midnight';
      applyTheme(isDark ? 'paper' : 'midnight');
    });
    // Keyboard shortcut: press "T" to toggle
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 't' || e.key === 'T') {
        const isDark = document.documentElement.getAttribute('data-theme') === 'midnight';
        applyTheme(isDark ? 'paper' : 'midnight');
      }
    });
  }

  // ===== hero parallax via GSAP =====
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.hero-grid').forEach((el) => {
      gsap.to(el, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    gsap.utils.toArray('.hero-cursor').forEach((el) => {
      gsap.to(el, {
        xPercent: -30,
        yPercent: 40,
        rotation: -16,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    gsap.utils.toArray('.canvas-frame').forEach((el) => {
      gsap.fromTo(el, { scale: 0.94, y: 40 }, {
        scale: 1, y: 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: 0.5 },
      });
    });

    gsap.utils.toArray('.scene-visual').forEach((el) => {
      gsap.fromTo(el, { y: 40 }, {
        y: -20,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // hero cursor follows pointer subtly
    document.querySelectorAll('.hero-cursor').forEach((el) => {
      const rect = () => el.parentElement.getBoundingClientRect();
      let ox = 0, oy = 0;
      el.parentElement.addEventListener('mousemove', (e) => {
        const r = rect();
        ox = ((e.clientX - r.left) / r.width - 0.5) * 30;
        oy = ((e.clientY - r.top) / r.height - 0.5) * 30;
        el.style.translate = `${ox}px ${oy}px`;
      });
      el.parentElement.addEventListener('mouseleave', () => {
        el.style.translate = `0 0`;
      });
    });
  }
})();
