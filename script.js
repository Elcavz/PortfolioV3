(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Analytics (GoatCounter events) ---------- */
  // Events show up in the GoatCounter dashboard alongside page views.
  // Silently does nothing if the script is blocked or hasn't loaded yet.
  const trackEvent = (path, title) => {
    const gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') {
      try { gc.count({ path, title: title || path, event: true }); } catch (_) { /* ignore */ }
    }
  };
  const linkLabel = a => {
    const project = a.closest('.pcard');
    const name = project && $('h3', project) ? $('h3', project).textContent.trim() : '';
    const text = a.textContent.trim() || a.getAttribute('aria-label') || '';
    return name ? `${name} — ${text}` : text;
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.startsWith('mailto:')) {
      trackEvent('email-click', 'Clicked email link');
    } else if (/^https?:/i.test(href) && a.hostname !== location.hostname) {
      trackEvent(`outbound/${a.hostname}${a.pathname.replace(/\/$/, '')}`, linkLabel(a));
    }
  });

  /* ---------- Typewriter (rotating roles) ---------- */
  const typed = $('#typed');
  const roles = [
    'Full Stack Web Developer',
    'Website Builder',
    'UI-focused Problem Solver',
    'Tech Enthusiast',
  ];

  if (typed) {
    if (reduceMotion) {
      typed.textContent = roles[0];
    } else {
      let r = 0, c = 0, deleting = false;
      const tick = () => {
        const word = roles[r];
        c += deleting ? -1 : 1;
        typed.textContent = word.slice(0, c);
        let delay = deleting ? 35 : 75;
        if (!deleting && c === word.length) { delay = 1800; deleting = true; }
        else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; delay = 400; }
        setTimeout(tick, delay);
      };
      setTimeout(tick, 600);
    }
  }

  /* ---------- Nav: scrolled state, progress bar, active link ---------- */
  const navWrap = $('.nav-wrap');
  const progress = $('.scroll-progress');
  const onScroll = () => {
    const y = window.scrollY;
    navWrap.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav-links a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('#menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('no-scroll', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

  /* ---------- Reveal on scroll + counters ---------- */
  const reveals = $$('.reveal');
  // Stagger siblings that reveal together
  reveals.forEach(el => {
    const group = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
    const idx = group.indexOf(el);
    if (idx > 0) el.style.setProperty('--d', `${Math.min(idx, 5) * 0.08}s`);
  });

  const animateCount = el => {
    const to = parseInt(el.dataset.to, 10) || 0;
    if (reduceMotion) { el.textContent = to; return; }
    const dur = 1400;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        $$('.count', entry.target).forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
    $$('.count').forEach(animateCount);
  }

  /* ---------- Marquee: duplicate for a seamless loop ---------- */
  const track = $('.marquee-track');
  if (track) {
    Array.from(track.children).forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    // Cursor glow
    const glow = $('.cursor-glow');
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = null;
    const loop = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      raf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));

    // Spotlight cards
    $$('.spotlight').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // 3D tilt
    $$('.tilt').forEach(el => {
      const max = el.classList.contains('code-card') ? 8 : 5;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1200px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // Magnetic buttons
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Project filters ---------- */
  const filterBtns = $$('.filter');
  const filterables = $$('.pcard[data-cat], .more-list li[data-cat]');
  filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === 'all' ? filterables.length : filterables.filter(el => el.dataset.cat === f).length;
    const badge = $('.filter-count', btn);
    if (badge) badge.textContent = n;

    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      filterables.forEach(el => {
        const show = f === 'all' || el.dataset.cat === f;
        el.classList.toggle('is-hidden', !show);
        if (show && el.classList.contains('pcard')) {
          el.classList.add('in');
          el.classList.remove('pop');
          void el.offsetWidth; // restart animation
          el.classList.add('pop');
        }
      });
    });
  });

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------- Copy email ---------- */
  $$('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast('Email copied to clipboard ✓');
      trackEvent('email-copy', 'Copied email address');
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('figcaption', lb);
  let lastFocus = null;

  const openLightbox = (src, title) => {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = title;
    lbCap.textContent = title;
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => lb.classList.add('show'));
    $('.lightbox-close', lb).focus();
  };
  const closeLightbox = () => {
    lb.classList.remove('show');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { lb.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  };

  $$('[data-lightbox]').forEach(el => {
    el.addEventListener('click', () => {
      openLightbox(el.dataset.lightbox, el.dataset.title);
      trackEvent(`project-preview/${el.dataset.lightbox.split('/').pop().replace(/\.\w+$/, '')}`, `Viewed screenshot: ${el.dataset.title}`);
    });
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox-close')) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) closeLightbox();
    else if (menu.classList.contains('open')) setMenu(false);
  });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  const form = $('#contact-form');
  const status = $('#form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fields = ['name', 'email', 'message'].map(id => $('#' + id, form));
    let ok = true;
    fields.forEach(f => {
      const valid = f.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()) : f.value.trim() !== '';
      f.parentElement.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      status.className = 'form-status error';
      status.textContent = 'Please fill in your name, a valid email, and a message.';
      return;
    }
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const subject = $('#subject').value.trim() || `Project inquiry from ${name}`;
    const body = `${$('#message').value.trim()}\n\n— ${name} (${email})`;
    trackEvent('contact-form-submit', 'Submitted contact form');
    window.location.href =
      `mailto:renzsayaman100@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.className = 'form-status ok';
    status.textContent = 'Opening your email app… thanks for reaching out!';
    form.reset();
  });
  $$('input, textarea', form).forEach(f =>
    f.addEventListener('input', () => f.parentElement.classList.remove('invalid')));

  /* ---------- Local time (Philippines) + year ---------- */
  const timeEl = $('#local-time');
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
    const update = () => { timeEl.textContent = `${fmt.format(new Date())} (PHT)`; };
    update();
    setInterval(update, 30000);
  }
  $('#year').textContent = new Date().getFullYear();
})();
