/* ══════════════════════════════════════════════════════════════════
   SPARK — THE SUMMONING

   One energy field, used three ways:

     summon()  the vision is not shown, it is CALLED into being —
               light converges from the dark and the art condenses
               out of it.
     beam()    every word is thrown from the mind that is writing it.
               The orb does not follow the text; the text comes OUT
               of the orb and lands.
     surge()   PRONTO. The whole screen remembers it is electric.

   Rules learned the hard way (the finale nearly froze his machine):
     · zero canvas shadowBlur — every glow is a pre-baked sprite blit
     · one preallocated pool, no allocation inside the frame loop
     · the loop STOPS when the field is empty; it never idles hot
     · DPR capped; a full-screen canvas at 2x is 4x the pixels for
       no more beauty
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── the field ── */
  var cv = null, ctx = null, W = 0, H = 0, DPR = 1;
  var raf = 0, last = 0, awake = false;

  var MAX = window.innerWidth < 620 ? 380 : 640;
  var P = new Array(MAX);
  var head = 0;                       // ring cursor — oldest gets recycled

  var ARCS = [], ARCMAX = 12;

  /* ── the bloom, baked once ──
     A radial gradient blitted with 'lighter' is a shadowBlur that
     costs a texture copy instead of a CPU gaussian. Six bands from
     cyan through violet to gold: the whole Motus spectrum. */
  var GLOW = [], GR = 32;
  var BANDS = [
    [190, 97, 88],   // 0 · ice
    [204, 96, 84],   // 1 · cyan
    [226, 95, 82],   // 2 · deep cyan
    [258, 94, 80],   // 3 · violet
    [280, 92, 78],   // 4 · magenta-violet
    [38,  98, 76]    // 5 · gold
  ];

  function bake() {
    for (var i = 0; i < BANDS.length; i++) {
      var b = BANDS[i];
      var c = document.createElement('canvas');
      c.width = c.height = GR * 2;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(GR, GR, 0, GR, GR, GR);
      g.addColorStop(0.00, 'hsla(' + b[0] + ',' + b[1] + '%,98%,1)');
      g.addColorStop(0.10, 'hsla(' + b[0] + ',' + b[1] + '%,' + b[2] + '%,.95)');
      g.addColorStop(0.30, 'hsla(' + b[0] + ',' + b[1] + '%,' + b[2] + '%,.34)');
      g.addColorStop(0.62, 'hsla(' + b[0] + ',' + b[1] + '%,' + (b[2] - 8) + '%,.08)');
      g.addColorStop(1.00, 'hsla(' + b[0] + ',' + b[1] + '%,' + (b[2] - 8) + '%,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, GR * 2, GR * 2);
      GLOW.push(c);
    }
  }

  function boot() {
    if (cv || reduce) return;
    bake();
    for (var i = 0; i < MAX; i++) {
      P[i] = { a: 0, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
               k: 0, dg: 0, age: 0, life: 1, sz: 1, g: 1, w: 0 };
    }
    cv = document.createElement('canvas');
    cv.id = 'sparkFx';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    size();
    addEventListener('resize', size, { passive: true });
    addEventListener('orientationchange', size, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else if (count()) { start(); }
    });
  }

  function size() {
    if (!cv) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx = cv.getContext('2d', { alpha: true });
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function count() {
    var n = 0;
    for (var i = 0; i < MAX; i++) if (P[i].a) n++;
    return n + ARCS.length;
  }

  /* ── claiming a particle ──
     The pool is a ring. At the cap the oldest light gives way to the
     newest — the field stays dense and the frame cost stays flat. */
  function take() {
    var p = P[head];
    head = (head + 1) % MAX;
    return p;
  }

  /* ══ THE PRIMITIVES ═══════════════════════════════════════════════ */

  /* a mote thrown from a point, optionally pulled toward a target */
  function spark(x, y, o) {
    if (!cv) return null;
    o = o || {};
    var p = take();
    p.a = 1;
    p.x = x; p.y = y;
    var ang = o.ang != null ? o.ang : Math.random() * 6.2832;
    var spd = o.spd != null ? o.spd : 40 + Math.random() * 90;
    p.vx = Math.cos(ang) * spd;
    p.vy = Math.sin(ang) * spd;
    p.tx = o.tx != null ? o.tx : 0;
    p.ty = o.ty != null ? o.ty : 0;
    p.k  = o.k  != null ? o.k  : 0;          // spring pull toward target
    p.dg = o.drag != null ? o.drag : 0.90;   // per-frame velocity retention
    p.age = 0;
    p.life = o.life != null ? o.life : 0.7 + Math.random() * 0.5;
    p.sz = o.sz != null ? o.sz : 1.4 + Math.random() * 1.9;
    p.g  = o.g  != null ? o.g  : (1 + (Math.random() * 3 | 0));
    p.w  = o.w != null ? o.w : 0;            // upward drift (the "rise")
    start();
    return p;
  }

  /* electricity — midpoint displacement, alive for a blink */
  function arc(x0, y0, x1, y1, o) {
    if (!cv) return;
    o = o || {};
    var dx = x1 - x0, dy = y1 - y0;
    var span = Math.sqrt(dx * dx + dy * dy);
    if (span < 2) return;
    var pts = [[x0, y0], [x1, y1]];
    var jag = o.jag != null ? o.jag : 0.3;
    for (var pass = 0; pass < 4; pass++) {
      var np = [pts[0]];
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        var ax = b[0] - a[0], ay = b[1] - a[1];
        var l = Math.sqrt(ax * ax + ay * ay) || 1;
        var off = (Math.random() - 0.5) * l * jag;
        np.push([(a[0] + b[0]) / 2 - ay / l * off,
                 (a[1] + b[1]) / 2 + ax / l * off]);
        np.push(b);
      }
      pts = np;
      jag *= 0.62;
    }
    if (ARCS.length >= ARCMAX) ARCS.shift();
    ARCS.push({
      p: pts, age: 0,
      life: o.life != null ? o.life : 0.16,
      hue: o.hue != null ? o.hue : 202,
      w: o.w != null ? o.w : 1.5
    });
    start();
  }

  /* ══ THE THREE MOVEMENTS ══════════════════════════════════════════ */

  /* SUMMON — light gathers from the dark and condenses onto a shape.
     Nothing "fades in"; it is assembled out of the field. */
  function summon(rect, o) {
    if (!cv || !rect) return;
    o = o || {};
    var cx = rect.left + rect.width / 2,
        cy = rect.top + rect.height / 2;
    var reach = Math.max(rect.width, rect.height) * (o.reach || 0.95);
    var n = o.n || (W < 620 ? 130 : 210);
    var dur = o.dur || 2600;

    /* the gathering — light arrives in waves, not all at once */
    var waves = 5, per = Math.ceil(n / waves);
    for (var wv = 0; wv < waves; wv++) {
      (function (wave) {
        setTimeout(function () {
          for (var i = 0; i < per; i++) {
            var a = Math.random() * 6.2832;
            var d = reach * (0.85 + Math.random() * 0.9);
            /* it lands somewhere on the shape, not at its middle */
            var tx = rect.left + Math.random() * rect.width;
            var ty = rect.top + Math.random() * rect.height;
            spark(cx + Math.cos(a) * d, cy + Math.sin(a) * d, {
              ang: a + Math.PI, spd: 20 + Math.random() * 40,
              tx: tx, ty: ty, k: 5.5 + Math.random() * 5, drag: 0.90,
              life: 1.1 + Math.random() * 0.9,
              sz: 1.2 + Math.random() * 2.6,
              g: wave < 2 ? (2 + (Math.random() * 2 | 0)) : (Math.random() < 0.14 ? 5 : 1 + (Math.random() * 3 | 0))
            });
          }
          /* the slow orbs — big, soft, drifting through */
          for (var j = 0; j < 4; j++) {
            var oa = Math.random() * 6.2832;
            spark(cx + Math.cos(oa) * reach * 1.2, cy + Math.sin(oa) * reach * 1.2, {
              ang: oa + Math.PI, spd: 12,
              tx: cx + (Math.random() - 0.5) * rect.width * 0.7,
              ty: cy + (Math.random() - 0.5) * rect.height * 0.7,
              k: 1.5, drag: 0.955, life: 2.4 + Math.random() * 1.4,
              sz: 7 + Math.random() * 9, g: 3
            });
          }
        }, wave * (dur / waves) * 0.55);
      })(wv);
    }

    /* the crackle — electricity walks the perimeter as it condenses */
    var strikes = o.strikes || 9;
    for (var s = 0; s < strikes; s++) {
      (function (i) {
        setTimeout(function () {
          var edge = i % 4;
          var x0, y0, x1, y1;
          if (edge === 0) { y0 = y1 = rect.top;    x0 = rect.left + Math.random() * rect.width * .5; x1 = x0 + rect.width * (.25 + Math.random() * .4); }
          else if (edge === 1) { x0 = x1 = rect.right; y0 = rect.top + Math.random() * rect.height * .5; y1 = y0 + rect.height * (.25 + Math.random() * .45); }
          else if (edge === 2) { y0 = y1 = rect.bottom; x0 = rect.left + Math.random() * rect.width * .5; x1 = x0 + rect.width * (.25 + Math.random() * .4); }
          else { x0 = x1 = rect.left; y0 = rect.top + Math.random() * rect.height * .5; y1 = y0 + rect.height * (.25 + Math.random() * .45); }
          arc(x0, y0, x1, y1, {
            hue: i % 3 === 0 ? 262 : 200,
            w: 1.4 + Math.random() * 1.4,
            life: 0.13 + Math.random() * 0.1,
            jag: 0.16
          });
          /* sparks fly off the strike */
          for (var q = 0; q < 5; q++) {
            spark(x1, y1, { spd: 90 + Math.random() * 150, drag: 0.86,
                            life: 0.4 + Math.random() * 0.4, sz: 1 + Math.random() * 1.6,
                            g: 1, w: -30 });
          }
        }, 320 + i * (dur / strikes) * 0.72);
      })(s);
    }
  }

  /* BEAM — a word is thrown out of the mind and lands on the page. */
  function beam(x0, y0, x1, y1, o) {
    if (!cv) return;
    o = o || {};
    var n = o.n || 5;
    var toward = Math.atan2(y1 - y0, x1 - x0);
    for (var i = 0; i < n; i++) {
      /* they leave the orb in a spray, then are pulled to the word —
         the curve is what makes it read as thrown, not slid */
      var a = toward + (Math.random() - 0.5) * (o.spread || 2.1);
      spark(x0, y0, {
        ang: a, spd: 120 + Math.random() * 190,
        tx: x1 + (Math.random() - 0.5) * (o.scatter || 16),
        ty: y1 + (Math.random() - 0.5) * 10,
        k: 22 + Math.random() * 16, drag: 0.80,
        life: 0.34 + Math.random() * 0.26,
        sz: 1.2 + Math.random() * 1.8,
        g: o.g != null ? o.g : (Math.random() < 0.2 ? 0 : 2 + (Math.random() * 3 | 0))
      });
    }
    /* the landing — a small bloom where the word locks in */
    if (o.land !== false) {
      spark(x1, y1, { spd: 0, k: 0, drag: 0.7, life: 0.3,
                      sz: o.landSz || 6, g: o.g != null ? o.g : 2 });
    }
    if (o.arc) arc(x0, y0, x1, y1, { hue: o.hue || 210, w: 1.1, life: 0.1, jag: 0.22 });
  }

  /* EMIT — the constant trickle that says the mind is working */
  function emit(x, y, o) {
    if (!cv) return;
    o = o || {};
    var n = o.n || 1;
    for (var i = 0; i < n; i++) {
      spark(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14, {
        spd: 12 + Math.random() * 34, drag: 0.94,
        life: 0.6 + Math.random() * 0.7,
        sz: 0.9 + Math.random() * 1.5,
        g: o.g != null ? o.g : (Math.random() < 0.5 ? 3 : 1),
        w: -34 - Math.random() * 30
      });
    }
  }

  /* SURGE — PRONTO. The screen remembers it is electric. */
  function surge(o) {
    if (!cv) return;
    o = o || {};
    var cx = o.x != null ? o.x : W / 2;
    var cy = o.y != null ? o.y : H / 2;
    var n = W < 620 ? 110 : 190;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.2832;
      spark(cx, cy, {
        ang: a, spd: 300 + Math.random() * 950, drag: 0.935,
        life: 0.6 + Math.random() * 0.7,
        sz: 1.3 + Math.random() * 2.6,
        g: Math.random() < 0.16 ? 5 : (1 + (Math.random() * 4 | 0)),
        w: -10
      });
    }
    /* lightning walks the whole screen */
    for (var s = 0; s < 7; s++) {
      (function (i) {
        setTimeout(function () {
          var vertical = i % 2 === 0;
          arc(vertical ? Math.random() * W : 0,
              vertical ? 0 : Math.random() * H,
              vertical ? Math.random() * W : W,
              vertical ? H : Math.random() * H,
              { hue: i % 3 === 0 ? 264 : 200, w: 1.2 + Math.random() * 1.6,
                life: 0.14, jag: 0.4 });
        }, i * 70);
      })(s);
    }
  }

  /* ══ THE LOOP ═════════════════════════════════════════════════════ */

  function start() {
    if (awake || !cv || document.hidden) return;
    awake = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    awake = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function frame(now) {
    if (!awake) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    var alive = 0, i;

    /* the arcs first — the light rides over them */
    for (i = ARCS.length - 1; i >= 0; i--) {
      var A = ARCS[i];
      A.age += dt;
      var u = A.age / A.life;
      if (u >= 1) { ARCS.splice(i, 1); continue; }
      var fade = 1 - u;
      var pts = A.p;
      /* a wide dim halo, then a hot thin core — two passes, no blur */
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.strokeStyle = 'hsla(' + A.hue + ',96%,72%,' + (fade * 0.22).toFixed(3) + ')';
      ctx.lineWidth = A.w * 5;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var q = 1; q < pts.length; q++) ctx.lineTo(pts[q][0], pts[q][1]);
      ctx.stroke();
      ctx.strokeStyle = 'hsla(' + A.hue + ',100%,93%,' + (fade * 0.95).toFixed(3) + ')';
      ctx.lineWidth = A.w;
      ctx.stroke();
      alive++;
    }

    /* the light */
    for (i = 0; i < MAX; i++) {
      var p = P[i];
      if (!p.a) continue;
      p.age += dt;
      if (p.age >= p.life) { p.a = 0; continue; }

      if (p.k) {
        p.vx += (p.tx - p.x) * p.k * dt;
        p.vy += (p.ty - p.y) * p.k * dt;
      }
      if (p.w) p.vy += p.w * dt;

      var d = Math.pow(p.dg, dt * 60);
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt;

      var t = p.age / p.life;
      /* fast attack, long tail — light arrives suddenly and lets go slowly */
      var a = t < 0.12 ? (t / 0.12) : (1 - (t - 0.12) / 0.88);
      a *= a;
      if (a <= 0.006) continue;

      var r = p.sz * 3.4;
      ctx.globalAlpha = a;
      ctx.drawImage(GLOW[p.g], p.x - r, p.y - r, r * 2, r * 2);
      alive++;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (alive) raf = requestAnimationFrame(frame);
    else stop();
  }

  /* ══ THE DOOR ═════════════════════════════════════════════════════ */
  window.MotusSpark = {
    boot: boot,
    summon: summon,
    beam: beam,
    emit: emit,
    arc: arc,
    surge: surge,
    stop: stop,
    /* when the prospectus is gone the field costs nothing at all */
    dismiss: function () {
      stop();
      if (cv) { cv.remove(); cv = null; ctx = null; }
    },
    alive: function () { return !!cv; }
  };

  if (!reduce) boot();
})();
