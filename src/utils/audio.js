import { MUSIC } from './constants.js';

// ─── SHARED AUDIO CONTEXT ─────────────────────────────────────────────────────
// Browsers limit concurrent AudioContexts. We create ONE and share it app-wide.
let sharedAudioCtx = null;

export function getSharedAudioCtx() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioCtx;
}

export function resumeAudioCtx() {
  const ctx = getSharedAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── OBBY RUSH SFX ──────────────────────────────────────────────────────────
export function playObbySound(type, combo = 0) {
  const audioCtx = getSharedAudioCtx();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  if (type === 'jump') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.start(t); osc.stop(t + 0.15);
  } else if (type === 'coin') {
    const pitchBoost = combo * 15;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(880 + pitchBoost, t);
    osc.frequency.setValueAtTime(1100 + pitchBoost, t + 0.06);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.start(t); osc.stop(t + 0.15);
  } else if (type === 'hit') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  } else if (type === 'death') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  } else if (type === 'land') {
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      gain.gain.setValueAtTime(0.15, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t + i * 0.04); osc.stop(t + 0.35);
    });
  } else if (type === 'heart') {
    [440, 554, 659].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.2, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.25);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.3);
    });
  } else if (type === 'beatJump') {
    // Ascending chord: C5-E5-G5 played simultaneously
    [523, 659, 784].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    });
  } else if (type === 'checkpoint') {
    // Triumphant C-E-G ascending arpeggio
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.2, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.35);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.4);
    });
  } else if (type === 'magnet') {
    const audioCtxLocal = audioCtx;
    const noise = audioCtxLocal.createBufferSource();
    const buf = audioCtxLocal.createBuffer(1, audioCtxLocal.sampleRate * 0.12, audioCtxLocal.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const filter = audioCtxLocal.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2500; filter.Q.value = 5;
    const gain = audioCtxLocal.createGain();
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtxLocal.destination);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    noise.start(t); noise.stop(t + 0.12);
  }
}

// ─── BEAT SANDBOX SFX ─────────────────────────────────────────────────────────
export function playSandboxSound(instrument) {
  const audioCtx = getSharedAudioCtx();
  const t = audioCtx.currentTime;
  const { freq, type } = instrument;

  if (type === 'kick') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  } else if (type === 'snare') {
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1000;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    noise.start(t); noise.stop(t + 0.1);
  } else if (type === 'hihat') {
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 5000;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    noise.start(t); noise.stop(t + 0.05);
  } else if (type === 'clap') {
    for (let c = 0; c < 3; c++) {
      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.02, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buf;
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 2000;
      noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.4, t + c * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.01, t + c * 0.015 + 0.04);
      noise.start(t + c * 0.015); noise.stop(t + c * 0.015 + 0.04);
    }
  } else if (type === 'bass') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  } else if (type === 'synth') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.2, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  }
}

