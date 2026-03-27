import { useState, useEffect, useRef, useCallback } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { OBBY } from '../utils/constants.js';
import { playObbySound, resumeAudioCtx } from '../utils/audio.js';

// ─── ENHANCED CONSTANTS ──────────────────────────────────────────────────────
const CW = 800;
const CH = 500;
const GROUND_Y_POS = CH - 80;
const GRAVITY = 0.52;
const JUMP_FORCE = -12;
const BASE_SPEED = 3.8;
const SPEED_INCREMENT = 0.4;
const SPEED_SCORE_INTERVAL = 500;
const INITIAL_LIVES = 3;
const MAX_LIVES = 3;
const INVINCIBILITY_FRAMES = 90;
const BEAT_FRAMES_PER_BEAT = 30;
const BEAT_TIMING_WINDOW = 5;

// Player dimensions
const PW = 36;
const PH = 48;

// Colors
const PALETTE = {
  skyTop: '#0B0B2B',
  skyMid: '#1A1145',
  skyBot: '#3D1F7A',
  ground: '#1E1040',
  groundLine: '#6C5CE7',
  groundAccent: '#A29BFE',
  neonPink: '#FF6B9D',
  neonBlue: '#00D4FF',
  neonPurple: '#A855F7',
  neonGold: '#FFD700',
  neonGreen: '#00FF88',
  coinInner: '#FFAA00',
  coinOuter: '#FFD700',
  heartRed: '#FF4757',
  white: '#FFFFFF',
  textShadow: '#000000',
};

// Obstacle color themes
const OBS_THEMES = [
  { main: '#FF6B6B', light: '#FF9B9B', dark: '#CC4444', glow: 'rgba(255,107,107,0.4)' },
  { main: '#E17055', light: '#F0A090', dark: '#B34A2E', glow: 'rgba(225,112,85,0.4)' },
  { main: '#D63031', light: '#F06060', dark: '#A01515', glow: 'rgba(214,48,49,0.4)' },
  { main: '#FF7675', light: '#FFA0A0', dark: '#CC5555', glow: 'rgba(255,118,117,0.4)' },
  { main: '#74B9FF', light: '#A8D8FF', dark: '#3A8AE0', glow: 'rgba(116,185,255,0.4)' },
  { main: '#A29BFE', light: '#C8C0FF', dark: '#7A70D0', glow: 'rgba(162,155,254,0.4)' },
];

// Parallax star layers
function generateStars(count, speedFactor) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * CW * 2,
      y: Math.random() * (GROUND_Y_POS - 40),
      size: 0.5 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: speedFactor,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

// Mountain generation
function generateMountains(count, baseY, maxH, color) {
  const mts = [];
  const spacing = (CW * 2) / count;
  for (let i = 0; i < count + 2; i++) {
    mts.push({
      x: i * spacing + (Math.random() - 0.5) * spacing * 0.5,
      h: maxH * (0.5 + Math.random() * 0.5),
      w: 100 + Math.random() * 160,
      color,
    });
  }
  return mts;
}

function createInitialGameState() {
  return {
    player: { x: 100, y: GROUND_Y_POS, vy: 0, jumping: false, grounded: true, runFrame: 0 },
    obstacles: [],
    particles: [],
    coins: [],
    score: 0,
    coinsCollected: 0,
    speed: BASE_SPEED,
    frame: 0,
    gameOver: false,
    started: false,
    beatPhase: 0,
    lives: INITIAL_LIVES,
    invincible: 0,
    magnetTimer: 0,
    combo: 0,
    highScore: parseInt(localStorage.getItem(OBBY.HIGH_SCORE_KEY) || '0'),
    floatingTexts: [],
    beatBorderFlash: 0,
    lastCheckpointScore: 0,
    screenShake: 0,
    screenShakeX: 0,
    screenShakeY: 0,
    // Parallax layers
    stars1: generateStars(40, 0.1),
    stars2: generateStars(25, 0.3),
    mountains1: generateMountains(6, GROUND_Y_POS, 180, 'rgba(30,10,60,0.6)'),
    mountains2: generateMountains(8, GROUND_Y_POS, 120, 'rgba(50,20,90,0.5)'),
    cloudX: 0,
    // Distance tracking
    distance: 0,
    distanceMarkers: [],
    // Beat bar
    beatBarGlow: 0,
    // Speed lines
    speedLines: [],
    // Trail particles
    trailTimer: 0,
    // Game over animation
    gameOverTimer: 0,
    // Start screen pulse
    startPulse: 0,
  };
}

