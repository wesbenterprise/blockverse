import { useState, useEffect, useRef, useCallback } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { CRYSTAL_MINE } from '../utils/constants.js';
import { playCrystalMineSound, getSharedAudioCtx, resumeAudioCtx } from '../utils/audio.js';

const CM = CRYSTAL_MINE;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getBpmForLayer(layer) {
  for (const [maxLayer, bpm] of CM.BPM_TABLE) {
    if (layer <= maxLayer) return bpm;
  }
  return 180;
}

function getTimingWindow(layer) {
  for (const [maxLayer, ms] of CM.TIMING_TABLE) {
    if (layer <= maxLayer) return ms;
  }
  return 65;
}

function getSpawnDistribution(layer) {
  for (const [maxLayer, dist] of CM.SPAWN_TABLE) {
    if (layer <= maxLayer) return dist;
  }
  return CM.SPAWN_TABLE[CM.SPAWN_TABLE.length - 1][1];
}

function pickOreFromDist(dist) {
  const entries = Object.entries(dist);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [oreId, weight] of entries) {
    r -= weight;
    if (r <= 0) return CM.ORE_TYPES.find(o => o.id === oreId);
  }
  return CM.ORE_TYPES.find(o => o.id === entries[entries.length - 1][0]);
}

function generateLayer(layerNum) {
  const dist = getSpawnDistribution(layerNum);
  const ores = [];
  for (let i = 0; i < CM.ORES_PER_LAYER; i++) {
    const ore = pickOreFromDist(dist);
    ores.push({
      type: ore,
      col: CM.COLUMN_CYCLE[i],
      mined: false,
    });
  }
  return ores;
}

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

function lightenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.floor(r * factor))},${Math.min(255, Math.floor(g * factor))},${Math.min(255, Math.floor(b * factor))})`;
}

// ─── INITIAL STATE ───────────────────────────────────────────────────────────

function createInitialState() {
  return {
    phase: 'start', // 'start' | 'playing' | 'collapsed' | 'results'
    depth: 1,
    oreIndex: 0,
    ores: generateLayer(1),
    bpm: 100,
    beatTime: 0,
    nextBeat: 0,
    beatCount: 0,
    misses: 0,
    streak: 0,
    bestStreak: 0,
    coinsEarned: 0,
    oresMined: {},
    totalOresMined: 0,
    bestDepth: parseInt(localStorage.getItem(CM.HIGH_SCORE_KEY) || '0'),
    shakeUntil: 0,
    shakePx: 0,
    scrollAnim: 0,
    scrollStart: 0,
    particles: [],
    beatPulse: 0, // 0-1 for pickaxe animation
    lastTapTime: 0,
    missedBeatCount: 0, // beats since last action on current ore
    wallCracks: [],
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CrystalMine({ onBack, coins, setCoins, setXp }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createInitialState());
  const animRef = useRef(null);
  const [phase, setPhase] = useState('start');
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayDepth, setDisplayDepth] = useState(1);

  // Handle tap/click on canvas
  const handleInput = useCallback((clientX, clientY) => {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CM.CANVAS_W / rect.width;
    const scaleY = CM.CANVAS_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (g.phase === 'start') {
      // Start the game
      resumeAudioCtx();
      const ctx = getSharedAudioCtx();
      g.phase = 'playing';
      g.beatTime = ctx.currentTime;
      g.nextBeat = ctx.currentTime + 60 / g.bpm;
      g.beatCount = 0;
      g.missedBeatCount = 0;
      setPhase('playing');
      playCrystalMineSound('metronome', { downbeat: true });
      return;
    }

    if (g.phase === 'collapsed' || g.phase === 'results') {
      return; // Handled by buttons
    }

    if (g.phase !== 'playing') return;

    const audioCtx = getSharedAudioCtx();
    const now = audioCtx.currentTime;

    // Determine which column was tapped
    const shaftY = CM.SHAFT_Y;
    if (y < shaftY || y > shaftY + CM.SHAFT_H) return;

    const relX = x - CM.GRID_X_OFFSET;
    let tappedCol = -1;
    for (let c = 0; c < 3; c++) {
      const colX = c * (CM.BLOCK_SIZE + CM.BLOCK_GAP);
      if (relX >= colX && relX <= colX + CM.BLOCK_SIZE) {
        tappedCol = c;
        break;
      }
    }
    if (tappedCol === -1) return;

    // Current target ore
    const currentOre = g.ores[g.oreIndex];
    if (!currentOre || currentOre.mined) return;

    // Check if tapped the correct column
    if (tappedCol !== currentOre.col) {
      // Wrong column = miss
      registerMiss(g, now);
      return;
    }

    // Check timing — distance to nearest beat
    const beatInterval = 60 / g.bpm;
    const timeSinceLastBeat = now - g.beatTime;
    const beatsElapsed = timeSinceLastBeat / beatInterval;
    const nearestBeatOffset = beatsElapsed - Math.round(beatsElapsed);
    const offsetMs = Math.abs(nearestBeatOffset * beatInterval * 1000);
    const window = getTimingWindow(g.depth);

    if (offsetMs <= window) {
      // Successful mine!
      successfulMine(g, currentOre, now);
    } else {
      // Off-beat = miss
      registerMiss(g, now);
    }
  }, []);

  function registerMiss(g, now) {
    g.misses++;
    g.streak = 0;
    g.missedBeatCount = 0;
    playCrystalMineSound('miss');

    // Screen shake
    g.shakeUntil = now + CM.MISS_SHAKE_MS / 1000;
    g.shakePx = CM.MISS_SHAKE_PX;

    // Add wall crack
    g.wallCracks.push({
      x: Math.random() < 0.5 ? Math.random() * 100 : CM.CANVAS_W - Math.random() * 100,
      y: CM.SHAFT_Y + Math.random() * CM.SHAFT_H,
      len: 20 + Math.random() * 30,
      angle: Math.random() * Math.PI,
    });

    if (g.misses >= CM.MAX_MISSES) {
      triggerCollapse(g, now);
    }
  }

  function successfulMine(g, ore, now) {
    ore.mined = true;
    g.streak++;
    if (g.streak > g.bestStreak) g.bestStreak = g.streak;
    g.missedBeatCount = 0;
    g.coinsEarned += ore.type.coinValue;
    g.totalOresMined++;
    g.oresMined[ore.type.id] = (g.oresMined[ore.type.id] || 0) + 1;

    playCrystalMineSound('ore', ore.type);

    // Spawn break particles
    const blockX = CM.GRID_X_OFFSET + ore.col * (CM.BLOCK_SIZE + CM.BLOCK_GAP) + CM.BLOCK_SIZE / 2;
    const blockY = CM.SHAFT_Y + CM.SHAFT_H / 2;
    const pCount = CM.ORE_BREAK_PARTICLES.count[0] + Math.floor(Math.random() * (CM.ORE_BREAK_PARTICLES.count[1] - CM.ORE_BREAK_PARTICLES.count[0]));
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = CM.ORE_BREAK_PARTICLES.speed[0] + Math.random() * (CM.ORE_BREAK_PARTICLES.speed[1] - CM.ORE_BREAK_PARTICLES.speed[0]);
      g.particles.push({
        x: blockX, y: blockY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: CM.ORE_BREAK_PARTICLES.size[0] + Math.random() * (CM.ORE_BREAK_PARTICLES.size[1] - CM.ORE_BREAK_PARTICLES.size[0]),
        color: Math.random() > 0.3 ? ore.type.color : '#ffffff',
        life: CM.ORE_BREAK_PARTICLES.life[0] + Math.random() * (CM.ORE_BREAK_PARTICLES.life[1] - CM.ORE_BREAK_PARTICLES.life[0]),
        maxLife: CM.ORE_BREAK_PARTICLES.life[1],
        gravity: CM.ORE_BREAK_PARTICLES.gravity,
        type: 'ore',
      });
    }

    // Coin particles
    const cCount = CM.COIN_PARTICLES.count[0] + Math.floor(Math.random() * (CM.COIN_PARTICLES.count[1] - CM.COIN_PARTICLES.count[0]));
    for (let i = 0; i < cCount; i++) {
      g.particles.push({
        x: blockX + (Math.random() - 0.5) * 20,
        y: blockY,
        vx: (Math.random() - 0.5) * 20,
        vy: -CM.COIN_PARTICLES.floatDist / (CM.COIN_PARTICLES.life / 1000),
        size: CM.COIN_PARTICLES.size,
        color: CM.COIN_COLOR,
        life: CM.COIN_PARTICLES.life,
        maxLife: CM.COIN_PARTICLES.life,
        gravity: 0,
        type: 'coin',
      });
    }

    // Scroll animation
    g.scrollStart = performance.now();
    g.scrollAnim = 1;

    // Advance to next ore
    g.oreIndex++;
    if (g.oreIndex >= CM.ORES_PER_LAYER) {
      // Next layer
      g.depth++;
      g.oreIndex = 0;
      g.bpm = getBpmForLayer(g.depth);
      g.ores = generateLayer(g.depth);
    }

    setDisplayCoins(g.coinsEarned);
    setDisplayDepth(g.depth);
  }

  function triggerCollapse(g, now) {
    g.phase = 'collapsed';
    g.shakeUntil = now + CM.COLLAPSE_SHAKE_MS / 1000;
    g.shakePx = CM.COLLAPSE_SHAKE_PX;
    playCrystalMineSound('collapse');

    // Spawn collapse rocks
    const rCount = CM.COLLAPSE_PARTICLES.count[0] + Math.floor(Math.random() * (CM.COLLAPSE_PARTICLES.count[1] - CM.COLLAPSE_PARTICLES.count[0]));
    for (let i = 0; i < rCount; i++) {
      g.particles.push({
        x: Math.random() * CM.CANVAS_W,
        y: -20,
        vx: (Math.random() - 0.5) * 40,
        vy: CM.COLLAPSE_PARTICLES.speed[0] + Math.random() * (CM.COLLAPSE_PARTICLES.speed[1] - CM.COLLAPSE_PARTICLES.speed[0]),
        size: CM.COLLAPSE_PARTICLES.size[0] + Math.random() * (CM.COLLAPSE_PARTICLES.size[1] - CM.COLLAPSE_PARTICLES.size[0]),
        color: CM.COLLAPSE_PARTICLES.color,
        life: 1500,
        maxLife: 1500,
        gravity: 0,
        type: 'rock',
      });
    }

    // Save best depth
    if (g.depth > g.bestDepth) {
      g.bestDepth = g.depth;
      localStorage.setItem(CM.HIGH_SCORE_KEY, g.depth.toString());
    }

    // Award coins and XP
    if (g.coinsEarned > 0) setCoins(c => c + g.coinsEarned);
    const xpEarned = Math.floor(g.depth / 2);
    if (xpEarned > 0) setXp(x => x + xpEarned);

    // Transition to results after collapse animation
    setTimeout(() => {
      const gg = gameRef.current;
      if (gg.phase === 'collapsed') {
        gg.phase = 'results';
        setPhase('results');
        playCrystalMineSound('coin_jingle');
      }
    }, 1200);

    setPhase('collapsed');
  }

  // Keyboard support
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        const g = gameRef.current;
        if (g.phase === 'start') {
          handleInput(0, 0); // Will be caught by phase check
          // Simulate center tap
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            handleInput(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
          return;
        }
        if (g.phase !== 'playing') return;

        // Map keys to columns
        let col = -1;
        if (e.code === 'ArrowLeft') col = 0;
        else if (e.code === 'ArrowDown' || e.code === 'Space') col = 1;
        else if (e.code === 'ArrowRight') col = 2;

        if (col === -1) return;

        // Simulate tap on that column
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / CM.CANVAS_W;
        const colCenterX = CM.GRID_X_OFFSET + col * (CM.BLOCK_SIZE + CM.BLOCK_GAP) + CM.BLOCK_SIZE / 2;
        const colCenterY = CM.SHAFT_Y + CM.SHAFT_H / 2;
        handleInput(rect.left + colCenterX * scaleX, rect.top + colCenterY * (rect.height / CM.CANVAS_H));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInput]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();

    const loop = (timestamp) => {
      const dt = (timestamp - lastTime) / 1000; // seconds
      lastTime = timestamp;
      const g = gameRef.current;

      // Beat tracking (only during gameplay)
      if (g.phase === 'playing') {
        const audioCtx = getSharedAudioCtx();
        const now = audioCtx.currentTime;
        const beatInterval = 60 / g.bpm;

        // Check for beats that have passed
        while (now >= g.nextBeat) {
          g.beatTime = g.nextBeat;
          g.nextBeat += beatInterval;
          g.beatCount++;
          g.missedBeatCount++;

          // Play metronome
          playCrystalMineSound('metronome', { downbeat: g.beatCount % 4 === 0 });

          // Check for missed beats (2 beats without action)
          if (g.missedBeatCount >= CM.MISS_TIMEOUT_BEATS) {
            g.missedBeatCount = 0;
            registerMiss(g, now);
            if (g.phase !== 'playing') break;
          }
        }

        // Beat pulse (0-1)
        const timeSinceBeat = now - g.beatTime;
        g.beatPulse = Math.max(0, 1 - timeSinceBeat / beatInterval);
      }

      // Update particles
      g.particles = g.particles.filter(p => {
        p.life -= dt * 1000;
        if (p.life <= 0) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.gravity || 0) * dt;
        return true;
      });

      // Update scroll animation
      if (g.scrollAnim > 0) {
        const elapsed = timestamp - g.scrollStart;
        g.scrollAnim = Math.max(0, 1 - elapsed / CM.SCROLL_DURATION_MS);
      }

      // Draw
      drawFrame(ctx, g, timestamp);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleRestart = () => {
    const newState = createInitialState();
    newState.bestDepth = gameRef.current.bestDepth;
    Object.assign(gameRef.current, newState);
    setPhase('start');
    setDisplayCoins(0);
    setDisplayDepth(1);
  };

  const handleCanvasClick = (e) => {
    handleInput(e.clientX, e.clientY);
  };

  const handleCanvasTouch = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) handleInput(touch.clientX, touch.clientY);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#0f0f1b,#1a1a2e,#2d2d44)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, position: 'relative', fontFamily: 'Nunito,sans-serif',
    }}>
      <FloatingParticles />
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: CM.CANVAS_W, justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 50,
            padding: '8px 18px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: 'white' }}>⛏️ Crystal Mine</div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white', borderRadius: 50,
            padding: '6px 14px', fontFamily: "'Fredoka One',cursive", fontSize: 14,
          }}>🪙 {coins + displayCoins}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={CM.CANVAS_W}
            height={CM.CANVAS_H}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasTouch}
            style={{
              borderRadius: 16, border: '3px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              touchAction: 'none',
            }}
          />
          {/* Results overlay buttons */}
          {(phase === 'results' || phase === 'collapsed') && phase === 'results' && (
            <div style={{
              position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 16, zIndex: 10,
            }}>
              <button onClick={handleRestart} style={{
                background: 'linear-gradient(135deg,#FDCB6E,#FFA500)', color: '#1a1a2e', border: 'none',
                borderRadius: 50, padding: '12px 28px', cursor: 'pointer',
                fontFamily: "'Fredoka One',cursive", fontSize: 16, fontWeight: 'bold',
              }}>DIG AGAIN</button>
              <button onClick={onBack} style={{
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: 50, padding: '12px 28px', cursor: 'pointer',
                fontFamily: "'Fredoka One',cursive", fontSize: 16,
                backdropFilter: 'blur(10px)',
              }}>EXIT</button>
            </div>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
          Tap ore blocks on the beat • Arrow keys or tap to mine
        </div>
      </div>
    </div>
  );
}

// ─── DRAW ────────────────────────────────────────────────────────────────────

function drawFrame(ctx, g, timestamp) {
  const audioCtx = g.phase === 'playing' || g.phase === 'collapsed' ? getSharedAudioCtx() : null;
  const now = audioCtx ? audioCtx.currentTime : 0;

  // Screen shake
  let shakeX = 0, shakeY = 0;
  if (now < g.shakeUntil) {
    shakeX = (Math.random() - 0.5) * g.shakePx * 2;
    shakeY = (Math.random() - 0.5) * g.shakePx * 2;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Background
  ctx.fillStyle = CM.BG_SHAFT;
  ctx.fillRect(0, 0, CM.CANVAS_W, CM.CANVAS_H);

  // HUD top bar background
  ctx.fillStyle = CM.HUD_BG;
  ctx.fillRect(0, 0, CM.CANVAS_W, CM.HUD_TOP_H);

  // Mine walls (left and right of shaft)
  const wallLeft = CM.GRID_X_OFFSET - 8;
  const wallRight = CM.GRID_X_OFFSET + CM.GRID_WIDTH + 8;
  ctx.fillStyle = CM.WALL_COLOR;
  ctx.fillRect(0, CM.SHAFT_Y, wallLeft, CM.SHAFT_H);
  ctx.fillRect(wallRight, CM.SHAFT_Y, CM.CANVAS_W - wallRight, CM.SHAFT_H);

  // Wall texture - random lighter blocks
  ctx.fillStyle = CM.WALL_ACCENT;
  for (let i = 0; i < 12; i++) {
    const wx = ((i * 37) % wallLeft);
    const wy = CM.SHAFT_Y + ((i * 53) % CM.SHAFT_H);
    ctx.fillRect(wx, wy, 16, 12);
  }
  for (let i = 0; i < 12; i++) {
    const wx = wallRight + ((i * 41) % (CM.CANVAS_W - wallRight));
    const wy = CM.SHAFT_Y + ((i * 47) % CM.SHAFT_H);
    ctx.fillRect(wx, wy, 16, 12);
  }

  // Wall cracks
  ctx.strokeStyle = CM.MISS_CRACK_COLOR;
  ctx.lineWidth = 2;
  for (const crack of g.wallCracks) {
    ctx.beginPath();
    ctx.moveTo(crack.x, crack.y);
    ctx.lineTo(crack.x + Math.cos(crack.angle) * crack.len, crack.y + Math.sin(crack.angle) * crack.len);
    const branch = crack.len * 0.5;
    ctx.lineTo(
      crack.x + Math.cos(crack.angle) * crack.len + Math.cos(crack.angle + 0.8) * branch,
      crack.y + Math.sin(crack.angle) * crack.len + Math.sin(crack.angle + 0.8) * branch
    );
    ctx.stroke();
  }

  // Draw ore grid (4 visible rows)
  if (g.phase === 'playing' || g.phase === 'start') {
    drawOreGrid(ctx, g, timestamp);
  }

  // HUD - Health hearts
  ctx.font = "14px sans-serif";
  ctx.textAlign = 'left';
  for (let i = 0; i < CM.MAX_MISSES; i++) {
    const hx = 12 + i * 22;
    ctx.fillStyle = i < (CM.MAX_MISSES - g.misses) ? CM.HEART_FULL : CM.HEART_EMPTY;
    ctx.fillText('♥', hx, 28);
  }

  // HUD - Beat indicator (pickaxe)
  const beatScale = 1 + g.beatPulse * 0.3;
  ctx.save();
  ctx.translate(CM.CANVAS_W / 2, 22);
  ctx.scale(beatScale, beatScale);
  ctx.fillStyle = CM.BEAT_INDICATOR_COLOR;
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('⛏', 0, 6);
  ctx.restore();

  // HUD - Depth counter
  ctx.fillStyle = CM.DEPTH_TEXT_COLOR;
  ctx.font = "bold 14px 'Fredoka One', sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText(`DEPTH: ${g.depth}`, CM.CANVAS_W - 12, 28);

  // Streak display
  if (g.streak > 1) {
    const streakColor = g.streak >= 15 ? '#FF4757' : g.streak >= 10 ? '#FFA500' : g.streak >= 5 ? '#FDCB6E' : '#e0e0e0';
    ctx.fillStyle = streakColor;
    ctx.font = `bold ${12 + Math.min(g.streak, 8)}px 'Fredoka One', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`x${g.streak}`, CM.CANVAS_W / 2, CM.SHAFT_Y + 20);
  }

  // Bottom bar
  ctx.fillStyle = CM.HUD_BG;
  ctx.fillRect(0, CM.CANVAS_H - CM.HUD_BOTTOM_H, CM.CANVAS_W, CM.HUD_BOTTOM_H);

  // Bottom - Coins
  ctx.fillStyle = CM.COIN_COLOR;
  ctx.font = "bold 13px 'Fredoka One', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`🪙 ${g.coinsEarned}`, 12, CM.CANVAS_H - 12);

  // Bottom - Ores mined count
  ctx.fillStyle = CM.HUD_TEXT;
  ctx.font = "12px sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(`Ores: ${g.totalOresMined}`, CM.CANVAS_W / 2, CM.CANVAS_H - 12);

  // Bottom - Best depth
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = "12px sans-serif";
  ctx.textAlign = 'right';
  ctx.fillText(`Best: ${g.bestDepth}`, CM.CANVAS_W - 12, CM.CANVAS_H - 12);

  // Particles
  for (const p of g.particles) {
    const alpha = Math.max(0, Math.min(1, p.life / Math.min(200, p.maxLife)));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Danger indicator at 4/5 misses
  if (g.misses >= CM.MAX_MISSES - 1 && g.phase === 'playing') {
    const dangerPulse = Math.sin(timestamp * 0.008) * 0.15 + 0.15;
    ctx.fillStyle = `rgba(255,0,0,${dangerPulse})`;
    ctx.fillRect(0, 0, 8, CM.CANVAS_H);
    ctx.fillRect(CM.CANVAS_W - 8, 0, 8, CM.CANVAS_H);
    ctx.fillRect(0, 0, CM.CANVAS_W, 4);
    ctx.fillRect(0, CM.CANVAS_H - 4, CM.CANVAS_W, 4);
  }

  // Start screen overlay
  if (g.phase === 'start') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CM.CANVAS_W, CM.CANVAS_H);

    // Mine entrance
    ctx.fillStyle = CM.WALL_COLOR;
    ctx.fillRect(CM.CANVAS_W / 2 - 80, 100, 160, 140);
    ctx.fillStyle = CM.BG_SHAFT;
    ctx.fillRect(CM.CANVAS_W / 2 - 60, 110, 120, 130);

    // Pickaxe
    const tapPulse = 1 + Math.sin(timestamp * 0.005) * 0.15;
    ctx.save();
    ctx.translate(CM.CANVAS_W / 2, 160);
    ctx.scale(tapPulse, tapPulse);
    ctx.font = "36px sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('⛏️', 0, 10);
    ctx.restore();

    ctx.fillStyle = 'white';
    ctx.font = "bold 24px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Crystal Mine', CM.CANVAS_W / 2, 280);

    // Pulsing TAP TO DIG
    const tapAlpha = 0.5 + Math.sin(timestamp * 0.006) * 0.5;
    ctx.fillStyle = `rgba(253,203,110,${tapAlpha})`;
    ctx.font = "bold 18px 'Fredoka One', sans-serif";
    ctx.fillText('TAP TO DIG', CM.CANVAS_W / 2, 310);

    if (g.bestDepth > 0) {
      ctx.fillStyle = CM.DEPTH_TEXT_COLOR;
      ctx.font = "bold 14px 'Fredoka One', sans-serif";
      ctx.fillText(`DEEPEST: Layer ${g.bestDepth}`, CM.CANVAS_W / 2, 340);
    }
  }

  // Collapse overlay
  if (g.phase === 'collapsed') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CM.CANVAS_W, CM.CANVAS_H);
    ctx.fillStyle = '#FF4757';
    ctx.font = "bold 28px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('MINE COLLAPSED', CM.CANVAS_W / 2, CM.CANVAS_H / 2 - 10);
  }

  // Results screen
  if (g.phase === 'results') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CM.CANVAS_W, CM.CANVAS_H);

    ctx.fillStyle = '#FF4757';
    ctx.font = "bold 24px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('MINE COLLAPSED', CM.CANVAS_W / 2, 50);

    // Depth reached
    ctx.fillStyle = CM.DEPTH_TEXT_COLOR;
    ctx.font = "bold 18px 'Fredoka One', sans-serif";
    ctx.fillText(`Depth: Layer ${g.depth}`, CM.CANVAS_W / 2, 85);

    if (g.depth >= g.bestDepth && g.depth > 0) {
      ctx.fillStyle = '#FDCB6E';
      ctx.font = "bold 14px sans-serif";
      ctx.fillText('NEW PERSONAL BEST!', CM.CANVAS_W / 2, 108);
    }

    // Coins earned
    ctx.fillStyle = CM.COIN_COLOR;
    ctx.font = "bold 16px 'Fredoka One', sans-serif";
    ctx.fillText(`🪙 +${g.coinsEarned} coins`, CM.CANVAS_W / 2, 140);

    // XP earned
    ctx.fillStyle = CM.XP_BAR_FILL;
    ctx.fillText(`+${Math.floor(g.depth / 2)} XP`, CM.CANVAS_W / 2, 165);

    // Best streak
    if (g.bestStreak > 0) {
      ctx.fillStyle = '#FFA500';
      ctx.font = "14px sans-serif";
      ctx.fillText(`Best streak: x${g.bestStreak}`, CM.CANVAS_W / 2, 188);
    }

    // Ores collected breakdown
    ctx.fillStyle = CM.HUD_TEXT;
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillText('Ores Collected', CM.CANVAS_W / 2, 220);

    const oreEntries = Object.entries(g.oresMined);
    const startY = 240;
    ctx.font = "13px sans-serif";
    for (let i = 0; i < oreEntries.length; i++) {
      const [oreId, count] = oreEntries[i];
      const oreType = CM.ORE_TYPES.find(o => o.id === oreId);
      if (!oreType) continue;
      const row = Math.floor(i / 2);
      const col = i % 2;
      const ox = col === 0 ? CM.CANVAS_W / 2 - 100 : CM.CANVAS_W / 2 + 20;
      const oy = startY + row * 22;

      // Ore color swatch
      ctx.fillStyle = oreType.color;
      ctx.fillRect(ox, oy - 10, 14, 14);
      ctx.fillStyle = CM.HUD_TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(`${oreType.name}: ${count}`, ox + 20, oy);
    }
    ctx.textAlign = 'center';

    // Next layer tease
    if (g.ores && g.oreIndex < g.ores.length) {
      const nextOre = g.ores[g.oreIndex];
      if (nextOre) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = "12px sans-serif";
        const nextY = startY + Math.ceil(oreEntries.length / 2) * 22 + 10;
        ctx.fillText(`Next ore would have been: ${nextOre.type.name}`, CM.CANVAS_W / 2, nextY);
      }
    }
  }

  ctx.restore();
}

