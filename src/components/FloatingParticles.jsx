import { useRef } from 'react';
import { FLOATING_SYMBOLS } from '../utils/constants.js';

const PARTICLE_COUNT = 18;

export default function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      sym: FLOATING_SYMBOLS[Math.floor(Math.random() * FLOATING_SYMBOLS.length)],
      left: `${Math.random() * 96}%`,
      top: `${Math.random() * 88}%`,
      size: 14 + Math.random() * 18,
      dur: `${5 + Math.random() * 5}s`,
      delay: `${Math.random() * 6}s`,
    }))
  ).current;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left,
          top: p.top,
          fontSize: p.size,
          opacity: 0.25,
          animation: `floatNote ${p.dur} ${p.delay} ease-in-out infinite`,
        }}>{p.sym}</div>
      ))}
    </div>
  );
}
