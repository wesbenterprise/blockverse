import { useState, useEffect, useRef, useCallback } from 'react';
import FloatingParticles from './FloatingParticles.jsx';

// ─── STYLE STAGE CONSTANTS ────────────────────────────────────────────────────
const ACCENT = '#FD79A8';
const ACCENT_DARK = '#e84393';
const BG_GRAD = 'linear-gradient(135deg, #2D1B69 0%, #6C5CE7 40%, #FD79A8 100%)';
const FONT_TITLE = "'Fredoka One', cursive";
const FONT_BODY = "'Nunito', sans-serif";

const DRESSING_TIME = 60; // seconds

const THEMES = [
  { name: 'Royal Ball', emoji: '👑', hint: 'Think crowns, gold, and elegance', accent: '#FFD700', keyItems: ['crown', 'gown', 'heels', 'necklace'] },
  { name: 'Cyber Punk', emoji: '🤖', hint: 'Neon, tech vibes, futuristic', accent: '#00FF88', keyItems: ['visor', 'jacket', 'boots', 'gloves'] },
  { name: 'Beach Day', emoji: '🏖️', hint: 'Sun, sand, and surf style', accent: '#00CEC9', keyItems: ['sunglasses', 'tanktop', 'sandals', 'hat'] },
  { name: 'Rock Star', emoji: '🎸', hint: 'Leather, studs, and attitude', accent: '#FF6B6B', keyItems: ['bandana', 'jacket', 'boots', 'guitar'] },
  { name: 'Garden Party', emoji: '🌸', hint: 'Floral, pastel, springtime', accent: '#FD79A8', keyItems: ['sunhat', 'dress', 'flats', 'bouquet'] },
  { name: 'Space Explorer', emoji: '🚀', hint: 'Astronaut chic, cosmic glow', accent: '#A78BFA', keyItems: ['helmet', 'suit', 'boots', 'jetpack'] },
  { name: 'Vintage Glam', emoji: '💎', hint: 'Old Hollywood, diamonds & pearls', accent: '#E8A84C', keyItems: ['tiara', 'gown', 'heels', 'pearls'] },
  { name: 'Street Style', emoji: '🛹', hint: 'Casual, cool, skateboard vibes', accent: '#74B9FF', keyItems: ['beanie', 'hoodie', 'sneakers', 'shades'] },
  { name: 'Fairy Tale', emoji: '🧚', hint: 'Wings, magic, enchanted forest', accent: '#55EFC4', keyItems: ['wings', 'dress', 'slippers', 'wand'] },
  { name: 'Arctic Frost', emoji: '❄️', hint: 'Icy blues, fur, winter wonder', accent: '#B9F2FF', keyItems: ['earmuffs', 'coat', 'boots', 'scarf'] },
  { name: 'Pirate Adventure', emoji: '🏴‍☠️', hint: 'Ahoy! Treasure hunter look', accent: '#E17055', keyItems: ['eyepatch', 'vest', 'boots', 'sword'] },
  { name: 'Neon Nights', emoji: '🌃', hint: 'Glow-in-the-dark party style', accent: '#FF00FF', keyItems: ['glasses', 'crop', 'platforms', 'bracelet'] },
  { name: 'Wild West', emoji: '🤠', hint: 'Cowboy boots and desert sun', accent: '#D4A373', keyItems: ['cowboyhat', 'vest', 'boots', 'lasso'] },
  { name: 'Enchanted Forest', emoji: '🍄', hint: 'Mushrooms, moss, magical nature', accent: '#00B894', keyItems: ['leafcrown', 'tunic', 'barefoot', 'staff'] },
  { name: 'Pop Star', emoji: '🎤', hint: 'Sparkle, sequins, stage-ready', accent: '#FD79A8', keyItems: ['mic', 'outfit', 'heels', 'earrings'] },
  { name: 'Steampunk', emoji: '⚙️', hint: 'Gears, goggles, Victorian tech', accent: '#CD7F32', keyItems: ['goggles', 'corset', 'boots', 'gears'] },
  { name: 'Candy Land', emoji: '🍬', hint: 'Sweet, sugary, rainbow colors', accent: '#FF69B4', keyItems: ['bow', 'dress', 'platforms', 'lollipop'] },
  { name: 'Superhero', emoji: '🦸', hint: 'Capes, masks, save the world!', accent: '#FF4757', keyItems: ['mask', 'suit', 'boots', 'cape'] },
  { name: 'Summer Festival', emoji: '🎪', hint: 'Boho chic, flower crowns, vibes', accent: '#FDCB6E', keyItems: ['flowercrown', 'crop', 'sandals', 'bangles'] },
  { name: 'Dark Academia', emoji: '📚', hint: 'Libraries, tweed, old money', accent: '#8B7355', keyItems: ['beret', 'blazer', 'loafers', 'book'] },
  { name: 'Mermaid Cove', emoji: '🧜', hint: 'Scales, shells, ocean depths', accent: '#00CEC9', keyItems: ['tiara', 'tail', 'sandals', 'trident'] },
  { name: 'Disco Fever', emoji: '🪩', hint: 'Mirror balls, 70s groovy moves', accent: '#FFD700', keyItems: ['afro', 'jumpsuit', 'platforms', 'chain'] },
  { name: 'Zombie Prom', emoji: '🧟', hint: 'Spooky elegant, undead formal', accent: '#6C5CE7', keyItems: ['veil', 'gown', 'boots', 'rose'] },
  { name: 'Safari Quest', emoji: '🦁', hint: 'Khaki, binoculars, wild prints', accent: '#DFB88C', keyItems: ['pithhat', 'vest', 'boots', 'binoculars'] },
  { name: 'Y2K Dream', emoji: '💿', hint: 'Butterfly clips, low-rise, chrome', accent: '#FF97E8', keyItems: ['clips', 'halter', 'platforms', 'phone'] },
  { name: 'Medieval Knight', emoji: '⚔️', hint: 'Armor, shields, castle vibes', accent: '#8A8A8A', keyItems: ['helmet', 'armor', 'boots', 'shield'] },
  { name: 'Tropical Paradise', emoji: '🌺', hint: 'Hawaiian shirts, leis, island life', accent: '#FF6B6B', keyItems: ['lei', 'shirt', 'sandals', 'ukulele'] },
  { name: 'Goth Royalty', emoji: '🖤', hint: 'Black lace, dark crowns, mysterious', accent: '#6C5CE7', keyItems: ['crown', 'corset', 'boots', 'choker'] },
];

