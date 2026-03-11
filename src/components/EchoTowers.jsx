import { useState, useEffect, useRef, useCallback } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { ECHO_TOWERS } from '../utils/constants.js';
import { playEchoTowersSound, getSharedAudioCtx, resumeAudioCtx } from '../utils/audio.js';

const ET = ECHO_TOWERS;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

function lightenColor(hex, amt) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.floor(r + (255 - r) * amt))},${Math.min(255, Math.floor(g + (255 - g) * amt))},${Math.min(255, Math.floor(b + (255 - b) * amt))})`;
}

function getColumnX(col) {
  return ET.GRID_X_OFFSET + col * (ET.BLOCK_SIZE + ET.GRID_GAP);
}

function getRowY(row) {
  // Row 0 is bottom (ground level), row 11 is top
  return ET.GROUND_Y - (row + 1) * ET.BLOCK_SIZE;
}

function getFrequency(col, row) {
  return ET.NOTE_FREQS[col] * ET.OCTAVE_BANDS[row];
}

function generateEchoSequences() {
  const seqs = [];
  for (let i = 0; i < ET.ECHO_SEQUENCES_PER_ROUND; i++) {
    const len = ET.ECHO_SEQUENCE_LENGTH[0] + Math.floor(Math.random() * (ET.ECHO_SEQUENCE_LENGTH[1] - ET.ECHO_SEQUENCE_LENGTH[0] + 1));
    const seq = [];
    for (let j = 0; j < len; j++) {
      seq.push(Math.floor(Math.random() * ET.COLS));
    }
    seqs.push(seq);
  }
  return seqs;
}

function generateStars() {
  const stars = [];
  for (let i = 0; i < ET.STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * ET.CANVAS_W,
      y: Math.random() * (ET.GROUND_Y - ET.HUD_TOP_H) + ET.HUD_TOP_H,
      size: 1 + Math.random() * 2,
      twinkleSpeed: 0.002 + Math.random() * 0.004,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function getMelodyRating(columnsUsed) {
  const unique = new Set(columnsUsed).size;
  if (unique >= 7) return 5;
  if (unique >= 5) return 4;
  if (unique >= 4) return 3;
  if (unique >= 3) return 2;
  return 1;
}

// ─── INITIAL STATE ───────────────────────────────────────────────────────────

function createInitialState() {
  return {
    phase: 'start',
    grid: Array.from({ length: ET.ROWS }, () => Array(ET.COLS).fill(false)),
    blockColors: Array.from({ length: ET.ROWS }, () => Array(ET.COLS).fill(-1)),
    onBeat: Array.from({ length: ET.ROWS }, () => Array(ET.COLS).fill(false)),
    cursorCol: 3,
    timer: ET.ROUND_DURATION,
    score: 0,
    multiplier: 1.0,
    streak: 0,
    bestStreak: 0,
    blocksPlaced: 0,
    echoBlocksFound: 0,
    bpm: ET.BASE_BPM,
    beatTime: 0,
    nextBeat: 0,
    beatCount: 0,
    melodyHistory: [],
    echoSequences: generateEchoSequences(),
    particles: [],
    floatingTexts: [],
    playbackRow: -1,
    playbackStartTime: 0,
    coinsEarned: 0,
    bestScore: parseInt(localStorage.getItem(ET.HIGH_SCORE_KEY) || '0'),
    stars: generateStars(),
    dropAnims: [], // { col, row, startTime, onBeat }
    columnsUsed: [],
    beatPulse: 0,
    lastPlaceTime: 0,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function EchoTowers({ onBack, coins, setCoins, setXp }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createInitialState());
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const [phase, setPhase] = useState('start');
  const [displayCoins, setDisplayCoins] = useState(0);

  // Get lowest open row in a column (0 = bottom)
  const getLowestOpenRow = useCallback((col) => {
    const g = gameRef.current;
    for (let row = 0; row < ET.ROWS; row++) {
      if (!g.grid[row][col]) return row;
    }
    return -1; // column full
  }, []);

  // Place a block
  const placeBlock = useCallback((col, isEchoBlock = false) => {
    const g = gameRef.current;
    if (g.phase !== 'playing') return;

    const row = getLowestOpenRow(col);
    if (row === -1) return; // column full

    const audioCtx = getSharedAudioCtx();
    const now = audioCtx.currentTime;
    const freq = getFrequency(col, row);

    // Check beat timing
    const beatInterval = 60 / g.bpm;
    const timeSinceLastBeat = now - g.beatTime;
    const beatsElapsed = timeSinceLastBeat / beatInterval;
    const nearestBeatOffset = beatsElapsed - Math.round(beatsElapsed);
    const offsetMs = Math.abs(nearestBeatOffset * beatInterval * 1000);
    const isOnBeat = offsetMs <= ET.BEAT_WINDOW_MS;

    // Place the block
    g.grid[row][col] = true;
    g.blockColors[row][col] = col;
    g.onBeat[row][col] = isOnBeat || isEchoBlock;
    g.blocksPlaced++;
    g.lastPlaceTime = performance.now();

    // Drop animation
    g.dropAnims.push({ col, row, startTime: performance.now(), onBeat: isOnBeat || isEchoBlock });

    // Track column usage
    g.columnsUsed.push(col);

    // Scoring
    let points;
    if (isEchoBlock) {
      points = ET.ECHO_BLOCK_POINTS;
      g.echoBlocksFound++;
      g.coinsEarned += ET.COINS_PER_ECHO_BLOCK;
      playEchoTowersSound('echo', { freq });

      // Screen flash particle
      g.particles.push({
        x: ET.CANVAS_W / 2, y: ET.CANVAS_H / 2,
        vx: 0, vy: 0, size: ET.CANVAS_W,
        color: 'rgba(255,255,255,0.3)', life: 300, maxLife: 300,
        type: 'flash',
      });

      // Floating text
      g.floatingTexts.push({
        x: getColumnX(col) + ET.BLOCK_SIZE / 2,
        y: getRowY(row),
        text: 'ECHO!', color: '#FFD700',
        life: 1000, maxLife: 1000,
      });
    } else if (isOnBeat) {
      g.multiplier += ET.MULTIPLIER_INCREMENT;
      g.streak++;
      if (g.streak > g.bestStreak) g.bestStreak = g.streak;
      points = Math.floor(ET.BASE_POINTS * g.multiplier);
      g.coinsEarned += ET.COINS_PER_BLOCK + ET.COINS_PER_ON_BEAT;
      playEchoTowersSound('beatNote', { freq });

      // Sparkle particles
      const cx = getColumnX(col) + ET.BLOCK_SIZE / 2;
      const cy = getRowY(row) + ET.BLOCK_SIZE / 2;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        g.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * 120,
          vy: Math.sin(angle) * 120,
          size: 3, color: '#ffffff',
          life: 400, maxLife: 400, type: 'sparkle',
        });
      }

      // Floating text
      g.floatingTexts.push({
        x: cx, y: cy - 20,
        text: '+♪', color: ET.COLUMN_COLORS[col],
        life: 800, maxLife: 800,
      });
    } else {
      g.multiplier = 1.0;
      g.streak = 0;
      points = ET.BASE_POINTS;
      g.coinsEarned += ET.COINS_PER_BLOCK;
      playEchoTowersSound('offBeat', { freq });
    }

    g.score += points;

    // Update melody history
    g.melodyHistory.push(col);
    if (g.melodyHistory.length > ET.MELODY_HISTORY_SIZE) {
      g.melodyHistory.shift();
    }

    // Check echo sequences
    if (g.melodyHistory.length >= 3) {
      for (let si = 0; si < g.echoSequences.length; si++) {
        const seq = g.echoSequences[si];
        if (g.melodyHistory.length >= seq.length) {
          const recent = g.melodyHistory.slice(-seq.length);
          if (recent.every((n, i) => n === seq[i])) {
            // Match! Place echo block
            // Find column with space
            const echoCols = Array.from({ length: ET.COLS }, (_, i) => i)
              .filter(c => getLowestOpenRow(c) !== -1);
            if (echoCols.length > 0) {
              const echoCol = echoCols[Math.floor(Math.random() * echoCols.length)];
              // Replace sequence
              const len = ET.ECHO_SEQUENCE_LENGTH[0] + Math.floor(Math.random() * (ET.ECHO_SEQUENCE_LENGTH[1] - ET.ECHO_SEQUENCE_LENGTH[0] + 1));
              const newSeq = [];
              for (let j = 0; j < len; j++) newSeq.push(Math.floor(Math.random() * ET.COLS));
              g.echoSequences[si] = newSeq;
              // Place echo block (recursive but isEchoBlock prevents infinite loop on sequence check)
              setTimeout(() => placeBlock(echoCol, true), 100);
            }
            break;
          }
        }
      }
    }

    // BPM increase every 12 blocks
    if (g.blocksPlaced % ET.BPM_BLOCK_INTERVAL === 0) {
      g.bpm += ET.BPM_INCREMENT;
    }

    setDisplayCoins(g.coinsEarned);
  }, [getLowestOpenRow]);

  // Handle input
  const handleInput = useCallback((col) => {
    const g = gameRef.current;
    if (g.phase === 'start') {
      resumeAudioCtx();
      const ctx = getSharedAudioCtx();
      g.phase = 'playing';
      g.beatTime = ctx.currentTime;
      g.nextBeat = ctx.currentTime + 60 / g.bpm;
      g.beatCount = 0;
      setPhase('playing');

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, ET.ROUND_DURATION - elapsed);
        gameRef.current.timer = remaining;
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          startPlayback();
        }
      }, 50);

      playEchoTowersSound('metronome', { downbeat: true });
      return;
    }
    if (g.phase !== 'playing') return;
    if (col < 0 || col >= ET.COLS) return;
    placeBlock(col);
  }, [placeBlock]);

  const startPlayback = useCallback(() => {
    const g = gameRef.current;
    g.phase = 'playback';
    g.playbackRow = 0;
    g.playbackStartTime = performance.now();
    setPhase('playback');
  }, []);

  // Mouse/touch handlers
  const getColFromX = useCallback((clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const scaleX = ET.CANVAS_W / rect.width;
    const x = (clientX - rect.left) * scaleX;
    for (let c = 0; c < ET.COLS; c++) {
      const cx = getColumnX(c);
      if (x >= cx && x <= cx + ET.BLOCK_SIZE) return c;
    }
    return -1;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const col = getColFromX(e.clientX);
    if (col >= 0) gameRef.current.cursorCol = col;
  }, [getColFromX]);

  const handleClick = useCallback((e) => {
    const col = getColFromX(e.clientX);
    if (col >= 0) {
      gameRef.current.cursorCol = col;
      handleInput(col);
    }
  }, [getColFromX, handleInput]);

  const handleTouch = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const col = getColFromX(touch.clientX);
    if (col >= 0) {
      gameRef.current.cursorCol = col;
      handleInput(col);
    }
  }, [getColFromX, handleInput]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e) => {
      const g = gameRef.current;
      // Keys 1-7 for columns
      if (e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const col = parseInt(e.key) - 1;
        g.cursorCol = col;
        handleInput(col);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleInput(g.cursorCol);
        return;
      }
      // Arrow keys to move cursor
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        g.cursorCol = Math.max(0, g.cursorCol - 1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        g.cursorCol = Math.min(ET.COLS - 1, g.cursorCol + 1);
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

    const loop = (timestamp) => {
      const g = gameRef.current;
      const dt = 16 / 1000; // approximate

      // Beat tracking
      if (g.phase === 'playing') {
        const audioCtx = getSharedAudioCtx();
        const now = audioCtx.currentTime;
        const beatInterval = 60 / g.bpm;

        while (now >= g.nextBeat) {
          g.beatTime = g.nextBeat;
          g.nextBeat += beatInterval;
          g.beatCount++;
          playEchoTowersSound('metronome', { downbeat: g.beatCount % 4 === 0 });

          // Musical note particle every 4 beats
          if (g.beatCount % 4 === 0) {
            const noteSymbols = ['♪', '♫', '♬', '♩'];
            g.floatingTexts.push({
              x: ET.GRID_X_OFFSET + Math.random() * (ET.COLS * (ET.BLOCK_SIZE + ET.GRID_GAP)),
              y: ET.GROUND_Y,
              text: noteSymbols[Math.floor(Math.random() * noteSymbols.length)],
              color: ET.COLUMN_COLORS[Math.floor(Math.random() * ET.COLS)],
              life: 2000, maxLife: 2000,
            });
          }
        }

        // Beat pulse
        const timeSinceBeat = now - g.beatTime;
        g.beatPulse = Math.max(0, 1 - timeSinceBeat / beatInterval);
      }

      // Playback phase
      if (g.phase === 'playback') {
        const elapsed = timestamp - g.playbackStartTime;
        const targetRow = Math.floor(elapsed / ET.PLAYBACK_ROW_MS);
        if (targetRow > g.playbackRow && targetRow <= ET.ROWS) {
          g.playbackRow = targetRow;
          // Play notes in this row
          const row = targetRow - 1;
          if (row >= 0 && row < ET.ROWS) {
            for (let c = 0; c < ET.COLS; c++) {
              if (g.grid[row][c]) {
                const freq = getFrequency(c, row);
                playEchoTowersSound('playbackNote', { freq });
              }
            }
          }
        }
        if (targetRow > ET.ROWS + 5) {
          // Playback done, show results
          finishGame(g);
        }
      }

      // Update particles
      g.particles = g.particles.filter(p => {
        p.life -= dt * 1000;
        if (p.life <= 0) return false;
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        return true;
      });

      // Update floating texts
      g.floatingTexts = g.floatingTexts.filter(ft => {
        ft.life -= dt * 1000;
        ft.y -= 30 * dt;
        return ft.life > 0;
      });

      // Clean up finished drop animations
      g.dropAnims = g.dropAnims.filter(d => timestamp - d.startTime < ET.DROP_DURATION_MS + 100);

      drawFrame(ctx, g, timestamp);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function finishGame(g) {
    g.phase = 'results';
    setPhase('results');

    // Calculate tower height
    let maxRow = 0;
    for (let r = 0; r < ET.ROWS; r++) {
      for (let c = 0; c < ET.COLS; c++) {
        if (g.grid[r][c] && r + 1 > maxRow) maxRow = r + 1;
      }
    }
    g.towerHeight = maxRow;

    // Melody rating
    g.melodyRating = getMelodyRating(g.columnsUsed);
    g.coinsEarned += g.melodyRating * ET.MELODY_STAR_COIN_MULTIPLIER;

    // Save best
    if (g.score > g.bestScore) {
      g.bestScore = g.score;
      localStorage.setItem(ET.HIGH_SCORE_KEY, g.score.toString());
    }

    // Award coins and XP
    if (g.coinsEarned > 0) setCoins(c => c + g.coinsEarned);
    const xpEarned = Math.floor(g.blocksPlaced / 5) + g.echoBlocksFound * 3;
    if (xpEarned > 0) setXp(x => x + xpEarned);

    setDisplayCoins(g.coinsEarned);
  }

  const handleRestart = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const newState = createInitialState();
    newState.bestScore = gameRef.current.bestScore;
    Object.assign(gameRef.current, newState);
    setPhase('start');
    setDisplayCoins(0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg,${ET.BG_TOP},${ET.BG_BOTTOM})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, position: 'relative', fontFamily: 'Nunito,sans-serif',
    }}>
      <FloatingParticles />
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: ET.CANVAS_W, justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 50,
            padding: '8px 18px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: 'white' }}>🏗️ Echo Towers</div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white', borderRadius: 50,
            padding: '6px 14px', fontFamily: "'Fredoka One',cursive", fontSize: 14,
          }}>🪙 {coins + displayCoins}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={ET.CANVAS_W}
            height={ET.CANVAS_H}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouch}
            style={{
              borderRadius: 16, border: '3px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              touchAction: 'none',
            }}
          />
          {phase === 'results' && (
            <div style={{
              position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 16, zIndex: 10,
            }}>
              <button onClick={handleRestart} style={{
                background: 'linear-gradient(135deg,#F5A623,#FFA500)', color: '#1a1a2e', border: 'none',
                borderRadius: 50, padding: '12px 28px', cursor: 'pointer',
                fontFamily: "'Fredoka One',cursive", fontSize: 16, fontWeight: 'bold',
              }}>BUILD AGAIN</button>
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
          Keys 1-7 or click columns to place blocks • Build on the beat!
        </div>
      </div>
    </div>
  );
}

// ─── DRAW ────────────────────────────────────────────────────────────────────

function drawFrame(ctx, g, timestamp) {
  const W = ET.CANVAS_W;
  const H = ET.CANVAS_H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, ET.BG_TOP);
  grad.addColorStop(1, ET.BG_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (const star of g.stars) {
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Grid lines
  ctx.strokeStyle = ET.GRID_LINE_COLOR;
  ctx.lineWidth = 1;
  for (let c = 0; c <= ET.COLS; c++) {
    const x = ET.GRID_X_OFFSET + c * (ET.BLOCK_SIZE + ET.GRID_GAP) - ET.GRID_GAP / 2;
    ctx.beginPath();
    ctx.moveTo(x, ET.HUD_TOP_H);
    ctx.lineTo(x, ET.GROUND_Y);
    ctx.stroke();
  }

  // Ground line
  const groundPulse = g.beatPulse * 3;
  ctx.fillStyle = g.beatPulse > 0.5 ? ET.GROUND_PULSE_COLOR : ET.GROUND_COLOR;
  ctx.fillRect(0, ET.GROUND_Y - groundPulse, W, 4 + groundPulse * 2);

  // Draw placed blocks
  for (let row = 0; row < ET.ROWS; row++) {
    for (let col = 0; col < ET.COLS; col++) {
      if (!g.grid[row][col]) continue;

      const bx = getColumnX(col);
      let by = getRowY(row);

      // Check drop animation
      const dropAnim = g.dropAnims.find(d => d.col === col && d.row === row);
      let squash = 1;
      if (dropAnim) {
        const elapsed = timestamp - dropAnim.startTime;
        const progress = Math.min(1, elapsed / ET.DROP_DURATION_MS);
        // Ease out bounce
        const eased = 1 - Math.pow(1 - progress, 3);
        const dropFrom = ET.HUD_TOP_H;
        by = dropFrom + (by - dropFrom) * eased;
        // Squash at landing
        if (progress > 0.8) {
          const squashProgress = (progress - 0.8) / 0.2;
          squash = 1 - 0.15 * Math.sin(squashProgress * Math.PI);
        }
      }

      const colorIdx = g.blockColors[row][col];
      const baseColor = ET.COLUMN_COLORS[colorIdx >= 0 ? colorIdx : col];

      // Block body
      ctx.save();
      ctx.translate(bx + ET.BLOCK_SIZE / 2, by + ET.BLOCK_SIZE / 2);
      ctx.scale(1, squash);
      ctx.translate(-(bx + ET.BLOCK_SIZE / 2), -(by + ET.BLOCK_SIZE / 2));

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
      ctx.fill();

      // Minecraft-style pixel texture (4x4 grid)
      const cellSize = ET.BLOCK_SIZE / 4;
      for (let px = 0; px < 4; px++) {
        for (let py = 0; py < 4; py++) {
          const variation = (Math.sin(px * 7 + py * 13 + col * 3 + row * 5) * 0.5 + 0.5) * 0.2 - 0.1;
          if (variation > 0) {
            ctx.fillStyle = lightenColor(baseColor, variation);
          } else {
            ctx.fillStyle = darkenColor(baseColor, 1 + variation);
          }
          ctx.fillRect(bx + px * cellSize, by + py * cellSize, cellSize, cellSize);
        }
      }

      // Border
      ctx.strokeStyle = darkenColor(baseColor, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
      ctx.stroke();

      // On-beat glow
      if (g.onBeat[row][col]) {
        ctx.fillStyle = ET.ON_BEAT_GLOW;
        ctx.beginPath();
        ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
        ctx.fill();

        // Outer glow
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx - 2, by - 2, ET.BLOCK_SIZE + 4, ET.BLOCK_SIZE + 4, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Playback highlight
      if (g.phase === 'playback' && row === g.playbackRow - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Cursor preview (during playing phase)
  if (g.phase === 'playing') {
    const cursorRow = getLowestOpenRowForDraw(g, g.cursorCol);
    if (cursorRow >= 0) {
      const bx = getColumnX(g.cursorCol);
      const by = getRowY(cursorRow);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = ET.COLUMN_COLORS[g.cursorCol];
      ctx.beginPath();
      ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, ET.BLOCK_SIZE, ET.BLOCK_SIZE, 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // HUD
  drawHUD(ctx, g, timestamp);

  // Particles
  for (const p of g.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    if (p.type === 'flash') {
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;

  // Floating texts
  for (const ft of g.floatingTexts) {
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = "bold 16px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;

  // Screen edge pulse in last 5 seconds
  if (g.phase === 'playing' && g.timer <= 5) {
    const pulse = Math.sin(timestamp * 0.01) * 0.2 + 0.2;
    ctx.fillStyle = `rgba(255,80,40,${pulse})`;
    ctx.fillRect(0, 0, 6, H);
    ctx.fillRect(W - 6, 0, 6, H);
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
  }

  // Start screen
  if (g.phase === 'start') {
    drawStartScreen(ctx, g, timestamp);
  }

  // Results screen
  if (g.phase === 'results') {
    drawResultsScreen(ctx, g, timestamp);
  }
}

function getLowestOpenRowForDraw(g, col) {
  for (let row = 0; row < ET.ROWS; row++) {
    if (!g.grid[row][col]) return row;
  }
  return -1;
}

function drawHUD(ctx, g, timestamp) {
  const W = ET.CANVAS_W;

  // Top bar background
  ctx.fillStyle = 'rgba(15,15,27,0.8)';
  ctx.fillRect(0, 0, W, ET.HUD_TOP_H);

  // Score
  ctx.fillStyle = ET.SCORE_COLOR;
  ctx.font = "bold 18px 'Fredoka One', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`${g.score}`, 12, 24);

  // Multiplier
  if (g.multiplier > 1.0) {
    ctx.fillStyle = ET.MULTIPLIER_COLOR;
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillText(`×${g.multiplier.toFixed(2)}`, 12, 44);
  }

  // Timer
  if (g.phase === 'playing') {
    const timerColor = g.timer <= 5 ? '#FF4757' : g.timer <= 15 ? '#FFA500' : ET.HUD_TEXT;
    ctx.fillStyle = timerColor;
    ctx.font = "bold 20px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(g.timer)}`, W / 2, 24);

    // BPM indicator
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = "11px sans-serif";
    ctx.fillText(`${g.bpm} BPM`, W / 2, 42);
  }

  // Beat pulse indicator
  const beatScale = 1 + g.beatPulse * 0.4;
  ctx.save();
  ctx.translate(W / 2 + 50, 20);
  ctx.scale(beatScale, beatScale);
  ctx.fillStyle = g.beatPulse > 0.5 ? '#FFD700' : 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Streak
  if (g.streak > 1) {
    ctx.fillStyle = '#FFA500';
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`🔥${g.streak}`, W - 12, 24);
  }

  // Melody history dots
  ctx.textAlign = 'right';
  const dotY = 46;
  const dotSize = 8;
  const dotGap = 4;
  const totalDotsW = ET.MELODY_HISTORY_SIZE * (dotSize + dotGap) - dotGap;
  const dotsStartX = W - 12 - totalDotsW;
  for (let i = 0; i < ET.MELODY_HISTORY_SIZE; i++) {
    const dx = dotsStartX + i * (dotSize + dotGap);
    if (i < g.melodyHistory.length) {
      const noteCol = g.melodyHistory[g.melodyHistory.length - ET.MELODY_HISTORY_SIZE + i];
      if (noteCol !== undefined) {
        ctx.fillStyle = ET.COLUMN_COLORS[noteCol];
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
    }
    ctx.beginPath();
    ctx.arc(dx + dotSize / 2, dotY, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Echo sequence hints (purple dots below melody)
  if (g.phase === 'playing' && g.echoSequences.length > 0) {
    const seq = g.echoSequences[0]; // show first target
    const seqY = dotY + 14;
    ctx.fillStyle = 'rgba(167,139,250,0.5)';
    ctx.font = "9px sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('echo:', dotsStartX - 6, seqY + 3);
    for (let i = 0; i < seq.length; i++) {
      const sx = dotsStartX + i * (dotSize + dotGap);
      ctx.fillStyle = 'rgba(167,139,250,0.6)';
      ctx.beginPath();
      ctx.arc(sx + dotSize / 2, seqY, dotSize / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Column labels at bottom
  if (g.phase === 'playing' || g.phase === 'start') {
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = 'center';
    for (let c = 0; c < ET.COLS; c++) {
      const x = getColumnX(c) + ET.BLOCK_SIZE / 2;
      ctx.fillStyle = ET.COLUMN_COLORS[c];
      ctx.fillText(ET.NOTE_NAMES[c], x, ET.GROUND_Y + 18);
    }
  }
}

function drawStartScreen(ctx, g, timestamp) {
  const W = ET.CANVAS_W;
  const H = ET.CANVAS_H;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Tower icon
  const tapPulse = 1 + Math.sin(timestamp * 0.005) * 0.15;
  ctx.save();
  ctx.translate(W / 2, 260);
  ctx.scale(tapPulse, tapPulse);
  ctx.font = "48px sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('🏗️', 0, 10);
  ctx.restore();

  ctx.fillStyle = 'white';
  ctx.font = "bold 28px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('Echo Towers', W / 2, 330);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = "14px sans-serif";
  ctx.fillText('Build musical towers on the beat!', W / 2, 360);

  // Pulsing TAP TO BUILD
  const tapAlpha = 0.5 + Math.sin(timestamp * 0.006) * 0.5;
  ctx.fillStyle = `rgba(245,166,35,${tapAlpha})`;
  ctx.font = "bold 20px 'Fredoka One', sans-serif";
  ctx.fillText('TAP TO BUILD', W / 2, 410);

  if (g.bestScore > 0) {
    ctx.fillStyle = ET.SCORE_COLOR;
    ctx.font = "bold 14px 'Fredoka One', sans-serif";
    ctx.fillText(`BEST: ${g.bestScore}`, W / 2, 450);
  }

  // Column color preview
  const previewY = 490;
  ctx.font = "12px sans-serif";
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('7 musical columns', W / 2, previewY - 10);
  for (let c = 0; c < ET.COLS; c++) {
    const px = W / 2 - (ET.COLS * 20) / 2 + c * 20;
    ctx.fillStyle = ET.COLUMN_COLORS[c];
    ctx.fillRect(px, previewY, 16, 16);
  }
}

function drawResultsScreen(ctx, g) {
  const W = ET.CANVAS_W;
  const H = ET.CANVAS_H;

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = ET.SCORE_COLOR;
  ctx.font = "bold 26px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('TOWER COMPLETE!', W / 2, 60);

  // Score
  ctx.fillStyle = 'white';
  ctx.font = "bold 36px 'Fredoka One', sans-serif";
  ctx.fillText(`${g.score}`, W / 2, 110);

  if (g.score >= g.bestScore) {
    ctx.fillStyle = '#FFD700';
    ctx.font = "bold 14px sans-serif";
    ctx.fillText('NEW PERSONAL BEST!', W / 2, 135);
  }

  // Stats
  const statsY = 170;
  const lineH = 30;
  ctx.font = "16px 'Fredoka One', sans-serif";
  ctx.textAlign = 'left';
  const leftX = W / 2 - 100;

  const stats = [
    ['Tower Height', `${g.towerHeight || 0} rows`],
    ['Notes Played', `${g.blocksPlaced}`],
    ['Echo Blocks', `${g.echoBlocksFound}`],
    ['Best Streak', `🔥 ${g.bestStreak}`],
  ];

  stats.forEach(([label, value], i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, statsY + i * lineH);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(value, W / 2 + 100, statsY + i * lineH);
  });

  // Melody Rating
  const ratingY = statsY + stats.length * lineH + 15;
  const rating = g.melodyRating || 1;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = "16px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('Melody Rating', W / 2, ratingY);

  ctx.font = "24px sans-serif";
  let starsStr = '';
  for (let i = 0; i < 5; i++) {
    starsStr += i < rating ? '⭐' : '☆';
  }
  ctx.fillText(starsStr, W / 2, ratingY + 30);

  // Coins earned
  const coinsY = ratingY + 60;
  ctx.fillStyle = ET.SCORE_COLOR;
  ctx.font = "bold 20px 'Fredoka One', sans-serif";
  ctx.fillText(`🪙 +${g.coinsEarned} coins`, W / 2, coinsY);

  // XP
  const xpEarned = Math.floor(g.blocksPlaced / 5) + g.echoBlocksFound * 3;
  ctx.fillStyle = '#A78BFA';
  ctx.font = "bold 16px 'Fredoka One', sans-serif";
  ctx.fillText(`+${xpEarned} XP`, W / 2, coinsY + 30);

  // Prompt
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = "14px sans-serif";
  ctx.fillText('Beat your record?', W / 2, coinsY + 70);
}
