import { useState, useEffect, useRef, useCallback } from 'react';
import FloatingParticles from './FloatingParticles.jsx';
import { OBBY } from '../utils/constants.js';
import { playObbySound, resumeAudioCtx } from '../utils/audio.js';

const {
  GRAVITY, JUMP_FORCE, GROUND_Y, CANVAS_W, CANVAS_H, BASE_SPEED,
  SPEED_INCREMENT, SPEED_SCORE_INTERVAL, INITIAL_LIVES, MAX_LIVES,
  INVINCIBILITY_FRAMES, BOUNCE_FORCE_MULTIPLIER, LANDING_BONUS_SCORE,
  XP_PER_SCORE_UNIT, COIN_COLLECTION_PADDING, MAGNET_DURATION_FRAMES,
  MAGNET_ATTRACT_RADIUS, MAGNET_ATTRACT_STRENGTH, MAGNET_SPAWN_SCORE_THRESHOLD,
  MAGNET_SPAWN_CHANCE, HEART_SPAWN_CHANCE, COIN_SPAWN_CHANCE,
  GAP_OBSTACLE_SCORE_THRESHOLD, GAP_OBSTACLE_CHANCE,
  MOVING_OBSTACLE_SCORE_THRESHOLD, MOVING_OBSTACLE_CHANCE,
  BASE_SPAWN_INTERVAL, MIN_SPAWN_INTERVAL,
  SPAWN_INTERVAL_REDUCTION_PER_STEP, SPAWN_INTERVAL_SCORE_STEP,
  OBSTACLE_TYPES, PLAYER_HITBOX, LANDING_THRESHOLD,
  COMBO_BONUS_INTERVAL, HIGH_SCORE_KEY, BEAT_FRAMES_PER_BEAT,
} = OBBY;

