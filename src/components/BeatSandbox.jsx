import { useState, useEffect, useRef } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { SANDBOX, COIN_TOAST_DURATION_MS } from '../utils/constants.js';
import { playSandboxSound, resumeAudioCtx } from '../utils/audio.js';

const { STEPS, BPM_OPTIONS, DEFAULT_BPM, INSTRUMENTS, MAX_COIN_REWARD, COINS_PER_INSTRUMENT, MAX_XP_PER_SESSION, XP_INTERVAL_SECONDS, GRID_SAVE_KEY, RANDOM_DENSITIES } = SANDBOX;

function loadSavedGrid() {
  const saved = localStorage.getItem(GRID_SAVE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  return INSTRUMENTS.map(() => new Array(STEPS).fill(false));
}

export default function BeatSandbox({ onBack, coins, setCoins, setXp }) {
  const [grid, setGrid] = useState(loadSavedGrid);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [coinToast, setCoinToast] = useState(0);
  const gridRef = useRef(grid);
  const intervalRef = useRef(null);
  const stepRef = useRef(0);
  const loopsRef = useRef(0);
  const playStartRef = useRef(0);

  // Keep gridRef synced and persist to localStorage
  useEffect(() => {
    gridRef.current = grid;
    localStorage.setItem(GRID_SAVE_KEY, JSON.stringify(grid));
  }, [grid]);

  const toggleCell = (row, col) => {
    const wasOn = grid[row][col];
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
    // Only play sound when turning ON (prevents double-sound)
    if (!wasOn) playSandboxSound(INSTRUMENTS[row]);
  };

  const startPlayback = () => {
    const ctx = resumeAudioCtx();
    stepRef.current = 0;
    loopsRef.current = 0;
    playStartRef.current = Date.now();
    setPlaying(true);
    setCurrentStep(0);
    const ms = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(() => {
      const s = stepRef.current;
      setCurrentStep(s);
      gridRef.current.forEach((row, i) => {
        if (row[s]) playSandboxSound(INSTRUMENTS[i]);
      });
      stepRef.current = (s + 1) % STEPS;
      if (stepRef.current === 0) loopsRef.current++;
    }, ms);
  };

  const stopPlayback = () => {
    clearInterval(intervalRef.current);
    setPlaying(false);
    setCurrentStep(-1);

    // Award coins if at least one full loop completed
    if (loopsRef.current >= 1) {
      const uniqueInsts = grid.reduce((c, row) => row.some(Boolean) ? c + 1 : c, 0);
      const reward = Math.min(uniqueInsts * COINS_PER_INSTRUMENT, MAX_COIN_REWARD);
      if (reward > 0) {
        setCoins(c => c + reward);
        setCoinToast(reward);
        setTimeout(() => setCoinToast(0), COIN_TOAST_DURATION_MS);
      }
    }

    // Award XP for playback time
    const playSeconds = (Date.now() - playStartRef.current) / 1000;
    const xpEarned = Math.min(Math.floor(playSeconds / XP_INTERVAL_SECONDS), MAX_XP_PER_SESSION);
    if (xpEarned > 0) setXp(x => x + xpEarned);

    stepRef.current = 0;
    loopsRef.current = 0;
  };

  const startStop = () => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Cleanup interval on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Restart interval when BPM changes while playing
  useEffect(() => {
    if (playing) {
      clearInterval(intervalRef.current);
      const ms = (60 / bpm / 4) * 1000;
      intervalRef.current = setInterval(() => {
        const s = stepRef.current;
        setCurrentStep(s);
        gridRef.current.forEach((row, i) => {
          if (row[s]) playSandboxSound(INSTRUMENTS[i]);
        });
        stepRef.current = (s + 1) % STEPS;
      }, ms);
    }
  }, [bpm]);

  const clearGrid = () => {
    setGrid(INSTRUMENTS.map(() => new Array(STEPS).fill(false)));
  };

  const randomize = () => {
    setGrid(INSTRUMENTS.map((inst) => {
      const density = RANDOM_DENSITIES[inst.type] ?? RANDOM_DENSITIES.default;
      return new Array(STEPS).fill(false).map(() => Math.random() < density);
    }));
  };

  const activeCount = grid.flat().filter(Boolean).length;
  const uniqueInstrumentCount = grid.reduce((c, row) => row.some(Boolean) ? c + 1 : c, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#1a0533,#2D1B69,#6C5CE7)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 10px', fontFamily: 'Nunito,sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <FloatingParticles />
      <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 700 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 50,
            padding: '8px 18px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: 'white' }}>🎵 Beat Sandbox</div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white', borderRadius: 50,
            padding: '6px 14px', fontFamily: "'Fredoka One',cursive", fontSize: 14,
          }}>🪙 {coins}</div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={startStop} style={{
            background: playing ? 'linear-gradient(135deg,#FF6B6B,#ee5a24)' : 'linear-gradient(135deg,#00b894,#00cec9)',
            color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer',
            fontFamily: "'Fredoka One',cursive", fontSize: 16,
            boxShadow: playing ? '0 4px 15px rgba(255,107,107,0.4)' : '0 4px 15px rgba(0,184,148,0.4)',
          }}>
            {playing ? '⏹ Stop' : '▶ Play'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '6px 12px' }}>
            <span style={{ color: 'white', fontSize: 12, fontFamily: "'Fredoka One',cursive" }}>BPM</span>
            {BPM_OPTIONS.map(b => (
              <button key={b} onClick={() => setBpm(b)} style={{
                background: bpm === b ? '#6C5CE7' : 'rgba(255,255,255,0.1)',
                color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px',
                cursor: 'pointer', fontSize: 12, fontWeight: bpm === b ? 'bold' : 'normal',
              }}>{b}</button>
            ))}
          </div>
          <button onClick={randomize} style={{
            background: 'rgba(253,203,110,0.3)', color: '#FDCB6E',
            border: '1px solid rgba(253,203,110,0.4)', borderRadius: 12,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: "'Fredoka One',cursive",
          }}>🎲 Random</button>
          <button onClick={clearGrid} style={{
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
            border: 'none', borderRadius: 12, padding: '8px 16px', cursor: 'pointer', fontSize: 13,
          }}>🗑 Clear</button>
        </div>

        {/* Grid */}
        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 12,
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto',
        }}>
          {/* Step numbers */}
          <div style={{ display: 'flex', marginLeft: 72, marginBottom: 4 }}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} style={{
                width: 32, minWidth: 32, textAlign: 'center', fontSize: 9,
                color: currentStep === i ? '#FDCB6E' : 'rgba(255,255,255,0.25)',
                fontWeight: currentStep === i ? 'bold' : 'normal',
                fontFamily: "'Fredoka One',cursive",
              }}>{i + 1}</div>
            ))}
          </div>

          {INSTRUMENTS.map((inst, row) => (
            <div key={inst.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ width: 70, minWidth: 70, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16 }}>{inst.label}</span>
                <span style={{ fontSize: 10, color: inst.color, fontFamily: "'Fredoka One',cursive" }}>{inst.name}</span>
              </div>
              {grid[row].map((on, col) => {
                const isCurrentStep = currentStep === col;
                const isBeat = col % 4 === 0;
                return (
                  <div key={col} onClick={() => toggleCell(row, col)} style={{
                    width: 30, height: 28, minWidth: 30, margin: 1, borderRadius: 5, cursor: 'pointer',
                    background: on
                      ? `linear-gradient(135deg, ${inst.color}, ${inst.color}99)`
                      : isBeat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: isCurrentStep
                      ? '2px solid #FDCB6E'
                      : on ? `1px solid ${inst.color}` : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: on && isCurrentStep ? `0 0 12px ${inst.color}80` : on ? `0 0 6px ${inst.color}40` : 'none',
                    transition: 'all 0.05s',
                    transform: on && isCurrentStep ? 'scale(1.15)' : 'scale(1)',
                  }} />
                );
              })}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          <span>{activeCount} beats placed</span>
          <span>{bpm} BPM • {(60 / bpm * 4).toFixed(1)}s loop</span>
          {uniqueInstrumentCount > 0 && (
            <span style={{ color: '#FDCB6E' }}>
              🪙 {uniqueInstrumentCount} instruments = {Math.min(uniqueInstrumentCount * COINS_PER_INSTRUMENT, MAX_COIN_REWARD)} coins
            </span>
          )}
        </div>

        {/* Tips */}
        <div style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          Tap squares to add beats • Hit Play to hear your creation • Try Random for inspiration!
        </div>

        {/* Coin reward toast */}
        {coinToast > 0 && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white',
            borderRadius: 16, padding: '12px 28px',
            fontFamily: "'Fredoka One',cursive", fontSize: 18,
            boxShadow: '0 6px 24px rgba(255,165,0,0.5)', zIndex: 100,
            animation: 'slideUp 0.4s ease',
          }}>
            🪙 +{coinToast} coins earned!
          </div>
        )}
      </div>
    </div>
  );
}
