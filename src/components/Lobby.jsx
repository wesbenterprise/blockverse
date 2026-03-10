import AvatarSVG from './AvatarSVG.jsx';
import MusicBars from './MusicBars.jsx';
import FloatingParticles from './FloatingParticles.jsx';
import GameCard from './GameCard.jsx';
import { GAMES, PLAYABLE_GAME_IDS } from '../utils/constants.js';
import { getLevel, getLevelTitle, getLevelProgress, getNextLevelXp } from '../utils/levels.js';

export default function Lobby({ avatar, coins, xp, onNavigate, onToggleMusic, musicPlaying, dailyToast, levelUpToast }) {
  const level = getLevel(xp);
  const nextXp = getNextLevelXp(xp);

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#1a0533 0%,#2D1B69 40%,#6C5CE7 80%,#FD79A8 100%)',
        position: 'relative', overflow: 'hidden', fontFamily: 'Nunito,sans-serif',
      }}>
        <FloatingParticles />

        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px',
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)',
          borderBottom: '1.5px solid rgba(255,255,255,0.15)', position: 'relative', zIndex: 10,
        }}>
          <MusicBars count={7} color="rgba(255,255,255,0.7)" height={32} />
          <div style={{
            fontFamily: "'Fredoka One',cursive", fontSize: 32,
            background: 'linear-gradient(90deg,#fff,#FD79A8,#FDCB6E,#00CEC9,#fff)',
            backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'logoShimmer 4s linear infinite', letterSpacing: 1,
          }}>🎵 BlockVerse 🧱</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onToggleMusic} title={musicPlaying ? 'Pause music' : 'Play music'} style={{
              background: musicPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, transition: 'all 0.2s', backdropFilter: 'blur(8px)',
            }}>{musicPlaying ? '🔊' : '🔇'}</button>
            <div style={{
              background: 'linear-gradient(135deg,#FFD700,#FF8C00)', color: 'white', borderRadius: 50,
              padding: '9px 20px', fontFamily: "'Fredoka One',cursive", fontSize: 17,
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 18px rgba(255,140,0,0.45)',
              animation: 'coinPulse 2.5s ease-in-out infinite',
            }}>🪙 {coins.toLocaleString()}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 18px', position: 'relative', zIndex: 5 }}>
          {/* Welcome card */}
          <div style={{
            background: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: 28, marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)', animation: 'slideUp 0.6s ease both',
          }}>
            <div style={{
              background: 'linear-gradient(135deg,#a29bfe,#fd79a8)', borderRadius: 20,
              padding: '14px 10px', flexShrink: 0, display: 'flex', alignItems: 'center',
            }}>
              <AvatarSVG av={avatar} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 30, color: '#2d3436', marginBottom: 4 }}>
                Welcome to BlockVerse! 👋
              </div>
              <div style={{ color: '#636e72', fontSize: 15, marginBottom: 6, lineHeight: 1.5 }}>
                🎵 Every game has a beat. Every block has a rhythm.<br />
                Play games, earn coins, and build your ultimate avatar!
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <button
                  onClick={() => onNavigate('customizer')}
                  style={{
                    background: 'linear-gradient(135deg,#6C5CE7,#a29bfe)', color: 'white', border: 'none',
                    borderRadius: 50, padding: '11px 24px', fontFamily: "'Fredoka One',cursive", fontSize: 16,
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(108,92,231,0.4)', transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >🎨 Customize Avatar</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{
                    background: '#fff5f5', border: '2px solid #FF6B6B', borderRadius: 50,
                    padding: '10px 20px', fontFamily: "'Fredoka One',cursive", color: '#FF6B6B', fontSize: 14,
                  }}>🏆 Level {level} {getLevelTitle(level)}</div>
                  <div style={{ background: '#eee', borderRadius: 8, height: 8, overflow: 'hidden', width: '100%' }}>
                    <div style={{
                      background: 'linear-gradient(90deg,#FF6B6B,#FDCB6E)', height: '100%', borderRadius: 8,
                      width: `${getLevelProgress(xp) * 100}%`, transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#999', fontFamily: 'Nunito,sans-serif', textAlign: 'center' }}>
                    {xp} XP{nextXp ? ` / ${nextXp} XP` : ' (MAX)'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', opacity: 0.85 }}>
              <div style={{ fontSize: 36, animation: 'notesBounce 2s ease-in-out infinite' }}>🎶</div>
              <div style={{ fontSize: 12, fontFamily: "'Fredoka One',cursive", color: '#b2bec3', marginTop: 4 }}>On Beat!</div>
              <MusicBars count={4} color="#6C5CE7" height={20} />
            </div>
          </div>

          {/* Game selector */}
          <div style={{
            textAlign: 'center', marginBottom: 20,
            fontFamily: "'Fredoka One',cursive", fontSize: 24, color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.7s 0.1s ease both', opacity: 0, animationFillMode: 'forwards',
          }}>🎮 Choose Your Game World</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16,
            animation: 'slideUp 0.7s 0.2s ease both', opacity: 0, animationFillMode: 'forwards',
          }}>
            {GAMES.filter(g => PLAYABLE_GAME_IDS.includes(g.id)).map(game => (
              <GameCard key={game.id} game={game} onPlay={() => onNavigate(game.id)} />
            ))}
          </div>

          {/* Footer banner */}
          <div style={{
            marginTop: 28,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 18,
            padding: '16px 24px', border: '2px dashed rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
            animation: 'slideUp 0.7s 0.3s ease both', opacity: 0, animationFillMode: 'forwards',
          }}>
            <MusicBars count={5} color="rgba(255,255,255,0.8)" height={24} />
            <span style={{ fontFamily: "'Fredoka One',cursive", color: 'white', fontSize: 16, textAlign: 'center' }}>
              🎵 Hit notes on the beat for bonus coins &nbsp;•&nbsp; 🧱 Every block you place plays a sound &nbsp;•&nbsp; 🏆 Top the leaderboard!
            </span>
            <MusicBars count={5} color="rgba(255,255,255,0.8)" height={24} />
          </div>
        </div>

        {/* Toasts */}
        {dailyToast && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#00b894,#00cec9)', color: 'white',
            borderRadius: 16, padding: '14px 32px',
            fontFamily: "'Fredoka One',cursive", fontSize: 18,
            boxShadow: '0 6px 24px rgba(0,206,201,0.5)', zIndex: 100,
            animation: 'slideUp 0.4s ease',
          }}>
            🎁 Daily Bonus! +25 coins
          </div>
        )}
        {levelUpToast > 0 && (
          <div style={{
            position: 'fixed', top: dailyToast ? 140 : 80, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,#6C5CE7,#FD79A8)', color: 'white',
            borderRadius: 16, padding: '14px 32px',
            fontFamily: "'Fredoka One',cursive", fontSize: 18,
            boxShadow: '0 6px 24px rgba(108,92,231,0.5)', zIndex: 100,
            animation: 'slideUp 0.4s ease',
          }}>
            🎉 Level Up! Level {levelUpToast} {getLevelTitle(levelUpToast)} +{levelUpToast * 10} coins
          </div>
        )}
      </div>
    </>
  );
}