function createInitialGameState() {
  return {
    player: { x: 80, y: GROUND_Y, vy: 0, jumping: false, grounded: true },
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
    highScore: parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0'),
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
      Object.assign(g, createInitialGameState());
      g.started = true;
      landedOnRef.current.clear();
      setGameOver(false); setStarted(true);
      setDisplayScore(0); setDisplayCoins(0); setDisplayLives(INITIAL_LIVES);
      return;
    }
    if (!g.started) { g.started = true; setStarted(true); }
    if (g.player.grounded) {
      g.player.vy = JUMP_FORCE;
      g.player.jumping = true;
      g.player.grounded = false;
      playObbySound('jump');
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

      // Tall narrow gap obstacle
      if (g.score > GAP_OBSTACLE_SCORE_THRESHOLD && Math.random() < GAP_OBSTACLE_CHANCE) {
        const gapX = CANVAS_W + 20;
        g.obstacles.push({ x: gapX, y: GROUND_Y + 30 - 32, w: 20, h: 32, color: '#a29bfe', isGap: true });
        g.obstacles.push({ x: gapX, y: GROUND_Y + 30 - 110, w: 20, h: 26, color: '#a29bfe', isGap: true });
        if (Math.random() > 0.3) {
          g.coins.push({ x: gapX + 2, y: GROUND_Y + 30 - 72, w: 16, h: 16, collected: false });
        }
        return;
      }

      const t = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const obs = { x: CANVAS_W + 20, y: GROUND_Y + 30 - t.h, w: t.w, h: t.h, color: t.color };

      // Moving obstacle
      if (g.score > MOVING_OBSTACLE_SCORE_THRESHOLD && Math.random() < MOVING_OBSTACLE_CHANCE) {
        obs.moving = true;
        obs.baseY = obs.y;
        obs.movePhase = Math.random() * Math.PI * 2;
        obs.color = '#74b9ff';
      }

      g.obstacles.push(obs);

      // Coin above some obstacles
      if (Math.random() < COIN_SPAWN_CHANCE) {
        g.coins.push({ x: CANVAS_W + 20 + t.w / 2 - 8, y: GROUND_Y + 30 - t.h - 40, w: 16, h: 16, collected: false });
      }
      // Rare heart pickup
      if (g.lives < MAX_LIVES && Math.random() < HEART_SPAWN_CHANCE) {
        g.coins.push({ x: CANVAS_W + 60 + Math.random() * 40, y: GROUND_Y + 30 - t.h - 65, w: 18, h: 18, collected: false, isHeart: true });
      }
      // Rare coin magnet power-up
      if (g.score > MAGNET_SPAWN_SCORE_THRESHOLD && Math.random() < MAGNET_SPAWN_CHANCE) {
        g.coins.push({ x: CANVAS_W + 80, y: GROUND_Y + 30 - t.h - 55, w: 18, h: 18, collected: false, isMagnet: true });
      }
    };

    const spawnParticles = (x, y, count, colors, sizeRange, spreadRange, lifeRange) => {
      const g = gameRef.current;
      for (let i = 0; i < count; i++) {
        g.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * spreadRange,
          vy: (Math.random() - 0.5) * spreadRange,
          life: lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]),
          color: colors[Math.floor(Math.random() * colors.length)],
          size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
        });
      }
    };

    const loop = () => {
      const g = gameRef.current;
      g.frame++;
      g.beatPhase = (g.frame % BEAT_FRAMES_PER_BEAT) / BEAT_FRAMES_PER_BEAT;

      if (g.started && !g.gameOver) {
        g.speed = BASE_SPEED + Math.floor(g.score / SPEED_SCORE_INTERVAL) * SPEED_INCREMENT;

        // Player physics
        g.player.vy += GRAVITY;
        g.player.y += g.player.vy;
        if (g.player.y >= GROUND_Y) {
          g.player.y = GROUND_Y;
          g.player.vy = 0;
          g.player.grounded = true;
          g.player.jumping = false;
        }

        // Spawn obstacles
        const spawnInterval = Math.max(
          MIN_SPAWN_INTERVAL,
          BASE_SPAWN_INTERVAL - Math.floor(g.score / SPAWN_INTERVAL_SCORE_STEP) * SPAWN_INTERVAL_REDUCTION_PER_STEP
        );
        if (g.frame % spawnInterval === 0) spawnObstacle();

        // Move obstacles
        g.obstacles.forEach(o => {
          o.x -= g.speed;
          if (o.moving) o.y = o.baseY + Math.sin(g.frame * 0.05 + o.movePhase) * 25;
        });
        const prevLen = g.obstacles.length;
        g.obstacles = g.obstacles.filter(o => o.x + o.w > -20);
        if (g.obstacles.length < prevLen) {
          landedOnRef.current.forEach(o => { if (o.x + o.w <= -20) landedOnRef.current.delete(o); });
        }

        // Move coins
        g.coins.forEach(c => { c.x -= g.speed; });
        g.coins = g.coins.filter(c => c.x + c.w > -20 && !c.collected);

        // Tick down invincibility frames
        if (g.invincible > 0) g.invincible--;

        // Coin magnet effect
        if (g.magnetTimer > 0) {
          g.magnetTimer--;
          for (const c of g.coins) {
            if (!c.collected && !c.isHeart && !c.isMagnet) {
              const dist = Math.hypot((c.x + 8) - (g.player.x + 20), (c.y + 8) - (g.player.y + 20));
              if (dist < MAGNET_ATTRACT_RADIUS) {
                c.x += (g.player.x + 12 - c.x) * MAGNET_ATTRACT_STRENGTH;
                c.y += (g.player.y + 12 - c.y) * MAGNET_ATTRACT_STRENGTH;
              }
            }
          }
        }

        // Collision detection
        const px = g.player.x + PLAYER_HITBOX.xOffset;
        const py = g.player.y + PLAYER_HITBOX.yOffset;
        const pw = PLAYER_HITBOX.w;
        const ph = PLAYER_HITBOX.h;

        for (const o of g.obstacles) {
          if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
            const playerBottom = py + ph;
            const landingZone = o.y + LANDING_THRESHOLD;

            if (playerBottom <= landingZone && g.player.vy >= 0) {
              // Land on top
              g.player.y = o.y - ph + 4;
              g.player.vy = 0;
              g.player.grounded = true;
              g.player.jumping = false;
              if (!landedOnRef.current.has(o)) {
                landedOnRef.current.add(o);
                g.score += LANDING_BONUS_SCORE;
                playObbySound('land');
                spawnParticles(px + pw / 2, o.y, 4, ['#a3e635'], [3, 6], 4, [15, 15]);
              }
              continue;
            }

            // Side/bottom hit
            if (g.invincible > 0) continue;
            g.combo = 0;
            g.lives--;
            setDisplayLives(g.lives);
            playObbySound('hit');
            spawnParticles(g.player.x + 20, g.player.y + 20, 8, ['#FF6B6B', '#FDCB6E', '#FD79A8'], [3, 7], 6, [20, 30]);

            if (g.lives <= 0) {
              g.gameOver = true;
              setGameOver(true);
              playObbySound('death');
              spawnParticles(g.player.x + 20, g.player.y + 20, 12, ['#FF6B6B', '#FDCB6E', '#6C5CE7', '#FD79A8'], [4, 10], 8, [30, 50]);

              if (g.score > g.highScore) {
                g.highScore = g.score;
                localStorage.setItem(HIGH_SCORE_KEY, g.score.toString());
              }
              const earned = g.coinsCollected;
              if (earned > 0) setCoins(c => c + earned);
              const xpEarned = Math.floor(g.score / XP_PER_SCORE_UNIT);
              if (xpEarned > 0) setXp(x => x + xpEarned);
            } else {
              g.invincible = INVINCIBILITY_FRAMES;
              g.player.vy = JUMP_FORCE * BOUNCE_FORCE_MULTIPLIER;
              g.player.grounded = false;
            }
            break;
          }
        }

        // Coin & heart collection
        for (const c of g.coins) {
          if (!c.collected &&
            px < c.x + c.w + COIN_COLLECTION_PADDING &&
            px + pw > c.x - COIN_COLLECTION_PADDING &&
            py < c.y + c.h + COIN_COLLECTION_PADDING &&
            py + ph > c.y - COIN_COLLECTION_PADDING
          ) {
            c.collected = true;
            if (c.isMagnet) {
              g.magnetTimer = MAGNET_DURATION_FRAMES;
              playObbySound('magnet');
              spawnParticles(c.x + 9, c.y + 9, 10, ['#74b9ff', '#00cec9', '#a29bfe'], [3, 7], 6, [25, 25]);
            } else if (c.isHeart) {
              g.lives = Math.min(MAX_LIVES, g.lives + 1);
              setDisplayLives(g.lives);
              playObbySound('heart');
              spawnParticles(c.x + 9, c.y + 9, 8, ['#FF6B6B', '#FF4757', '#FF69B4'], [3, 7], 5, [25, 25]);
            } else {
              g.combo++;
              g.coinsCollected += 1 + Math.floor(g.combo / COMBO_BONUS_INTERVAL);
              playObbySound('coin', g.combo);
              spawnParticles(c.x + 8, c.y + 8, 6, ['#FFD700'], [3, 6], 5, [20, 20]);
            }
          }
        }

        g.score++;
        if (g.frame % 6 === 0) {
          setDisplayScore(g.score);
          setDisplayCoins(g.coinsCollected);
        }
      }

      // Update particles
      g.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vy += 0.15; });
      g.particles = g.particles.filter(p => p.life > 0);

      // ─── DRAW ───
      drawFrame(ctx, g, avatarRef.current);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [setCoins, setXp]);

  const handleTap = () => {
    const g = gameRef.current;
    if (g.gameOver) {
      Object.assign(g, createInitialGameState());
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
      background: 'linear-gradient(160deg,#1a0533,#2D1B69,#6C5CE7)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, position: 'relative', fontFamily: 'Nunito,sans-serif',
    }}>
      <FloatingParticles />
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: CANVAS_W, justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 50,
            padding: '8px 18px', cursor: 'pointer', fontFamily: "'Fredoka One',cursive", fontSize: 14,
            backdropFilter: 'blur(10px)',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: 'white' }}>🏃 Obby Rush</div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white', borderRadius: 50,
            padding: '6px 14px', fontFamily: "'Fredoka One',cursive", fontSize: 14,
          }}>🪙 {coins + displayCoins}</div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleTap}
          onTouchStart={e => { e.preventDefault(); handleTap(); }}
          style={{
            borderRadius: 16, border: '3px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
          Tap the screen or press Space/↑ to jump
        </div>
      </div>
    </div>
  );
}

