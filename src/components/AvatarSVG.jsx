import { ACCESSORIES, HATS } from '../utils/constants.js';

const HAT_COLORS = {
  none: 'transparent',
  cap: '#FF6B6B',
  tophat: '#2D3436',
  crown: '#FFD700',
  headphones: '#6C5CE7',
  wizard: '#6C5CE7',
};

export default function AvatarSVG({ av, size = 1 }) {
  const { skinColor, shirtColor, pantsColor, hatId, accessoryId } = av;
  const w = 90 * size, h = 130 * size;

  const shirt = shirtColor === 'rainbow'
    ? 'url(#rainbowGrad)'
    : shirtColor === '#2D1B69'
    ? 'url(#galaxyGrad)'
    : shirtColor;

  const hatColor = HAT_COLORS[hatId] || '#FF6B6B';

  return (
    <svg width={w} height={h} viewBox="0 0 90 130">
      <defs>
        <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="33%" stopColor="#FDCB6E" />
          <stop offset="66%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00CEC9" />
        </linearGradient>
        <linearGradient id="galaxyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D1B69" />
          <stop offset="50%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#FD79A8" />
        </linearGradient>
      </defs>

      {/* Hats */}
      {hatId === 'cap' && (<>
        <rect x="16" y="22" width="58" height="14" rx="7" fill={hatColor} />
        <rect x="20" y="14" width="50" height="14" rx="6" fill={hatColor} />
        <rect x="60" y="28" width="20" height="8" rx="4" fill={hatColor} />
        <rect x="35" y="15" width="20" height="5" rx="2" fill="white" opacity="0.3" />
      </>)}
      {hatId === 'tophat' && (<>
        <rect x="10" y="24" width="70" height="7" rx="3" fill={hatColor} />
        <rect x="22" y="4" width="46" height="22" rx="3" fill={hatColor} />
        <rect x="24" y="6" width="42" height="6" rx="2" fill="white" opacity="0.15" />
      </>)}
      {hatId === 'crown' && (<>
        <polygon points="22,28 22,10 34,18 45,6 56,18 68,10 68,28" fill={hatColor} />
        {[28, 45, 62].map((x, i) => <circle key={i} cx={x} cy="11" r="4" fill="white" opacity="0.9" />)}
      </>)}
      {hatId === 'headphones' && (<>
        <path d="M20 42 Q20 12 45 12 Q70 12 70 42" fill="none" stroke={hatColor} strokeWidth="6" strokeLinecap="round" />
        <rect x="12" y="34" width="14" height="18" rx="6" fill={hatColor} />
        <rect x="64" y="34" width="14" height="18" rx="6" fill={hatColor} />
      </>)}
      {hatId === 'wizard' && (<>
        <polygon points="45,2 22,30 68,30" fill={hatColor} />
        <rect x="16" y="27" width="58" height="7" rx="3" fill={hatColor} />
        {[35, 52, 44].map((x, i) => <text key={i} x={x} y={25 - i * 6} fontSize="8" fill="gold">✦</text>)}
      </>)}

      {/* Head */}
      <rect x="20" y="30" width="50" height="44" rx="10" fill={skinColor} />
      {/* Eyes */}
      <rect x="27" y="42" width="13" height="13" rx="3" fill="white" />
      <rect x="50" y="42" width="13" height="13" rx="3" fill="white" />
      <rect x="30" y="44" width="8" height="9" rx="2" fill="#2d3436" />
      <rect x="53" y="44" width="8" height="9" rx="2" fill="#2d3436" />
      <rect x="32" y="45" width="3" height="3" rx="1" fill="white" />
      <rect x="55" y="45" width="3" height="3" rx="1" fill="white" />
      {/* Mouth */}
      <path d="M30 62 Q45 74 60 62" stroke="#2d3436" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="26" cy="62" rx="6" ry="4" fill="#FFB3C6" opacity="0.5" />
      <ellipse cx="64" cy="62" rx="6" ry="4" fill="#FFB3C6" opacity="0.5" />
      {/* Body */}
      <rect x="18" y="76" width="54" height="32" rx="7" fill={shirt} />
      <rect x="2" y="76" width="16" height="26" rx="7" fill={shirt} />
      <rect x="72" y="76" width="16" height="26" rx="7" fill={shirt} />
      {/* Hands */}
      <ellipse cx="10" cy="104" rx="8" ry="8" fill={skinColor} />
      <ellipse cx="80" cy="104" rx="8" ry="8" fill={skinColor} />
      {/* Pants */}
      <rect x="18" y="108" width="24" height="20" rx="5" fill={pantsColor} />
      <rect x="48" y="108" width="24" height="20" rx="5" fill={pantsColor} />
      {/* Accessories */}
      {accessoryId === 'guitar' && <text x="66" y="115" fontSize="22">🎸</text>}
      {accessoryId === 'mic' && <text x="66" y="110" fontSize="20">🎤</text>}
      {accessoryId === 'drumsticks' && <text x="64" y="108" fontSize="20">🥁</text>}
      {accessoryId === 'keyboard' && <text x="-4" y="108" fontSize="18">🎹</text>}
      {accessoryId === 'trumpet' && <text x="64" y="108" fontSize="18">🎺</text>}
    </svg>
  );
}

// Re-export for convenience
export { ACCESSORIES, HATS };