// ─── WARDROBE ITEMS (grouped by slot) ──────────────────────────────────────────
const WARDROBE = {
  hair: [
    { id: 'bob', label: 'Bob Cut', emoji: '💇', color: '#2D3436' },
    { id: 'long', label: 'Long Flow', emoji: '💁', color: '#8B5E3C' },
    { id: 'curly', label: 'Curly', emoji: '🌀', color: '#4A2C17' },
    { id: 'spiky', label: 'Spiky', emoji: '⚡', color: '#FFD700' },
    { id: 'ponytail', label: 'Ponytail', emoji: '🎀', color: '#C9A7EB' },
    { id: 'afro', label: 'Afro', emoji: '🌟', color: '#2D3436' },
    { id: 'pigtails', label: 'Pigtails', emoji: '🎀', color: '#FD79A8' },
    { id: 'mohawk', label: 'Mohawk', emoji: '🔥', color: '#FF6B6B' },
  ],
  top: [
    { id: 'tshirt', label: 'T-Shirt', emoji: '👕', color: '#6C5CE7' },
    { id: 'hoodie', label: 'Hoodie', emoji: '🧥', color: '#2D3436' },
    { id: 'blazer', label: 'Blazer', emoji: '🤵', color: '#0984E3' },
    { id: 'crop', label: 'Crop Top', emoji: '✨', color: '#FD79A8' },
    { id: 'gown', label: 'Gown', emoji: '👗', color: '#A78BFA' },
    { id: 'jacket', label: 'Jacket', emoji: '🧥', color: '#2D3436' },
    { id: 'tanktop', label: 'Tank Top', emoji: '🎽', color: '#00CEC9' },
    { id: 'suit', label: 'Suit', emoji: '🤵', color: '#1a1a2e' },
  ],
  bottom: [
    { id: 'jeans', label: 'Jeans', emoji: '👖', color: '#0984E3' },
    { id: 'skirt', label: 'Skirt', emoji: '💃', color: '#FD79A8' },
    { id: 'shorts', label: 'Shorts', emoji: '🩳', color: '#FDCB6E' },
    { id: 'cargo', label: 'Cargo', emoji: '👖', color: '#556B2F' },
    { id: 'leggings', label: 'Leggings', emoji: '🦵', color: '#2D3436' },
    { id: 'dress', label: 'Long Skirt', emoji: '👗', color: '#A78BFA' },
  ],
  shoes: [
    { id: 'sneakers', label: 'Sneakers', emoji: '👟', color: '#FF6B6B' },
    { id: 'heels', label: 'Heels', emoji: '👠', color: '#FD79A8' },
    { id: 'boots', label: 'Boots', emoji: '👢', color: '#795548' },
    { id: 'sandals', label: 'Sandals', emoji: '🩴', color: '#FDCB6E' },
    { id: 'platforms', label: 'Platforms', emoji: '👡', color: '#6C5CE7' },
    { id: 'slippers', label: 'Slippers', emoji: '🥿', color: '#55EFC4' },
  ],
  accessory: [
    { id: 'sunglasses', label: 'Shades', emoji: '🕶️', color: '#2D3436' },
    { id: 'necklace', label: 'Necklace', emoji: '📿', color: '#FFD700' },
    { id: 'crown', label: 'Crown', emoji: '👑', color: '#FFD700' },
    { id: 'scarf', label: 'Scarf', emoji: '🧣', color: '#FF6B6B' },
    { id: 'bag', label: 'Handbag', emoji: '👜', color: '#E17055' },
    { id: 'wings', label: 'Wings', emoji: '🧚', color: '#A78BFA' },
    { id: 'cape', label: 'Cape', emoji: '🦸', color: '#FF4757' },
    { id: 'flower', label: 'Flower', emoji: '🌸', color: '#FD79A8' },
  ],
  pattern: [
    { id: 'solid', label: 'Solid', emoji: '⬜', color: null },
    { id: 'stripes', label: 'Stripes', emoji: '📏', color: null },
    { id: 'plaid', label: 'Plaid', emoji: '🏁', color: null },
    { id: 'floral', label: 'Floral', emoji: '🌺', color: null },
    { id: 'stars', label: 'Stars', emoji: '⭐', color: null },
    { id: 'hearts', label: 'Hearts', emoji: '💖', color: null },
    { id: 'animal', label: 'Animal', emoji: '🐆', color: null },
    { id: 'galaxy', label: 'Galaxy', emoji: '🌌', color: null },
  ],
};

const COLOR_PALETTE = [
  '#FF6B6B', '#FD79A8', '#A78BFA', '#6C5CE7',
  '#74B9FF', '#00CEC9', '#55EFC4', '#FDCB6E',
  '#FFD700', '#E17055', '#2D3436', '#F5F5F5',
  '#FF00FF', '#00FF88', '#FF4757', '#1a1a2e',
];

