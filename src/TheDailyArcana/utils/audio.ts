// WebAudio for The Daily Arcana.
//
// Interaction SFX only — card actions sound like a deck of stiff paper
// cards on a felt-topped table, plus a reveal chime. No ambient bed (the
// looping room tone was removed — too noisy for a scroll-feed game).
//
// The AudioContext inits lazily on first sound (Aigram preloads games;
// mount-time audio would leak into the previous game's session).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const C = (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
        (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// ---------- One-shots ----------

// Soft paper-on-felt slide for the deck shuffle / card slide.
export function playCardSlide(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // Short noise burst, band-passed around 4kHz, fast attack + 280ms decay
  // — sounds like a card sliding off a deck onto felt.
  const dur = 0.32;
  const bufSize = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / bufSize;
    // Pink-ish noise with a soft envelope
    d[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3800;
  bp.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.32, now);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(now);
}

// Brief dull thump for the card landing flat on the table.
export function playCardThud(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const o = ac.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(160, now);
  o.frequency.exponentialRampToValueAtTime(60, now + 0.18);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, now);
  g.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.26);
}

// Reveal chime: a slow ascending bell ladder + a warm Maj7 pad welling
// up underneath. Marks the moment the card turns face-up.
export function playReveal(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // Bell ladder — A-major pentatonic, sine + sub-octave triangle for
  // a warm crystal-bowl tone. Slower than the album-cover reveal, more
  // contemplative.
  const bells = [330, 415.30, 493.88, 659.25, 880];
  const bellMaster = ac.createGain();
  bellMaster.gain.value = 0.28;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 280;
  bellMaster.connect(hp).connect(ac.destination);

  bells.forEach((freq, i) => {
    const t = now + i * 0.18;
    const oSine = ac.createOscillator();
    oSine.type = 'sine';
    oSine.frequency.value = freq;
    const oTri = ac.createOscillator();
    oTri.type = 'triangle';
    oTri.frequency.value = freq / 2;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    const gTri = ac.createGain();
    gTri.gain.value = 0.18;
    oSine.connect(g).connect(bellMaster);
    oTri.connect(gTri).connect(g);
    oSine.start(t);
    oSine.stop(t + 1.5);
    oTri.start(t);
    oTri.stop(t + 1.5);
  });

  // Pad: A Maj7 voicing welling up underneath the bells.
  const notes = [220, 277.18, 329.63, 415.30];
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.13, now + 2.2);
  master.gain.setValueAtTime(0.13, now + 4.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2000;
  lp.Q.value = 0.7;
  master.connect(lp).connect(ac.destination);
  notes.forEach((freq, i) => {
    [-3, 0, 3].forEach((cents) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * Math.pow(2, cents / 1200);
      const g = ac.createGain();
      g.gain.value = (1 - i * 0.18) * 0.32;
      o.connect(g).connect(master);
      o.start(now + i * 0.18);
      o.stop(now + 8.7);
    });
  });
}

export function playPop(): void {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const o1 = ac.createOscillator();
  const g1 = ac.createGain();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(520, t0);
  o1.frequency.exponentialRampToValueAtTime(1040, t0 + 0.06);
  g1.gain.setValueAtTime(0, t0);
  g1.gain.linearRampToValueAtTime(0.08, t0 + 0.008);
  g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
  o1.connect(g1).connect(ac.destination);
  o1.start(t0);
  o1.stop(t0 + 0.16);

  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'triangle';
  o2.frequency.value = 2400;
  g2.gain.setValueAtTime(0, t0);
  g2.gain.linearRampToValueAtTime(0.03, t0 + 0.005);
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  o2.connect(g2).connect(ac.destination);
  o2.start(t0);
  o2.stop(t0 + 0.10);
}

export function hapticTap(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(8); } catch { /* no-op */ }
  }
}

let globalTapInstalled = false;
export function installGlobalTapFeedback(): void {
  if (globalTapInstalled) return;
  if (typeof window === 'undefined') return;
  globalTapInstalled = true;
  window.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const interactive = target.closest('button, [role="button"], a[href]') as HTMLElement | null;
    if (!interactive) return;
    if ((interactive as HTMLButtonElement).disabled) return;
    if (interactive.closest('[data-no-feedback]')) return;
    playPop();
    hapticTap();
  }, true);
}