// ─── DRAW FUNCTION (extracted from game loop) ─────────────────────────────────
function drawFrame(ctx, g, avatar) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a0533');
  grad.addColorStop(0.6, '#2D1B69');
  grad.addColorStop(1, '#6C5CE7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + g.frame * 0.2) % CANVAS_W;
    const sy = (i * 97) % (GROUND_Y - 20);
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Beat pulse background bar
  const beatAlpha = Math.sin(g.beatPhase * Math.PI) * 0.15;
  ctx.fillStyle = `rgba(253,121,168,${beatAlpha})`;
  ctx.fillRect(0, GROUND_Y + 20, CANVAS_W, 12);

  // Ground
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, GROUND_Y + 30, CANVAS_W, CANVAS_H - GROUND_Y - 30);
  ctx.fillStyle = '#6C5CE7';
  ctx.fillRect(0, GROUND_Y + 30, CANVAS_W, 3);
  ctx.fillStyle = 'rgba(108,92,231,0.2)';
  for (let i = 0; i < 20; i++) {
    const gx = ((i * 32) - (g.frame * g.speed) % 32 + CANVAS_W) % CANVAS_W;
    ctx.fillRect(gx, GROUND_Y + 40, 16, 4);
  }

  // Obstacles
  g.obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(o.x + 2, o.y + o.h - 6, o.w - 4, 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    if (o.moving) {
      ctx.fillStyle = 'rgba(116,185,255,0.3)';
      ctx.fillRect(o.x - 2, o.y - 2, o.w + 4, o.h + 4);
      ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('↕', o.x + o.w / 2, o.y - 4);
    }
    if (o.isGap) {
      ctx.strokeStyle = '#a29bfe'; ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]); ctx.strokeRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2); ctx.setLineDash([]);
    }
  });

  // Magnet aura
  if (g.magnetTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(g.frame * 0.1) * 0.08;
    ctx.strokeStyle = '#74b9ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.player.x + 20, g.player.y + 20, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(g.player.x + 20, g.player.y + 20, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Coins, Hearts & Magnets
  g.coins.filter(c => !c.collected).forEach(c => {
    const bounce = Math.sin(g.frame * 0.1 + c.x) * 3;
    if (c.isMagnet) {
      ctx.save(); ctx.translate(c.x + 9, c.y + 9 + bounce);
      const pulse = 1 + Math.sin(g.frame * 0.12) * 0.15; ctx.scale(pulse, pulse);
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧲', 0, 0); ctx.restore();
    } else if (c.isHeart) {
      const pulse = 1 + Math.sin(g.frame * 0.15) * 0.15;
      ctx.save(); ctx.translate(c.x + 9, c.y + 9 + bounce); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#FF4757';
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❤️', 0, 0); ctx.restore();
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8 + bounce, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8 + bounce, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('¢', c.x + 8, c.y + 12 + bounce);
    }
  });

  // Player — flash when invincible
  const showPlayer = g.invincible <= 0 || Math.floor(g.frame / 4) % 2 === 0;
  if (showPlayer) {
    const py = g.player.y;
    const px2 = g.player.x;
    const squash = g.player.jumping ? 0.85 : (g.player.grounded && g.player.vy === 0 ? 1 + Math.sin(g.frame * 0.15) * 0.03 : 1);
    ctx.save();
    ctx.translate(px2 + 20, py + 40);
    ctx.scale(1, squash);
    ctx.translate(-(px2 + 20), -(py + 40));

    // Body
    ctx.fillStyle = avatar.shirtColor === 'rainbow' ? '#FF6B6B' : avatar.shirtColor;
    ctx.fillRect(px2 + 6, py + 18, 28, 16);
    // Head
    ctx.fillStyle = avatar.skinColor;
    ctx.fillRect(px2 + 8, py, 24, 20);
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(px2 + 12, py + 7, 7, 7);
    ctx.fillRect(px2 + 22, py + 7, 7, 7);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(px2 + 14, py + 9, 4, 4);
    ctx.fillRect(px2 + 24, py + 9, 4, 4);
    // Smile
    ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px2 + 20, py + 14, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    // Pants
    ctx.fillStyle = avatar.pantsColor;
    ctx.fillRect(px2 + 6, py + 34, 12, 10);
    ctx.fillRect(px2 + 22, py + 34, 12, 10);
    // Arms
    ctx.fillStyle = avatar.shirtColor === 'rainbow' ? '#FF6B6B' : avatar.shirtColor;
    const armSwing = Math.sin(g.frame * 0.2) * (g.player.jumping ? 15 : 5);
    ctx.save();
    ctx.translate(px2 + 4, py + 20); ctx.rotate(armSwing * Math.PI / 180);
    ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    ctx.save();
    ctx.translate(px2 + 36, py + 20); ctx.rotate(-armSwing * Math.PI / 180);
    ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    // Hat
    if (avatar.hatId === 'cap') {
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(px2 + 6, py - 4, 28, 6);
      ctx.fillRect(px2 + 28, py - 1, 10, 4);
    } else if (avatar.hatId === 'crown') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(px2 + 8, py - 8, 24, 10);
      ctx.fillStyle = 'white';
      [14, 20, 26].forEach(x => { ctx.beginPath(); ctx.arc(px2 + x, py - 6, 2, 0, Math.PI * 2); ctx.fill(); });
    } else if (avatar.hatId === 'tophat') {
      ctx.fillStyle = '#2D3436';
      ctx.fillRect(px2 + 4, py - 2, 32, 4);
      ctx.fillRect(px2 + 10, py - 16, 20, 16);
    }
    ctx.restore();
  }

  // Particles
  g.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(8, 8, 200, 28);
  ctx.fillStyle = 'white';
  ctx.font = "bold 13px 'Fredoka One', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${g.score}`, 16, 26);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`🪙 ${g.coinsCollected}`, 100, 26);
  ctx.fillStyle = '#FF6B6B';
  const heartsStr = '❤️'.repeat(g.lives) + '🖤'.repeat(Math.max(0, MAX_LIVES - g.lives));
  ctx.fillText(heartsStr, 150, 26);

  // Combo display
  if (g.combo > 1) {
    const comboColor = g.combo >= 8 ? '#FF4757' : g.combo >= 5 ? '#FFA500' : g.combo >= 3 ? '#FDCB6E' : 'white';
    ctx.fillStyle = comboColor;
    ctx.font = `bold ${14 + Math.min(g.combo, 10)}px 'Fredoka One', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`x${g.combo}`, CANVAS_W - 16, 26);
    ctx.textAlign = 'left';
  }

  if (g.score > 0 && g.highScore > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Best: ${g.highScore}`, 16, 46);
  }

  // Start screen
  if (!g.started) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'white';
    ctx.font = "bold 28px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('🏃 Obby Rush!', CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('Tap or press Space to jump', CANVAS_W / 2, CANVAS_H / 2 + 15);
    ctx.fillStyle = '#FDCB6E';
    ctx.fillText('Collect coins 🪙 • Dodge blocks!', CANVAS_W / 2, CANVAS_H / 2 + 40);
    if (g.highScore > 0) {
      ctx.fillStyle = '#a29bfe';
      ctx.font = "bold 15px 'Fredoka One', sans-serif";
      ctx.fillText(`Your Best: ${g.highScore}`, CANVAS_W / 2, CANVAS_H / 2 + 65);
    }
  }

  // Game Over overlay
  if (g.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#FF6B6B';
    ctx.font = "bold 32px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', CANVAS_W / 2, CANVAS_H / 2 - 30);
    ctx.fillStyle = 'white';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${g.score}`, CANVAS_W / 2, CANVAS_H / 2 + 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🪙 +${g.coinsCollected} coins earned!`, CANVAS_W / 2, CANVAS_H / 2 + 30);
    if (g.score >= g.highScore && g.score > 0) {
      ctx.fillStyle = '#FDCB6E';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('🏆 NEW HIGH SCORE!', CANVAS_W / 2, CANVAS_H / 2 + 55);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Tap or press Space to play again', CANVAS_W / 2, CANVAS_H / 2 + 80);
  }
}