// ─── CRYSTAL MINE SFX ────────────────────────────────────────────────────────
export function playCrystalMineSound(type, oreType) {
  const audioCtx = getSharedAudioCtx();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  if (type === 'metronome') {
    // oreType here is { downbeat: bool }
    const freq = oreType?.downbeat ? 1000 : 800;
    const vol = oreType?.downbeat ? 0.12 : 0.08;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.002);
    gain.gain.linearRampToValueAtTime(0, t + 0.032);
    osc.start(t); osc.stop(t + 0.035);
  } else if (type === 'ore') {
    // oreType is the ore object from CRYSTAL_MINE.ORE_TYPES
    if (!oreType) return;
    const ore = oreType;

    if (ore.id === 'ruby') {
      // Dual sine: 440 + 880
      [440, 880].forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.003);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.153);
        gain.gain.linearRampToValueAtTime(0, t + 0.273);
        osc.start(t); osc.stop(t + 0.28);
      });
    } else if (ore.id === 'diamond') {
      // Dual sine: 784 + 1176 (fifth)
      [784, 1176].forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.002);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.302);
        gain.gain.linearRampToValueAtTime(0, t + 0.552);
        osc.start(t); osc.stop(t + 0.56);
      });
    } else if (ore.id === 'emerald') {
      // Square wave through lowpass filter
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(588, t);
      filter.type = 'lowpass'; filter.frequency.value = 1200; filter.Q.value = 1.0;
      osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.255);
      gain.gain.linearRampToValueAtTime(0, t + 0.455);
      osc.start(t); osc.stop(t + 0.46);
    } else if (ore.id === 'echo') {
      // Full 8-note C major pentatonic phrase: C4-D4-E4-G4-A4-G4-E4-C5
      const echoNotes = [261.6, 293.7, 329.6, 392.0, 440.0, 392.0, 329.6, 523.3];
      echoNotes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, t + i * 0.1 + 0.01);
        gain.gain.linearRampToValueAtTime(0.10, t + i * 0.1 + 0.2);
        gain.gain.linearRampToValueAtTime(0, t + i * 0.1 + 0.5);
        osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.51);
      });
    } else {
      // Standard single oscillator ores
      const configs = {
        coal:     { freq: 262, wave: 'triangle', gain: 0.25, attack: 0.005, decay: 0.080, sustain: 0,    release: 0.050 },
        copper:   { freq: 330, wave: 'square',   gain: 0.20, attack: 0.003, decay: 0.100, sustain: 0.05, release: 0.080 },
        iron:     { freq: 294, wave: 'sawtooth', gain: 0.22, attack: 0.002, decay: 0.120, sustain: 0.08, release: 0.100 },
        gold:     { freq: 392, wave: 'sine',     gain: 0.28, attack: 0.005, decay: 0.200, sustain: 0.10, release: 0.150 },
        sapphire: { freq: 524, wave: 'triangle', gain: 0.22, attack: 0.002, decay: 0.180, sustain: 0.08, release: 0.140 },
      };
      const cfg = configs[ore.id];
      if (!cfg) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = cfg.wave; osc.frequency.setValueAtTime(cfg.freq, t);
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(cfg.gain, t + cfg.attack);
      gain.gain.linearRampToValueAtTime(cfg.sustain, t + cfg.attack + cfg.decay);
      gain.gain.linearRampToValueAtTime(0, t + cfg.attack + cfg.decay + cfg.release);
      osc.start(t); osc.stop(t + cfg.attack + cfg.decay + cfg.release + 0.01);
    }
  } else if (type === 'miss') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(120, t);
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.002);
    gain.gain.linearRampToValueAtTime(0, t + 0.062);
    osc.start(t); osc.stop(t + 0.065);
  } else if (type === 'collapse') {
    // Sawtooth sweep 80→40Hz
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, t);
    osc1.frequency.linearRampToValueAtTime(40, t + 0.6);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.4, t + 0.01);
    gain1.gain.linearRampToValueAtTime(0.1, t + 0.41);
    gain1.gain.linearRampToValueAtTime(0, t + 0.61);
    osc1.start(t); osc1.stop(t + 0.62);

    // White noise
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const gain2 = audioCtx.createGain();
    noise.connect(gain2); gain2.connect(audioCtx.destination);
    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.linearRampToValueAtTime(0, t + 0.6);
    noise.start(t); noise.stop(t + 0.61);
  } else if (type === 'coin_jingle') {
    // C5-E5-G5 rapid arpeggio
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.08);
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.002);
      gain.gain.linearRampToValueAtTime(0, t + i * 0.08 + 0.082);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.085);
    });
  }
}

// ─── ECHO TOWERS SFX ────────────────────────────────────────────────────────
export function playEchoTowersSound(type, params = {}) {
  const audioCtx = getSharedAudioCtx();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  if (type === 'note') {
    const freq = params.freq || 261.63;
    // Triangle wave primary
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass'; filter.frequency.value = 2000; filter.Q.value = 1.0;
    osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    // ADSR: 10ms attack, 150ms decay, sustain 0.3, release 400ms
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.linearRampToValueAtTime(0.3 * 0.35, t + 0.01 + 0.15);
    gain.gain.setValueAtTime(0.3 * 0.35, t + 0.01 + 0.15);
    gain.gain.linearRampToValueAtTime(0, t + 0.01 + 0.15 + 0.4);
    osc.start(t); osc.stop(t + 0.57);

    // Sine sub
    const sub = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    sub.type = 'sine'; sub.frequency.setValueAtTime(freq, t);
    sub.connect(subGain); subGain.connect(audioCtx.destination);
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.12, t + 0.01);
    subGain.gain.linearRampToValueAtTime(0.04, t + 0.16);
    subGain.gain.linearRampToValueAtTime(0, t + 0.56);
    sub.start(t); sub.stop(t + 0.57);
  } else if (type === 'beatNote') {
    // Play base note
    playEchoTowersSound('note', params);
    const freq = params.freq || 261.63;

    // Square wave ding
    const ding = audioCtx.createOscillator();
    const dingGain = audioCtx.createGain();
    ding.type = 'square'; ding.frequency.setValueAtTime(freq, t);
    ding.connect(dingGain); dingGain.connect(audioCtx.destination);
    dingGain.gain.setValueAtTime(0, t);
    dingGain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    dingGain.gain.linearRampToValueAtTime(0, t + 0.25);
    ding.start(t); ding.stop(t + 0.26);

    // Noise shimmer
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.09, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 4500; bp.Q.value = 1.5;
    const nGain = audioCtx.createGain();
    noise.connect(bp); bp.connect(nGain); nGain.connect(audioCtx.destination);
    nGain.gain.setValueAtTime(0, t);
    nGain.gain.linearRampToValueAtTime(0.06, t + 0.005);
    nGain.gain.linearRampToValueAtTime(0, t + 0.085);
    noise.start(t); noise.stop(t + 0.09);
  } else if (type === 'offBeat') {
    const freq = params.freq || 261.63;
    // Reduced note
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
    gain.gain.linearRampToValueAtTime(0.15 * 0.25, t + 0.16);
    gain.gain.linearRampToValueAtTime(0, t + 0.36);
    osc.start(t); osc.stop(t + 0.37);

    // Low thud
    const thud = audioCtx.createOscillator();
    const thudGain = audioCtx.createGain();
    thud.type = 'sine'; thud.frequency.setValueAtTime(80, t);
    thud.connect(thudGain); thudGain.connect(audioCtx.destination);
    thudGain.gain.setValueAtTime(0, t);
    thudGain.gain.linearRampToValueAtTime(0.15, t + 0.005);
    thudGain.gain.linearRampToValueAtTime(0, t + 0.105);
    thud.start(t); thud.stop(t + 0.11);
  } else if (type === 'echo') {
    const freq = params.freq || 261.63;
    // 3-note chord: root, M3 (×5/4), P5 (×3/2)
    [freq, freq * 5 / 4, freq * 3 / 2].forEach(f => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t);
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.005);
      gain.gain.linearRampToValueAtTime(0.5 * 0.25, t + 0.105);
      gain.gain.linearRampToValueAtTime(0, t + 0.905);
      osc.start(t); osc.stop(t + 0.91);
    });

    // Ascending 5-note arpeggio pings
    const arpFreqs = [freq, freq * 9 / 8, freq * 5 / 4, freq * 3 / 2, freq * 2];
    arpFreqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f, t + i * 0.1);
      osc.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.005);
      gain.gain.linearRampToValueAtTime(0, t + i * 0.1 + 0.2);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.21);
    });
  } else if (type === 'metronome') {
    const beat1 = params.downbeat;
    const freq = beat1 ? 880 : 660;
    const vol = beat1 ? 0.08 : 0.04;
    const release = beat1 ? 0.06 : 0.04;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.001);
    gain.gain.linearRampToValueAtTime(0, t + 0.001 + release);
    osc.start(t); osc.stop(t + 0.001 + release + 0.01);
  } else if (type === 'playbackNote') {
    const freq = params.freq || 261.63;
    // Enhanced note with longer release
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass'; filter.frequency.value = 2000; filter.Q.value = 1.0;
    osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.005);
    gain.gain.linearRampToValueAtTime(0.4 * 0.45, t + 0.205);
    gain.gain.linearRampToValueAtTime(0, t + 0.805);
    osc.start(t); osc.stop(t + 0.81);

    // Delay effect (simple echo)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle'; osc2.frequency.setValueAtTime(freq, t + 0.12);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    gain2.gain.setValueAtTime(0, t + 0.12);
    gain2.gain.linearRampToValueAtTime(0.45 * 0.3, t + 0.125);
    gain2.gain.linearRampToValueAtTime(0, t + 0.925);
    osc2.start(t + 0.12); osc2.stop(t + 0.93);
  }
}

