export default function MusicBars({ count = 7, color = 'white', height = 32 }) {
  const barHeightMultipliers = [0.5, 0.9, 0.4, 1, 0.7, 0.35, 0.8];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height }}>
      {Array.from({ length: count }, (_, i) => {
        const maxH = barHeightMultipliers[i % barHeightMultipliers.length];
        return (
          <div key={i} style={{
            width: 5,
            borderRadius: 3,
            background: color,
            animation: `musicBar ${0.35 + i * 0.09}s ${i * 0.06}s ease-in-out infinite alternate`,
            height: 8,
            '--maxH': `${Math.round(maxH * height)}px`,
          }} />
        );
      })}
    </div>
  );
}