export default function ObbyRush({ avatar, onBack, coins, setCoins, setXp }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createInitialGameState());
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayLives, setDisplayLives] = useState(INITIAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(null);
  const avatarRef = useRef(avatar);
  const landedOnRef = useRef(new Set());

  const jump = useCallback(() => {
    const g = gameRef.current;
    resumeAudioCtx();
    if (g.gameOver) {
      const hs = g.highScore;
      Object.assign(g, createInitialGameState());
      g.highScore = hs;
      g.started = true;
      landedOnRef.current.clear();
      setGameOver(false); setStarted(true);
      setDisplayScore(0); setDisplayCoins(0); setDisplayLives(INITIAL_LIVES);
      return;
    }
    if (!g.started) { g.started = true; setStarted(true); }
    if (g.player.grounded) {
      const beatFrame = g.frame % BEAT_FRAMES_PER_BEAT;
      const isOnBeat = beatFrame <= BEAT_TIMING_WINDOW || beatFrame >= (BEAT_FRAMES_PER_BEAT - BEAT_TIMING_WINDOW);

      if (isOnBeat && g.started && !g.gameOver) {
        g.player.vy = JUMP_FORCE * 1.2;
        playObbySound('beatJump');
        g.beatBorderFlash = 20;
        g.beatBarGlow = 30;
        g.floatingTexts.push({
          x: g.player.x + PW / 2, y: g.player.y - 20,
          text: '♪ ON BEAT!', color: PALETTE.neonGold, life: 50, maxLife: 50, size: 18,
        });
        // Beat jump burst particles
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          g.particles.push({
            x: g.player.x + PW / 2, y: g.player.y + PH,
            vx: Math.cos(angle) * 4 + (Math.random() - 0.5) * 2,
            vy: Math.sin(angle) * 4 - 2,
            life: 25 + Math.random() * 15,
            color: Math.random() > 0.5 ? PALETTE.neonGold : PALETTE.neonPurple,
            size: 2 + Math.random() * 3,
            type: 'burst',
          });
        }
      } else {
        g.player.vy = JUMP_FORCE;
        playObbySound('jump');
      }
      g.player.jumping = true;
      g.player.grounded = false;

      // Jump dust
      for (let i = 0; i < 5; i++) {
        g.particles.push({
          x: g.player.x + PW / 2 + (Math.random() - 0.5) * 20,
          y: g.player.y + PH,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 2,
          life: 15 + Math.random() * 10,
          color: 'rgba(255,255,255,0.5)',
          size: 3 + Math.random() * 4,
          type: 'dust',
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleKey = e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

  useEffect(() => { avatarRef.current = avatar; }, [avatar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const spawnObstacle = () => {
      const g = gameRef.current;
      const themeIdx = Math.floor(Math.random() * OBS_THEMES.length);
      const theme = OBS_THEMES[themeIdx];

      // Gap obstacle
      if (g.score > 500 && Math.random() < 0.12) {
        const gapX = CW + 20;
        g.obstacles.push({ x: gapX, y: GROUND_Y_POS - 36, w: 24, h: 36, theme, isGap: true });
        g.obstacles.push({ x: gapX, y: GROUND_Y_POS - 120, w: 24, h: 30, theme, isGap: true });
        if (Math.random() > 0.3) {
          g.coins.push({ x: gapX + 4, y: GROUND_Y_POS - 78, w: 16, h: 16, collected: false });
        }
        return;
      }

      // Normal obstacles with variety
      const types = [
        { w: 32, h: 42 },
        { w: 26, h: 60 },
        { w: 46, h: 34 },
        { w: 22, h: 50 },
        { w: 38, h: 46 },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      const obs = { x: CW + 20, y: GROUND_Y_POS - t.h, w: t.w, h: t.h, theme };

      // Moving obstacle
      if (g.score > 300 && Math.random() < 0.18) {
        obs.moving = true;
        obs.baseY = obs.y;
        obs.movePhase = Math.random() * Math.PI * 2;
        obs.theme = OBS_THEMES[4]; // Blue for moving
      }

      g.obstacles.push(obs);

      // Coins
      if (Math.random() < 0.55) {
        const coinY = GROUND_Y_POS - t.h - 45;
        g.coins.push({ x: CW + 20 + t.w / 2 - 8, y: coinY, w: 16, h: 16, collected: false });
        // Sometimes spawn a line of coins
        if (Math.random() < 0.25) {
          for (let i = 1; i < 3; i++) {
            g.coins.push({
              x: CW + 20 + t.w / 2 - 8 + i * 30,
              y: coinY - i * 10,
              w: 16, h: 16, collected: false,
            });
          }
        }
      }

      // Heart
      if (g.lives < MAX_LIVES && Math.random() < 0.06) {
        g.coins.push({ x: CW + 60, y: GROUND_Y_POS - t.h - 70, w: 18, h: 18, collected: false, isHeart: true });
      }

      // Magnet
      if (g.score > 200 && Math.random() < 0.025) {
        g.coins.push({ x: CW + 80, y: GROUND_Y_POS - t.h - 60, w: 18, h: 18, collected: false, isMagnet: true });
      }
    };

    const loop = () => {
      const g = gameRef.current;
      g.frame++;
      g.beatPhase = (g.frame % BEAT_FRAMES_PER_BEAT) / BEAT_FRAMES_PER_BEAT;
      g.startPulse += 0.03;

      if (g.started && !g.gameOver) {
        g.speed = BASE_SPEED + Math.floor(g.score / SPEED_SCORE_INTERVAL) * SPEED_INCREMENT;
        g.distance += g.speed;

        // Player run animation
        if (g.player.grounded) g.player.runFrame += 0.15;

        // Player physics
        g.player.vy += GRAVITY;
        g.player.y += g.player.vy;
        if (g.player.y >= GROUND_Y_POS) {
          // Landing particles
          if (g.player.jumping && g.player.vy > 3) {
            for (let i = 0; i < 4; i++) {
              g.particles.push({
                x: g.player.x + PW / 2 + (Math.random() - 0.5) * 16,
                y: GROUND_Y_POS + PH,
                vx: (Math.random() - 0.5) * 4,
                vy: -1 - Math.random() * 1.5,
                life: 12 + Math.random() * 8,
                color: 'rgba(162,155,254,0.6)',
                size: 3 + Math.random() * 3,
                type: 'dust',
              });
            }
          }
          g.player.y = GROUND_Y_POS;
          g.player.vy = 0;
          g.player.grounded = true;
          g.player.jumping = false;
        }

        // Trail particles while running
        g.trailTimer++;
        if (g.trailTimer % 3 === 0 && g.player.grounded) {
          g.particles.push({
            x: g.player.x + PW / 2 + (Math.random() - 0.5) * 6,
            y: g.player.y + PH - 2,
            vx: -g.speed * 0.3,
            vy: -0.3 - Math.random() * 0.5,
            life: 10 + Math.random() * 5,
            color: `rgba(162,155,254,${0.2 + Math.random() * 0.2})`,
            size: 2 + Math.random() * 2,
            type: 'trail',
          });
        }

        // Speed lines at high speed
        if (g.speed > 5 && g.frame % 2 === 0) {
          g.speedLines.push({
            x: CW + 10,
            y: 30 + Math.random() * (GROUND_Y_POS - 60),
            len: 40 + Math.random() * 80,
            life: 8 + Math.random() * 4,
            maxLife: 12,
          });
        }

        // Checkpoint
        const cp = Math.floor(g.score / OBBY.CHECKPOINT_SCORE_INTERVAL) * OBBY.CHECKPOINT_SCORE_INTERVAL;
        if (cp > 0 && cp > g.lastCheckpointScore && g.score - cp < 2) {
          g.lastCheckpointScore = cp;
          g.obstacles.push({
            x: CW + 20, y: GROUND_Y_POS - 24, w: 70, h: 24,
            theme: OBS_THEMES[0], isCheckpoint: true, claimed: false,
          });
        }

        // Spawn obstacles
        const spawnInterval = Math.max(55, 85 - Math.floor(g.score / 200) * 4);
        if (g.frame % spawnInterval === 0) spawnObstacle();

        // Move obstacles
        g.obstacles.forEach(o => {
          o.x -= g.speed;
          if (o.moving) o.y = o.baseY + Math.sin(g.frame * 0.04 + o.movePhase) * 28;
        });
        g.obstacles = g.obstacles.filter(o => o.x + o.w > -30);

        // Move coins
        g.coins.forEach(c => { c.x -= g.speed; });
        g.coins = g.coins.filter(c => c.x + c.w > -20 && !c.collected);

        // Invincibility
        if (g.invincible > 0) g.invincible--;

        // Magnet
        if (g.magnetTimer > 0) {
          g.magnetTimer--;
          for (const c of g.coins) {
            if (!c.collected && !c.isHeart && !c.isMagnet) {
              const dist = Math.hypot((c.x + 8) - (g.player.x + PW / 2), (c.y + 8) - (g.player.y + PH / 2));
              if (dist < 160) {
                c.x += (g.player.x + PW / 2 - c.x - 8) * 0.12;
                c.y += (g.player.y + PH / 2 - c.y - 8) * 0.12;
              }
            }
          }
        }

        // Collision
        const px = g.player.x + 6;
        const py = g.player.y + 4;
        const pw = PW - 12;
        const ph = PH - 8;

        for (const o of g.obstacles) {
          if (o.isCheckpoint) {
            if (!o.claimed && o.x < g.player.x + PW) {
              o.claimed = true;
              g.coinsCollected += OBBY.CHECKPOINT_COINS;
              playObbySound('checkpoint');
              g.beatBorderFlash = 30;
              for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 * i) / 16;
                g.particles.push({
                  x: o.x + o.w / 2, y: o.y,
                  vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5 - 2,
                  life: 30, color: PALETTE.neonGold, size: 3 + Math.random() * 3, type: 'burst',
                });
              }
              g.floatingTexts.push({
                x: o.x + o.w / 2, y: o.y - 25,
                text: `♪ CHECKPOINT +${OBBY.CHECKPOINT_COINS}`, color: PALETTE.neonGold,
                life: 60, maxLife: 60, size: 16,
              });
            }
            continue;
          }

          if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
            const playerBottom = py + ph;
            const landingZone = o.y + 12;

            if (playerBottom <= landingZone && g.player.vy >= 0) {
              g.player.y = o.y - PH + 4;
              g.player.vy = 0;
              g.player.grounded = true;
              g.player.jumping = false;
              if (!landedOnRef.current.has(o)) {
                landedOnRef.current.add(o);
                g.score += OBBY.LANDING_BONUS_SCORE;
                playObbySound('land');
                for (let i = 0; i < 6; i++) {
                  g.particles.push({
                    x: px + pw / 2 + (Math.random() - 0.5) * 20, y: o.y,
                    vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2,
                    life: 15, color: PALETTE.neonGreen, size: 3 + Math.random() * 3, type: 'burst',
                  });
                }
              }
              continue;
            }

            if (g.invincible > 0) continue;
            g.combo = 0;
            g.lives--;
            setDisplayLives(g.lives);
            playObbySound('hit');
            g.screenShake = 12;

            // Hit burst
            for (let i = 0; i < 14; i++) {
              g.particles.push({
                x: g.player.x + PW / 2, y: g.player.y + PH / 2,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                life: 25 + Math.random() * 15,
                color: [PALETTE.neonPink, PALETTE.neonGold, PALETTE.neonPurple][Math.floor(Math.random() * 3)],
                size: 3 + Math.random() * 5, type: 'burst',
              });
            }

            if (g.lives <= 0) {
              g.gameOver = true;
              g.gameOverTimer = 0;
              setGameOver(true);
              playObbySound('death');
              g.screenShake = 25;

              // Death explosion
              for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                g.particles.push({
                  x: g.player.x + PW / 2, y: g.player.y + PH / 2,
                  vx: Math.cos(angle) * (3 + Math.random() * 6),
                  vy: Math.sin(angle) * (3 + Math.random() * 6) - 3,
                  life: 40 + Math.random() * 30,
                  color: [PALETTE.neonPink, PALETTE.neonGold, PALETTE.neonPurple, PALETTE.neonBlue][Math.floor(Math.random() * 4)],
                  size: 3 + Math.random() * 6, type: 'burst',
                });
              }

              if (g.score > g.highScore) {
                g.highScore = g.score;
                localStorage.setItem(OBBY.HIGH_SCORE_KEY, g.score.toString());
              }
              if (g.coinsCollected > 0) setCoins(c => c + g.coinsCollected);
              const xpEarned = Math.floor(g.score / OBBY.XP_PER_SCORE_UNIT);
              if (xpEarned > 0) setXp(x => x + xpEarned);
            } else {
              g.invincible = INVINCIBILITY_FRAMES;
              g.player.vy = JUMP_FORCE * 0.7;
              g.player.grounded = false;
            }
            break;
          }
        }

        // Coin collection
        for (const c of g.coins) {
          if (!c.collected &&
            px < c.x + c.w + 14 && px + pw > c.x - 14 &&
            py < c.y + c.h + 14 && py + ph > c.y - 14
          ) {
            c.collected = true;
            if (c.isMagnet) {
              g.magnetTimer = 300;
              playObbySound('magnet');
              for (let i = 0; i < 10; i++) {
                g.particles.push({
                  x: c.x + 9, y: c.y + 9,
                  vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                  life: 20, color: PALETTE.neonBlue, size: 3 + Math.random() * 4, type: 'burst',
                });
              }
            } else if (c.isHeart) {
              g.lives = Math.min(MAX_LIVES, g.lives + 1);
              setDisplayLives(g.lives);
              playObbySound('heart');
              for (let i = 0; i < 8; i++) {
                g.particles.push({
                  x: c.x + 9, y: c.y + 9,
                  vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                  life: 20, color: PALETTE.heartRed, size: 3 + Math.random() * 4, type: 'burst',
                });
              }
            } else {
              g.combo++;
              g.coinsCollected += 1 + Math.floor(g.combo / 5);
              playObbySound('coin', g.combo);
              for (let i = 0; i < 6; i++) {
                g.particles.push({
                  x: c.x + 8, y: c.y + 8,
                  vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3,
                  life: 18, color: PALETTE.neonGold, size: 2 + Math.random() * 3, type: 'burst',
                });
              }
            }
          }
        }

        g.score++;
        if (g.frame % 4 === 0) {
          setDisplayScore(g.score);
          setDisplayCoins(g.coinsCollected);
        }
      }

      // Game over timer
      if (g.gameOver) g.gameOverTimer++;

      // Screen shake
      if (g.screenShake > 0) {
        g.screenShake--;
        g.screenShakeX = (Math.random() - 0.5) * g.screenShake * 0.8;
        g.screenShakeY = (Math.random() - 0.5) * g.screenShake * 0.8;
      } else {
        g.screenShakeX = 0;
        g.screenShakeY = 0;
      }

      // Update particles
      g.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.type !== 'trail') p.vy += 0.12;
      });
      g.particles = g.particles.filter(p => p.life > 0);

      // Update floating texts
      g.floatingTexts.forEach(ft => { ft.life--; ft.y -= 0.9; });
      g.floatingTexts = g.floatingTexts.filter(ft => ft.life > 0);

      // Update speed lines
      g.speedLines.forEach(sl => { sl.x -= g.speed * 3; sl.life--; });
      g.speedLines = g.speedLines.filter(sl => sl.life > 0);

      // Beat effects
      if (g.beatBorderFlash > 0) g.beatBorderFlash--;
      if (g.beatBarGlow > 0) g.beatBarGlow--;

      drawFrame(ctx, g, avatarRef.current);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [setCoins, setXp]);

  const handleTap = () => {
    const g = gameRef.current;
    if (g.gameOver) {
      const hs = g.highScore;
      Object.assign(g, createInitialGameState());
      g.highScore = hs;
      g.started = true;
      landedOnRef.current.clear();
      setGameOver(false); setStarted(true);
      setDisplayScore(0); setDisplayCoins(0); setDisplayLives(INITIAL_LIVES);
    } else {
      jump();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#0B0B2B 0%,#1A1145 40%,#3D1F7A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, position: 'relative', fontFamily: 'Nunito,sans-serif',
    }}>
      <FloatingParticles />
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: CW, justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50,
            padding: '8px 20px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
            backdropFilter: 'blur(10px)', transition: 'all 0.2s',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 24, color: 'white', textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
            🏃 Obby Rush
          </div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#1a0533', borderRadius: 50,
            padding: '7px 16px', fontFamily: "'Fredoka One',cursive", fontSize: 15, fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(255,165,0,0.4)',
          }}>🪙 {coins + displayCoins}</div>
        </div>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          onClick={handleTap}
          onTouchStart={e => { e.preventDefault(); handleTap(); }}
          style={{
            borderRadius: 16,
            border: '2px solid rgba(168,85,247,0.3)',
            cursor: 'pointer',
            maxWidth: '100%',
            boxShadow: '0 0 40px rgba(108,92,231,0.3), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
          Tap / Space / ↑ to jump • Land on blocks for bonus points • Jump on the beat for extra power
        </div>
      </div>
    </div>
  );
}