const SLOT_TABS = [
  { id: 'hair', label: '💇 Hair' },
  { id: 'top', label: '👕 Top' },
  { id: 'bottom', label: '👖 Bottom' },
  { id: 'shoes', label: '👟 Shoes' },
  { id: 'accessory', label: '✨ Accessory' },
  { id: 'pattern', label: '🎨 Pattern' },
  { id: 'color', label: '🌈 Colors' },
];

const JUDGE_NAMES = ['Cleo', 'Marco', 'Ivy', 'Rex', 'Luna'];
const JUDGE_EMOJIS = ['👩‍🎨', '🧑‍💼', '👩‍🎤', '🧑‍🎓', '🧙‍♀️'];

const RANKS = [
  { name: 'New Model', minScore: 0, emoji: '🌟' },
  { name: 'Rising Star', minScore: 15, emoji: '⭐' },
  { name: 'Trendsetter', minScore: 25, emoji: '💫' },
  { name: 'Fashion Icon', minScore: 35, emoji: '👑' },
  { name: 'Style Legend', minScore: 42, emoji: '🏆' },
  { name: 'Top Model', minScore: 48, emoji: '💎' },
];

function getRank(score) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) return RANKS[i];
  }
  return RANKS[0];
}

// ─── AVATAR RENDERER for Style Stage ───────────────────────────────────────────
function StageAvatar({ outfit, skinColor, size = 1, animate = false, glow = false }) {
  const w = 120 * size, h = 200 * size;
  const hairItem = WARDROBE.hair.find(h => h.id === outfit.hair);
  const topItem = WARDROBE.top.find(t => t.id === outfit.top);
  const bottomItem = WARDROBE.bottom.find(b => b.id === outfit.bottom);
  const shoeItem = WARDROBE.shoes.find(s => s.id === outfit.shoes);
  const accItem = WARDROBE.accessory.find(a => a.id === outfit.accessory);
  const patternId = outfit.pattern || 'solid';

  const topColor = outfit.topColor || topItem?.color || '#6C5CE7';
  const bottomColor = outfit.bottomColor || bottomItem?.color || '#2D3436';
  const shoeColor = outfit.shoeColor || shoeItem?.color || '#FF6B6B';
  const hairColor = outfit.hairColor || hairItem?.color || '#2D3436';

  const patternDef = () => {
    if (patternId === 'stripes') return (
      <pattern id="pat-stripes" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill={topColor} />
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      </pattern>
    );
    if (patternId === 'plaid') return (
      <pattern id="pat-plaid" patternUnits="userSpaceOnUse" width="10" height="10">
        <rect width="10" height="10" fill={topColor} />
        <line x1="0" y1="5" x2="10" y2="5" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
      </pattern>
    );
    if (patternId === 'stars') return (
      <pattern id="pat-stars" patternUnits="userSpaceOnUse" width="16" height="16">
        <rect width="16" height="16" fill={topColor} />
        <text x="3" y="12" fontSize="9" fill="rgba(255,255,255,0.4)">★</text>
      </pattern>
    );
    if (patternId === 'hearts') return (
      <pattern id="pat-hearts" patternUnits="userSpaceOnUse" width="16" height="16">
        <rect width="16" height="16" fill={topColor} />
        <text x="2" y="12" fontSize="9" fill="rgba(255,255,255,0.4)">♥</text>
      </pattern>
    );
    if (patternId === 'floral') return (
      <pattern id="pat-floral" patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill={topColor} />
        <circle cx="7" cy="7" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="7" cy="7" r="1.5" fill="rgba(255,200,100,0.4)" />
      </pattern>
    );
    if (patternId === 'animal') return (
      <pattern id="pat-animal" patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill={topColor} />
        <circle cx="4" cy="4" r="2.5" fill="rgba(0,0,0,0.2)" />
        <circle cx="10" cy="9" r="2" fill="rgba(0,0,0,0.15)" />
      </pattern>
    );
    if (patternId === 'galaxy') return (
      <pattern id="pat-galaxy" patternUnits="userSpaceOnUse" width="20" height="20">
        <rect width="20" height="20" fill={topColor} />
        <circle cx="5" cy="5" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="15" cy="10" r="0.7" fill="rgba(255,255,255,0.5)" />
        <circle cx="10" cy="17" r="1.2" fill="rgba(255,255,255,0.4)" />
        <circle cx="3" cy="14" r="0.5" fill="rgba(200,200,255,0.5)" />
      </pattern>
    );
    return null;
  };

  const topFill = patternId !== 'solid' ? `url(#pat-${patternId})` : topColor;

  const renderHair = () => {
    const hid = outfit.hair;
    if (hid === 'bob') return <path d="M32 30 Q32 14 60 14 Q88 14 88 30 L88 50 L82 45 L82 55 L38 55 L38 45 L32 50 Z" fill={hairColor} />;
    if (hid === 'long') return (<>
      <path d="M32 30 Q32 12 60 12 Q88 12 88 30 L88 55 L92 85 L84 80 L38 80 L28 85 L32 55 Z" fill={hairColor} />
    </>);
    if (hid === 'curly') return (<>
      <path d="M30 30 Q30 10 60 10 Q90 10 90 30 L90 55 L88 60 Q85 65 80 60 L78 55 Q75 60 70 55 L68 50 Q65 55 60 50 Q55 55 50 50 L48 55 Q45 60 40 55 L38 60 Q35 65 30 60 L30 55 Z" fill={hairColor} />
    </>);
    if (hid === 'spiky') return (<>
      <path d="M35 40 L40 10 L50 32 L55 5 L62 30 L70 8 L75 32 L82 12 L85 40 Q88 20 88 35 L88 48 L32 48 L32 35 Q32 20 35 40 Z" fill={hairColor} />
    </>);
    if (hid === 'ponytail') return (<>
      <path d="M32 30 Q32 14 60 14 Q88 14 88 30 L88 48 L32 48 Z" fill={hairColor} />
      <path d="M80 35 Q95 40 90 70 Q88 85 82 80" fill={hairColor} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />
    </>);
    if (hid === 'afro') return <ellipse cx="60" cy="34" rx="36" ry="32" fill={hairColor} />;
    if (hid === 'pigtails') return (<>
      <path d="M32 30 Q32 14 60 14 Q88 14 88 30 L88 48 L32 48 Z" fill={hairColor} />
      <ellipse cx="26" cy="50" rx="10" ry="16" fill={hairColor} />
      <ellipse cx="94" cy="50" rx="10" ry="16" fill={hairColor} />
    </>);
    if (hid === 'mohawk') return (<>
      <path d="M32 40 Q32 20 60 20 Q88 20 88 40 L88 48 L32 48 Z" fill={hairColor} />
      <path d="M50 26 L52 4 L56 22 L60 2 L64 22 L68 6 L70 26" fill={hairColor} stroke={hairColor} strokeWidth="3" />
    </>);
    return <path d="M32 30 Q32 14 60 14 Q88 14 88 30 L88 48 L32 48 Z" fill={hairColor} />;
  };

  const renderAccessory = () => {
    const aid = outfit.accessory;
    if (aid === 'sunglasses') return (<>
      <rect x="38" y="55" width="16" height="10" rx="4" fill="#2D3436" opacity="0.85" />
      <rect x="66" y="55" width="16" height="10" rx="4" fill="#2D3436" opacity="0.85" />
      <line x1="54" y1="59" x2="66" y2="59" stroke="#2D3436" strokeWidth="2" />
    </>);
    if (aid === 'necklace') return <ellipse cx="60" cy="92" rx="14" ry="6" fill="none" stroke="#FFD700" strokeWidth="2.5" />;
    if (aid === 'crown') return (<>
      <polygon points="42,32 42,20 50,26 56,14 62,26 70,18 78,26 78,32" fill="#FFD700" />
      <circle cx="50" cy="22" r="2" fill="white" opacity="0.8" />
      <circle cx="60" cy="16" r="2.5" fill="white" opacity="0.9" />
      <circle cx="70" cy="20" r="2" fill="white" opacity="0.8" />
    </>);
    if (aid === 'scarf') return <path d="M40 88 Q60 98 80 88 Q82 96 75 100 Q60 106 45 100 Q38 96 40 88" fill="#FF6B6B" />;
    if (aid === 'bag') return <rect x="84" y="120" width="14" height="16" rx="4" fill="#E17055" />;
    if (aid === 'wings') return (<>
      <path d="M30 110 Q10 90 20 105 Q5 95 18 110 Q8 105 25 115" fill="#A78BFA" opacity="0.5" />
      <path d="M90 110 Q110 90 100 105 Q115 95 102 110 Q112 105 95 115" fill="#A78BFA" opacity="0.5" />
    </>);
    if (aid === 'cape') return <path d="M38 95 L30 160 Q60 170 90 160 L82 95" fill="#FF4757" opacity="0.6" />;
    if (aid === 'flower') return <text x="82" y="50" fontSize="16">🌸</text>;
    return null;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {glow && <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        background: `radial-gradient(circle, ${ACCENT}44 0%, transparent 70%)`,
        animation: 'pulse 2s ease-in-out infinite',
      }} />}
      <svg width={w} height={h} viewBox="0 0 120 200" style={{
        animation: animate ? 'avatarBounce 0.6s ease-in-out infinite alternate' : 'none',
        filter: glow ? `drop-shadow(0 0 12px ${ACCENT}88)` : 'none',
      }}>
        <defs>{patternDef()}</defs>

        {/* Cape behind body */}
        {outfit.accessory === 'cape' && renderAccessory()}

        {/* Hair behind head */}
        {renderHair()}

        {/* Head */}
        <rect x="38" y="36" width="44" height="38" rx="12" fill={skinColor} />
        {/* Eyes */}
        <rect x="44" y="48" width="12" height="11" rx="3" fill="white" />
        <rect x="64" y="48" width="12" height="11" rx="3" fill="white" />
        <rect x="47" y="50" width="7" height="8" rx="2" fill="#2d3436" />
        <rect x="67" y="50" width="7" height="8" rx="2" fill="#2d3436" />
        <rect x="49" y="51" width="3" height="3" rx="1" fill="white" />
        <rect x="69" y="51" width="3" height="3" rx="1" fill="white" />
        {/* Blush */}
        <ellipse cx="42" cy="62" rx="5" ry="3" fill="#FFB3C6" opacity="0.5" />
        <ellipse cx="78" cy="62" rx="5" ry="3" fill="#FFB3C6" opacity="0.5" />
        {/* Mouth */}
        <path d="M50 66 Q60 74 70 66" stroke="#2d3436" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Body / Top */}
        <rect x="32" y="82" width="56" height="36" rx="8" fill={topFill} />
        {/* Arms */}
        <rect x="16" y="82" width="16" height="28" rx="8" fill={topFill} />
        <rect x="88" y="82" width="16" height="28" rx="8" fill={topFill} />
        {/* Hands */}
        <ellipse cx="24" cy="112" rx="8" ry="8" fill={skinColor} />
        <ellipse cx="96" cy="112" rx="8" ry="8" fill={skinColor} />

        {/* Bottom */}
        <rect x="32" y="118" width="24" height="28" rx="5" fill={bottomColor} />
        <rect x="64" y="118" width="24" height="28" rx="5" fill={bottomColor} />

        {/* Shoes */}
        <rect x="28" y="146" width="28" height="12" rx="6" fill={shoeColor} />
        <rect x="64" y="146" width="28" height="12" rx="6" fill={shoeColor} />

        {/* Accessory (not cape) */}
        {outfit.accessory !== 'cape' && renderAccessory()}
      </svg>
    </div>
  );
}

