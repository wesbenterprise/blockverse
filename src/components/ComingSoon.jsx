import FloatingParticles from './FloatingParticles.jsx';
import MusicBars from './MusicBars.jsx';

export default function ComingSoon({ game, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      background: `linear-gradient(135deg, ${game.color}44, ${game.color}22)`,
      position: 'relative',
    }}>
      <FloatingParticles />
      <div style={{ fontSize: 80 }}>{game.icon}</div>
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 36, color: game.color }}>{game.name}</div>
      <div style={{
        background: 'white', borderRadius: 20, padding: '20px 32px', textAlign: 'center',
        boxShadow: `0 8px 32px ${game.color}33`, maxWidth: 340,
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎵</div>
        <div style={{ fontFamily: "'Fredoka One',cursive", color: '#444', fontSize: 18, marginBottom: 8 }}>
          Coming in the next build!
        </div>
        <div style={{ color: '#888', fontSize: 14, fontFamily: 'Nunito,sans-serif' }}>
          This game will feature live rhythm mechanics, coin rewards, and a unique musical twist!
        </div>
        <div style={{
          marginTop: 14,
          background: `${game.color}22`,
          borderRadius: 10,
          padding: '8px 16px',
          fontFamily: "'Fredoka One',cursive",
          color: game.color,
          fontSize: 13,
        }}>🪙 Earn {game.coinReward} coins per session</div>
      </div>
      <MusicBars count={9} color={game.color} height={40} />
      <button onClick={onBack} style={{
        background: game.color, color: 'white', border: 'none', borderRadius: 50,
        padding: '12px 32px', fontFamily: "'Fredoka One',cursive", fontSize: 18,
        cursor: 'pointer', boxShadow: `0 4px 16px ${game.color}55`,
      }}>← Back to Lobby</button>
    </div>
  );
}
