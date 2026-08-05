/* ══════════════════════════════════════════════════════════════════
   THE SYMPHONY — every cue in this deck is one instrument.

   No audio files. Everything is synthesised in the browser from
   oscillators, filtered noise, and a feedback space. One root (D),
   one mode (Dorian) — so nothing you hear can ever clash with
   anything else you hear.

   Silent until you ask for it. Sound is an invitation, not an ambush.
   ══════════════════════════════════════════════════════════════════ */
window.MotusSound = (function () {
  'use strict';

  var D3 = 146.83;                       // the root — everything is a ratio of this
  var R = { u: 1, m2: 9 / 8, m3: 6 / 5, p4: 4 / 3, p5: 3 / 2, m6: 8 / 5, m7: 16 / 9, oct: 2 };
  var n = function (mult, oct) { return D3 * mult * Math.pow(2, oct || 0); };

  var A = null, master = null, space = null, ready = false;
  var on = false, lastAt = 0, THROTTLE = 110;

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    A = new AC();

    master = A.createGain();
    master.gain.value = 0.0001;
    master.connect(A.destination);

    // a room, made of delay — cheap, warm, and no asset to download
    space = A.createGain(); space.gain.value = 0.34;
    var d1 = A.createDelay(1.2); d1.delayTime.value = 0.083;
    var d2 = A.createDelay(1.2); d2.delayTime.value = 0.137;
    var fb = A.createGain(); fb.gain.value = 0.42;
    var tone = A.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2600;
    space.connect(d1); d1.connect(d2); d2.connect(tone); tone.connect(fb); fb.connect(d1);
    tone.connect(master);

    ready = true;
    return true;
  }

  var noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      var len = A.sampleRate * 2;
      noiseBuf = A.createBuffer(1, len, A.sampleRate);
      var ch = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    }
    var src = A.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    return src;
  }

  /* a single voice: waveform → filter → envelope → (dry + space) */
  function voice(o) {
    var t = A.currentTime + (o.at || 0);
    var g = A.createGain();
    var f = A.createBiquadFilter();
    f.type = o.ft || 'lowpass';
    f.frequency.setValueAtTime(o.fc || 4000, t);
    if (o.fcTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.fcTo), t + (o.fcT || o.dur));
    if (o.q) f.Q.value = o.q;

    var src;
    if (o.wave === 'noise') { src = noise(); }
    else {
      src = A.createOscillator();
      src.type = o.wave || 'sine';
      src.frequency.setValueAtTime(o.f, t);
      if (o.fTo) src.frequency.exponentialRampToValueAtTime(Math.max(20, o.fTo), t + (o.fT || o.dur));
      if (o.detune) src.detune.value = o.detune;
    }

    var peak = (o.g == null ? 0.2 : o.g);
    var atk = (o.a == null ? 0.012 : o.a);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);

    src.connect(f); f.connect(g);
    g.connect(master);
    if (o.wet !== 0) { var w = A.createGain(); w.gain.value = o.wet == null ? 0.5 : o.wet; g.connect(w); w.connect(space); }

    src.start(t);
    src.stop(t + o.dur + 0.06);
  }

  /* ══ the cues ═════════════════════════════════════════════════════
     Each one carries a meaning. None of them is decoration.        */
  var CUES = {
    // a section arrives — the deck inhales
    breath: function () {
      voice({ wave: 'noise', ft: 'bandpass', fc: 420, fcTo: 1250, q: 0.8, g: 0.030, a: 0.5, dur: 1.5, wet: 0.7 });
      voice({ wave: 'sine', f: n(R.u, -1), g: 0.045, a: 0.35, dur: 1.7, wet: 0.4 });
    },
    // a headline lands — the strike of a statement
    strike: function () {
      voice({ wave: 'sine', f: n(R.u, -1), fTo: n(R.u, -2), fT: 0.5, g: 0.16, a: 0.006, dur: 0.85, wet: 0.35 });
      voice({ wave: 'triangle', f: n(R.p5, 1), g: 0.055, a: 0.004, dur: 0.55, wet: 0.65 });
      voice({ wave: 'noise', ft: 'highpass', fc: 2400, g: 0.020, a: 0.003, dur: 0.16, wet: 0.4 });
    },
    // a card materialises — a small structure comes into being
    materialize: function () {
      voice({ wave: 'triangle', f: n(R.p4), fTo: n(R.p5), fT: 0.12, g: 0.045, a: 0.005, dur: 0.34, wet: 0.6 });
    },
    // a number locks — two tones agreeing
    lockNum: function () {
      voice({ wave: 'sine', f: n(R.u, 1), g: 0.055, a: 0.004, dur: 0.4, wet: 0.5 });
      voice({ wave: 'sine', f: n(R.p5, 1), g: 0.040, a: 0.004, dur: 0.5, at: 0.055, wet: 0.5 });
    },
    // a step on the ladder
    step: function () {
      voice({ wave: 'triangle', f: n(R.m3, 1), g: 0.032, a: 0.004, dur: 0.24, wet: 0.55 });
    },
    // THE SWARM GATHERS — noise rising, drone tightening
    forge: function () {
      voice({ wave: 'noise', ft: 'bandpass', fc: 180, fcTo: 3200, fcT: 1.6, q: 1.6, g: 0.055, a: 0.9, dur: 1.75, wet: 0.75 });
      voice({ wave: 'sawtooth', f: n(R.u, -1), g: 0.028, a: 1.1, dur: 1.75, detune: -8, wet: 0.5 });
      voice({ wave: 'sawtooth', f: n(R.u, -1), g: 0.028, a: 1.1, dur: 1.75, detune: 9, wet: 0.5 });
    },
    // THE LINE EXISTS — the triad resolves
    lock: function () {
      voice({ wave: 'sine', f: n(R.u), g: 0.085, a: 0.01, dur: 1.5, wet: 0.6 });
      voice({ wave: 'sine', f: n(R.m3), g: 0.060, a: 0.02, dur: 1.5, at: 0.045, wet: 0.6 });
      voice({ wave: 'sine', f: n(R.p5), g: 0.060, a: 0.02, dur: 1.6, at: 0.09, wet: 0.6 });
      voice({ wave: 'triangle', f: n(R.u, 2), g: 0.028, a: 0.006, dur: 0.7, at: 0.02, wet: 0.8 });
    },
    // holding to unlock — charge building
    charge: function () {
      voice({ wave: 'sine', f: n(R.u), fTo: n(R.p5), fT: 1.1, g: 0.05, a: 0.25, dur: 1.2, wet: 0.6 });
    },
    // the whole thing arrives
    arrival: function () {
      [[R.u, 0], [R.m3, 0], [R.p5, 0], [R.m7, 0], [R.u, 1], [R.p5, 1]].forEach(function (p, i) {
        voice({ wave: 'sine', f: n(p[0], p[1]), g: 0.062 - i * 0.006, a: 0.05 + i * 0.03, dur: 3.4, at: i * 0.075, wet: 0.75 });
      });
      voice({ wave: 'noise', ft: 'bandpass', fc: 700, fcTo: 2600, fcT: 2.2, q: 0.7, g: 0.024, a: 1.2, dur: 3.2, wet: 0.8 });
    },
    // the soft bell at a line's end
    ding: function () {
      voice({ wave: 'sine', f: n(R.oct, 1), g: 0.035, a: 0.004, dur: 0.7, wet: 0.65 });
      voice({ wave: 'sine', f: n(R.p5, 1), g: 0.02, a: 0.004, dur: 0.55, at: 0.03, wet: 0.65 });
    },
    // the door opens — the invitation
    door: function () {
      voice({ wave: 'triangle', f: n(R.p4), g: 0.05, a: 0.008, dur: 0.5, wet: 0.7 });
      voice({ wave: 'sine', f: n(R.oct), g: 0.045, a: 0.01, dur: 0.9, at: 0.11, wet: 0.7 });
    }
  };

  var lastKey = 0;
  function key() {
    if (!on || !ready) return;
    var now = performance.now();
    if (now - lastKey < 26) return;
    lastKey = now;
    try {
      if (A.state === 'suspended') A.resume();
      voice({ wave: 'noise', ft: 'bandpass', fc: 1500 + Math.random() * 900, q: 2.4, g: 0.03, a: 0.002, dur: 0.05, wet: 0.12 });
      voice({ wave: 'triangle', f: 1900 + Math.random() * 700, g: 0.011, a: 0.001, dur: 0.03, wet: 0.1 });
    } catch (e) {}
  }

  function play(name) {
    if (!on || !ready || !CUES[name]) return;
    var now = performance.now();
    if (name !== 'lock' && name !== 'arrival' && now - lastAt < THROTTLE) return;
    lastAt = now;
    try {
      if (A.state === 'suspended') A.resume();
      CUES[name]();
    } catch (e) { /* audio must never break the page */ }
  }

  function enable() {
    if (!ready && !build()) return false;
    if (A.state === 'suspended') A.resume();
    on = true;
    master.gain.cancelScheduledValues(A.currentTime);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), A.currentTime);
    master.gain.exponentialRampToValueAtTime(0.85, A.currentTime + 0.5);
    return true;
  }

  function disable() {
    if (!ready) { on = false; return; }
    on = false;
    master.gain.cancelScheduledValues(A.currentTime);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), A.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + 0.28);
  }

  function toggle() { if (on) { disable(); return false; } return enable(); }

  return { play: play, key: key, enable: enable, disable: disable, toggle: toggle,
           isOn: function () { return on; } };
})();