// ─── RUNWAY COMPONENT ──────────────────────────────────────────────────────────
function Runway({ outfit, skinColor, theme, onFinish }) {
  const [progress, setProgress] = useState(0);
  const [spotlightOn, setSpotlightOn] = useState(false);
  const animRef = useRef(null);
  const startRef = useRef(null);
  const WALK_DURATION = 4000; // ms

  useEffect(() => {
    setSpotlightOn(true);
    const run = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / WALK_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(run);
      } else {
        setTimeout(onFinish, 800);
      }
    };
    animRef.current = requestAnimationFrame(run);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [onFinish]);

  const avatarX = 10 + progress * 80; // percentage across

  return (
    <div style={{
      width: '100%', height: 360, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #2D1B69 50%, #0f0f1b 100%)',
      borderRadius: 20, border: `3px solid ${theme.accent}44`,
    }}>
      {/* Runway floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(180deg, #3d3d5c 0%, #2d2d44 50%, #1a1a2e 100%)',
        clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
      }} />

      {/* Runway center line */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        width: 4, height: 80, background: `${theme.accent}44`, borderRadius: 2,
      }} />

      {/* Spotlight */}
      {spotlightOn && (
        <div style={{
          position: 'absolute', top: 0,
          left: `${avatarX}%`, transform: 'translateX(-50%)',
          width: 150, height: '100%',
          background: `radial-gradient(ellipse at 50% 20%, ${theme.accent}22 0%, transparent 70%)`,
          transition: 'left 0.1s linear',
        }} />
      )}

      {/* Side lights */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          position: 'absolute', bottom: 10 + i * 20, left: 20 + i * 5,
          width: 6, height: 6, borderRadius: '50%',
          background: progress > i * 0.2 ? theme.accent : '#3d3d5c',
          boxShadow: progress > i * 0.2 ? `0 0 10px ${theme.accent}` : 'none',
          transition: 'all 0.3s',
        }} />
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={`r${i}`} style={{
          position: 'absolute', bottom: 10 + i * 20, right: 20 + i * 5,
          width: 6, height: 6, borderRadius: '50%',
          background: progress > i * 0.2 ? theme.accent : '#3d3d5c',
          boxShadow: progress > i * 0.2 ? `0 0 10px ${theme.accent}` : 'none',
          transition: 'all 0.3s',
        }} />
      ))}

      {/* Theme banner */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        fontFamily: FONT_TITLE, color: theme.accent, fontSize: 18,
        textShadow: `0 0 20px ${theme.accent}88`,
        whiteSpace: 'nowrap',
      }}>
        {theme.emoji} {theme.name} {theme.emoji}
      </div>

      {/* Walking avatar */}
      <div style={{
        position: 'absolute', bottom: 60,
        left: `${avatarX}%`, transform: 'translateX(-50%)',
        transition: 'left 0.1s linear',
      }}>
        <StageAvatar outfit={outfit} skinColor={skinColor} size={0.8} animate glow />
      </div>

      {/* Sparkles that follow */}
      {progress > 0.1 && [0,1,2].map(i => (
        <div key={`sp${i}`} style={{
          position: 'absolute', bottom: 80 + Math.sin(Date.now() / 300 + i) * 20,
          left: `${avatarX - 5 - i * 4}%`,
          fontSize: 12, opacity: 0.6 - i * 0.15,
          animation: `sparkle ${0.5 + i * 0.2}s ease-in-out infinite`,
        }}>✨</div>
      ))}
    </div>
  );
}