// ─── DRAW ────────────────────────────────────────────────────────────────────
function drawFrame(ctx, g, avatar) {
  ctx.save();
  ctx.translate(g.screenShakeX, g.screenShakeY);

  // ─── SKY ───
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CH);
  // Shift sky color based on score for progression feel
  const progression = Math.min(1, g.score / 3000);
  const r = Math.floor(11 + progression * 20);
  const gb = Math.floor(11 + progression * 5);
  const b2 = Math.floor(43 + progression * 30);
  skyGrad.addColorStop(0, `rgb(${r},${gb},${b2})`);
  skyGrad.addColorStop(0.5, PALETTE.skyMid);
  skyGrad.addColorStop(1, PALETTE.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CW, CH);

  // ─── STARS (parallax layer 1 — far) ───
  g.stars1.forEach(s => {
    s.x -= g.speed * s.speed;
    if (s.x < -5) s.x += CW * 2;
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(g.frame * 0.02 + s.twinkle));
    ctx.globalAlpha = twinkle * s.brightness;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ─── STARS (parallax layer 2 — closer) ───
  g.stars2.forEach(s => {
    s.x -= g.speed * s.speed;
    if (s.x < -5) s.x += CW * 2;
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(g.frame * 0.03 + s.twinkle));
    ctx.globalAlpha = twinkle * s.brightness;
    ctx.fillStyle = s.brightness > 0.8 ? '#E8DAFF' : '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ─── MOUNTAINS (far) ───
  g.mountains1.forEach(m => {
    m.x -= g.speed * 0.15;
    if (m.x + m.w < -50) m.x += CW * 2 + m.w;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(m.x - m.w / 2, GROUND_Y_POS + 10);
    ctx.lineTo(m.x, GROUND_Y_POS + 10 - m.h);
    ctx.lineTo(m.x + m.w / 2, GROUND_Y_POS + 10);
    ctx.closePath();
    ctx.fill();
  });

  // ─── MOUNTAINS (near) ───
  g.mountains2.forEach(m => {
    m.x -= g.speed * 0.3;
    if (m.x + m.w < -50) m.x += CW * 2 + m.w;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(m.x - m.w / 2, GROUND_Y_POS + 10);
    ctx.lineTo(m.x, GROUND_Y_POS + 10 - m.h);
    ctx.lineTo(m.x + m.w / 2, GROUND_Y_POS + 10);
    ctx.closePath();
    ctx.fill();
  });

  // ─── SPEED LINES ───
  g.speedLines.forEach(sl => {
    const alpha = sl.life / sl.maxLife;
    ctx.globalAlpha = alpha * 0.25;
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sl.x, sl.y);
    ctx.lineTo(sl.x + sl.len, sl.y);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // ─── BEAT REACTIVE PULSE ───
  const beatSin = Math.sin(g.beatPhase * Math.PI);
  if (beatSin > 0.7) {
    const pulseAlpha = (beatSin - 0.7) * 0.3;
    ctx.fillStyle = `rgba(168,85,247,${pulseAlpha})`;
    ctx.fillRect(0, GROUND_Y_POS - 6, CW, 12);
  }

  // ─── GROUND ───
  // Main ground fill
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y_POS, 0, CH);
  groundGrad.addColorStop(0, '#2A1550');
  groundGrad.addColorStop(1, '#0E0620');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y_POS + PH, CW, CH - GROUND_Y_POS - PH);

  // Ground neon line
  const beatPeak = g.beatPhase < 0.12 || g.beatPhase > 0.88;
  ctx.strokeStyle = beatPeak ? PALETTE.neonPurple : PALETTE.groundLine;
  ctx.lineWidth = beatPeak ? 3 : 2;
  ctx.shadowColor = PALETTE.neonPurple;
  ctx.shadowBlur = beatPeak ? 16 : 6;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y_POS + PH);
  ctx.lineTo(CW, GROUND_Y_POS + PH);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ground grid lines (perspective feel)
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = PALETTE.groundAccent;
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const gx = ((i * 50) - (g.frame * g.speed) % 50 + CW) % CW;
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y_POS + PH);
    ctx.lineTo(gx, CH);
    ctx.stroke();
  }
  // Horizontal grid lines
  for (let i = 1; i < 4; i++) {
    const gy = GROUND_Y_POS + PH + i * 20;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CW, gy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ─── DISTANCE MARKERS ───
  if (g.started && !g.gameOver) {
    const distMarker = Math.floor(g.score / 250) * 250;
    if (distMarker > 0 && g.score % 250 < 50) {
      ctx.globalAlpha = Math.max(0, 1 - (g.score % 250) / 50);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = "bold 48px 'Fredoka One', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(`${distMarker}m`, CW / 2, CH / 2);
      ctx.globalAlpha = 1;
    }
  }

  // ─── OBSTACLES ───
  g.obstacles.forEach(o => {
    if (o.isCheckpoint) {
      drawCheckpoint(ctx, o, g);
      return;
    }
    drawObstacle(ctx, o, g);
  });

  // ─── COINS / HEARTS / MAGNETS ───
  g.coins.filter(c => !c.collected).forEach(c => {
    const bounce = Math.sin(g.frame * 0.08 + c.x * 0.03) * 4;
    if (c.isMagnet) {
      drawMagnet(ctx, c.x + 9, c.y + 9 + bounce, g);
    } else if (c.isHeart) {
      drawHeart(ctx, c.x + 9, c.y + 9 + bounce, g);
    } else {
      drawCoin(ctx, c.x + 8, c.y + 8 + bounce, g);
    }
  });

  // ─── MAGNET AURA ───
  if (g.magnetTimer > 0) {
    const magnetAlpha = 0.08 + Math.sin(g.frame * 0.08) * 0.05;
    ctx.strokeStyle = `rgba(0,212,255,${magnetAlpha + 0.1})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(g.player.x + PW / 2, g.player.y + PH / 2, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(g.player.x + PW / 2, g.player.y + PH / 2, 100, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ─── PLAYER ───
  const showPlayer = g.invincible <= 0 || Math.floor(g.frame / 4) % 2 === 0;
  if (showPlayer && !g.gameOver) {
    drawPlayer(ctx, g, avatar);
  }

  // ─── PARTICLES ───
  g.particles.forEach(p => {
    const alpha = Math.max(0, p.life / 30);
    ctx.globalAlpha = alpha;
    if (p.type === 'burst') {
      // Glowing particle
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;

  // ─── FLOATING TEXTS ───
  g.floatingTexts.forEach(ft => {
    const alpha = Math.max(0, ft.life / ft.maxLife);
    const scale = 0.8 + alpha * 0.2;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(ft.x, ft.y);
    ctx.scale(scale, scale);
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size || 14}px 'Fredoka One', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  // ─── BEAT BORDER ───
  if (g.beatBorderFlash > 0) {
    const ba = g.beatBorderFlash / 30;
    ctx.shadowColor = PALETTE.neonGold;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = `rgba(255,215,0,${ba})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CW - 4, CH - 4);
    ctx.shadowBlur = 0;
  }

  // ─── HUD ───
  drawHUD(ctx, g);

  // ─── START SCREEN ───
  if (!g.started) {
    drawStartScreen(ctx, g);
  }

  // ─── GAME OVER ───
  if (g.gameOver) {
    drawGameOver(ctx, g);
  }

  ctx.restore();
}

