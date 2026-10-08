(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  $('#year').textContent = new Date().getFullYear();

  // Theme toggle (saved when storage is available)
  const root = document.documentElement, themeBtn = $('#theme');
  const setTheme = t => {
    root.dataset.theme = t;
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || 'dark');
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Mobile menu
  const burger = $('#burger'), menu = $('#menu');
  const toggleMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  // Typing animation
  const words = ['websites', 'databases', 'networks', 'IT solutions'];
  const typed = $('#typed');
  if (reduce) typed.textContent = words[0];
  else {
    let w = 0, c = 0, del = false;
    (function tick() {
      const word = words[w];
      c += del ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = del ? 45 : 90;
      if (!del && c === word.length) { del = true; delay = 1400; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  // Scroll reveal, skill bars, counters
  const count = el => {
    const to = +el.dataset.to;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1200;
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      $$('.bar i', el).forEach(b => b.style.width = b.dataset.w + '%');
      $$('.count', el).forEach(count);
      io.unobserve(el);
    });
  }, { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  // Active nav link + back-to-top + header state
  const links = $$('.menu a'), top = $('#top');
  const secs = links.map(a => $(a.getAttribute('href')));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('active', on);
        on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => s && spy.observe(s));
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > 600), { passive: true });
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // Project filter
  const chips = $$('.chip'), cards = $$('#grid .card');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.toggle('on', c === chip); c.setAttribute('aria-pressed', c === chip); });
    cards.forEach(card => card.classList.toggle('hide', chip.dataset.f !== 'all' && card.dataset.c !== chip.dataset.f));
  }));



  // Network background (fits the IT theme); pauses off-screen
  const cv = $('#net'), ctx = cv.getContext('2d'), hero = $('#home');
  let nodes = [], vis = true, mouse = { x: -999, y: -999 };
  const size = () => {
    const r = hero.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(70, Math.round(r.width * r.height / 16000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * r.width, y: Math.random() * r.height,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35
    }));
  };
  const draw = () => {
    const w = cv.clientWidth, h = cv.clientHeight;
    const col = getComputedStyle(root).getPropertyValue('--accent').trim();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = col;
    nodes.forEach((a, i) => {
      if (!reduce) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(a.x, a.y, 2, 0, 6.3); ctx.fill();
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.globalAlpha = (1 - d / 130) * .35; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (m < 170) { ctx.globalAlpha = (1 - m / 170) * .6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  };
  const loop = () => { if (vis) draw(); if (!reduce) requestAnimationFrame(loop); };
  size(); loop(); if (reduce) draw();
  addEventListener('resize', () => { size(); if (reduce) draw(); });
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(hero);
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  hero.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });

  // CV: print-friendly layout, choose "Save as PDF" in the print window
  $('#cv').addEventListener('click', () => print());

  // Scroll progress bar
  const prog = $('#progress');
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  }, { passive: true });

  // Card spotlight follows the pointer
  cards.forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  // Project details dialog
  const modal = $('#modal'), mBody = $('#m-body');
  const extra = [
    ['Designed the layout, wrote all CSS and JavaScript, and tested it on phone, tablet and desktop.', 'Dark/light themes', 'Typing and scroll animations', 'Validated contact form'],
    ['Designed the tables, wrote the PHP pages and built search and report screens.', 'Student profiles and grades', 'Enrollment tracking', 'Search and print reports'],
    ['Built the interface and logic in plain JavaScript with no libraries.', 'Add, edit, complete tasks', 'Filter by status', 'Saved in the browser'],
    ['Mapped the room, ran the cabling and configured addressing and sharing.', 'IP addressing plan', 'Shared printer', 'Basic troubleshooting guide'],
    ['Modeled products and suppliers and wrote queries for daily use.', 'Normalized schema', 'Low-stock alert query', 'Backup routine'],
    ['Built the form, validated input on the server and saved records safely.', 'Required-field checks', 'Prepared statements', 'Confirmation page']
  ];
  cards.forEach((card, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn ghost'; btn.type = 'button'; btn.textContent = 'Details';
    $('.btns', card).appendChild(btn);
    btn.addEventListener('click', () => {
      const [intro, ...pts] = extra[i];
      mBody.innerHTML = '';
      const img = $('img', card).cloneNode();
      const box = document.createElement('div'); box.className = 'pad';
      box.innerHTML = '<h3 id="m-title"></h3><p></p><h4>What I did</h4><p class="intro"></p><h4>Features</h4><ul class="list"></ul>';
      $('h3', box).textContent = $('h3', card).textContent;
      $('p', box).textContent = $('p', card).textContent;
      $('.intro', box).textContent = intro;
      pts.forEach(t => { const li = document.createElement('li'); li.textContent = t; $('.list', box).appendChild(li); });
      mBody.append(img, box);
      modal.showModal();
    });
  });
  $('#m-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  // Contact form validation
  const form = $('#form'), toast = $('#toast');
  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name (at least 2 characters).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email address, like name@example.com.',
    subject: v => v.trim().length >= 3 || 'Enter a subject (at least 3 characters).',
    message: v => v.trim().length >= 10 || 'Write a message of at least 10 characters.'
  };
  const check = f => {
    const res = rules[f.name](f.value), ok = res === true;
    f.classList.toggle('invalid', !ok);
    f.setAttribute('aria-invalid', !ok);
    $('#e-' + f.name).textContent = ok ? '' : res;
    return ok;
  };
  const fields = $$('input, textarea', form);
  fields.forEach(f => f.addEventListener('blur', () => check(f)));
  fields.forEach(f => f.addEventListener('input', () => f.classList.contains('invalid') && check(f)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = fields.filter(f => !check(f));
    if (bad.length) { bad[0].focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    location.href = 'mailto:daironporin360@gmail.com?subject=' + encodeURIComponent(d.subject) +
      '&body=' + encodeURIComponent(d.message + '\n\nFrom: ' + d.name + ' (' + d.email + ')');
    form.reset();
    toast.textContent = 'Opening your email app. Press send there to deliver your message.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  });
})();