// ─── JUDGE RATING COMPONENT ─────────────────────────────────────────────────
function JudgePanel({ scores, theme, revealed, onAllRevealed }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    const interval = setInterval(() => {
      setVisibleCount(v => {
        if (v >= JUDGE_NAMES.length) {
          clearInterval(interval);
          setTimeout(onAllRevealed, 600);
          return v;
        }
        return v + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [revealed, onAllRevealed]);

  return (
    <div style={{
      display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
      padding: '16px 0',
    }}>
      {JUDGE_NAMES.map((name, i) => {
        const show = i < visibleCount;
        const score = scores[i] || 0;
        return (
          <div key={name} style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 16,
            padding: '12px 14px', textAlign: 'center', minWidth: 80,
            backdropFilter: 'blur(8px)',
            border: show ? `2px solid ${theme.accent}66` : '2px solid transparent',
            transform: show ? 'scale(1)' : 'scale(0.9)',
            opacity: show ? 1 : 0.4,
            transition: 'all 0.4s cubic-bezier(.34,1.56,.64,1)',
          }}>
            <div style={{ fontSize: 28 }}>{JUDGE_EMOJIS[i]}</div>
            <div style={{ fontFamily: FONT_TITLE, color: 'white', fontSize: 12, marginTop: 4 }}>{name}</div>
            <div style={{ marginTop: 6, fontSize: 16, letterSpacing: 2 }}>
              {show ? Array.from({ length: 5 }, (_, s) => (
                <span key={s} style={{
                  color: s < score ? '#FFD700' : '#555',
                  textShadow: s < score ? '0 0 6px #FFD700' : 'none',
                }}>★</span>
              )) : <span style={{ color: '#555' }}>?????</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────
function calculateScores(outfit, theme) {
  // Each judge scores 1-5 stars
  // Base score depends on how many wardrobe slots are customized (not default)
  // Bonus for theme-matching items
  const scores = [];
  const defaults = { hair: 'bob', top: 'tshirt', bottom: 'jeans', shoes: 'sneakers', accessory: 'sunglasses', pattern: 'solid' };

  let customized = 0;
  let themeMatch = 0;
  const themeKeywords = theme.keyItems || [];

  Object.keys(defaults).forEach(slot => {
    if (outfit[slot] !== defaults[slot]) customized++;
    if (themeKeywords.some(kw => outfit[slot]?.toLowerCase().includes(kw.slice(0, 4)))) themeMatch++;
  });

  // Color variety bonus
  const colors = [outfit.topColor, outfit.bottomColor, outfit.shoeColor, outfit.hairColor].filter(Boolean);
  const uniqueColors = new Set(colors).size;
  const colorBonus = uniqueColors >= 3 ? 1 : 0;

  // Pattern bonus
  const patternBonus = outfit.pattern !== 'solid' ? 0.5 : 0;

  // Theme accent color match
  const accentMatch = colors.some(c => c === theme.accent) ? 1 : 0;

  for (let i = 0; i < JUDGE_NAMES.length; i++) {
    const base = 1 + Math.min(customized * 0.5, 2);
    const match = themeMatch * 0.4;
    const variety = colorBonus + patternBonus + accentMatch;
    const randomness = (Math.random() - 0.3) * 0.8; // slight random factor
    const raw = base + match + variety + randomness;
    scores.push(Math.max(1, Math.min(5, Math.round(raw))));
  }
  return scores;
}

// ─── CSS KEYFRAMES INJECTION ────────────────────────────────────────────────
const styleId = 'style-stage-keyframes';
function injectStyles() {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes avatarBounce {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-6px); }
    }
    @keyframes pulse { 
      0%, 100% { opacity: 0.6; transform: scale(1); } 
      50% { opacity: 1; transform: scale(1.05); } 
    }
    @keyframes sparkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 0.8; transform: scale(1.2); }
    }
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInScale {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes themeReveal {
      0% { opacity: 0; transform: scale(0.5) rotate(-10deg); letter-spacing: 15px; }
      60% { opacity: 1; transform: scale(1.1) rotate(2deg); letter-spacing: 2px; }
      100% { opacity: 1; transform: scale(1) rotate(0deg); letter-spacing: 0px; }
    }
    @keyframes timerPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes confetti {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-80px) rotate(720deg); opacity: 0; }
    }
    @keyframes starPop {
      0% { transform: scale(0); }
      60% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    @keyframes rainbowShift {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }
    @keyframes floatUp {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-50px); }
    }
  `;
  document.head.appendChild(style);
}

// ─── MAIN GAME COMPONENT ───────────────────────────────────────────────────────
export default function StyleStage({ onBack, coins, setCoins, setXp, avatar }) {
  const [phase, setPhase] = useState('start'); // start | themeReveal | dressing | runway | voting | results
  const [theme, setTheme] = useState(null);
  const [outfit, setOutfit] = useState({
    hair: 'bob', top: 'tshirt', bottom: 'jeans', shoes: 'sneakers',
    accessory: 'sunglasses', pattern: 'solid',
    topColor: '#6C5CE7', bottomColor: '#2D3436', shoeColor: '#FF6B6B', hairColor: '#2D3436',
  });
  const [activeTab, setActiveTab] = useState('hair');
  const [timer, setTimer] = useState(DRESSING_TIME);
  const [scores, setScores] = useState([]);
  const [totalStars, setTotalStars] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [judgesRevealed, setJudgesRevealed] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const timerRef = useRef(null);
  const skinColor = avatar?.skinColor || '#FDBCB4';

  useEffect(() => { injectStyles(); }, []);

  // Timer for dressing phase
  useEffect(() => {
    if (phase !== 'dressing') return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('runway');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startGame = useCallback(() => {
    const t = THEMES[Math.floor(Math.random() * THEMES.length)];
    setTheme(t);
    setPhase('themeReveal');
    setOutfit({
      hair: 'bob', top: 'tshirt', bottom: 'jeans', shoes: 'sneakers',
      accessory: 'sunglasses', pattern: 'solid',
      topColor: '#6C5CE7', bottomColor: '#2D3436', shoeColor: '#FF6B6B', hairColor: '#2D3436',
    });
    setTimer(DRESSING_TIME);
    setScores([]);
    setTotalStars(0);
    setCoinsEarned(0);
    setJudgesRevealed(false);
    setConfetti([]);
    setTimeout(() => setPhase('dressing'), 3000);
  }, []);

  const finishRunway = useCallback(() => {
    const s = calculateScores(outfit, theme);
    setScores(s);
    setPhase('voting');
    setJudgesRevealed(true);
  }, [outfit, theme]);

  const onAllJudgesRevealed = useCallback(() => {
    const total = scores.reduce((a, b) => a + b, 0);
    setTotalStars(total);

    // Coins: 25 base + 3 per star
    const earned = 25 + total * 3;
    setCoinsEarned(earned);
    setCoins(c => c + earned);
    setXp(x => x + total * 2);

    // Confetti
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i, left: 10 + Math.random() * 80,
      color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }));
    setConfetti(pieces);

    setTimeout(() => setPhase('results'), 400);
  }, [scores, setCoins, setXp]);

  const updateOutfit = (key, value) => {
    setOutfit(prev => ({ ...prev, [key]: value }));
  };

  // ─── START SCREEN ───────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        background: BG_GRAD, position: 'relative',
      }}>
        <FloatingParticles />
        <div style={{ fontSize: 80, animation: 'slideInScale 0.6s ease' }}>👗</div>
        <div style={{
          fontFamily: FONT_TITLE, fontSize: 42, color: 'white',
          textShadow: `0 4px 20px ${ACCENT}88`,
          animation: 'slideInUp 0.6s ease',
        }}>Style Stage</div>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '20px 32px', maxWidth: 400, textAlign: 'center',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
          animation: 'slideInUp 0.8s ease',
        }}>
          <div style={{ fontFamily: FONT_TITLE, color: 'white', fontSize: 18, marginBottom: 8 }}>
            How to Play
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
            1. A random fashion theme is revealed<br/>
            2. You have 60 seconds to dress your avatar<br/>
            3. Walk the runway and show your look<br/>
            4. Judges rate your outfit 1-5 stars<br/>
            5. Earn coins based on your score
          </div>
          <div style={{
            marginTop: 14, background: `${ACCENT}22`, borderRadius: 10,
            padding: '8px 16px', fontFamily: FONT_TITLE, color: ACCENT, fontSize: 13,
          }}>🪙 Earn 25–100 coins per round</div>
        </div>
        <button onClick={startGame} style={{
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
          color: 'white', border: 'none', borderRadius: 50,
          padding: '16px 48px', fontFamily: FONT_TITLE, fontSize: 22,
          cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}66`,
          animation: 'slideInUp 1s ease',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          Start Round ✨
        </button>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none',
          borderRadius: 50, padding: '10px 28px', fontFamily: FONT_TITLE,
          fontSize: 15, cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}>← Back to Lobby</button>
      </div>
    );
  }

  // ─── THEME REVEAL ───────────────────────────────────────────────────────
  if (phase === 'themeReveal') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        background: BG_GRAD, position: 'relative',
      }}>
        <FloatingParticles />
        <div style={{
          fontFamily: FONT_TITLE, color: 'rgba(255,255,255,0.6)', fontSize: 18,
          letterSpacing: 4, textTransform: 'uppercase',
          animation: 'slideInUp 0.4s ease',
        }}>Today's Theme</div>
        <div style={{
          fontSize: 80,
          animation: 'themeReveal 0.8s 0.3s ease both',
        }}>{theme.emoji}</div>
        <div style={{
          fontFamily: FONT_TITLE, fontSize: 44, color: theme.accent,
          textShadow: `0 0 30px ${theme.accent}88, 0 4px 20px rgba(0,0,0,0.3)`,
          animation: 'themeReveal 0.8s 0.5s ease both',
        }}>{theme.name}</div>
        <div style={{
          color: 'rgba(255,255,255,0.7)', fontFamily: FONT_BODY, fontSize: 16,
          animation: 'slideInUp 0.8s 0.8s ease both',
        }}>{theme.hint}</div>
        <div style={{
          marginTop: 12, fontFamily: FONT_TITLE, color: 'white', fontSize: 14,
          opacity: 0.6, animation: 'pulse 1s ease-in-out infinite',
        }}>Get ready...</div>
      </div>
    );
  }

  // ─── DRESSING PHASE ─────────────────────────────────────────────────────
  if (phase === 'dressing') {
    const urgent = timer <= 10;
    return (
      <div style={{
        minHeight: '100vh', background: BG_GRAD,
        padding: '12px', fontFamily: FONT_BODY, position: 'relative',
      }}>
        <FloatingParticles />
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 5 }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
            flexWrap: 'wrap',
          }}>
            <button onClick={() => { clearInterval(timerRef.current); setPhase('runway'); }} style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none',
              borderRadius: 50, padding: '8px 16px', fontFamily: FONT_TITLE,
              fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}>Walk Now →</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{
                fontFamily: FONT_TITLE, color: theme.accent, fontSize: 16,
              }}>{theme.emoji} {theme.name}</span>
            </div>
            <div style={{
              fontFamily: FONT_TITLE, fontSize: 22, color: urgent ? '#FF6B6B' : 'white',
              background: urgent ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.1)',
              borderRadius: 50, padding: '6px 18px',
              animation: urgent ? 'timerPulse 0.5s ease-in-out infinite' : 'none',
              backdropFilter: 'blur(8px)',
            }}>⏱ {timer}s</div>
          </div>

          {/* Main layout */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Avatar Preview */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 20,
              padding: 16, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, minWidth: 160, flex: '0 0 auto',
              backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <StageAvatar outfit={outfit} skinColor={skinColor} size={1} />
              <div style={{
                fontFamily: FONT_TITLE, color: 'white', fontSize: 13, opacity: 0.8,
              }}>Preview</div>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY,
              }}>Tip: Match the {theme.name} theme!</div>
            </div>

            {/* Wardrobe Panel */}
            <div style={{ flex: 1, minWidth: 300 }}>
              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap',
              }}>
                {SLOT_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
                    color: activeTab === tab.id ? ACCENT_DARK : 'white',
                    border: 'none', borderRadius: 50, padding: '6px 12px',
                    fontFamily: FONT_TITLE, fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.15s', backdropFilter: 'blur(8px)',
                  }}>{tab.label}</button>
                ))}
              </div>

              {/* Items grid */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 16,
                padding: 14, backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {activeTab !== 'color' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: 8,
                  }}>
                    {(WARDROBE[activeTab] || []).map(item => {
                      const selected = outfit[activeTab] === item.id;
                      return (
                        <div key={item.id}
                          onClick={() => updateOutfit(activeTab, item.id)}
                          style={{
                            background: selected ? `${theme.accent}33` : 'rgba(255,255,255,0.06)',
                            border: selected ? `2px solid ${theme.accent}` : '2px solid transparent',
                            borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 26 }}>{item.emoji}</div>
                          <div style={{
                            fontFamily: FONT_TITLE, fontSize: 10, color: 'white',
                            marginTop: 4, opacity: 0.9,
                          }}>{item.label}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Color picker */
                  <div>
                    <div style={{
                      fontFamily: FONT_TITLE, color: 'white', fontSize: 13,
                      marginBottom: 10, opacity: 0.8,
                    }}>Pick colors for each piece</div>
                    {['topColor', 'bottomColor', 'shoeColor', 'hairColor'].map(ckey => (
                      <div key={ckey} style={{ marginBottom: 12 }}>
                        <div style={{
                          fontFamily: FONT_TITLE, color: 'rgba(255,255,255,0.6)',
                          fontSize: 11, marginBottom: 6, textTransform: 'capitalize',
                        }}>{ckey.replace('Color', '')}</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {COLOR_PALETTE.map(color => (
                            <div key={color}
                              onClick={() => updateOutfit(ckey, color)}
                              style={{
                                width: 26, height: 26, borderRadius: 6,
                                background: color, cursor: 'pointer',
                                border: outfit[ckey] === color
                                  ? '3px solid white'
                                  : '3px solid transparent',
                                boxShadow: outfit[ckey] === color
                                  ? `0 0 8px ${color}88` : 'none',
                                transition: 'all 0.12s',
                              }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNWAY ─────────────────────────────────────────────────────────────
  if (phase === 'runway') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        background: BG_GRAD, position: 'relative', padding: 20,
      }}>
        <FloatingParticles />
        <div style={{
          fontFamily: FONT_TITLE, color: 'white', fontSize: 22,
          animation: 'slideInUp 0.4s ease',
        }}>Walking the Runway...</div>
        <div style={{ width: '100%', maxWidth: 700, position: 'relative', zIndex: 5 }}>
          <Runway outfit={outfit} skinColor={skinColor} theme={theme} onFinish={finishRunway} />
        </div>
      </div>
    );
  }

  // ─── VOTING ─────────────────────────────────────────────────────────────
  if (phase === 'voting') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        background: BG_GRAD, position: 'relative', padding: 20,
      }}>
        <FloatingParticles />
        <div style={{
          fontFamily: FONT_TITLE, color: 'white', fontSize: 24,
          animation: 'slideInUp 0.4s ease',
        }}>The Judges Are Voting...</div>
        <div style={{ position: 'relative', zIndex: 5 }}>
          <StageAvatar outfit={outfit} skinColor={skinColor} size={0.7} glow />
        </div>
        <JudgePanel
          scores={scores}
          theme={theme}
          revealed={judgesRevealed}
          onAllRevealed={onAllJudgesRevealed}
        />
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const rank = getRank(totalStars);
    const avgStars = (totalStars / JUDGE_NAMES.length).toFixed(1);

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: BG_GRAD, position: 'relative', padding: 20,
        overflow: 'hidden',
      }}>
        <FloatingParticles />

        {/* Confetti */}
        {confetti.map(c => (
          <div key={c.id} style={{
            position: 'fixed', left: `${c.left}%`, bottom: -20,
            width: c.size, height: c.size, borderRadius: 2,
            background: c.color,
            animation: `confetti ${1.5 + c.delay}s ${c.delay}s ease-out forwards`,
            zIndex: 10,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <div style={{
            fontFamily: FONT_TITLE, color: theme.accent, fontSize: 16,
            textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4,
            animation: 'slideInUp 0.3s ease',
          }}>Round Complete</div>

          <div style={{
            fontFamily: FONT_TITLE, color: 'white', fontSize: 36,
            animation: 'slideInScale 0.5s 0.2s ease both',
          }}>{rank.emoji} {rank.name}</div>

          {/* Stats card */}
          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 24,
            padding: '24px 36px', marginTop: 16,
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
            animation: 'slideInUp 0.6s 0.3s ease both',
          }}>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <StageAvatar outfit={outfit} skinColor={skinColor} size={0.6} glow />
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: FONT_TITLE, color: theme.accent, fontSize: 14,
                  marginBottom: 8,
                }}>{theme.emoji} {theme.name}</div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{
                      fontSize: 24,
                      color: i < Math.round(parseFloat(avgStars)) ? '#FFD700' : '#555',
                      animation: `starPop 0.3s ${0.5 + i * 0.1}s ease both`,
                    }}>★</span>
                  ))}
                  <span style={{
                    fontFamily: FONT_TITLE, color: '#FFD700', fontSize: 20,
                    marginLeft: 4,
                  }}>{avgStars}</span>
                </div>

                <div style={{
                  fontFamily: FONT_TITLE, color: '#FFD700', fontSize: 18,
                  marginBottom: 4,
                }}>🪙 +{coinsEarned} coins</div>

                <div style={{
                  fontFamily: FONT_BODY, color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                }}>Total Stars: {totalStars}/{JUDGE_NAMES.length * 5}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center',
            animation: 'slideInUp 0.6s 0.6s ease both',
          }}>
            <button onClick={startGame} style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
              color: 'white', border: 'none', borderRadius: 50,
              padding: '14px 36px', fontFamily: FONT_TITLE, fontSize: 18,
              cursor: 'pointer', boxShadow: `0 6px 20px ${ACCENT}55`,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >Play Again ✨</button>
            <button onClick={onBack} style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none',
              borderRadius: 50, padding: '14px 28px', fontFamily: FONT_TITLE,
              fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(8px)',
            }}>← Lobby</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