function drawOreGrid(ctx, g, timestamp) {
  const currentOre = g.ores[g.oreIndex];
  if (!currentOre) return;

  // Build visible grid: show the current ore in the center-ish area,
  // with already-mined ores above and upcoming ores below
  const visibleOres = [];

  // Show a few ores around the current index
  for (let i = Math.max(0, g.oreIndex - 2); i < Math.min(g.ores.length, g.oreIndex + 6); i++) {
    const ore = g.ores[i];
    const rowOffset = i - g.oreIndex;
    visibleOres.push({ ore, rowOffset, index: i });
  }

  // Scroll offset for animation
  const scrollOffset = g.scrollAnim * CM.BLOCK_SIZE * 0.5;

  for (const { ore, rowOffset, index } of visibleOres) {
    if (ore.mined && index < g.oreIndex) continue; // Don't draw already-mined past ores

    const col = ore.col;
    const bx = CM.GRID_X_OFFSET + col * (CM.BLOCK_SIZE + CM.BLOCK_GAP);
    const row = rowOffset + 1; // Center current ore at row 1 (0-indexed)
    const by = CM.SHAFT_Y + 20 + row * (CM.BLOCK_SIZE + CM.BLOCK_GAP) + scrollOffset;

    // Skip if out of visible area
    if (by + CM.BLOCK_SIZE < CM.SHAFT_Y || by > CM.SHAFT_Y + CM.SHAFT_H) continue;

    if (ore.mined) continue;

    const isTarget = index === g.oreIndex;
    const oreType = ore.type;

    // Draw ore block
    // Base fill
    ctx.fillStyle = oreType.color;
    ctx.fillRect(bx, by, CM.BLOCK_SIZE, CM.BLOCK_SIZE);

    // Bottom-right shadow (darker)
    ctx.fillStyle = darkenColor(oreType.color, 0.8);
    ctx.fillRect(bx, by + CM.BLOCK_SIZE - 4, CM.BLOCK_SIZE, 4);
    ctx.fillRect(bx + CM.BLOCK_SIZE - 4, by, 4, CM.BLOCK_SIZE);

    // Top-left highlight (lighter)
    ctx.fillStyle = lightenColor(oreType.color, 1.2);
    ctx.fillRect(bx, by, CM.BLOCK_SIZE, 4);
    ctx.fillRect(bx, by, 4, CM.BLOCK_SIZE);

    // Inner crystal shapes (small diamonds)
    ctx.fillStyle = oreType.accent;
    const crystalPositions = [
      [bx + 20, by + 25], [bx + 50, by + 35], [bx + 35, by + 55],
    ];
    for (const [cx, cy] of crystalPositions) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }

    // Highlight glow on target
    if (isTarget && g.phase === 'playing') {
      const glowOpacity = 0.3 + g.beatPulse * 0.3;
      ctx.strokeStyle = `rgba(255,255,255,${glowOpacity})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(bx - 2, by - 2, CM.BLOCK_SIZE + 4, CM.BLOCK_SIZE + 4);
    }

    // Dim non-target ores
    if (!isTarget) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx, by, CM.BLOCK_SIZE, CM.BLOCK_SIZE);
    }
  }
}
