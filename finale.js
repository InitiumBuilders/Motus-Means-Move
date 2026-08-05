/* ══════════════════════════════════════════════════════════════════
   THE SENTIENT SWARM — the finale of The Motus Vision.

   A mind arrives at a sentence. It BLOOMS open, ORBITS the words,
   SCANS across them like it is reading, then briefly CRYSTALLISES
   into structure — a ring of nodes, or a line drawn beneath what
   matters — before dissolving back into orbit and moving on.

   It plays itself. You do not have to do anything but watch.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var stage = document.getElementById('finaleStage');
  if (!stage) return;
  var canvas = stage.querySelector('.swarm-canvas');
  var lineEls = [].slice.call(document.querySelectorAll('.fline'));
  if (!canvas || !lineEls.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    lineEls.forEach(function (el) { el.classList.add('locked'); });
    canvas.style.display = 'none';
    return;
  }

  var ctx = canvas.getContext('2d', { alpha: true });
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  /* ── the bloom, baked once ──
     A radial gradient drawn into a small offscreen canvas and blitted with
     'lighter' reads exactly like a shadowBlur'd dot — and costs a blit. */
  var GLOW = [], GLOW_R = 34;
  (function bakeGlow(){
    for (var g = 0; g < 6; g++) {
      var hue = 188 + g * 22;                       // cyan → violet, the band
      var c = document.createElement('canvas');
      c.width = c.height = GLOW_R * 2;
      var x = c.getContext('2d');
      var rg = x.createRadialGradient(GLOW_R, GLOW_R, 0, GLOW_R, GLOW_R, GLOW_R);
      rg.addColorStop(0,    'hsla(' + hue + ',96%,84%,1)');
      rg.addColorStop(0.14, 'hsla(' + hue + ',94%,74%,.86)');
      rg.addColorStop(0.38, 'hsla(' + hue + ',92%,66%,.26)');
      rg.addColorStop(1,    'hsla(' + hue + ',92%,60%,0)');
      x.fillStyle = rg; x.fillRect(0, 0, GLOW_R * 2, GLOW_R * 2);
      GLOW.push(c);
    }
  })();
  function glowFor(hue){
    var g = Math.round((hue - 188) / 22);
    return GLOW[g < 0 ? 0 : g > 5 ? 5 : g];
  }
  var W = 0, H = 0;
  var BANDS = [195, 262, 38];          // cyan signal · violet mind · gold arrival

  /* ══ THE SCORE — each line is a movement, and it plays itself ══════
     bloom → orbit → scan (reading) → structure → orbit → hand off   */
  var ACTS = [
    { k: 'bloom',  d: 620 },
    { k: 'orbit',  d: 850 },
    { k: 'scan',   d: 980 },
    { k: 'struct', d: 1320 },
    { k: 'orbit',  d: 780 }
  ];
  var LINE_MS = ACTS.reduce(function (a, b) { return a + b.d; }, 0);   // ~7.8s

  /* ── the mind ── */
  var N = 0, P = [];
  function sizePool() {
    N = W < 520 ? 44 : 66;
    while (P.length < N) {
      var i = P.length;
      P.push({
        ph: Math.random() * 6.283,
        sp: 0.15 + Math.random() * 0.24,
        dir: Math.random() < 0.26 ? -1 : 1,
        wob: 0.4 + Math.random() * 0.9,
        band: 0.8 + Math.random() * 0.55,
        sz: 1.2 + Math.random() * 2.1,
        hue: BANDS[i % 3] + (Math.random() - 0.5) * 30,
        node: i % 14,                       // its seat in the lattice
        x: 0, y: 0, px: 0, py: 0, lit: 0
      });
    }
    P.length = N;
  }

  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(window.innerHeight));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sizePool();
  }

  /* ── what it is attending to ── */
  var F = { cx: 0, cy: 0, rx: 120, ry: 60, l: 0, r: 0, t: 0, b: 0 };
  function readFocus() {
    var el = lineEls[active < 0 ? 0 : active];
    if (!el) return;
    var r = el.getBoundingClientRect(), h = canvas.getBoundingClientRect();
    F.l = r.left - h.left; F.r = F.l + r.width;
    F.t = r.top - h.top;   F.b = F.t + r.height;
    F.cx = F.l + r.width / 2; F.cy = F.t + r.height / 2;
    F.rx = Math.max(78, r.width / 2 + 36);
    F.ry = Math.max(48, r.height / 2 + 32);
  }


  /* ══ THE STRUCTURE LIBRARY ══════════════════════════════════════
     Each returns { nodes:[[x,y]…], edges:[[i,j]…] } in canvas space.
     They are topologies, not decorations: a chain, a merkle root, a
     peer mesh, a lattice, an atom, a triple, a vortex, a field.    */
  function S_chain(F) {
    var n = [], e = [], K = 7, y = F.b + 30;
    for (var i = 0; i < K; i++) n.push([F.l + (i / (K - 1)) * (F.r - F.l), y + Math.sin(i * 1.1) * 5]);
    for (var j = 0; j < K - 1; j++) e.push([j, j + 1]);
    return { nodes: n, edges: e, glyph: 'block' };
  }
  function S_merkle(F) {
    var n = [], e = [], base = F.b + 66, lift = 21;
    for (var i = 0; i < 8; i++) n.push([F.l + (i / 7) * (F.r - F.l), base]);
    for (var i2 = 0; i2 < 4; i2++) n.push([(n[i2 * 2][0] + n[i2 * 2 + 1][0]) / 2, base - lift]);
    for (var i3 = 0; i3 < 2; i3++) n.push([(n[8 + i3 * 2][0] + n[8 + i3 * 2 + 1][0]) / 2, base - lift * 2]);
    n.push([(n[12][0] + n[13][0]) / 2, base - lift * 3]);
    for (var k = 0; k < 8; k++) e.push([k, 8 + (k >> 1)]);
    for (var k2 = 0; k2 < 4; k2++) e.push([8 + k2, 12 + (k2 >> 1)]);
    e.push([12, 14]); e.push([13, 14]);
    return { nodes: n, edges: e, root: 14, glyph: 'node' };
  }
  function S_mesh(F) {
    var n = [], e = [], K = 15;
    for (var i = 0; i < K; i++) {
      var a = (i / K) * 6.283 + (i % 3) * 0.22;
      var rr = 0.78 + ((i * 37) % 11) / 26;
      n.push([F.cx + Math.cos(a) * F.rx * rr * 1.1, F.cy + Math.sin(a) * F.ry * rr * 1.28]);
    }
    for (var x = 0; x < K; x++) for (var y2 = x + 1; y2 < K; y2++) {
      var dx = n[x][0] - n[y2][0], dy = n[x][1] - n[y2][1];
      if (dx * dx + dy * dy < 15000) e.push([x, y2]);
    }
    return { nodes: n, edges: e, glyph: 'node' };
  }
  function S_hex(F) {
    var n = [], e = [], K = 12, R = Math.max(F.rx, F.ry) * 0.92;
    for (var i = 0; i < 6; i++) {
      var a = i * 1.0472 - 1.5708;
      n.push([F.cx + Math.cos(a) * R * 1.12, F.cy + Math.sin(a) * R * 0.62]);
    }
    for (var i2 = 0; i2 < 6; i2++) {
      var a2 = i2 * 1.0472 - 1.5708 + 0.524;
      n.push([F.cx + Math.cos(a2) * R * 0.6, F.cy + Math.sin(a2) * R * 0.34]);
    }
    for (var k = 0; k < 6; k++) { e.push([k, (k + 1) % 6]); e.push([6 + k, 6 + (k + 1) % 6]); e.push([k, 6 + k]); }
    return { nodes: n, edges: e, glyph: 'node' };
  }
  function S_shells(F) {
    var n = [], e = [], rings = [0.52, 0.86, 1.18], per = 6;
    for (var r = 0; r < 3; r++) for (var i = 0; i < per; i++) {
      var a = (i / per) * 6.283 + r * 0.4;
      n.push([F.cx + Math.cos(a) * F.rx * rings[r], F.cy + Math.sin(a) * F.ry * rings[r] * 1.15]);
    }
    for (var r2 = 0; r2 < 3; r2++) for (var i2 = 0; i2 < per; i2++)
      e.push([r2 * per + i2, r2 * per + (i2 + 1) % per]);
    for (var i3 = 0; i3 < per; i3++) { e.push([i3, per + i3]); e.push([per + i3, per * 2 + i3]); }
    return { nodes: n, edges: e, glyph: 'node' };
  }
  function S_triple(F) {
    // Intuition's primitive: subject · predicate · object, bound at the centre
    var n = [
      [F.l - 14, F.cy], [F.cx, F.t - 30], [F.r + 14, F.cy], [F.cx, F.b + 34]
    ];
    var e = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
    return { nodes: n, edges: e, glyph: 'atom' };
  }
  function S_spiral(F) {
    var n = [], e = [], K = 16;
    for (var i = 0; i < K; i++) {
      var a = i * 0.72, rr = 0.16 + (i / K) * 1.15;
      n.push([F.cx + Math.cos(a) * F.rx * rr, F.cy + Math.sin(a) * F.ry * rr * 1.2]);
    }
    for (var j = 0; j < K - 1; j++) e.push([j, j + 1]);
    e.push([0, K - 1]);
    return { nodes: n, edges: e, glyph: 'node' };
  }
  function S_field(F) {
    var n = [], e = [], cols = 6, rows = 3;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      n.push([F.l - 20 + (x / (cols - 1)) * (F.r - F.l + 40),
              F.t - 24 + (y / (rows - 1)) * (F.b - F.t + 48)]);
    }
    for (var y2 = 0; y2 < rows; y2++) for (var x2 = 0; x2 < cols; x2++) {
      var id = y2 * cols + x2;
      if (x2 < cols - 1) e.push([id, id + 1]);
      if (y2 < rows - 1) e.push([id, id + cols]);
    }
    return { nodes: n, edges: e, glyph: 'node' };
  }
  var STRUCTS = [S_chain, S_merkle, S_mesh, S_hex, S_shells, S_triple, S_spiral, S_field];
  var lastStruct = -1, SH = null;
  function pickStruct() {
    var i = lastStruct;
    while (i === lastStruct) i = (Math.random() * STRUCTS.length) | 0;
    lastStruct = i;
    SH = STRUCTS[i](F);
  }

  var active = -1, act = 0, actT = 0, playing = false, done = false;

  function goto(i) {
    if (i < 0 || i >= lineEls.length) return;
    lineEls.forEach(function (el, k) { if (k !== i) el.classList.remove('locked', 'live'); });
    active = i; act = 0; actT = 0;
    lineEls[i].classList.add('live', 'locked');
    readFocus();
    dots();
    if (window.MotusSound) window.MotusSound.play(i === lineEls.length - 1 ? 'arrival' : 'lock');
  }

  function dots() {
    var wrap = stage.querySelector('.fdots');
    if (!wrap) return;
    [].forEach.call(wrap.children, function (d, k) {
      d.classList.toggle('on', k === active);
      d.classList.toggle('past', k < active);
    });
  }

  /* ══ the loop ═════════════════════════════════════════════════════ */
  var last = 0, running = false, visible = false;

  function frame(ts) {
    if (!running) return;
    var dt = Math.min(50, ts - (last || ts)); last = ts;
    var t = ts * 0.001, s = dt * 0.001;

    ctx.clearRect(0, 0, W, H);
    if (active < 0) { requestAnimationFrame(frame); return; }
    readFocus();

    /* advance the score */
    if (playing) {
      actT += dt;
      while (actT >= ACTS[act].d) {
        actT -= ACTS[act].d;
        act++;
        if (act >= ACTS.length) {
          act = 0;
          if (active < lineEls.length - 1) { goto(active + 1); }
          else { done = true; playing = false; act = 1; }   // rest in orbit
        }
        if (ACTS[act].k === 'struct') {
          readFocus(); pickStruct();
          if (window.MotusSound) window.MotusSound.play('materialize');
        }
      }
    }
    var mode = ACTS[act].k;
    var u = Math.min(1, actT / ACTS[act].d);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    var scanX = F.l - 40 + (F.r - F.l + 80) * (u * u * (3 - 2 * u));
    var ringN = 14;
    var pull = mode === 'struct' ? Math.sin(Math.min(1, u * 1.15) * Math.PI) : 0;

    for (var k = 0; k < N; k++) {
      var p = P[k];
      p.px = p.x; p.py = p.y;

      /* the orbit is home */
      p.ph += p.sp * p.dir * s;
      var br = 1 + Math.sin(t * 0.7 + p.ph * 1.7) * 0.09;
      var ox = F.cx + Math.cos(p.ph) * F.rx * p.band * br + Math.sin(t * 1.6 * p.wob + p.ph * 3) * 5;
      var oy = F.cy + Math.sin(p.ph) * F.ry * p.band * br + Math.cos(t * 1.3 * p.wob + p.ph * 2) * 5;
      var tx = ox, ty = oy, near = 0;

      if (mode === 'bloom') {
        // the mind opens: thrown outward, then drawn home
        var b = Math.sin(u * Math.PI);
        tx = F.cx + (ox - F.cx) * (1 + b * 1.7);
        ty = F.cy + (oy - F.cy) * (1 + b * 1.7);
      } else if (mode === 'scan') {
        // a band of attention sweeps the sentence; what it passes over lights
        var d = Math.abs(ox - scanX);
        if (d < 62) {
          var g = 1 - d / 62;
          near = g * 0.9;
          tx = ox + (scanX - ox) * g * 0.85;
          ty = oy + ((F.t + (p.node / ringN) * (F.b - F.t)) - oy) * g * 0.8;
        }
      } else if (pull > 0 && SH) {
        // CRYSTALLISE — chaos takes a topology, briefly
        var seat = SH.nodes[p.node % SH.nodes.length];
        var jx = Math.cos(p.ph * 3) * 4, jy = Math.sin(p.ph * 3) * 4;
        tx = ox + (seat[0] + jx - ox) * pull;
        ty = oy + (seat[1] + jy - oy) * pull;
        near = pull * 0.62;
      }

      if (!p.x && !p.y) { p.x = tx; p.y = ty; p.px = tx; p.py = ty; }
      var ease = mode === 'bloom' ? 5.5 : (pull > 0 ? 5.0 : 3.4);
      p.x += (tx - p.x) * Math.min(1, s * ease);
      p.y += (ty - p.y) * Math.min(1, s * ease);
      p.lit += (near - p.lit) * Math.min(1, s * 6);

      var a = 0.26 + Math.sin(t * 1.8 + p.ph * 2) * 0.15 + p.lit * 0.46;
      if (a <= 0.012) continue;

      ctx.strokeStyle = 'hsla(' + p.hue.toFixed(0) + ',92%,74%,' + (a * 0.45).toFixed(3) + ')';
      ctx.lineWidth = p.sz * 0.7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();

      /* the body and its halo, in one blit */
      var rr = p.sz * (2.9 + p.lit * 2.6);
      ctx.globalAlpha = a;
      ctx.drawImage(glowFor(p.hue), p.x - rr, p.y - rr, rr * 2, rr * 2);
      ctx.globalAlpha = 1;
    }

    /* the network assembles: nodes seat, edges propagate, charge runs */
    if (pull > 0.05 && SH) {
      var NN = SH.nodes.length, EE = SH.edges.length;
      /* one pass over the swarm, not one pass per node */
      var seats = SH._seats;
      if (!seats || seats.length !== NN) {
        seats = SH._seats = [];
        for (var z = 0; z < NN; z++) seats.push([0, 0]);
      }
      var cnt = SH._cnt || (SH._cnt = []);
      for (var z2 = 0; z2 < NN; z2++) { seats[z2][0] = 0; seats[z2][1] = 0; cnt[z2] = 0; }
      for (var m = 0; m < N; m++) {
        var b = P[m].node % NN;
        seats[b][0] += P[m].x; seats[b][1] += P[m].y; cnt[b]++;
      }
      for (var z3 = 0; z3 < NN; z3++) {
        if (cnt[z3]) { seats[z3][0] /= cnt[z3]; seats[z3][1] /= cnt[z3]; }
        else { seats[z3][0] = SH.nodes[z3][0]; seats[z3][1] = SH.nodes[z3][1]; }
      }
      // edges arrive in sequence — a network coming into being, not appearing
      ctx.lineWidth = 1.15;
      for (var ei = 0; ei < EE; ei++) {
        var ed = SH.edges[ei];
        var lead = Math.max(0, Math.min(1, (u * 2.5) - (ei / EE) * 1.15));
        if (lead <= 0) continue;
        var A = seats[ed[0]], B = seats[ed[1]];
        ctx.strokeStyle = 'rgba(180,228,255,' + (pull * 0.5 * lead).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]);
        ctx.lineTo(A[0] + (B[0] - A[0]) * lead, A[1] + (B[1] - A[1]) * lead);
        ctx.stroke();
        // a confirmation running the wire
        if (lead > 0.9) {
          var f = ((t * 0.55 + ei * 0.14) % 1);
          var px2 = A[0] + (B[0] - A[0]) * f, py2 = A[1] + (B[1] - A[1]) * f;
          ctx.globalAlpha = pull * 0.9;
          ctx.drawImage(GLOW[0], px2 - 7, py2 - 7, 14, 14);
          ctx.globalAlpha = 1;
        }
      }
      // the nodes themselves — blocks for a chain, a crowned root for a merkle
      for (var nq = 0; nq < NN; nq++) {
        var q = seats[nq], isRoot = (SH.root === nq);
        var sizeN = (SH.glyph === 'block' ? 5.5 : SH.glyph === 'atom' ? 5 : 3.4) * (isRoot ? 1.7 : 1);
        ctx.strokeStyle = 'rgba(200,238,255,' + (pull * 0.75).toFixed(3) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (SH.glyph === 'block') ctx.rect(q[0] - sizeN, q[1] - sizeN, sizeN * 2, sizeN * 2);
        else ctx.arc(q[0], q[1], sizeN, 0, 7);
        ctx.stroke();
        if (isRoot) {
          ctx.fillStyle = 'rgba(255,214,150,' + (pull * 0.5).toFixed(3) + ')';
          ctx.fill();
          ctx.globalAlpha = pull * 0.55;
          ctx.drawImage(GLOW[5], q[0] - 26, q[1] - 26, 52, 52);
          ctx.globalAlpha = 1;
        }
      }
    }

    /* synapses — charge between whoever happens to be close */
    ctx.lineWidth = 0.6;
    for (var a1 = 0; a1 < N; a1 += 2) {
      var q1 = P[a1], q2 = P[(a1 + 3) % N];
      var dx = q2.x - q1.x, dy = q2.y - q1.y, d2 = dx * dx + dy * dy;
      if (d2 > 3400 || d2 < 40) continue;
      ctx.strokeStyle = 'rgba(170,220,255,' + ((1 - d2 / 3400) * 0.28).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
    requestAnimationFrame(frame);
  }

  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; ctx.clearRect(0, 0, W, H); }

  /* ══ it plays itself the moment you arrive ════════════════════════ */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (!visible) { stop(); return; }
      resize(); start();
      if (active < 0) { playing = true; goto(0); }
      else if (!done) { playing = true; }
    });
  }, { threshold: 0.35 });
  io.observe(stage);

  var rt; window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(resize, 160);
  }, { passive: true });

  // a tap replays the whole sequence
  stage.addEventListener('click', function () {
    done = false; playing = true; active = -1; goto(0);
  });

  resize();

  window.__swarm = {
    state: function () {
      return { active: active, act: ACTS[act].k, u: +(actT / ACTS[act].d).toFixed(2),
               playing: playing, done: done, visible: visible, running: running, n: N,
               lineMs: LINE_MS };
    },
    force: function (i) { visible = true; resize(); start(); playing = true; goto(i); }
  };
})();