// ─── PROCEDURAL BACKGROUND MUSIC ─────────────────────────────────────────────
export function startProceduralMusic() {
  const audioCtx = getSharedAudioCtx();
  const bpm = MUSIC.BPM;
  const beatDur = 60 / bpm;
  const barDur = beatDur * 4;
  const loopDur = barDur * 4;
  const master = audioCtx.createGain();
  master.gain.value = MUSIC.MASTER_VOLUME;
  master.connect(audioCtx.destination);
  let stopped = false, timeoutId;

  const schedule = () => {
    if (stopped) return;
    const now = audioCtx.currentTime + 0.05;

    // Pad tones
    MUSIC.PAD_FREQUENCIES.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(MUSIC.PAD_VOLUME, now + 1);
      g.gain.setValueAtTime(MUSIC.PAD_VOLUME, now + loopDur - 1.5);
      g.gain.linearRampToValueAtTime(0, now + loopDur);
      osc.start(now); osc.stop(now + loopDur + 0.1);
    });

    // Kick and offbeat per bar
    for (let bar = 0; bar < 4; bar++) {
      const bt = now + bar * barDur;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.connect(g); g.connect(master);
      osc.frequency.setValueAtTime(MUSIC.KICK_FREQ_START, bt);
      osc.frequency.exponentialRampToValueAtTime(MUSIC.KICK_FREQ_END, bt + 0.12);
      g.gain.setValueAtTime(MUSIC.KICK_VOLUME, bt);
      g.gain.exponentialRampToValueAtTime(0.001, bt + 0.15);
      osc.start(bt); osc.stop(bt + 0.2);

      const bt2 = bt + beatDur * 2;
      const osc2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      osc2.connect(g2); g2.connect(master);
      osc2.frequency.setValueAtTime(MUSIC.OFFBEAT_FREQ_START, bt2);
      osc2.frequency.exponentialRampToValueAtTime(MUSIC.OFFBEAT_FREQ_END, bt2 + 0.1);
      g2.gain.setValueAtTime(MUSIC.OFFBEAT_VOLUME, bt2);
      g2.gain.exponentialRampToValueAtTime(0.001, bt2 + 0.12);
      osc2.start(bt2); osc2.stop(bt2 + 0.15);
    }

    timeoutId = setTimeout(schedule, (loopDur - 0.2) * 1000);
  };

  schedule();

  return {
    stop() {
      stopped = true;
      clearTimeout(timeoutId);
      master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    },
  };
}
