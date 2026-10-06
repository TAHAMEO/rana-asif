/* =========================================================
   Rana Asif — site interactions (plain script, no dependencies)
   The WebGL hero lives in hero3d.min.js (built from src/hero3d.js).
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js-ok');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  // run fn at most once per animation frame
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  /* ---------- preloader: doors open once the page has loaded ---------- */
  function initPreloader() {
    var pre = $('#preloader');
    var bar = $('#preloader-bar');
    var reveal = function () {
      root.classList.add('is-revealed');
      window.dispatchEvent(new CustomEvent('site:revealed'));
    };
    if (!pre) { reveal(); return; }

    root.classList.add('is-loading');
    var started = performance.now();
    var minShow = reduceMotion ? 200 : 1500;
    var progress = 0;
    var done = false;

    (function creep() {
      if (done) return;
      progress += (0.9 - progress) * 0.035;
      bar.style.transform = 'scaleX(' + progress.toFixed(3) + ')';
      requestAnimationFrame(creep);
    })();

    function finish() {
      if (done) return;
      done = true;
      bar.style.transform = 'scaleX(1)';
      var wait = Math.max(0, minShow - (performance.now() - started)) + 300;
      setTimeout(function () {
        pre.classList.add('is-open');
        root.classList.remove('is-loading');
        reveal();
        setTimeout(function () { pre.remove(); }, reduceMotion ? 300 : 1900);
      }, wait);
    }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    setTimeout(finish, 6000); // never hold the visitor longer than this
  }

  /* ---------- header: compact on scroll, mobile menu, active link ---------- */
  function initHeader() {
    var header = $('.site-header');
    var toggle = $('.nav-toggle');
    var menu = $('#nav-menu');

    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 30); };
    onScroll();
    window.addEventListener('scroll', rafThrottle(onScroll), { passive: true });

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      root.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', function (e) { if (e.matches) setOpen(false); });

    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav-links a');
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) { link.classList.add('is-active'); link.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- 3D extruded title: stacked layers behind a gold face ---------- */
  function initTitle3d() {
    $$('.title3d').forEach(function (el) {
      var text = el.textContent.trim();
      var depth = parseInt(el.getAttribute('data-depth') || '14', 10);
      el.textContent = '';
      el.style.setProperty('--depth', depth);

      var label = document.createElement('span');
      label.className = 'sr-only';
      label.textContent = text;
      el.parentNode.insertBefore(label, el);
      el.setAttribute('aria-hidden', 'true');

      for (var k = depth; k >= 1; k--) {
        var layer = document.createElement('span');
        layer.className = 'title3d__layer';
        layer.style.setProperty('--k', k);
        layer.textContent = text;
        el.appendChild(layer);
      }
      var face = document.createElement('span');
      face.className = 'title3d__face';
      face.textContent = text;
      el.appendChild(face);
    });

    var title = $('.hero .title3d');
    var hero = $('#home');
    if (!title || !hero || !finePointer || reduceMotion) return;

    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    var loop = function () {
      x = lerp(x, tx, 0.08);
      y = lerp(y, ty, 0.08);
      title.style.setProperty('--try', (-14 + x * 30).toFixed(2) + 'deg');
      title.style.setProperty('--trx', (8 - y * 18).toFixed(2) + 'deg');
      raf = Math.abs(x - tx) + Math.abs(y - ty) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', function (e) {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- tilt: cards lean toward the pointer ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max') || '12');
      var rx = 0, ry = 0, tx = 0, ty = 0, raf = 0, rect = null;
      var hovering = false;

      var render = function () {
        rx = lerp(rx, tx, 0.15);
        ry = lerp(ry, ty, 0.15);
        el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        var settled = Math.abs(rx - tx) < 0.02 && Math.abs(ry - ty) < 0.02;
        raf = hovering || !settled ? requestAnimationFrame(render) : 0;
      };
      var kick = function () { if (!raf) raf = requestAnimationFrame(render); };

      el.addEventListener('pointerenter', function () {
        hovering = true;
        rect = el.getBoundingClientRect();
        el.classList.add('is-tilting');
        kick();
      });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        var py = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        ty = (px - 0.5) * 2 * max;
        tx = (0.5 - py) * 2 * max;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        kick();
      });
      el.addEventListener('pointerleave', function () {
        hovering = false;
        rect = null;
        tx = 0;
        ty = 0;
        el.classList.remove('is-tilting');
        kick();
      });
      window.addEventListener('scroll', function () { rect = null; }, { passive: true });
    });
  }

  /* ---------- flip cards also flip on tap ---------- */
  function initFlips() {
    $$('.flip').forEach(function (card) {
      card.addEventListener('click', function () { card.classList.toggle('is-flipped'); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('is-flipped'); }
      });
    });
  }

  /* ---------- animated counters ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var fmt = new Intl.NumberFormat('en-US');
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var t0 = performance.now();
      var step = function (now) {
        var p = clamp((now - t0) / 1800, 0, 1);
        el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* ---------- 3D ring of important links: auto-spin, drag, buttons ---------- */
  function initRing() {
    var ring = $('.ring');
    if (!ring) return;
    var stage = $('.ring__stage', ring);
    var spinner = $('.ring__spinner', ring);
    var items = $$('.ring__item', ring);
    var n = items.length;
    var step = 360 / n;
    ring.style.setProperty('--n', n);
    items.forEach(function (item, i) { item.style.setProperty('--i', i); });

    var angle = 0, target = 0, velocity = 0;
    var dragging = false, moved = 0, lastX = 0, paused = false, visible = false, raf = 0;

    var apply = function () {
      spinner.style.setProperty('--angle', angle.toFixed(3) + 'deg');
      items.forEach(function (item, i) {
        var facing = Math.cos(((i * step + angle) * Math.PI) / 180);
        item.style.setProperty('--facing', ((facing + 1) / 2).toFixed(3));
        item.classList.toggle('is-front', facing > 0.94);
        item.classList.toggle('is-back', facing < 0);
      });
    };
    var frame = function () {
      raf = 0;
      if (!visible) return;
      if (!dragging) {
        if (Math.abs(velocity) > 0.01) {
          target += velocity;
          velocity *= 0.92;
        } else if (!paused && !reduceMotion) {
          target -= 0.05;
        }
        angle = lerp(angle, target, 0.09);
      }
      apply();
      raf = requestAnimationFrame(frame);
    };
    var start = function () { if (!raf) raf = requestAnimationFrame(frame); };
    var snap = function () { target = Math.round(target / step) * step; };

    $$('.ring__btn', ring).forEach(function (btn) {
      btn.addEventListener('click', function () {
        velocity = 0;
        snap();
        target -= Number(btn.getAttribute('data-dir')) * step;
      });
    });

    stage.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      velocity = 0;
      stage.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      angle += dx * 0.3;
      target = angle;
      velocity = dx * 0.3;
    });
    var endDrag = function () {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (Math.abs(velocity) < 0.5) snap();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    // a drag should not count as a click on a link
    stage.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    ring.addEventListener('pointerenter', function () { paused = true; });
    ring.addEventListener('pointerleave', function () { paused = false; });
    ring.addEventListener('focusin', function (e) {
      paused = true;
      var item = e.target.closest('.ring__item');
      if (!item) return;
      // bring the focused card to the front by the shortest turn
      var desired = -items.indexOf(item) * step;
      target = desired + Math.round((target - desired) / 360) * 360;
      velocity = 0;
    });
    ring.addEventListener('focusout', function () { paused = false; });

    apply();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(ring);
    } else {
      visible = true;
      start();
    }
  }

  /* ---------- timeline: gold line fills as you scroll ---------- */
  function initTimeline() {
    var tl = $('.timeline');
    if (!tl) return;
    var update = function () {
      var r = tl.getBoundingClientRect();
      var p = clamp((window.innerHeight * 0.6 - r.top) / r.height, 0, 1);
      tl.style.setProperty('--progress', p.toFixed(3));
    };
    update();
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
    window.addEventListener('resize', rafThrottle(update));
  }

  /* ---------- news ticker: duplicate items for a seamless loop ---------- */
  function initTicker() {
    $$('.ticker__items').forEach(function (list) {
      var clone = list.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      list.parentNode.appendChild(clone);
    });
  }

  /* ---------- custom cursor ---------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    var ring = document.createElement('div');
    var dot = document.createElement('div');
    ring.className = 'cursor-ring';
    dot.className = 'cursor-dot';
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    var loop = function () {
      rx = lerp(rx, x, 0.2);
      ry = lerp(ry, y, 0.2);
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      raf = Math.abs(rx - x) + Math.abs(ry - y) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (!root.classList.contains('has-cursor')) { rx = e.clientX; ry = e.clientY; }
      x = e.clientX;
      y = e.clientY;
      root.classList.add('has-cursor');
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    root.addEventListener('mouseleave', function () { root.classList.remove('has-cursor'); });
    document.addEventListener('pointerover', function (e) {
      var interactive = e.target.closest && e.target.closest('a, button, input, select, textarea, label, [data-tilt], .flip, .ring__stage');
      ring.classList.toggle('is-hover', !!interactive);
    });
  }

  /* ---------- back to top with scroll progress ---------- */
  function initToTop() {
    var btn = $('.to-top');
    if (!btn) return;
    var progress = $('.to-top__progress', btn);
    var length = 2 * Math.PI * 22;
    progress.style.strokeDasharray = length;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      progress.style.strokeDashoffset = (length * (1 - p)).toFixed(1);
      btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    };
    update();
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- consultation form → WhatsApp or email ---------- */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;
    var status = $('.form__status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var via = (e.submitter && e.submitter.value) || 'whatsapp';
      var text = [
        'Assalam-o-Alaikum, I would like to request a consultation.',
        '',
        'Name: ' + data.get('name'),
        'Phone: ' + data.get('phone'),
        'Matter: ' + data.get('matter'),
        data.get('message') ? '\n' + data.get('message') : ''
      ].join('\n').trim();

      if (via === 'email') {
        var subject = 'Consultation request — ' + data.get('name');
        window.location.href = 'mailto:' + form.getAttribute('data-email') +
          '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
        status.textContent = 'Opening your email app…';
      } else {
        window.open('https://wa.me/' + form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        status.textContent = 'Opening WhatsApp…';
      }
    });
  }

  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  initTitle3d();
  initPreloader();
  initHeader();
  initReveal();
  initTilt();
  initFlips();
  initCounters();
  initRing();
  initTimeline();
  initTicker();
  initCursor();
  initToTop();
  initContactForm();
  initYear();
})();
