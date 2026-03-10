import { useState } from 'react';

export default function GameCard({ game, onPlay }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? game.color : 'white',
        border: `3px solid ${game.color}`,
        borderRadius: 20,
        padding: '18px 14px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(.34,1.56,.64,1)',
        transform: hov ? 'scale(1.06) translateY(-5px)' : 'scale(1)',
        boxShadow: hov ? `0 12px 28px ${game.color}55` : '0 4px 14px rgba(0,0,0,0.08)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 8, right: 10, fontSize: 13,
        opacity: hov ? 0.9 : 0.4,
        color: hov ? 'white' : game.color,
        fontFamily: 'monospace',
      }}>{game.note}</div>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{game.icon}</div>
      <div style={{
        fontFamily: "'Fredoka One',cursive", fontSize: 16,
        color: hov ? 'white' : game.color, marginBottom: 4,
      }}>{game.name}</div>
      <div style={{
        fontSize: 11,
        color: hov ? 'rgba(255,255,255,0.88)' : '#777',
        fontFamily: 'Nunito,sans-serif',
        marginBottom: 8, lineHeight: 1.4,
      }}>{game.desc}</div>
      <div style={{
        display: 'inline-block',
        background: hov ? 'rgba(255,255,255,0.25)' : `${game.color}22`,
        color: hov ? 'white' : game.color,
        borderRadius: 50,
        padding: '3px 10px',
        fontSize: 11,
        fontFamily: "'Fredoka One',cursive",
      }}>🪙 {game.coinReward} coins</div>
    </div>
  );
}
