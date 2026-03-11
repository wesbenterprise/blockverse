import { useState, useEffect, useRef } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { SANDBOX, COIN_TOAST_DURATION_MS } from '../utils/constants.js';
import { playSandboxSound, resumeAudioCtx } from '../utils/audio.js';

const { STEPS, BPM_OPTIONS, DEFAULT_BPM, INSTRUMENTS, MAX_COIN_REWARD, COINS_PER_INSTRUMENT, MAX_XP_PER_SESSION, XP_INTERVAL_SECONDS, GRID_SAVE_KEY, RANDOM_DENSITIES, MAX_COINS_PER_SESSION, MIN_LOOPS_FOR_REWARD, BEAT_SAVES_KEY, MAX_SAVES } = SANDBOX;

function isValidGrid(g) {
  return Array.isArray(g) && g.length === INSTRUMENTS.length &&
    g.every(row => Array.isArray(row) && row.length === STEPS && row.every(v => typeof v === 'boolean'));
}

function loadSavedGrid() {
  const saved = localStorage.getItem(GRID_SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (isValidGrid(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  return INSTRUMENTS.map(() => new Array(STEPS).fill(false));
}

function loadSaves() {
  try {
    const raw = localStorage.getItem(BEAT_SAVES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(s => s && s.name && isValidGrid(s.grid));
    }
  } catch { /* fall through */ }
  return [];
}

function persistSaves(saves) {
  localStorage.setItem(BEAT_SAVES_KEY, JSON.stringify(saves));
}

export default function BeatSandbox({ onBack, coins, setCoins, setXp }) {
  const [grid, setGrid] = useState(loadSavedGrid);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [coinToast, setCoinToast] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saves, setSaves] = useState(loadSaves);
  const [toast, setToast] = useState('');
  const gridRef = useRef(grid);
  const intervalRef = useRef(null);
  const stepRef = useRef(0);
  const loopsRef = useRef(0);
  const playStartRef = useRef(0);
  const sessionCoinsEarnedRef = useRef(0);

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

  const tick = () => {
    const s = stepRef.current;
    setCurrentStep(s);
    gridRef.current.forEach((row, i) => {
      if (row[s]) playSandboxSound(INSTRUMENTS[i]);
    });
    stepRef.current = (s + 1) % STEPS;
    if (stepRef.current === 0) loopsRef.current++;
  };

  const startPlayback = () => {
    const ctx = resumeAudioCtx();
    stepRef.current = 0;
    loopsRef.current = 0;
    playStartRef.current = Date.now();
    setPlaying(true);
    setCurrentStep(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(tick, ms);
  };

  const stopPlayback = () => {
    clearInterval(intervalRef.current);
    setPlaying(false);
    setCurrentStep(-1);

    // Award coins if at least MIN_LOOPS_FOR_REWARD full loops completed
    if (loopsRef.current >= MIN_LOOPS_FOR_REWARD) {
      const uniqueInsts = gridRef.current.reduce((c, row) => row.some(Boolean) ? c + 1 : c, 0);
      const rawReward = Math.min(uniqueInsts * COINS_PER_INSTRUMENT, MAX_COIN_REWARD);
      const remaining = MAX_COINS_PER_SESSION - sessionCoinsEarnedRef.current;
      const reward = Math.min(rawReward, remaining);
      if (reward > 0) {
        sessionCoinsEarnedRef.current += reward;
        setCoins(c => c + reward);
        setCoinToast(reward);
        setTimeout(() => setCoinToast(0), COIN_TOAST_DURATION_MS);
      } else if (rawReward > 0) {
        setCoinToast(-1);
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
      intervalRef.current = setInterval(tick, ms);
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const openSaveModal = () => {
    setSaveName(`My Beat #${saves.length + 1}`);
    setShowSaveModal(true);
  };

  const handleSave = () => {
    if (saves.length >= MAX_SAVES) {
      showToast('Max saves reached! Delete one first.');
      setShowSaveModal(false);
      return;
    }
    const name = saveName.trim() || `My Beat #${saves.length + 1}`;
    const newSave = { name, grid: grid.map(r => [...r]), bpm, createdAt: Date.now() };
    const updated = [...saves, newSave];
    setSaves(updated);
    persistSaves(updated);
    setShowSaveModal(false);
    showToast(`Saved: ${name}!`);
  };

  const handleLoad = (index) => {
    const s = saves[index];
    if (!s) return;
    setGrid(s.grid.map(r => [...r]));
    setBpm(s.bpm);
    setShowLoadModal(false);
    showToast(`${s.name} loaded!`);
  };

  const handleDeleteSave = (index) => {
    const updated = saves.filter((_, i) => i !== index);
    setSaves(updated);
    persistSaves(updated);
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
          <button onClick={openSaveModal} style={{
            background: 'rgba(108,92,231,0.3)', color: '#a29bfe',
            border: '1px solid rgba(108,92,231,0.4)', borderRadius: 12,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: "'Fredoka One',cursive",
          }}>💾 Save</button>
          <button onClick={() => setShowLoadModal(true)} style={{
            background: 'rgba(108,92,231,0.3)', color: '#a29bfe',
            border: '1px solid rgba(108,92,231,0.4)', borderRadius: 12,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: "'Fredoka One',cursive",
          }}>📂 Load</button>
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
        {coinToast !== 0 && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: coinToast > 0 ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'linear-gradient(135deg,#636e72,#b2bec3)',
            color: 'white',
            borderRadius: 16, padding: '12px 28px',
            fontFamily: "'Fredoka One',cursive", fontSize: 18,
            boxShadow: '0 6px 24px rgba(255,165,0,0.5)', zIndex: 100,
            animation: 'slideUp 0.4s ease',
          }}>
            {coinToast > 0 ? `🪙 +${coinToast} coins earned!` : 'Coin limit reached! Play other games to earn more.'}
          </div>
        )}

        {/* General toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 30, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#00b894,#00cec9)', color: 'white',
            borderRadius: 16, padding: '10px 24px',
            fontFamily: "'Fredoka One',cursive", fontSize: 15,
            boxShadow: '0 4px 16px rgba(0,206,201,0.4)', zIndex: 200,
          }}>{toast}</div>
        )}

        {/* Save Modal */}
        {showSaveModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150,
          }} onClick={() => setShowSaveModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'linear-gradient(160deg,#1a1a2e,#2d2d44)', borderRadius: 20,
              padding: '28px 32px', minWidth: 300, border: '1px solid rgba(108,92,231,0.3)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ color: 'white', fontFamily: "'Fredoka One',cursive", fontSize: 20, marginBottom: 16 }}>
                Name your beat:
              </div>
              <input
                type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
                maxLength={30}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(108,92,231,0.4)',
                  fontSize: 15, fontFamily: 'Nunito,sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSaveModal(false)} style={{
                  background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none',
                  borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 14,
                }}>Cancel</button>
                <button onClick={handleSave} style={{
                  background: 'linear-gradient(135deg,#6C5CE7,#a29bfe)', color: 'white', border: 'none',
                  borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150,
          }} onClick={() => setShowLoadModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'linear-gradient(160deg,#1a1a2e,#2d2d44)', borderRadius: 20,
              padding: '28px 32px', minWidth: 340, maxHeight: '70vh', overflowY: 'auto',
              border: '1px solid rgba(108,92,231,0.3)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ color: 'white', fontFamily: "'Fredoka One',cursive", fontSize: 20, marginBottom: 16 }}>
                Saved Beats
              </div>
              {saves.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                  No saved beats yet
                </div>
              ) : (
                saves.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: 14, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                        {s.bpm} BPM &middot; {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleLoad(i)} style={{
                        background: 'linear-gradient(135deg,#00b894,#00cec9)', color: 'white', border: 'none',
                        borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
                      }}>Play</button>
                      <button onClick={() => handleDeleteSave(i)} style={{
                        background: 'rgba(255,107,107,0.2)', color: '#FF6B6B', border: 'none',
                        borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12,
                      }}>✕</button>
                    </div>
                  </div>
                ))
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => setShowLoadModal(false)} style={{
                  background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none',
                  borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: 14,
                }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
