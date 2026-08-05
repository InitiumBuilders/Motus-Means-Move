/* ══════════════════════════════════════════════════════════════════
   THE PROSPECTUS, WRITTEN LIVE — two hands, one vision.

   Act 0  — THE SUMMONING. The vision is not shown. Light gathers out
            of the dark, electricity walks its edges, and the image
            condenses out of the field that called it.
   Act I  — DAVARA IS TYPING. Every word is thrown out of her lens and
            lands on the page. The text does not appear; it arrives.
   Act II — AUGUST IS WRITING. "Reword This For Me Please" dissolves
            the myth and the founder writes the plain truth himself,
            key by key, with the sound of the keys.

   PRONTO — for the reader who already believes you. The screen
            remembers it is electric, and then everything moves.

   Nothing here is generated. Every word was written by a person or
   a mind that meant it. The typing is the proof.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FAST = /[?&]tw=fast/.test(location.search);           // build-verification only

  var prosp = document.getElementById('prosp');
  var reword = document.getElementById('reword');
  if (!prosp) return;

  /* the one dial PRONTO turns */
  var SPEED = 1;
  function S(ms) { return ms / SPEED; }

  var SPARK = function () { return window.MotusSpark; };

  /* reduced motion: everything appears, nothing types */
  if (reduce) {
    document.body.classList.add('tw-done');
    if (reword) reword.classList.add('rw-instant');
    var art0 = prosp.querySelector('.pr-art'); if (art0) art0.classList.add('condensed');
    wireButtons();
    return;
  }

  /* ══ THE TRAVELLING PRESENCE ══════════════════════════════════════ */
  var orb = document.createElement('div');
  orb.id = 'twOrb';
  orb.innerHTML =
    '<span class="two-core"><img src="img/davara-logo.jpg" alt=""></span>' +
    '<span class="two-label"></span>';
  document.body.appendChild(orb);
  var orbLabel = orb.querySelector('.two-label');
  var orbCore = orb.querySelector('.two-core');

  /* ── the presence says its name ──
     It arrives letter by letter, burns for seven seconds, and then
     folds itself away. After that it would only be standing in front
     of the words it came to deliver. */
  var labelTimers = [];
  function speak(name, hold) {
    labelTimers.forEach(clearTimeout); labelTimers = [];
    orb.classList.remove('quiet');
    orb.classList.add('speaking');
    orbLabel.innerHTML = '';
    var frag = document.createDocumentFragment();
    var cells = [];
    for (var i = 0; i < name.length; i++) {
      var c = document.createElement('i');
      c.className = 'lc';
      c.textContent = name[i] === ' ' ? '\u00a0' : name[i];
      frag.appendChild(c);
      cells.push(c);
    }
    var dots = document.createElement('b');
    dots.className = 'two-dots';
    dots.innerHTML = '<i>.</i><i>.</i><i>.</i>';
    frag.appendChild(dots);
    orbLabel.appendChild(frag);

    cells.forEach(function (c, i) {
      labelTimers.push(setTimeout(function () {
        c.classList.add('on');
        var sk = SPARK();
        if (sk && i % 2 === 0) {
          var r = c.getBoundingClientRect();
          sk.beam(srcX, srcY, r.left + r.width / 2, r.top + r.height / 2,
                  { n: 3, landSz: 4, g: orb.classList.contains('august') ? 5 : 2 });
        }
      }, 90 + i * 42));
    });

    labelTimers.push(setTimeout(function () {
      orb.classList.remove('speaking');
      orb.classList.add('quiet');
    }, hold || 7000));
  }

  /* where the light leaves from — cached, so nothing measures per frame */
  var srcX = window.innerWidth * 0.5, srcY = window.innerHeight * 0.35;

  function readSource() {
    var r = orbCore.getBoundingClientRect();
    srcX = r.left + r.width / 2;
    srcY = r.top + r.height / 2;
  }

  /* ── the presence GLIDES ──
     Snapping the orb to each word made it look mechanical and always
     a beat behind. It now runs on its own animation frame, easing
     toward wherever the writing is — so it flows with the words
     instead of chasing them, and it is never out of sync. */
  var oX = window.innerWidth * 0.5, oY = window.innerHeight * 0.4;
  var tX = oX, tY = oY, glide = 0;
  /* while the opening ceremony runs, the path drives the orb directly
     and nothing else is allowed to move it */
  var ORB_CEREMONY = false;

  function orbTo(rect) {
    if (!rect || ORB_CEREMONY) return;      // the ceremony owns the orb outright
    tX = Math.min(window.innerWidth - 210, Math.max(12, rect.right + 14));
    tY = Math.max(14, rect.top - 74);
    if (!glide) glide = requestAnimationFrame(glideStep);
  }

  function glideStep() {
    var k = SPEED > 6 ? 0.34 : 0.13;          // firm when hurrying, silk when not
    oX += (tX - oX) * k;
    oY += (tY - oY) * k;
    srcX = oX + 36; srcY = oY + 36;           // the light always leaves from the lens
    orb.style.transform = 'translate3d(' + oX.toFixed(1) + 'px,' + oY.toFixed(1) + 'px,0)';
    if (Math.abs(tX - oX) > 0.4 || Math.abs(tY - oY) > 0.4) {
      glide = requestAnimationFrame(glideStep);
    } else { glide = 0; }
  }

  /* the mind is always working, even between words */
  var emitTimer = 0;
  function startEmission() {
    if (emitTimer) return;
    emitTimer = setInterval(function () {
      if (paused || !running) return;
      var sp = SPARK(); if (!sp) return;
      sp.emit(srcX, srcY, { n: 1, g: orb.classList.contains('august') ? 5 : 3 });
    }, 110);
  }
  function stopEmission() { if (emitTimer) { clearInterval(emitTimer); emitTimer = 0; } }

  /* ══ WRAPPING ═════════════════════════════════════════════════════
     Characters are inline-block so each one can land with weight —
     which means the browser could break a line between any two of
     them. So every WORD gets a nowrap shell, and lines break only
     where language says they may. ══════════════════════════════════ */
  function wrapChars(el) {
    var out = [];
    (function walk(node) {
      var kids = [].slice.call(node.childNodes);
      kids.forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var parts = ch.nodeValue.split(/(\s+)/);
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'tw';
            for (var i = 0; i < part.length; i++) {
              var sp = document.createElement('span');
              sp.className = 'tc';
              sp.textContent = part[i];
              w.appendChild(sp);
              out.push(sp);
            }
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'IMG' && !ch.classList.contains('rw-logo')) {
          walk(ch);
        }
      });
    })(el);
    return out;
  }

  function collectBlocks(root, sel) {
    return [].slice.call(root.querySelectorAll(sel)).filter(function (el) {
      return el.tagName !== 'DIV' && (el.textContent || '').trim().length > 0;
    });
  }

  /* ── THE FLASH, FIXED ──
     A block used to sit at full opacity from the moment the page
     loaded until the instant typing actually reached it — the CSS
     rule that hides an untyped block only fires once it carries
     class .tw-block, and that class was only ever added at the top
     of typeSequence(), seconds after the blocks already existed and
     already painted. Marking a block the moment it is COLLECTED,
     rather than the moment it is TYPED, closes that window: it is
     never visible with its full text before a single letter has
     landed. */
  function markBlocks(blocks) {
    blocks.forEach(function (b) { b.classList.add('tw-block'); });
    return blocks;
  }

  var EM = 'b,strong,.rw-str,.grad,.gold';

  /* ══ THE TYPING ═══════════════════════════════════════════════════ */
  var running = false, paused = false, watchdogAt = 0;
  var pendingTicks = [];          // every timer the typing owns
  function later(fn, ms) { var t = setTimeout(fn, ms); pendingTicks.push(t); return t; }

  /* ══ THE FULL STOP ════════════════════════════════════════════════
     The intro is a performance, and a performance that has ended must
     leave the stage. Before this, walking into the deck left the
     typewriter still ticking, an emitter firing every 110ms, the orb
     still gliding on its own animation frame, the watchdog polling
     forever and the spark canvas still painting — all of it behind a
     page you were no longer looking at. This stops every one of them,
     once, and cannot be run twice. */
  var stopped = false;
  function introStop() {
    if (stopped) return;
    stopped = true;

    running = false;
    paused = true;

    stopEmission();
    if (glide) { cancelAnimationFrame(glide); glide = 0; }
    if (watchdog) { clearInterval(watchdog); watchdog = 0; }
    labelTimers.forEach(clearTimeout); labelTimers = [];
    pendingTicks.forEach(clearTimeout); pendingTicks = [];
    clearTimeout(holdTimer); clearInterval(holdBurst);

    /* the canvas keeps a requestAnimationFrame alive for as long as it
       is awake — dismissing it is what actually returns the GPU */
    try { var sk = SPARK(); if (sk && sk.dismiss) sk.dismiss(); } catch (e) {}
    try { if (window.MotusSound && MotusSound.stop) MotusSound.stop(); } catch (e) {}

    /* PRONTO belongs to the intro. It does not follow you into the deck. */
    try { pronto.remove(); } catch (e) {}
    ['twOrb', 'prosp', 'reword', 'prontoWave', 'prontoRing', 'prontoEdge']
      .forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });

    document.body.classList.remove('pro-open', 'pronto-hold', 'pronto-surge', 'pronto-on');
  }
  window.__introStop = introStop;

  /* whichever door you leave by — Set The Stage, Tell Me More, or four
     taps on PRONTO — the intro shuts down behind you */
  (function guardEnter() {
    var wired = 0;
    var t = setInterval(function () {
      if (typeof window.__enterDeck === 'function') {
        clearInterval(t);
        var realEnter = window.__enterDeck;
        window.__enterDeck = function () { var r = realEnter.apply(this, arguments); introStop(); return r; };
      } else if (++wired > 100) { clearInterval(t); }
    }, 50);
  })();

  /* a tab you cannot see should not be painting */
  document.addEventListener('visibilitychange', function () {
    if (stopped) return;
    if (document.hidden) {
      paused = true;
      stopEmission();
      if (glide) { cancelAnimationFrame(glide); glide = 0; }
      try { var s = SPARK(); if (s && s.stop) s.stop(); } catch (e) {}
    } else {
      paused = false;
      if (running) startEmission();
    }
  });

  function typeSequence(scroller, blocks, opts, onDone) {
    running = true;
    watchdogAt = performance.now();   // a fresh clock for a fresh act
    startEmission();
    var bi = 0, ci = 0, chars = [], total = 0, done = 0, words = 0;
    blocks.forEach(function (b) {
      b.classList.add('tw-block');
      total += (b.textContent || '').length;
    });

    var lastScroll = 0;
    // one measurement serves both the orb and the scroll — never two
    function keepInView(sp, rect) {
      var now = performance.now();
      if (now - lastScroll < S(480)) return;
      var r = rect || sp.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.top > vh * 0.6 || r.top < vh * 0.22) {
        lastScroll = now;
        var target = scroller.scrollTop + r.top - vh * 0.42;
        try { scroller.scrollTo({ top: target, behavior: 'smooth' }); } catch (e) { scroller.scrollTop = target; }
      }
    }

    /* a hand does not type at one speed. It leans on the words that
       matter, breathes at a full stop, and hesitates now and then. */
    function delayFor(c, heavy) {
      if (FAST) return 3;
      var d = 44 + Math.random() * 36;
      if (heavy) d *= 1.34;
      if (Math.random() < 0.028) d += 80 + Math.random() * 90;   // the pause of a thought
      if (/[.!?]/.test(c)) d += 520;
      else if (/[,;:—–]/.test(c)) d += 210;
      return S(d);
    }

    function nextBlock() {
      if (stopped) return;               // the teardown ends the act mid-word
      if (bi >= blocks.length) { running = false; stopEmission(); onDone && onDone(); return; }
      var b = blocks[bi];
      watchdogAt = performance.now();          // the pre-roll is not a stall
      b.classList.add('tw-seen', 'tw-live');
      var sec = b.closest('.rw-sec'); if (sec) sec.classList.add('lit');
      chars = b.__tc || (b.__tc = wrapChars(b));
      ci = 0;
      if (chars.length === 0) { bi++; setTimeout(nextBlock, FAST ? 3 : S(260)); return; }
      keepInView(chars[0]);
      var big = b.classList.contains('pr-huge') || b.classList.contains('rw-huge') ||
                b.classList.contains('pr-sec') ||
                (b.parentElement && b.parentElement.classList.contains('pr-sec'));
      var pre = FAST ? 3 : S(big ? 950 : 520);
      setTimeout(tick, pre);
    }

    function tick() {
      if (stopped) return;               // not paused — gone
      if (paused) { watchdogAt = performance.now(); setTimeout(tick, 300); return; }
      var b = blocks[bi];
      watchdogAt = performance.now();
      if (ci >= chars.length) {
        b.classList.remove('tw-live');        // shadow returns, once
        /* the largest statements do not simply finish — they land */
        if (SPEED < 6 && (b.classList.contains('pr-huge') || b.classList.contains('rw-huge'))) {
          var br = b.getBoundingClientRect();
          var sk2 = SPARK();
          if (sk2) {
            try {
              sk2.summon({ left: br.left, top: br.top, width: br.width, height: br.height,
                           right: br.right, bottom: br.bottom },
                         { n: 90, dur: 900, strikes: 4, reach: 0.7 });
            } catch (e4) {}
          }
          try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e5) {}
        }
        bi++;
        if (opts.ding && window.MotusSound && Math.random() < 0.5) { try { MotusSound.play('ding'); } catch (e) {} }
        setTimeout(nextBlock, FAST ? 3 : S(560));
        return;
      }
      var sp = chars[ci++];
      var heavy = !!sp.parentElement.parentElement &&
                  sp.parentElement.parentElement.matches &&
                  sp.parentElement.parentElement.matches(EM);
      sp.classList.add('on');
      done++;

      if (done % 8 === 0) {
        orb.style.setProperty('--e', Math.min(1, done / Math.max(1, total)).toFixed(3));
      }

      /* ── the word is thrown ──
         A word ends where its nowrap shell ends. That single boundary
         is the only place we measure, the only place light is spent,
         and the only place the page has to do any work at all. */
      var next = chars[ci];
      var wordEnd = !next || next.parentElement !== sp.parentElement;
      if (wordEnd) {
        words++;
        var wr = sp.parentElement.getBoundingClientRect();
        orbTo(wr);
        keepInView(sp, wr);
        readSource();

        var sk = SPARK();
        if (sk && (SPEED === 1 || words % 2 === 0)) {
          var tx = wr.left + wr.width * 0.62, ty = wr.top + wr.height * 0.5;
          sk.beam(srcX, srcY, tx, ty, {
            n: heavy ? 8 : 5,
            g: opts.august ? 5 : undefined,
            hue: opts.august ? 38 : 210,
            arc: heavy || words % 7 === 0,
            landSz: heavy ? 9 : 6
          });
        }

        /* an emphasised phrase keeps its aura once it is complete */
        if (heavy) {
          var em = sp.closest(EM);
          var nextEm = next ? next.closest(EM) : null;
          if (em && em !== nextEm) {
            em.classList.add('tw-lit');
            if (sk) {
              var er = em.getBoundingClientRect();
              sk.arc(srcX, srcY, er.left + er.width / 2, er.top + er.height / 2,
                     { hue: opts.august ? 38 : 264, w: 1.3, life: 0.14, jag: 0.26 });
            }
            if (window.MotusSound) { try { MotusSound.play('ding'); } catch (e3) {} }
          }
        }
      }

      /* a finished thought sends a ring out from where it landed */
      if (/[.!?]/.test(sp.textContent) && SPEED < 6) {
        var rr = sp.getBoundingClientRect();
        var ring = document.createElement('i');
        ring.className = 'tw-ring' + (opts.august ? ' au' : '');
        ring.style.left = (rr.left + rr.width / 2) + 'px';
        ring.style.top = (rr.top + rr.height / 2) + 'px';
        document.body.appendChild(ring);
        setTimeout(function () { ring.remove(); }, 1000);
      }

      if (opts.keys && window.MotusSound) { try { MotusSound.key(); } catch (e2) {} }
      setTimeout(tick, delayFor(sp.textContent, heavy));
    }

    nextBlock();
  }

  /* auras that stay with the strongest statements */
  function crownStrong(root) {
    [].slice.call(root.querySelectorAll('.rw-str,.rw-huge')).forEach(function (el) {
      el.classList.add('rw-crowned');
    });
  }

  document.addEventListener('visibilitychange', function () { paused = document.hidden; });

  function forceVisible(ids) {
    ids.forEach(function (id) {
      var b = document.getElementById(id) || document.querySelector(id);
      if (b && parseFloat(getComputedStyle(b).opacity) < 0.5) {
        b.style.animation = 'none';
        b.style.opacity = '1'; b.style.transform = 'none'; b.style.filter = 'none';
        b.style.pointerEvents = 'auto';
      }
    });
  }

  /* watchdog — the experience must never strand anyone */
  var watchdog = setInterval(function () {
    if (running && !paused && performance.now() - watchdogAt > 6000) {
      running = false;
      stopEmission();
      document.body.classList.add('tw-done', 'tw-rescue');   // every word, instantly
      if (reword) reword.classList.add('rw-done');
      forceVisible(['prReword', 'prEnter', 'rwMore']);
      orb.classList.add('gone');
      hidePronto();
    }
  }, 2500);

  /* ══ PRONTO ═══════════════════════════════════════════════════════ */
  var pronto = document.createElement('button');
  pronto.id = 'prontoBtn';
  pronto.className = 'pronto';
  pronto.type = 'button';
  pronto.setAttribute('aria-label', 'Pronto — write it faster');
  pronto.innerHTML = '<i aria-hidden="true">\u26a1</i><b>PRONTO</b>';
  document.body.appendChild(pronto);

  ['prontoWave', 'prontoRing', 'prontoEdge'].forEach(function (id) {
    var d = document.createElement('div');
    d.id = id; d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
  });

  function showPronto() { pronto.classList.add('show'); }
  function hidePronto() { pronto.classList.remove('show'); }

  /* ── HOLD ──
     A press is a decision to move faster. A HOLD is a decision to be
     somewhere else — sixteen times the pace, every effect intact,
     the whole page tearing past. Let go and it lands exactly where
     the reading would have been. */
  var holdAt = 0, holding = false, holdBurst = 0, holdTimer = 0;

  function holdStart(e) {
    if (holding) return;
    holdAt = performance.now();
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () {
      holding = true;
      SPEED = 30;                 // a skip that is still a performance
      document.body.classList.add('pronto-hold');
      pronto.classList.add('holding');
      try { if (window.MotusSound) { MotusSound.enable(); MotusSound.play('charge'); } } catch (er) {}
      var sk = SPARK();
      if (sk) holdBurst = setInterval(function () { sk.surge({ x: srcX, y: srcY }); }, 340);
    }, 220);
    if (e && e.preventDefault) e.preventDefault();
  }
  /* Letting go does NOT slow it down. Once you have decided to skip,
     you have decided — it runs at 27 to the end of the act. */
  function holdEnd() {
    clearTimeout(holdTimer);
    if (!holding) return;
    holding = false;
    clearInterval(holdBurst);
    document.body.classList.remove('pronto-hold');
    pronto.classList.add('locked');
    try { if (window.MotusSound) MotusSound.play('ding'); } catch (er) {}
  }
  pronto.addEventListener('pointerdown', holdStart);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    pronto.addEventListener(ev, holdEnd);
  });
  addEventListener('blur', holdEnd);

  /* ── FOUR TAPS · straight to the deck ──
     PRONTO is for the reader who already believes you. Four quick taps
     is for the person who wrote it: skip the prospectus entirely and
     land on the first slide. Taps must come inside a second of each
     other, so a slow reader pressing it twice never triggers it. */
  var tapN = 0, tapAt = 0;

  pronto.addEventListener('click', function () {
    if (performance.now() - holdAt > 240) return;   // that was a hold, not a press

    var now = performance.now();
    tapN = (now - tapAt < 900) ? tapN + 1 : 1;
    tapAt = now;

    if (tapN >= 4) {
      tapN = 0;
      pronto.classList.add('on', 'locked');
      try { if (window.MotusSound) { MotusSound.enable(); MotusSound.play('arrival'); } } catch (e) {}
      if (window.__enterDeck) window.__enterDeck();
      return;
    }
    /* taps two and three say "heard you" so the fourth is not a guess */
    if (tapN > 1) {
      pronto.classList.remove('tap');
      void pronto.offsetWidth;
      pronto.classList.add('tap');
    }

    if (SPEED > 1) return;
    pronto.classList.add('on');

    try { if (window.MotusSound) { MotusSound.enable(); MotusSound.play('charge'); } } catch (e) {}

    var r = pronto.getBoundingClientRect();
    var sk = SPARK();
    if (sk) {
      sk.surge({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      setTimeout(function () { sk.surge(); }, 240);
      setTimeout(function () { sk.surge({ x: srcX, y: srcY }); }, 480);
    }
    document.body.classList.add('pronto-surge');

    setTimeout(function () {
      try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e) {}
    }, 300);

    /* the surge lands first — THEN everything moves */
    setTimeout(function () {
      SPEED = 2.6;
      document.body.classList.remove('pronto-surge');
      document.body.classList.add('pronto-on');
    }, 900);

    setTimeout(function () { pronto.classList.add('faded'); }, 3400);
  });

  /* ══ ACT 0 — THE SUMMONING ════════════════════════════════════════ */
  var art = prosp.querySelector('.pr-art');
  var artImg = art && art.querySelector('img');

  /* The light must gather on the PAINTED pixels, not on the element
     that holds them. The old version assumed a centred object-fit
     letterbox — true on some viewports, false on others, and on a wide
     desktop the image's box was twice its painted height, which put
     the whole ceremony half an artwork BELOW the logo. This computes
     the painted box the way the browser does: from the element's own
     computed object-fit and object-position. No assumptions left. */
  function paintedRect(box, img) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh || !box.width || !box.height) return null;
    var cs = getComputedStyle(img);
    var fit = cs.objectFit || 'fill', w, h, s;
    if (fit === 'contain' || fit === 'scale-down') {
      s = Math.min(box.width / nw, box.height / nh);
      if (fit === 'scale-down') s = Math.min(1, s);
      w = nw * s; h = nh * s;
    } else if (fit === 'cover') {
      s = Math.max(box.width / nw, box.height / nh);
      w = nw * s; h = nh * s;
    } else if (fit === 'none') { w = nw; h = nh; }
    else { w = box.width; h = box.height; }
    var pos = (cs.objectPosition || '50% 50%').split(/\s+/);
    function along(p, extent, span) {
      p = (p || '50%').trim();
      if (p.slice(-1) === '%')  return (span - extent) * parseFloat(p) / 100;
      if (/px$/.test(p))        return parseFloat(p);
      if (p === 'left' || p === 'top')    return 0;
      if (p === 'right' || p === 'bottom') return span - extent;
      return (span - extent) / 2;
    }
    var ox = along(pos[0], w, box.width);
    var oy = along(pos[1] || '50%', h, box.height);
    var l = box.left + ox, t = box.top + oy;
    return { left: l, top: t, width: w, height: h, right: l + w, bottom: t + h };
  }

  function summonArt() {
    if (!art || !artImg) return;
    var sk = SPARK();
    if (sk) {
      try { sk.summon(paintedRect(artImg.getBoundingClientRect(), artImg), { dur: 2400, strikes: 10 }); }
      catch (e) {}
    }
    setTimeout(function () {
      art.classList.add('condensed');
      try { if (window.MotusSound) MotusSound.play('forge'); } catch (e) {}
    }, 640);
  }

  if (artImg) {
    if (artImg.complete && artImg.naturalWidth) setTimeout(summonArt, 260);
    else artImg.addEventListener('load', function () { setTimeout(summonArt, 160); }, { once: true });
  }

  /* ══ THE VIGIL — the vision is HELD before it is explained ════════
     "The Best Ideas Are Meant To Be Shared" deserves to be read, not
     scrolled past. So before a single word is typed, the orb rises and
     walks three slow circles around the image — arcing lightning into
     it as it goes — and only when the third circle closes does Davara
     sit down to write. Every timer registers with the teardown, so
     four taps on PRONTO cut the ceremony dead like everything else. */
  /* The orb is a row — a round core, then a label. Every position here
     is expressed for the CORE, because the core is the eye a person
     follows; placing the element's top-left on the path is what made
     the circle look off its own centre. */
  /* Self-correcting: put the element where we think it goes, ask the
     browser where the CORE actually landed, then close the gap exactly.
     Deriving an offset from the layout instead was landing her 55px to
     the left of the mark, because the orb's box is not the orb's eye. */
  /* Where the core sits INSIDE the orb, in the orb's own coordinates.
     Measured once, with the transition switched off and the element
     parked at zero — reading a rect while a transform transition is
     running returns where the orb currently IS, not where it was told
     to go, and correcting against that left her 64px off the mark
     every single time. */
  var CORE_DX = null, CORE_DY = null;
  function measureCore() {
    /* core-within-orb, in the orb's own coordinates. Both rects carry
       the same transform, so the difference cancels it out — this is
       true whether or not a transition is mid-flight, which reading a
       single rect is not. */
    var o = orb.getBoundingClientRect(), c = orbCore.getBoundingClientRect();
    if (o.width && c.width) {
      CORE_DX = (c.left + c.width / 2) - o.left;
      CORE_DY = (c.top + c.height / 2) - o.top;
    } else { CORE_DX = 22; CORE_DY = 22; }
  }

  /* During the ceremony she is placed with left/top, not transform.
     Only transform and opacity are transitioned on this element, so a
     rect read during a transform transition reports where she IS, not
     where she was sent — which is how every correction landed 64px
     wide of the mark. left/top apply immediately and cannot lie. */
  function placeCore(x, y) {
    if (CORE_DX === null) measureCore();
    onRail = false;                           // she is on the path again
    var nx = x - CORE_DX, ny = y - CORE_DY;
    orb.style.transform = 'none';
    orb.style.left = nx.toFixed(1) + 'px';
    orb.style.top  = ny.toFixed(1) + 'px';
    oX = tX = nx; oY = tY = ny;
    srcX = x; srcY = y;                       // light leaves from the lens itself
  }

  /* hand her back to the ordinary transform-driven glide — once. The
     second call used to read the already-zeroed left/top as her real
     position and snap her to the top-left corner of the screen. */
  var onRail = false;
  function releaseCore() {
    if (onRail) return;
    onRail = true;
    var l = parseFloat(orb.style.left) || 0, t = parseFloat(orb.style.top) || 0;
    orb.style.transition = 'none';
    orb.style.left = '0px'; orb.style.top = '0px';
    oX = tX = l; oY = tY = t;
    orb.style.transform = 'translate3d(' + oX.toFixed(1) + 'px,' + oY.toFixed(1) + 'px,0)';
    orb.offsetWidth;
    orb.style.transition = '';
  }

  /* The mark sits at 21% across and 60% down the ARTWORK ITSELF.
     Measure from the <img>, never from .pr-art: on a phone the image
     is height:auto inside a taller box, so deriving the painted area
     from the container put the point 53px above the logo and 13px to
     its left — which is exactly the "way off" you saw. The img's own
     rect already IS the painted area there, and on a desk, where the
     image is object-fit:contain, the contain maths still letterboxes
     it correctly. One formula, right on both. */
  function markPoint() {
    if (!art || !artImg || !artImg.naturalWidth) return null;
    var ib = artImg.getBoundingClientRect();
    if (!ib.width || !ib.height) return null;
    var r = paintedRect(ib, artImg);
    if (!r) return null;
    return { x: r.left + r.width * 0.21, y: r.top + r.height * 0.60, art: r };
  }

  /* ── SHE PUSHES HERSELF OUT OF THE PICTURE ── */
  function emergeFromArt(done) {
    if (stopped) return done && done();
    var p = markPoint();
    if (!p) return done && done();

    orb.classList.remove('speaking');
    orbLabel.innerHTML = '';
    orb.style.transition = 'none';            // land on the mark without gliding to it
    CORE_DX = null;                           // the label just changed — remeasure
    placeCore(p.x, p.y);
    orb.offsetWidth;
    orb.style.transition = '';
    orb.classList.add('live', 'emerge');
    /* Re-anchor once the birth class has actually taken effect, so she
       begins the animation dead on the mark and not near it. A timer,
       not a frame: requestAnimationFrame never fires in a backgrounded
       tab, and this must survive someone opening the deck in one. */
    later(function () {
      if (stopped) return;
      placeCore(p.x, p.y);
      try {
        window.__emergeCheck = {
          mark: [Math.round(p.x), Math.round(p.y)],
          placed: [orb.style.left, orb.style.top],
          coreOff: [Math.round(CORE_DX), Math.round(CORE_DY)]
        };
      } catch (e) {}
    }, 40);

    /* THE GATHERING, then THE BREAK.
       For two seconds the artwork feeds her: bolts run inward from all
       over the plate into the mark. Then the surface gives — a burst
       out of the mark, the whole picture crackles, and she is loose. */
    var sk = SPARK();
    if (sk) {
      try { sk.emit(p.x, p.y, { n: 12, g: 6 }); } catch (e) {}

      for (var b = 0; b < 9; b++) {
        (function (n) {
          later(function () {
            if (stopped) return;
            var s = SPARK(); if (!s) return;
            var a = Math.random() * Math.PI * 2;
            var reach = 0.30 + Math.random() * 0.34;
            try {
              /* inward: the plate pours itself into the mark */
              s.arc(p.x + Math.cos(a) * p.art.width * reach,
                    p.y + Math.sin(a) * p.art.height * reach,
                    p.x, p.y, { jag: 0.5 });
              s.emit(p.x, p.y, { n: 5 + n * 2, g: 6 });
            } catch (e) {}
          }, 180 + n * 190);
        })(b);
      }

      /* the break */
      later(function () {
        if (stopped) return;
        var s = SPARK(); if (!s) return;
        try {
          s.surge({ x: p.x, y: p.y });
          s.emit(p.x, p.y, { n: 60, g: 7 });
          s.summon(p.art, { n: 70, dur: 900, strikes: 5, reach: 0.85 });
        } catch (e) {}
        try { if (window.MotusSound) { MotusSound.enable(); MotusSound.play('forge'); } } catch (e) {}
      }, 2030);

      /* and one last outward crack as she clears the surface */
      later(function () {
        if (stopped) return;
        var s = SPARK(); if (!s) return;
        for (var q = 0; q < 5; q++) {
          var a2 = (q / 5) * Math.PI * 2 + 0.4;
          try {
            s.arc(p.x, p.y,
                  p.x + Math.cos(a2) * 190,
                  p.y + Math.sin(a2) * 190, { jag: 0.55 });
          } catch (e) {}
        }
        try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e) {}
      }, 2380);
    }

    later(function () {
      if (stopped) return;
      orb.classList.remove('emerge');
      done && done();
    }, 3400);
  }

  function circleArt(turns, done) {
    if (stopped) return done && done();
    var p = markPoint();
    if (!p) return done && done();
    var r = p.art;
    var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;

    /* The radii are chosen so the ENTIRE ellipse is reachable on this
       screen. Clamping each waypoint instead — which is what happened
       before — flattens the bottom of the path and the circle appears
       to stop halfway down the picture. */
    var cb = orbCore.getBoundingClientRect();
    var half = (cb.width || 44) / 2, m = 10 + half;
    var maxRx = Math.min(cx - m, window.innerWidth - m - cx);
    var maxRy = Math.min(cy - m, window.innerHeight - m - cy);
    var rx = Math.max(46, Math.min(r.width * 0.52, maxRx));
    var ry = Math.max(46, Math.min(r.height * 0.52, maxRy));

    var steps = 30, total = turns * steps, i = 0;
    window.__ceremonyAt = Math.round(performance.now());
    ORB_CEREMONY = true;
    if (glide) { cancelAnimationFrame(glide); glide = 0; }   // the path drives, not the easing
    orb.classList.add('live', 'orbiting');
    labelTimers.forEach(clearTimeout); labelTimers = [];
    orbLabel.innerHTML = '';                 // she circles as a light, not as a nameplate
    orb.classList.remove('speaking');
    CORE_DX = null;                          // remeasure against the bare orb
    readSource();

    (function hop() {
      if (stopped) { ORB_CEREMONY = false; return; }
      var a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
      placeCore(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);

      var sk = SPARK();
      if (sk) {
        if (i % 5 === 2) {
          try { sk.arc(srcX, srcY,
                       r.left + r.width * (0.18 + Math.random() * 0.64),
                       r.top + r.height * (0.18 + Math.random() * 0.64),
                       { jag: 0.42 }); } catch (e) {}
        }
        if (i > 0 && i % steps === 0) {
          try { sk.summon(r, { n: 44, dur: 700, strikes: 2, reach: 0.5 }); } catch (e) {}
          try { if (window.MotusSound) MotusSound.play('ding'); } catch (e) {}
        }
      }
      i++;
      if (i <= total) later(hop, 74);
      else {
        ORB_CEREMONY = false;
        orb.classList.remove('orbiting');
        releaseCore();
        var s2 = SPARK();
        if (s2) { try { s2.surge({ x: cx, y: cy }); } catch (e) {} }
        later(done, 460);
      }
    })();
  }

  /* ══ ACT I — Davara types the vision ══════════════════════════════ */
  document.body.classList.add('tw-on');
  var PR_SEL = '.pr-kick,.pr-title,.pr-note,.pr-sec>b,.pr-sec>span,.pr-body,.pr-big,.pr-plus,.pr-result,.pr-huge,.pr-wrap p';
  var prBlocks = markBlocks(collectBlocks(prosp, PR_SEL));

  var typingStarted = false;
  function beginTyping() {
    if (typingStarted || stopped) return;
    typingStarted = true;
    window.__typeStartAt = Math.round(performance.now());
    /* whatever route we took to get here — full ceremony, a skipped
       circle, or the failsafe — she goes back on the transform rail
       before the writing starts, or left/top and transform would both
       be in play and she would type from the wrong place */
    ORB_CEREMONY = false;
    orb.classList.remove('emerge', 'orbiting');
    releaseCore();
    orb.classList.add('live');
    readSource();
    speak('Davara Is Typing');
    typeSequence(prosp, prBlocks, { keys: true, ding: false }, function () {
      document.body.classList.add('tw-done');
      orb.classList.add('rest');
      hidePronto();
      setTimeout(function () { forceVisible(['prReword', 'prEnter']); }, 1900);
      try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e) {}
    });
  }

  /* The ceremony is measured against the PAINTED artwork, so it cannot
     begin until the browser has decoded it — otherwise markPoint() is
     null, the whole opening is skipped silently, and the typing starts
     as if nothing had been planned. */
  var ceremonyStarted = false;
  function startCeremony() {
    if (ceremonyStarted || stopped) return;
    ceremonyStarted = true;
    if (FAST) return beginTyping();
    emergeFromArt(function () { circleArt(3, beginTyping); });
  }

  later(function () {
    showPronto();                       // the skip is offered from the first moment
    if (artImg && artImg.complete && artImg.naturalWidth) return startCeremony();
    if (artImg) artImg.addEventListener('load', function () { later(startCeremony, 220); }, { once: true });
    later(startCeremony, 4200);         // and never wait on it forever
  }, FAST ? 200 : 3400);                // after the condense settles — its scale(1.1)
                                        // would inflate every measurement by 5%
  later(beginTyping, 24000);            // whatever happens, the words arrive

  /* ══ ACT II — August writes the plain truth ═══════════════════════ */
  wireButtons();

  function wireButtons() {
    var enter = document.getElementById('prEnter');
    if (enter) enter.addEventListener('click', function () {
      try { retirePronto(); } catch (e) {}
    });
    var rwBtn = document.getElementById('prReword');
    var moreBtn = document.getElementById('rwMore');
    if (rwBtn && reword) rwBtn.addEventListener('click', openReword);
    if (moreBtn) moreBtn.addEventListener('click', tellMeMore);
  }

  var rewordRan = false;
  function openReword() {
    if (rewordRan) { reword.classList.add('open'); return; }
    rewordRan = true;

    try { if (window.MotusSound) { MotusSound.enable(); MotusSound.play('forge'); } } catch (e) {}

    /* the myth dissolves */
    prosp.classList.add('pr-dissolve');
    orb.classList.remove('rest');
    orb.classList.add('august');
    speak('August Is Writing');

    setTimeout(function () { prosp.classList.add('pr-sealed'); }, 1500);
    setTimeout(function () {
      reword.classList.add('open');
      reword.scrollTop = 0;
      var blocks = markBlocks(collectBlocks(reword, '.rw-wrap p,.rw-line,.rw-huge,.rw-link'));
      crownStrong(reword);

      /* his words are summoned too — the page is called into being */
      var sk = SPARK();
      if (sk) { try { sk.surge({ x: innerWidth / 2, y: innerHeight * 0.42 }); } catch (e) {} }

      setTimeout(function () {
        readSource();
        showPronto();
        typeSequence(reword, blocks, { keys: true, ding: true, august: true }, function () {
          reword.classList.add('rw-done');
          orb.classList.add('rest');
          hidePronto();
          setTimeout(function () { forceVisible(['rwMore']); }, 2000);
          try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e) {}
        });
      }, FAST ? 200 : 1900);   // the emergence breath
    }, 1350);
  }

  /* the deck wakes one frame early so its unseal never shares a frame
     with the fade that reveals it */
  /* PRONTO belongs to the intro. It does not follow you into the deck. */
  function retirePronto() {
    hidePronto();
    setTimeout(function () { try { pronto.remove(); } catch (e) {} }, 700);
  }

  function preWake() {
    try { document.body.classList.add('pre-wake'); } catch (e) {}
    retirePronto();
  }

  /* ── TELL ME MORE — the release ── */
  function tellMeMore() {
    try { if (window.MotusSound) MotusSound.play('charge'); } catch (e) {}
    reword.classList.add('rw-shake');
    orb.classList.add('gone');
    hidePronto();
    stopEmission();

    var sk = SPARK();
    if (sk) { try { sk.surge(); } catch (e) {} }

    setTimeout(preWake, 1200);
    setTimeout(function () {
      try { if (window.MotusSound) MotusSound.play('arrival'); } catch (e) {}
      /* the burst */
      for (var i = 0; i < 34; i++) {
        var m = document.createElement('i');
        m.className = 'rw-burstmote';
        var a = Math.random() * 6.283, d = 120 + Math.random() * Math.max(window.innerWidth, 500) * 0.6;
        m.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
        m.style.setProperty('--dy', Math.round(Math.sin(a) * d) + 'px');
        m.style.left = '50%'; m.style.top = '46%';
        reword.appendChild(m);
      }
      reword.classList.add('rw-burst');
      setTimeout(function () {
        if (typeof window.__enterDeck === 'function') window.__enterDeck();
        setTimeout(function () {
          reword.classList.remove('open'); reword.remove();
          /* the field has done its work — it costs nothing from here */
          try { if (SPARK()) SPARK().dismiss(); } catch (e) {}
          pronto.remove();
        }, 900);
      }, 980);
    }, 1550);
  }
})();