// ─── SUB-DRAW FUNCTIONS ──────────────────────────────────────────────────────

function drawPlayer(ctx, g, avatar) {
  const px = g.player.x;
  const py = g.player.y;
  const runPhase = Math.sin(g.player.runFrame);
  const squashY = g.player.jumping ? 0.88 : (g.player.grounded ? 1 + Math.sin(g.player.runFrame * 2) * 0.02 : 1);
  const squashX = g.player.jumping ? 1.08 : 1;

  ctx.save();
  ctx.translate(px + PW / 2, py + PH);
  ctx.scale(squashX, squashY);
  ctx.translate(-(px + PW / 2), -(py + PH));

  const skinColor = avatar.skinColor || '#FDBCB4';
  const shirtColor = avatar.shirtColor === 'rainbow' ? '#FF6B6B' : (avatar.shirtColor || '#6C5CE7');
  const pantsColor = avatar.pantsColor || '#2D3436';

  // Shadow beneath player
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(px + PW / 2, py + PH + 2, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (shirt)
  ctx.fillStyle = shirtColor;
  drawRoundRect(ctx, px + 6, py + 20, PW - 12, 18, 3);
  ctx.fill();

  // Shirt detail - collar
  ctx.fillStyle = lighten(shirtColor, 30);
  ctx.fillRect(px + 12, py + 20, PW - 24, 3);

  // Head
  ctx.fillStyle = skinColor;
  drawRoundRect(ctx, px + 8, py, PW - 16, 22, 4);
  ctx.fill();

  // Eyes
  const eyeY = py + 8;
  ctx.fillStyle = '#FFFFFF';
  drawRoundRect(ctx, px + 11, eyeY, 8, 8, 2);
  ctx.fill();
  drawRoundRect(ctx, px + 22, eyeY, 8, 8, 2);
  ctx.fill();
  // Pupils (look slightly forward)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(px + 15, eyeY + 2, 4, 4);
  ctx.fillRect(px + 26, eyeY + 2, 4, 4);
  // Pupil highlights
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px + 15, eyeY + 2, 2, 2);
  ctx.fillRect(px + 26, eyeY + 2, 2, 2);

  // Smile
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px + PW / 2, py + 14, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Pants / Legs with run animation
  const legAngle = g.player.grounded ? runPhase * 12 : 0;
  ctx.fillStyle = pantsColor;
  // Left leg
  ctx.save();
  ctx.translate(px + 10, py + 38);
  ctx.rotate(legAngle * Math.PI / 180);
  ctx.fillRect(-5, 0, 10, 12);
  ctx.restore();
  // Right leg
  ctx.save();
  ctx.translate(px + PW - 10, py + 38);
  ctx.rotate(-legAngle * Math.PI / 180);
  ctx.fillRect(-5, 0, 10, 12);
  ctx.restore();

  // Arms with swing
  const armSwing = g.player.jumping ? 25 : runPhase * 15;
  ctx.fillStyle = shirtColor;
  // Left arm
  ctx.save();
  ctx.translate(px + 4, py + 22);
  ctx.rotate(armSwing * Math.PI / 180);
  ctx.fillRect(-3, 0, 6, 14);
  ctx.restore();
  // Right arm
  ctx.save();
  ctx.translate(px + PW - 4, py + 22);
  ctx.rotate(-armSwing * Math.PI / 180);
  ctx.fillRect(-3, 0, 6, 14);
  ctx.restore();

  // Hat
  if (avatar.hatId === 'cap') {
    ctx.fillStyle = '#FF6B6B';
    drawRoundRect(ctx, px + 6, py - 5, PW - 12, 7, 2);
    ctx.fill();
    ctx.fillRect(px + PW - 8, py - 2, 12, 5);
  } else if (avatar.hatId === 'crown') {
    ctx.fillStyle = PALETTE.neonGold;
    // Crown body
    ctx.fillRect(px + 8, py - 10, PW - 16, 12);
    // Crown spikes
    ctx.beginPath();
    ctx.moveTo(px + 8, py - 10);
    ctx.lineTo(px + 12, py - 18);
    ctx.lineTo(px + 16, py - 10);
    ctx.moveTo(px + 16, py - 10);
    ctx.lineTo(px + PW / 2, py - 18);
    ctx.lineTo(px + PW - 16, py - 10);
    ctx.moveTo(px + PW - 16, py - 10);
    ctx.lineTo(px + PW - 12, py - 18);
    ctx.lineTo(px + PW - 8, py - 10);
    ctx.fill();
    // Jewels
    ctx.fillStyle = '#FF0000';
    [14, PW / 2, PW - 14].forEach(xOff => {
      ctx.beginPath();
      ctx.arc(px + xOff, py - 5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (avatar.hatId === 'tophat') {
    ctx.fillStyle = '#2D3436';
    ctx.fillRect(px + 4, py - 3, PW - 8, 5);
    ctx.fillRect(px + 10, py - 20, PW - 20, 20);
    ctx.fillStyle = PALETTE.neonPurple;
    ctx.fillRect(px + 10, py - 6, PW - 20, 3);
  } else if (avatar.hatId === 'headphones') {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px + PW / 2, py + 2, 14, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath(); ctx.arc(px + 6, py + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + PW - 6, py + 6, 5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawObstacle(ctx, o, g) {
  const theme = o.theme;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(o.x + o.w / 2, GROUND_Y_POS + PH + 2, o.w / 2 + 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;

  // Main block body
  ctx.fillStyle = theme.main;
  drawRoundRect(ctx, o.x, o.y, o.w, o.h, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Top highlight
  ctx.fillStyle = theme.light;
  drawRoundRect(ctx, o.x + 2, o.y + 2, o.w - 4, 6, 3);
  ctx.fill();

  // Bottom shadow
  ctx.fillStyle = theme.dark;
  ctx.fillRect(o.x + 2, o.y + o.h - 6, o.w - 4, 4);

  // Inner detail - cross pattern
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  const gridSize = 12;
  for (let gx = o.x + gridSize; gx < o.x + o.w; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, o.y + 4);
    ctx.lineTo(gx, o.y + o.h - 4);
    ctx.stroke();
  }
  for (let gy = o.y + gridSize; gy < o.y + o.h; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(o.x + 4, gy);
    ctx.lineTo(o.x + o.w - 4, gy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Moving indicator
  if (o.moving) {
    ctx.fillStyle = 'rgba(116,185,255,0.4)';
    drawRoundRect(ctx, o.x - 2, o.y - 2, o.w + 4, o.h + 4, 6);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↕', o.x + o.w / 2, o.y - 6);
  }

  // Gap indicator
  if (o.isGap) {
    ctx.strokeStyle = PALETTE.neonPurple;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
    ctx.setLineDash([]);
  }
}

function drawCheckpoint(ctx, o, g) {
  const glow = 0.5 + Math.sin(g.frame * 0.08) * 0.3;

  // Glow
  ctx.shadowColor = PALETTE.neonGold;
  ctx.shadowBlur = 20;
  ctx.fillStyle = `rgba(255,215,0,${glow * 0.4})`;
  drawRoundRect(ctx, o.x - 4, o.y - 4, o.w + 8, o.h + 8, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Block
  ctx.fillStyle = o.claimed ? '#8B6914' : PALETTE.neonGold;
  drawRoundRect(ctx, o.x, o.y, o.w, o.h, 4);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, 5);

  // Musical note
  ctx.fillStyle = '#1a0533';
  ctx.font = "bold 16px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('♪', o.x + o.w / 2, o.y + o.h - 5);
}

function drawCoin(ctx, cx, cy, g) {
  const spin = Math.sin(g.frame * 0.06 + cx * 0.02);
  const scaleX = 0.5 + Math.abs(spin) * 0.5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);

  // Glow
  ctx.shadowColor = PALETTE.neonGold;
  ctx.shadowBlur = 10;

  // Outer
  ctx.fillStyle = PALETTE.coinOuter;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();

  // Inner
  ctx.fillStyle = PALETTE.coinInner;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // ¢ symbol
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.neonGold;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¢', 0, 1);

  ctx.restore();
}

function drawHeart(ctx, hx, hy, g) {
  const pulse = 1 + Math.sin(g.frame * 0.12) * 0.15;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = PALETTE.heartRed;
  ctx.shadowBlur = 8;
  ctx.fillStyle = PALETTE.heartRed;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❤️', 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMagnet(ctx, mx, my, g) {
  const pulse = 1 + Math.sin(g.frame * 0.1) * 0.12;
  ctx.save();
  ctx.translate(mx, my);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = PALETTE.neonBlue;
  ctx.shadowBlur = 10;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧲', 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHUD(ctx, g) {
  // Top bar background
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(10, 10, CW - 20, 44, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(168,85,247,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(10, 10, CW - 20, 44, 12);
  ctx.stroke();

  // Score
  ctx.fillStyle = PALETTE.white;
  ctx.font = "bold 18px 'Fredoka One', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE`, 24, 30);
  ctx.fillStyle = PALETTE.neonGold;
  ctx.fillText(`${g.score}`, 90, 30);

  // Distance
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = "12px 'Fredoka One', sans-serif";
  ctx.fillText(`${Math.floor(g.distance / 10)}m`, 24, 46);

  // Coins
  ctx.fillStyle = PALETTE.neonGold;
  ctx.font = "bold 16px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText(`🪙 ${g.coinsCollected}`, CW / 2 - 50, 36);

  // Hearts
  ctx.font = "16px sans-serif";
  for (let i = 0; i < MAX_LIVES; i++) {
    const hx = CW / 2 + 20 + i * 24;
    ctx.fillStyle = i < g.lives ? PALETTE.heartRed : '#333';
    ctx.fillText(i < g.lives ? '❤️' : '🖤', hx, 36);
  }

  // Combo
  if (g.combo > 1) {
    const comboScale = Math.min(1.3, 1 + g.combo * 0.03);
    const comboColor = g.combo >= 8 ? PALETTE.neonPink : g.combo >= 5 ? '#FFA500' : g.combo >= 3 ? PALETTE.neonGold : PALETTE.white;
    ctx.save();
    ctx.translate(CW - 50, 34);
    ctx.scale(comboScale, comboScale);
    ctx.fillStyle = comboColor;
    ctx.shadowColor = comboColor;
    ctx.shadowBlur = 8;
    ctx.font = `bold ${16}px 'Fredoka One', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`x${g.combo}`, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // High score
  if (g.highScore > 0 && g.started) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = "11px sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`Best: ${g.highScore}`, CW - 24, 46);
  }

  // Speed indicator
  if (g.speed > BASE_SPEED + 1) {
    ctx.fillStyle = 'rgba(255,107,157,0.6)';
    ctx.font = "bold 11px 'Fredoka One', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`⚡ ${g.speed.toFixed(1)}x`, CW - 24, 30);
  }

  // Beat bar at bottom
  const barY = CH - 16;
  const barW = CW - 40;
  const barH = 6;
  const barX = 20;

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  drawRoundRect(ctx, barX, barY, barW, barH, 3);
  ctx.fill();

  // Beat progress
  const beatPos = g.beatPhase * barW;
  // Beat zones (where on-beat jumps work)
  const windowFrac = BEAT_TIMING_WINDOW / BEAT_FRAMES_PER_BEAT;
  ctx.fillStyle = 'rgba(168,85,247,0.2)';
  drawRoundRect(ctx, barX, barY, barW * windowFrac, barH, 3);
  ctx.fill();
  drawRoundRect(ctx, barX + barW * (1 - windowFrac), barY, barW * windowFrac, barH, 3);
  ctx.fill();

  // Beat cursor
  const cursorGlow = g.beatBarGlow > 0 ? PALETTE.neonGold : PALETTE.neonPurple;
  ctx.shadowColor = cursorGlow;
  ctx.shadowBlur = g.beatBarGlow > 0 ? 12 : 4;
  ctx.fillStyle = cursorGlow;
  ctx.beginPath();
  ctx.arc(barX + beatPos, barY + barH / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawStartScreen(ctx, g) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CW, CH);

  // Title with glow
  const titlePulse = 1 + Math.sin(g.startPulse * 2) * 0.03;
  ctx.save();
  ctx.translate(CW / 2, CH / 2 - 60);
  ctx.scale(titlePulse, titlePulse);
  ctx.shadowColor = PALETTE.neonPurple;
  ctx.shadowBlur = 30;
  ctx.fillStyle = PALETTE.white;
  ctx.font = "bold 42px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('🏃 Obby Rush', 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = "18px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('Race, jump, and collect coins to the beat!', CW / 2, CH / 2 - 10);

  // Tap to play
  const tapAlpha = 0.4 + Math.sin(g.startPulse * 3) * 0.4;
  ctx.fillStyle = `rgba(168,85,247,${tapAlpha})`;
  ctx.font = "bold 22px 'Fredoka One', sans-serif";
  ctx.fillText('TAP or SPACE to Start', CW / 2, CH / 2 + 35);

  // Tips
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = "14px sans-serif";
  ctx.fillText('🎵 Jump on the beat for bonus power', CW / 2, CH / 2 + 75);
  ctx.fillText('⬆ Land on blocks for extra points', CW / 2, CH / 2 + 95);

  if (g.highScore > 0) {
    ctx.fillStyle = PALETTE.neonGold;
    ctx.font = "bold 16px 'Fredoka One', sans-serif";
    ctx.fillText(`🏆 Best: ${g.highScore}`, CW / 2, CH / 2 + 130);
  }
}

function drawGameOver(ctx, g) {
  const fadeIn = Math.min(1, g.gameOverTimer / 30);
  ctx.fillStyle = `rgba(0,0,0,${fadeIn * 0.65})`;
  ctx.fillRect(0, 0, CW, CH);

  const slideY = (1 - fadeIn) * 40;

  ctx.save();
  ctx.translate(0, slideY);

  // Title
  ctx.shadowColor = PALETTE.neonPink;
  ctx.shadowBlur = 20;
  ctx.fillStyle = PALETTE.neonPink;
  ctx.font = "bold 38px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', CW / 2, CH / 2 - 80);
  ctx.shadowBlur = 0;

  // Score
  ctx.fillStyle = PALETTE.white;
  ctx.font = "bold 28px 'Fredoka One', sans-serif";
  ctx.fillText(`Score: ${g.score}`, CW / 2, CH / 2 - 35);

  // Coins earned
  ctx.fillStyle = PALETTE.neonGold;
  ctx.font = "bold 20px 'Fredoka One', sans-serif";
  ctx.fillText(`🪙 +${g.coinsCollected} coins earned`, CW / 2, CH / 2 + 5);

  // Distance
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = "16px 'Fredoka One', sans-serif";
  ctx.fillText(`Distance: ${Math.floor(g.distance / 10)}m`, CW / 2, CH / 2 + 35);

  // New high score
  if (g.score >= g.highScore && g.score > 0) {
    const hsGlow = Math.sin(g.gameOverTimer * 0.1) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,215,0,${hsGlow})`;
    ctx.shadowColor = PALETTE.neonGold;
    ctx.shadowBlur = 15;
    ctx.font = "bold 18px 'Fredoka One', sans-serif";
    ctx.fillText('🏆 NEW HIGH SCORE!', CW / 2, CH / 2 + 65);
    ctx.shadowBlur = 0;
  }

  // Retry prompt
  if (g.gameOverTimer > 40) {
    const retryAlpha = 0.4 + Math.sin(g.gameOverTimer * 0.06) * 0.4;
    ctx.fillStyle = `rgba(168,85,247,${retryAlpha})`;
    ctx.font = "bold 18px 'Fredoka One', sans-serif";
    ctx.fillText('Tap or Space to play again', CW / 2, CH / 2 + 110);
  }

  ctx.restore();
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
