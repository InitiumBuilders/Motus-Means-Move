// ════════════════════════════════════════════════════════════════════════
// motus-mind-mark.js — THE MOTUSMIND. The canonical MotusMoves mark.
//
// The whole MOTUS model, animated once and then again.
//
// SEVEN PASSES, each faster than the last —
//   1  a $ crosses the loop, so you learn how the loop works
//   2  TRUST      forged in the mind, leading the arrow into the heart
//   3  MANTRA          "
//   4  MIND            "
//   5  MODEL           "
//   6  MOVE            "
//   7  a $ again, closing the circuit
//
// THEN THE FORGING. The network does not shrink — it COLLAPSES, every node
// spiralling inward and merging into one point of energy, and out of that
// point $TRUST is struck and carried into the heart.
//
// THEN MOTUS. The word appears in the middle of the loop, and walks the
// user's own navigation: hovering over MANTRA, MIND, MODEL, MOVE, bouncing
// as it lands, until it settles INTO the last one and briefly becomes it.
// Then it dissolves, MOVE returns, and each name lights in turn.
//
// D(n) = max(2.2s, 6.4s · 0.86ⁿ) — 29.8 seconds of passes, then ~5s of
// forging, then ~7.6s of MOTUS. Slow enough to read at the start; humming
// by the end.
//
// EFFICIENCY — this runs on somebody's phone.
//   · ONE requestAnimationFrame, stopped dead whenever the mark is offscreen
//     or the tab is hidden. No timers, no CSS animation loops.
//   · Every path is sampled ONCE into a lookup table at build, so the frame
//     loop never calls getPointAtLength — it interpolates two floats.
//   · Every write goes through a cache and is skipped when the value has not
//     changed, which on a typical frame is most of them.
//   · The network's ~100 elements are touched only while they are growing or
//     collapsing. In steady state the loop writes about a dozen attributes.
//
// USE IT ANYWHERE:  <div data-mind-mark></div>
//   data-mind-mark="bare"   → mark only, no creed line
//   data-mind-mark-size     → any CSS width (default 320px)
// ════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var CREED = 'A MotusMind Is A Mind You Invest In. The Mind You /BUILD And The Mind You /MOVE.';
  var NS = 'http://www.w3.org/2000/svg';

  // the model itself, in order. '$' passes carry value; the rest carry meaning.
  var WORDS = ['$', 'TRUST', 'MANTRA', 'MIND', 'MODEL', 'MOVE', '$'];

  var CFG = {
    CYCLES: WORDS.length,   // seven
    D0: 8000,               // the first pass — slow, so the word can be read
    RATE: 0.88,             // and each one 88% of the last
    DMIN: 2800,             // never faster than a word can land
    NODES: 34,
    LOBES: 4,
    FIN: 6500,              // the collapse and the forging
    // THE WALK IS THE POINT, so it is given time. At 7.6s it was a blur of
    // hops; at 26s each landing, each bounce and each name lighting has room
    // to be read as a step in a sequence rather than a flicker.
    MOTUS: 26000
  };

  // ── THE PERSON ────────────────────────────────────────────────────────
  var HEAD =
    'M42 118'                      // the base of the neck, behind
    + 'C41 108 40 99 40 90'        // straight up the back of a real neck
    + 'C31 82 28 62 34 49'         // into the back of the skull
    + 'C41 31 58 24 74 29'         // over the crown
    + 'C88 34 95 45 95 57'         // the forehead, descending
    + 'L92 65'                     // THE BROW
    + 'C95 69 98 73 99 76'         // THE NOSE — short
    + 'C100 78 98 80 95 80'        // and rounded, never pointed
    + 'L91 81'                     // the base of the nose
    + 'C93 85 90 86 92 89'         // THE MOUTH — one notch
    + 'C90 94 85 98 79 99'         // THE CHIN
    + 'C75 100 74 102 74 105'      // the jaw turning into the throat
    + 'L74 118';                   // and down the front of the neck

  var SHOULDERS = 'M4 160C10 132 20 121 42 118'
                + 'M74 118C102 121 120 133 126 160';

  // ── THE LOOP · both arrows stop SHORT of the heart ────────────────────
  var LINK_DOWN = 'M112 130C166 158 212 148 234 122';
  var LINK_UP   = 'M242 58C232 22 168 12 108 38';
  var FLY_DOWN  = 'M60 55C68 84 88 110 112 130C166 158 212 148 234 122C243 112 250 100 255 90';
  var FLY_UP    = 'M255 88C252 74 248 64 242 58C232 22 168 12 108 38C92 45 74 50 60 55';

  var HEART = 'M256 112C240 99 230 90 230 79'
            + 'A13.6 13.6 0 0 1 256 73.5'
            + 'A13.6 13.6 0 0 1 282 79'
            + 'C282 90 272 99 256 112Z';

  var BRAIN = { cx: 59, cy: 56 };
  var LOOP = { cx: 178, cy: 86 };                 // where MOTUS is born
  // pulled in from the rim: the mind should read as one dense organ, not four
  // colonies holding the walls
  var LOBE = [ { x: 59, y: 40 }, { x: 75, y: 56 }, { x: 58, y: 73 }, { x: 43, y: 56 } ];

  var seq = 0;
  var DOCK_BUSY = false;        // only one mark may ever walk the navigation

  // ══ WHERE THE MIND GROWS ══════════════════════════════════════════════
  function layout() {
    var per = Math.ceil(CFG.NODES / CFG.LOBES), pts = [], i, c, byLobe = [];
    for (c = 0; c < CFG.LOBES; c++) {
      byLobe[c] = [];
      for (i = 0; i < per; i++) {
        var r = 12.2 * Math.sqrt((i + 0.55) / per);
        var a = i * 2.39996 + c * 1.1;                     // the golden angle
        byLobe[c].push({
          x: LOBE[c].x + Math.cos(a) * r + (Math.random() - 0.5) * 1.6,
          y: LOBE[c].y + Math.sin(a) * r * 0.94 + (Math.random() - 0.5) * 1.6,
          lobe: c
        });
      }
    }
    for (i = 0; i < per; i++) {
      for (c = 0; c < CFG.LOBES; c++) if (byLobe[c][i] && pts.length < CFG.NODES) pts.push(byLobe[c][i]);
    }
    return pts;
  }

  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k)) e.setAttribute(k, a[k]);
    return e;
  }

  // ── easings ──
  function outCubic(k) { return 1 - Math.pow(1 - k, 3); }
  function inOutCubic(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function backOut(k) { var p = k - 1; return 1 + 2.1 * p * p * p + 1.32 * p * p; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(k, a, b) { return clamp01((k - a) / (b - a)); }
  // a damped oscillation — lands, overshoots, settles. The bounce.
  function ring(t) { return Math.sin(t * 15.5) * Math.exp(-t * 5.2); }

  // ══ PATHS, SAMPLED ONCE ═══════════════════════════════════════════════
  // getPointAtLength is a geometry query. Called three times a frame across
  // several marks it is real work for no reason — the paths never change, so
  // they are sampled here and the loop interpolates two floats instead.
  function lut(path, n) {
    var L = path.getTotalLength(), a = new Float32Array((n + 1) * 2), i, p;
    for (i = 0; i <= n; i++) { p = path.getPointAtLength(L * i / n); a[i * 2] = p.x; a[i * 2 + 1] = p.y; }
    return { a: a, n: n, L: L };
  }
  function at(t, u) {
    u = clamp01(u);
    var f = u * t.n, i = f | 0, r = f - i;
    if (i >= t.n) return { x: t.a[t.n * 2], y: t.a[t.n * 2 + 1] };
    var x0 = t.a[i * 2], y0 = t.a[i * 2 + 1];
    return { x: x0 + (t.a[i * 2 + 2] - x0) * r, y: y0 + (t.a[i * 2 + 3] - y0) * r };
  }
  function ang(t, u) {
    var p = at(t, u), q = at(t, Math.min(1, u + 0.008));
    return Math.atan2(q.y - p.y, q.x - p.x) * 57.29578;
  }
  function arcOf(t, pt) {
    var best = 0, bd = Infinity, i, p, d;
    for (i = 0; i <= t.n; i++) {
      d = (t.a[i * 2] - pt.x) * (t.a[i * 2] - pt.x) + (t.a[i * 2 + 1] - pt.y) * (t.a[i * 2 + 1] - pt.y);
      if (d < bd) { bd = d; best = i / t.n; }
    }
    return best;
  }

  // ══ WRITES, DEDUPED ═══════════════════════════════════════════════════
  // Most values are unchanged most frames. Setting them anyway is how a small
  // animation becomes a warm phone.
  function W(node, key, val) {
    var c = node.__mmc || (node.__mmc = {});
    if (c[key] === val) return false;
    c[key] = val;
    return true;
  }
  function setT(node, val) { if (W(node, 't', val)) node.setAttribute('transform', val); }
  function setO(node, val) {
    val = val < 0 ? 0 : val > 1 ? 1 : val;
    var r = Math.round(val * 100) / 100;
    if (W(node, 'o', r)) node.style.opacity = r;
  }
  function place(node, x, y, s, o) {
    setT(node, 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' + (s === undefined ? '' : ' scale(' + s.toFixed(3) + ')'));
    setO(node, o === undefined ? 1 : o);
  }

  // ══ ONE LIVING MARK ═══════════════════════════════════════════════════
  function Mind(root, uid) {
    var q = function (s) { return root.querySelector(s); };
    this.root = root;
    this.svg = q('svg.mm');
    this.net = q('.mm-net');
    this.wave = q('.mm-wave');
    this.core = q('.mm-core');
    this.heartG = q('.mm-heartG');
    this.heart = q('.mm-heart');
    this.figure = q('.mm-figure');
    this.linkD = q('.mm-link--down');
    this.linkU = q('.mm-link--up');
    this.tipD = q('.mm-tip--down');
    this.tipU = q('.mm-tip--up');
    this.polD = q('.mm-pol--down');
    this.polU = q('.mm-pol--up');
    this.word = q('.mm-word');
    this.wordT = q('.mm-word text');
    this.mint = q('.mm-mint');
    this.forge = q('.mm-forge');
    this.forgeT = q('.mm-forge text');
    this.motus = q('.mm-motus');

    this.FD = lut(q('#mmFD' + uid), 220);
    this.FU = lut(q('#mmFU' + uid), 220);
    this.dA = arcOf(this.FD, { x: 112, y: 130 });
    this.dB = arcOf(this.FD, { x: 234, y: 122 });
    this.uA = arcOf(this.FU, { x: 242, y: 58 });
    this.uB = arcOf(this.FU, { x: 108, y: 38 });

    this.nodes = [];
    this.edges = [];
    this.fresh = [];
    this.age = 0;
    this.visible = true;
    this.reset(true);

    var still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    // motion off → no frames → nothing would ever finish arriving, so mature
    // the whole mind at once and leave a finished drawing
    if (still) { this.grow(CFG.NODES); this.age += 99999; this.settle(); this.paint(0.02); return; }

    this.watch();
    this.run();
  }

  Mind.prototype.alive = function () { return !!(this.svg && this.svg.isConnected); };
  Mind.prototype.awake = function () { return this.visible && !document.hidden; };

  // ── PARK: STOPPING MUST ALSO CLEAN UP ─────────────────────────────────
  // The MOTUS word is a fixed <div> on <body> — it deliberately leaves the
  // drawing to walk the navigation, which also means it does not belong to
  // any page. When the mark scrolled out of view or the tab changed, the loop
  // simply halted, and the word was left stranded on screen, following the
  // user onto every other page. A loop that can be stopped at any moment has
  // to be able to put everything back at any moment.
  Mind.prototype.park = function () {
    this.restoreDock();
    if (this.mode === 'motus') {           // never resume a walk half-walked
      this.mode = 'run'; this.cycle = 0; this.at = 0; this.t = 0;
    }
  };

  Mind.prototype.watch = function () {
    var self = this;
    try {
      new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) self.visible = es[i].isIntersecting;
        // A hidden SPA view reports not-intersecting, so this is also what
        // keeps the mark from running on every other page in the app.
        if (self.visible) self.run(); else self.park();
      }, { threshold: 0 }).observe(this.svg);
    } catch (e) {}
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self.park(); else self.run();
    });
  };

  Mind.prototype.reset = function (first) {
    while (this.net.firstChild) this.net.removeChild(this.net.firstChild);
    this.nodes = []; this.edges = []; this.fresh = [];
    this.pts = layout();
    this.cycle = 0; this.at = 0; this.mode = 'run'; this.t = 0;
    this.restoreDock();
    this.grow(7);
    if (!first) this.paint(0);
  };

  Mind.prototype.dur = function () {
    return Math.max(CFG.DMIN, CFG.D0 * Math.pow(CFG.RATE, this.cycle));
  };

  Mind.prototype.grow = function (n) {
    for (var i = 0; i < n && this.nodes.length < this.pts.length; i++) {
      var p = this.pts[this.nodes.length];
      var mine = [], other = [], j, d;
      for (j = 0; j < this.nodes.length; j++) {
        d = (this.nodes[j].x - p.x) * (this.nodes[j].x - p.x) + (this.nodes[j].y - p.y) * (this.nodes[j].y - p.y);
        (this.nodes[j].lobe === p.lobe ? mine : other).push({ n: this.nodes[j], d: d });
      }
      mine.sort(function (a, b) { return a.d - b.d; });
      other.sort(function (a, b) { return a.d - b.d; });
      var link = mine.slice(0, 2);
      if (other.length && this.nodes.length % 3 === 0) link.push(other[0]);

      var node = { x: p.x, y: p.y, hx: p.x, hy: p.y, lobe: p.lobe, el: null };
      // polar home, for the spiral collapse
      node.r0 = Math.sqrt((p.x - BRAIN.cx) * (p.x - BRAIN.cx) + (p.y - BRAIN.cy) * (p.y - BRAIN.cy));
      node.a0 = Math.atan2(p.y - BRAIN.cy, p.x - BRAIN.cx);

      for (j = 0; j < link.length; j++) {
        var e = el('line', {
          x1: link[j].n.x.toFixed(1), y1: link[j].n.y.toFixed(1),
          x2: p.x.toFixed(1), y2: p.y.toFixed(1),
          pathLength: '1', 'class': 'mm-edge', 'stroke-dashoffset': '1'
        });
        e.style.opacity = 0;
        this.net.appendChild(e);
        this.edges.push({ el: e, a: link[j].n, b: node });
        this.arrive(e, 700, 'edge');
      }
      node.el = el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: '0', 'class': 'mm-node' });
      node.el.style.opacity = 0;
      this.net.appendChild(node.el);
      this.nodes.push(node);
      this.arrive(node.el, 560, 'node');
    }
  };

  // ── ARRIVALS, ON THE SAME CLOCK AS EVERYTHING ELSE ────────────────────
  // These were CSS keyframes, and CSS keyframes cost the browser one live
  // animation per element — a hundred of them for a network this size, on a
  // phone. Worse, an element whose animation never advances is stuck on its
  // FIRST frame, which for a fade-in means invisible forever. Measured:
  // opacity 0 and stroke-dashoffset 1 across every node and edge.
  //
  // Now they ride the loop that was already running, and once an element has
  // finished arriving it is dropped from the list and never touched again —
  // so the steady state costs nothing at all.
  Mind.prototype.arrive = function (node, dur, kind) {
    this.fresh.push({ el: node, born: this.age, dur: dur, kind: kind });
  };
  Mind.prototype.settle = function () {
    if (!this.fresh.length) return;
    var keep = [], i, f, t;
    for (i = 0; i < this.fresh.length; i++) {
      f = this.fresh[i];
      t = (this.age - f.born) / f.dur;
      if (t >= 1) {                                  // matured — set final, forget it
        if (f.kind === 'node') { f.el.setAttribute('r', '1.15'); f.el.style.opacity = 0.95; }
        else { f.el.setAttribute('stroke-dashoffset', '0'); f.el.style.opacity = 0.58; }
        continue;
      }
      if (t < 0) { keep.push(f); continue; }
      if (f.kind === 'node') {
        f.el.setAttribute('r', (1.15 * backOut(t)).toFixed(2));
        f.el.style.opacity = (0.95 * Math.min(1, t * 3)).toFixed(2);
      } else {
        f.el.setAttribute('stroke-dashoffset', (1 - outCubic(t)).toFixed(3));
        f.el.style.opacity = (0.58 * Math.min(1, t * 2.6)).toFixed(2);
      }
      keep.push(f);
    }
    this.fresh = keep;
  };

  // ── the frame loop ────────────────────────────────────────────────────
  Mind.prototype.run = function () {
    if (this.raf || !this.alive() || !this.awake()) return;
    var self = this;
    this.last = null;
    this.raf = requestAnimationFrame(function step(now) {
      if (!self.alive() || !self.awake()) { self.raf = 0; self.park(); return; }
      if (self.last === null) self.last = now;
      var dt = Math.min(64, now - self.last);
      self.last = now;
      self.tick(dt);
      self.raf = requestAnimationFrame(step);
    });
  };

  Mind.prototype.tick = function (dt) {
    this.age += dt;
    this.settle();
    if (this.mode === 'run') {
      var D = this.dur();
      this.at += dt;
      if (this.at >= D) {
        this.at -= D;
        this.cycle++;
        this.grow(this.cycle < 3 ? 4 : 5);
        if (this.cycle >= CFG.CYCLES) { this.mode = 'fin'; this.t = 0; return this.paintFin(0); }
      }
      this.paint(this.at / D);
    } else if (this.mode === 'fin') {
      this.t += dt;
      if (this.t >= CFG.FIN) { this.mode = 'motus'; this.t = 0; this.dockPlan(); return this.paintMotus(0); }
      this.paintFin(this.t / CFG.FIN);
    } else {
      this.t += dt;
      if (this.t >= CFG.MOTUS) return this.reset();
      this.paintMotus(this.t / CFG.MOTUS);
    }
  };

  // ── the growing arrow, and what leads it ──────────────────────────────
  Mind.prototype.arrow = function (link, tip, t, u, a, b, on) {
    var sA = Math.max(0, u - 0.105);                 // the head, a step behind
    var f = clamp01((sA - a) / (b - a));
    setO(link, on ? 1 : 0);
    if (W(link, 'd', Math.round(f * 200))) link.style.strokeDashoffset = (100 * (1 - f)).toFixed(1);
    if (!on || f <= 0.015) { setO(tip, 0); return; }
    var p = at(t, sA);
    setT(tip, 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ') rotate(' + ang(t, sA).toFixed(1) + ')');
    setO(tip, 1);
  };

  // ══ ONE PASS ══════════════════════════════════════════════════════════
  Mind.prototype.paint = function (k) {
    var w = WORDS[this.cycle] || '$';
    if (this.wordT.firstChild.nodeValue !== w) this.wordT.firstChild.nodeValue = w;
    if (W(this.word, 'cls', w === '$')) this.word.setAttribute('class', 'mm-word' + (w === '$' ? ' mm-word--coin' : ''));

    // the mind gathers before it gives
    var g = seg(k, 0, 0.10), pull = Math.sin(g * Math.PI) * 0.09;
    setT(this.net, 'translate(' + (BRAIN.cx * pull).toFixed(2) + ',' + (BRAIN.cy * pull).toFixed(2) + ') scale(' + (1 - pull).toFixed(3) + ')');
    setO(this.net, 1);
    setO(this.core, 0);

    // OUT — the word leads, the arrow grows behind it
    var out = seg(k, 0.10, 0.50);
    if (out > 0 && out < 1) {
      var u = inOutCubic(out);
      this.arrow(this.linkD, this.tipD, this.FD, u, this.dA, this.dB, true);
      var p = at(this.FD, u);
      place(this.word, p.x, p.y, backOut(clamp01(out * 5)), out > 0.9 ? (1 - out) / 0.1 : 1);
    } else if (out >= 1 && k < 0.62) {
      this.arrow(this.linkD, this.tipD, this.FD, 1, this.dA, this.dB, true);
      setO(this.word, 0);
    } else {
      setO(this.linkD, 0); setO(this.tipD, 0); setO(this.word, 0);
    }

    // the heart takes it — and $M rides INSIDE the heart, one transform for
    // both, so the letters swell exactly as the heart swells
    var take = seg(k, 0.48, 0.58);
    var beat = take > 0 && take < 1 ? 1 + Math.sin(take * Math.PI) * 0.24 : 1;
    setT(this.heartG, 'translate(256,90) scale(' + beat.toFixed(3) + ') translate(-256,-90)');
    // it arrives slowly and stays a while — it is the answer, not a flicker.
    // The scale here is its OWN, on top of whatever the heart is doing.
    var m = seg(k, 0.50, 0.76);
    setO(this.mint, m > 0 && m < 1 ? (m < 0.40 ? m / 0.40 : m > 0.80 ? (1 - m) / 0.20 : 1) : 0);
    setT(this.mint, 'translate(256,88) scale(' + (m > 0 && m < 1 ? backOut(clamp01(m * 2.1)) * 0.95 : 0.95).toFixed(3) + ') translate(-256,-88)');

    // BACK — the $ leaves the heart and leads the return
    var back = seg(k, 0.64, 0.96);
    if (back > 0 && back < 1) {
      var v = inOutCubic(back);
      this.arrow(this.linkU, this.tipU, this.FU, v, this.uA, this.uB, true);
      var pu = at(this.FU, v);
      place(this.forge, pu.x, pu.y, 1, back > 0.9 ? (1 - back) / 0.1 : 1);
      if (this.forgeT.firstChild.nodeValue !== '$') this.forgeT.firstChild.nodeValue = '$';
      if (W(this.forge, 'cls', 1)) this.forge.setAttribute('class', 'mm-forge mm-forge--coin');
    } else if (back >= 1 && k < 0.995) {
      this.arrow(this.linkU, this.tipU, this.FU, 1, this.uA, this.uB, true);
      setO(this.forge, 0);
    } else {
      setO(this.linkU, 0); setO(this.tipU, 0); setO(this.forge, 0);
    }

    // THE LOOP GETS STRONGER
    var lw = (2.6 + Math.min(1.8, Math.max(0, this.cycle - 1) * 0.30)).toFixed(2);
    if (W(this.linkU, 'w', lw)) this.linkU.style.strokeWidth = lw;
    setO(this.polD, 0.42 * (+this.linkD.style.opacity || 0));
    setO(this.polU, 0.42 * (+this.linkU.style.opacity || 0));

    // the arrival crosses the mind
    var wv = seg(k, 0.94, 1);
    if (wv > 0 && wv < 1) {
      this.wave.setAttribute('r', (3 + wv * 34).toFixed(1));
      setO(this.wave, 0.6 * (1 - wv));
    } else setO(this.wave, 0);
    setO(this.motus, 0);
  };

  // ══ THE COLLAPSE ══════════════════════════════════════════════════════
  // Not a shrink. Every node spirals inward on its own schedule — the outer
  // ones falling furthest and arriving last — until they merge into a single
  // point of energy, and the word is struck out of that point. A group scaled
  // to nothing is a group getting smaller; this is a thing collapsing.
  Mind.prototype.paintFin = function (k) {
    setO(this.word, 0); setO(this.mint, 0); setO(this.motus, 0);
    setO(this.linkU, 0); setO(this.tipU, 0); setO(this.wave, 0);
    setT(this.net, 'translate(0,0) scale(1)');       // the collapse is per-node now

    var col = seg(k, 0.02, 0.40), i, n, e;
    for (i = 0; i < this.nodes.length; i++) {
      n = this.nodes[i];
      // outer nodes start later and travel further — the rim closes last
      var d0 = 0.22 * (n.r0 / 26);
      var t = clamp01((col - d0) / (1 - d0));
      var ee = inOutCubic(t);
      var r = n.r0 * (1 - ee);
      var a = n.a0 + ee * 2.6;                        // and they turn as they fall
      n.x = BRAIN.cx + Math.cos(a) * r;
      n.y = BRAIN.cy + Math.sin(a) * r;
      if (W(n.el, 'p', (n.x * 1000 | 0) + ':' + (n.y * 1000 | 0))) {
        n.el.setAttribute('cx', n.x.toFixed(1)); n.el.setAttribute('cy', n.y.toFixed(1));
      }
    }
    for (i = 0; i < this.edges.length; i++) {
      e = this.edges[i];
      e.el.setAttribute('x1', e.a.x.toFixed(1)); e.el.setAttribute('y1', e.a.y.toFixed(1));
      e.el.setAttribute('x2', e.b.x.toFixed(1)); e.el.setAttribute('y2', e.b.y.toFixed(1));
    }
    setO(this.net, col < 0.86 ? 1 : (1 - col) / 0.14);

    // the point of energy they became
    var flare = seg(k, 0.24, 0.50);
    if (flare > 0 && flare < 1) {
      var f = Math.sin(flare * Math.PI);
      this.core.setAttribute('r', (1.5 + f * 7.5).toFixed(2));
      setO(this.core, f);
    } else setO(this.core, 0);

    // and the word struck out of it
    var born = seg(k, 0.40, 0.52), trip = seg(k, 0.50, 0.90);
    if (this.forgeT.firstChild.nodeValue !== '$TRUST') this.forgeT.firstChild.nodeValue = '$TRUST';
    if (W(this.forge, 'cls', 0)) this.forge.setAttribute('class', 'mm-forge');
    if (born > 0) {
      var u = inOutCubic(trip);
      var p = at(this.FD, u);
      place(this.forge, p.x, p.y, trip > 0 ? 1 : backOut(born), trip > 0.9 ? (1 - trip) / 0.1 : 1);
      this.arrow(this.linkD, this.tipD, this.FD, u, this.dA, this.dB, trip > 0.02);
    } else {
      setO(this.forge, 0); setO(this.linkD, 0); setO(this.tipD, 0);
    }

    // the heart takes it and keeps it
    var take = seg(k, 0.86, 1), b = take > 0 ? 1 + Math.sin(take * Math.PI) * 0.4 : 1;
    setT(this.heartG, 'translate(256,90) scale(' + b.toFixed(3) + ') translate(-256,-90)');
  };

  // ══ MOTUS WALKS THE NAVIGATION ════════════════════════════════════════
  Mind.prototype.dockPlan = function () {
    this.stops = null; this.owns = false;
    if (DOCK_BUSY) return;
    var dock = document.querySelector('.dock');
    if (!dock) return;
    var sel = ['profile', 'mind', 'model', 'news'], out = [], i, b;
    for (i = 0; i < sel.length; i++) {
      b = dock.querySelector('.dock__btn[data-nav="' + sel[i] + '"]');
      if (!b) return;
      out.push(b);
    }
    this.btns = out;
    this.moveLbl = out[3].querySelector('.dock__lbl');
    if (!this.moveLbl) return;
    this.moveWas = this.moveLbl.textContent;
    this.owns = true; DOCK_BUSY = true;

    this.fly = document.createElement('div');
    this.fly.className = 'mm-fly';
    this.fly.textContent = 'MOTUS';
    document.body.appendChild(this.fly);
  };

  // ALWAYS put the navigation back exactly as it was. This animation borrows
  // a piece of the user's actual interface; leaving it changed — even once,
  // even on an error — is not a glitch, it is a broken app.
  Mind.prototype.restoreDock = function () {
    if (this.moveLbl) {
      if (this.moveWas) this.moveLbl.textContent = this.moveWas;
      this.moveLbl.style.textShadow = '';
    }
    if (this.btns) for (var i = 0; i < this.btns.length; i++) this.btns[i].classList.remove('mm-lit');
    if (this.fly && this.fly.parentNode) this.fly.parentNode.removeChild(this.fly);
    this.fly = null; this.moveLbl = null;
    if (this.owns) { DOCK_BUSY = false; this.owns = false; }
  };

  // viewBox → screen, so the word can leave the drawing and enter the page
  Mind.prototype.toScreen = function (x, y) {
    var b = this.svg.getBoundingClientRect();
    return { x: b.left + x * (b.width / 300), y: b.top + y * (b.height / 170) };
  };

  Mind.prototype.paintMotus = function (k) {
    setO(this.forge, 0); setO(this.word, 0); setO(this.mint, 0);
    setO(this.linkD, 0); setO(this.tipD, 0); setO(this.linkU, 0); setO(this.tipU, 0);
    setO(this.net, 0); setO(this.core, 0);
    setT(this.heartG, 'translate(256,90) scale(1) translate(-256,-90)');

    // The walk is authored on a fixed 7600-unit storyboard; CFG.MOTUS only
    // decides how much real time that storyboard is given. Slowing the whole
    // sequence is one number, and every beat inside it stays in proportion.
    var ms = k * 7600;

    // 0 – 1.5s  MOTUS is born in the middle of the loop
    if (!this.owns || !this.fly) {
      var born = seg(ms / 1500, 0, 1);
      if (ms < 1900) {
        place(this.motus, LOOP.cx, LOOP.cy, backOut(clamp01(born * 1.4)) * (1 + 0.06 * Math.sin(ms / 150)),
          ms > 1600 ? (1900 - ms) / 300 : 1);
      } else setO(this.motus, 0);
      return;
    }

    if (ms < 1500) {
      var b0 = clamp01(ms / 800);
      place(this.motus, LOOP.cx, LOOP.cy, backOut(b0) * (1 + 0.07 * Math.sin(ms / 140)), b0);
      setO(this.fly, 0);
      return;
    }
    setO(this.motus, 0);

    // the journey, in the page's own coordinates
    var s0 = this.toScreen(LOOP.cx, LOOP.cy);
    var stop = [], i, r;
    for (i = 0; i < 4; i++) { r = this.btns[i].getBoundingClientRect(); stop.push({ x: r.left + r.width / 2, y: r.top - 16 }); }
    var lb = this.moveLbl.getBoundingClientRect();
    var home = { x: lb.left + lb.width / 2, y: lb.top + lb.height / 2 };

    var x, y, sc = 1, op = 1, glow = 0;
    var LEG = [[1500, 2350], [2350, 2950], [2950, 3550], [3550, 4150]];   // to each stop

    function hop(a, b, t) {                                    // arc across, then bounce
      var e = inOutCubic(clamp01(t));
      return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e - Math.sin(clamp01(t) * Math.PI) * 46 };
    }

    if (ms < LEG[0][1]) {
      var p = hop(s0, stop[0], (ms - LEG[0][0]) / (LEG[0][1] - LEG[0][0]));
      x = p.x; y = p.y; sc = 1;
    } else if (ms < 4150) {
      var idx = ms < LEG[1][1] ? 1 : ms < LEG[2][1] ? 2 : 3;
      var L = LEG[idx], t = (ms - L[0]) / (L[1] - L[0]);
      var p2 = hop(stop[idx - 1], stop[idx], t);
      x = p2.x; y = p2.y;
      // it lands, and BOUNCES left-to-right with the momentum it carried
      if (t > 0.68) { var bt = (t - 0.68) / 0.32; x += ring(bt) * 15; sc = 1 + Math.exp(-bt * 5) * 0.16; }
      this.lit(idx - 1, t < 0.68);
    } else if (ms < 4900) {                                     // pulsing over MOVE
      var pt = (ms - 4150) / 750;
      x = stop[3].x; y = stop[3].y;
      sc = 1 + Math.sin(pt * Math.PI * 2) * 0.11;
      glow = Math.sin(pt * Math.PI);
      this.lit(3, true);
    } else if (ms < 5500) {                                     // descending into it
      var dt = inOutCubic((ms - 4900) / 600);
      x = stop[3].x + (home.x - stop[3].x) * dt;
      y = stop[3].y + (home.y - stop[3].y) * dt;
      sc = 1 - dt * 0.28;
      if (dt > 0.72 && this.moveLbl.textContent !== 'MOTUS') this.moveLbl.textContent = 'MOTUS';
      op = dt > 0.72 ? (1 - dt) / 0.28 : 1;
    } else if (ms < 6300) {                                     // it IS the navigation
      x = home.x; y = home.y; op = 0;
      if (this.moveLbl.textContent !== 'MOTUS') this.moveLbl.textContent = 'MOTUS';
      // gravity waves off the word it has become — written straight onto the
      // label, because reaching into the dock's own pseudo-elements is how you
      // break somebody else's component
      var g = Math.sin(((ms - 5500) / 800) * Math.PI);
      this.moveLbl.style.textShadow =
        '0 0 ' + (10 + g * 26).toFixed(0) + 'px rgba(95,243,192,' + (0.5 + g * 0.5).toFixed(2) + '), ' +
        '0 0 ' + (24 + g * 54).toFixed(0) + 'px rgba(95,243,192,' + (g * 0.55).toFixed(2) + ')';
      this.lit(3, true);
    } else {                                                    // and gives it back
      x = home.x; y = home.y; op = 0;
      this.moveLbl.style.textShadow = '';
      if (this.moveLbl.textContent !== this.moveWas) this.moveLbl.textContent = this.moveWas;
      // then each name lights in turn, left to right, to close the sequence
      var q = (ms - 6500) / 260;
      for (i = 0; i < 4; i++) this.lit(i, q >= i && q < i + 1.1);
    }

    this.fly.style.transform = 'translate3d(' + (x - 34) + 'px,' + (y - 13) + 'px,0) scale(' + sc.toFixed(3) + ')';
    this.fly.style.opacity = op;
    this.fly.style.setProperty('--mm-glow', glow.toFixed(2));
  };

  Mind.prototype.lit = function (i, on) {
    var b = this.btns && this.btns[i];
    if (!b) return;
    if (W(b, 'lit', on)) b.classList.toggle('mm-lit', !!on);
  };

  // ══ the mark ══════════════════════════════════════════════════════════
  function markSVG(uid) {
    var glow = 'mmG' + uid, clip = 'mmC' + uid;
    var DART = 'M0 0 L-9.4 -5.2 L-6.6 0 L-9.4 5.2 Z';
    return '' +
    '<svg class="mm" viewBox="0 0 300 170" role="img" aria-label="The MotusMind — mantra, mind, model and move circulating between a mind and a heart">' +
      '<defs>' +
        '<radialGradient id="' + glow + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="var(--trust,#5ff3c0)" stop-opacity=".26"/>' +
          '<stop offset="100%" stop-color="var(--trust,#5ff3c0)" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<path id="mmFD' + uid + '" d="' + FLY_DOWN + '"/>' +
        '<path id="mmFU' + uid + '" d="' + FLY_UP + '"/>' +
        '<clipPath id="' + clip + '"><path d="' + HEAD + 'Z"/></clipPath>' +
      '</defs>' +

      '<ellipse class="mm-halo" cx="64" cy="64" rx="54" ry="54" fill="url(#' + glow + ')"/>' +

      '<path class="mm-link mm-link--down" pathLength="100" d="' + LINK_DOWN + '"/>' +
      '<path class="mm-link mm-link--up"   pathLength="100" d="' + LINK_UP + '"/>' +
      '<path class="mm-tip mm-tip--down" d="' + DART + '"/>' +
      '<path class="mm-tip mm-tip--up"   d="' + DART + '"/>' +
      '<text class="mm-pol mm-pol--up" x="150" y="9">+</text>' +
      '<text class="mm-pol mm-pol--down" x="150" y="167">+</text>' +

      '<path class="mm-figure" d="' + HEAD + '"/>' +
      '<path class="mm-figure mm-figure--body" d="' + SHOULDERS + '"/>' +
      '<g class="mm-net" clip-path="url(#' + clip + ')"></g>' +
      '<circle class="mm-core" cx="59" cy="56" r="2" clip-path="url(#' + clip + ')"/>' +
      '<circle class="mm-wave" cx="59" cy="56" r="3" clip-path="url(#' + clip + ')"/>' +

      // ONE GROUP for the heart and what is inside it. Transformed separately,
      // $M floated while the heart beat around it.
      // $M lives INSIDE the heart's group. As a sibling it had to be given its
      // own matching transform, and two transforms that are supposed to agree
      // eventually don't — the letters floated while the heart beat around
      // them. Nested, there is only one transform and nothing to keep in sync.
      '<g class="mm-heartG">' +
        '<path class="mm-heart" d="' + HEART + '"/>' +
        '<g class="mm-mint"><text x="256" y="88" text-anchor="middle" dominant-baseline="central">$M</text></g>' +
      '</g>' +

      '<g class="mm-word"><text text-anchor="middle" dominant-baseline="central">TRUST</text></g>' +
      '<g class="mm-forge"><text text-anchor="middle" dominant-baseline="central">$TRUST</text></g>' +
      '<g class="mm-motus"><text text-anchor="middle" dominant-baseline="central">MOTUS</text></g>' +
    '</svg>';
  }

  // A mount REPLACES the node's innerHTML. On a form control that is the same
  // thing as overwriting what the person typed — a textarea's innerHTML IS its
  // value. This mark once shared the `data-motusmind` attribute name with the
  // MotusMind textarea and did exactly that. The attribute is now its own
  // (`data-mind-mark`), and the mount refuses a form control regardless.
  var NEVER = { TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, FORM: 1 };
  function mount(node) {
    if (!node || node.getAttribute('data-mm-ready')) return;
    if (NEVER[node.tagName]) return;
    node.setAttribute('data-mm-ready', '1');
    var uid = 'x' + (++seq);
    var bare = node.getAttribute('data-mind-mark') === 'bare';
    var size = node.getAttribute('data-mind-mark-size');
    node.classList.add('mm-mount');
    node.innerHTML = markSVG(uid) + (bare ? '' : '<p class="mm-creed">' + CREED + '</p>');
    if (size) { var s = node.querySelector('.mm'); if (s) s.style.width = size; }
    try { node.__mind = new Mind(node, uid); } catch (e) { /* the drawing still stands */ }
  }

  function scan(root) {
    var host = root || document;
    var list = host.querySelectorAll ? host.querySelectorAll('[data-mind-mark]') : [];
    for (var i = 0; i < list.length; i++) mount(list[i]);
  }

  function boot() {
    scan(document);
    try { new MutationObserver(function () { scan(document); })
      .observe(document.body, { childList: true, subtree: true }); }
    catch (e) { setInterval(function () { scan(document); }, 1200); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.MotusMind = { mount: mount, scan: scan, svg: markSVG, creed: CREED };
})();
