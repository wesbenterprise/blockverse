import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FLOATING_SYMBOLS = ['♩','♪','♫','♬','🎵','🎶','🎸','🎹','🥁','🎺','🎻'];

const SKIN_COLORS = [
  { label: 'Peach', value: '#FDBCB4', cost: 0 },
  { label: 'Tan', value: '#DDA07A', cost: 0 },
  { label: 'Brown', value: '#8B5E3C', cost: 0 },
  { label: 'Deep', value: '#4A2C17', cost: 0 },
  { label: 'Lavender', value: '#C9A7EB', cost: 50 },
  { label: 'Mint', value: '#98E4D0', cost: 50 },
  { label: 'Neon', value: '#39FF14', cost: 100 },
  { label: 'Gold', value: '#FFD700', cost: 150 },
];

const SHIRT_COLORS = [
  { label: 'Purple', value: '#6C5CE7', cost: 0 },
  { label: 'Coral', value: '#FF6B6B', cost: 0 },
  { label: 'Teal', value: '#00CEC9', cost: 0 },
  { label: 'Yellow', value: '#FDCB6E', cost: 0 },
  { label: 'Pink', value: '#FD79A8', cost: 0 },
  { label: 'Green', value: '#55EFC4', cost: 0 },
  { label: 'Rainbow', value: 'rainbow', cost: 200 },
  { label: 'Galaxy', value: '#2D1B69', cost: 150 },
];

const PANTS_COLORS = [
  { label: 'Dark', value: '#2D3436', cost: 0 },
  { label: 'Blue', value: '#0984E3', cost: 0 },
  { label: 'Brown', value: '#795548', cost: 0 },
  { label: 'Black', value: '#1a1a2e', cost: 0 },
  { label: 'White', value: '#F5F5F5', cost: 0 },
  { label: 'Camo', value: '#556B2F', cost: 75 },
];

const HATS = [
  { id: 'none', label: 'No Hat', icon: '🚫', cost: 0 },
  { id: 'cap', label: 'Cool Cap', icon: '🧢', cost: 0 },
  { id: 'tophat', label: 'Top Hat', icon: '🎩', cost: 75 },
  { id: 'crown', label: 'Crown', icon: '👑', cost: 200 },
  { id: 'headphones', label: 'Headphones', icon: '🎧', cost: 150 },
  { id: 'wizard', label: 'Wizard', icon: '🧙', cost: 125 },
];

const ACCESSORIES = [
  { id: 'none', label: 'None', icon: '🚫', cost: 0 },
  { id: 'guitar', label: 'Guitar', icon: '🎸', cost: 100 },
  { id: 'mic', label: 'Microphone', icon: '🎤', cost: 80 },
  { id: 'drumsticks', label: 'Drum Sticks', icon: '🥁', cost: 120 },
  { id: 'keyboard', label: 'Keyboard', icon: '🎹', cost: 175 },
  { id: 'trumpet', label: 'Trumpet', icon: '🎺', cost: 150 },
];

const GAMES = [
  { id: 'obby',    name: 'Obby Rush',     icon: '🏃', color: '#FF6B6B', bg: '#fff5f5', desc: 'Race & jump to the beat!',    note: '♩', coinReward: '10–30' },
  { id: 'sandbox', name: 'Beat Sandbox',  icon: '🧱', color: '#00CEC9', bg: '#f0fffe', desc: 'Build worlds with music!',     note: '♫', coinReward: '5–20'  },
  { id: 'mining',  name: 'Crystal Mine',  icon: '⛏️', color: '#FDCB6E', bg: '#fffdf0', desc: 'Dig ores to the rhythm!',     note: '♬', coinReward: '15–40' },
  { id: 'battle',  name: 'Beat Battle',   icon: '⚔️', color: '#6C5CE7', bg: '#f5f0ff', desc: 'Fight in sync with the beat!', note: '🎵', coinReward: '20–60' },
  { id: 'outfit',  name: 'Style Stage',   icon: '👗', color: '#FD79A8', bg: '#fff0f7', desc: 'Design, perform & get ranked!', note: '🎶', coinReward: '25–100'},
];

// ─── AVATAR SVG ───────────────────────────────────────────────────────────────
function AvatarSVG({ av, size = 1 }) {
  const { skinColor, shirtColor, pantsColor, hatId, accessoryId } = av;
  const w = 90 * size, h = 130 * size;

  const shirt = shirtColor === 'rainbow'
    ? 'url(#rainbowGrad)'
    : shirtColor === '#2D1B69'
    ? 'url(#galaxyGrad)'
    : shirtColor;

  const hatColor = {
    none: 'transparent', cap: '#FF6B6B', tophat: '#2D3436',
    crown: '#FFD700', headphones: '#6C5CE7', wizard: '#6C5CE7',
  }[hatId] || '#FF6B6B';

  return (
    <svg width={w} height={h} viewBox="0 0 90 130">
      <defs>
        <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B6B"/>
          <stop offset="33%" stopColor="#FDCB6E"/>
          <stop offset="66%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#00CEC9"/>
        </linearGradient>
        <linearGradient id="galaxyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D1B69"/>
          <stop offset="50%" stopColor="#6C5CE7"/>
          <stop offset="100%" stopColor="#FD79A8"/>
        </linearGradient>
      </defs>
      {hatId === 'cap' && (<>
        <rect x="16" y="22" width="58" height="14" rx="7" fill={hatColor}/>
        <rect x="20" y="14" width="50" height="14" rx="6" fill={hatColor}/>
        <rect x="60" y="28" width="20" height="8" rx="4" fill={hatColor}/>
        <rect x="35" y="15" width="20" height="5" rx="2" fill="white" opacity="0.3"/>
      </>)}
      {hatId === 'tophat' && (<>
        <rect x="10" y="24" width="70" height="7" rx="3" fill={hatColor}/>
        <rect x="22" y="4" width="46" height="22" rx="3" fill={hatColor}/>
        <rect x="24" y="6" width="42" height="6" rx="2" fill="white" opacity="0.15"/>
      </>)}
      {hatId === 'crown' && (<>
        <polygon points="22,28 22,10 34,18 45,6 56,18 68,10 68,28" fill={hatColor}/>
        {[28,45,62].map((x,i) => <circle key={i} cx={x} cy="11" r="4" fill="white" opacity="0.9"/>)}
      </>)}
      {hatId === 'headphones' && (<>
        <path d="M20 42 Q20 12 45 12 Q70 12 70 42" fill="none" stroke={hatColor} strokeWidth="6" strokeLinecap="round"/>
        <rect x="12" y="34" width="14" height="18" rx="6" fill={hatColor}/>
        <rect x="64" y="34" width="14" height="18" rx="6" fill={hatColor}/>
      </>)}
      {hatId === 'wizard' && (<>
        <polygon points="45,2 22,30 68,30" fill={hatColor}/>
        <rect x="16" y="27" width="58" height="7" rx="3" fill={hatColor}/>
        {[35,52,44].map((x,i) => <text key={i} x={x} y={25-i*6} fontSize="8" fill="gold">✦</text>)}
      </>)}
      <rect x="20" y="30" width="50" height="44" rx="10" fill={skinColor}/>
      <rect x="27" y="42" width="13" height="13" rx="3" fill="white"/>
      <rect x="50" y="42" width="13" height="13" rx="3" fill="white"/>
      <rect x="30" y="44" width="8" height="9" rx="2" fill="#2d3436"/>
      <rect x="53" y="44" width="8" height="9" rx="2" fill="#2d3436"/>
      <rect x="32" y="45" width="3" height="3" rx="1" fill="white"/>
      <rect x="55" y="45" width="3" height="3" rx="1" fill="white"/>
      <path d="M30 62 Q45 74 60 62" stroke="#2d3436" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="26" cy="62" rx="6" ry="4" fill="#FFB3C6" opacity="0.5"/>
      <ellipse cx="64" cy="62" rx="6" ry="4" fill="#FFB3C6" opacity="0.5"/>
      <rect x="18" y="76" width="54" height="32" rx="7" fill={shirt}/>
      <rect x="2" y="76" width="16" height="26" rx="7" fill={shirt}/>
      <rect x="72" y="76" width="16" height="26" rx="7" fill={shirt}/>
      <ellipse cx="10" cy="104" rx="8" ry="8" fill={skinColor}/>
      <ellipse cx="80" cy="104" rx="8" ry="8" fill={skinColor}/>
      <rect x="18" y="108" width="24" height="20" rx="5" fill={pantsColor}/>
      <rect x="48" y="108" width="24" height="20" rx="5" fill={pantsColor}/>
      {accessoryId === 'guitar'     && <text x="66" y="115" fontSize="22">🎸</text>}
      {accessoryId === 'mic'        && <text x="66" y="110" fontSize="20">🎤</text>}
      {accessoryId === 'drumsticks' && <text x="64" y="108" fontSize="20">🥁</text>}
      {accessoryId === 'keyboard'   && <text x="-4" y="108" fontSize="18">🎹</text>}
      {accessoryId === 'trumpet'    && <text x="64" y="108" fontSize="18">🎺</text>}
    </svg>
  );
}

function MusicBars({ count = 7, color = 'white', height = 32 }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'3px', height }}>
      {Array.from({length: count}, (_,i) => {
        const maxH = [0.5,0.9,0.4,1,0.7,0.35,0.8][i % 7];
        return (
          <div key={i} style={{
            width: 5, borderRadius: 3, background: color,
            animation: `musicBar ${0.35 + i * 0.09}s ${i * 0.06}s ease-in-out infinite alternate`,
            height: 8, '--maxH': `${Math.round(maxH * height)}px`,
          }}/>
        );
      })}
    </div>
  );
}

function FloatingParticles() {
  const particles = useRef(
    Array.from({length: 18}, (_, i) => ({
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
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:p.left, top:p.top,
          fontSize:p.size, opacity:0.25,
          animation:`floatNote ${p.dur} ${p.delay} ease-in-out infinite`,
        }}>{p.sym}</div>
      ))}
    </div>
  );
}

function GameCard({ game, onPlay }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onPlay} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? game.color : 'white',
        border: `3px solid ${game.color}`, borderRadius: 20,
        padding: '18px 14px', cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(.34,1.56,.64,1)',
        transform: hov ? 'scale(1.06) translateY(-5px)' : 'scale(1)',
        boxShadow: hov ? `0 12px 28px ${game.color}55` : '0 4px 14px rgba(0,0,0,0.08)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
      <div style={{position:'absolute',top:8,right:10,fontSize:13,opacity:hov?0.9:0.4,color:hov?'white':game.color,fontFamily:'monospace'}}>{game.note}</div>
      <div style={{fontSize:40,marginBottom:8}}>{game.icon}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:hov?'white':game.color,marginBottom:4}}>{game.name}</div>
      <div style={{fontSize:11,color:hov?'rgba(255,255,255,0.88)':'#777',fontFamily:'Nunito,sans-serif',marginBottom:8,lineHeight:1.4}}>{game.desc}</div>
      <div style={{display:'inline-block',background:hov?'rgba(255,255,255,0.25)':`${game.color}22`,color:hov?'white':game.color,borderRadius:50,padding:'3px 10px',fontSize:11,fontFamily:"'Fredoka One',cursive"}}>🪙 {game.coinReward} coins</div>
    </div>
  );
}

function Customizer({ av, setAv, coins, setCoins, onBack, owned, setOwned }) {
  const [tab, setTab] = useState('skin');
  const tabs = [
    { id:'skin', label:'🎨 Skin' }, { id:'shirt', label:'👕 Shirt' },
    { id:'pants', label:'👖 Pants' }, { id:'hat', label:'🎩 Hat' },
    { id:'acc', label:'🎸 Accessory' },
  ];
  const tryBuy = (key, value, cost) => {
    const itemKey = `${key}:${value}`;
    if (owned.has(itemKey) || cost === 0) { setAv(a => ({...a, [key]: value})); }
    else if (coins >= cost) { setCoins(c => c - cost); setOwned(s => new Set([...s, itemKey])); setAv(a => ({...a, [key]: value})); }
  };
  const isOwned = (key, value, cost) => cost === 0 || owned.has(`${key}:${value}`);

  const ColorGrid = ({ items, avKey }) => (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
      {items.map(item => {
        const active = av[avKey] === item.value;
        const got = isOwned(avKey, item.value, item.cost);
        return (
          <div key={item.value} onClick={() => tryBuy(avKey, item.value, item.cost)}
            style={{borderRadius:12,padding:'10px 6px',cursor:'pointer',textAlign:'center',border:active?'3px solid #6C5CE7':'3px solid transparent',background:active?'#f0eeff':'#f8f8f8',transition:'all 0.15s',opacity:(!got&&coins<item.cost)?0.5:1}}>
            <div style={{width:32,height:32,borderRadius:8,margin:'0 auto 6px',background:item.value==='rainbow'?'linear-gradient(90deg,#FF6B6B,#FDCB6E,#6C5CE7,#00CEC9)':item.value==='#2D1B69'?'linear-gradient(135deg,#2D1B69,#6C5CE7,#FD79A8)':item.value,border:'2px solid rgba(0,0,0,0.1)'}}/>
            <div style={{fontSize:10,fontFamily:'Nunito,sans-serif',color:'#555',fontWeight:700}}>{item.label}</div>
            {item.cost > 0 && <div style={{fontSize:10,color:got?'#00b894':'#e17055',fontFamily:'Nunito,sans-serif',fontWeight:800}}>{got?'✓ Owned':`🪙 ${item.cost}`}</div>}
          </div>
        );
      })}
    </div>
  );

  const ItemGrid = ({ items, avKey }) => (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
      {items.map(item => {
        const active = av[avKey] === item.id;
        const got = isOwned(avKey, item.id, item.cost);
        return (
          <div key={item.id} onClick={() => tryBuy(avKey, item.id, item.cost)}
            style={{borderRadius:14,padding:'12px 8px',cursor:'pointer',textAlign:'center',border:active?'3px solid #6C5CE7':'3px solid #eee',background:active?'#f0eeff':'white',transition:'all 0.15s',opacity:(!got&&coins<item.cost)?0.5:1}}>
            <div style={{fontSize:32,marginBottom:4}}>{item.icon}</div>
            <div style={{fontSize:12,fontFamily:"'Fredoka One',cursive",color:'#444',marginBottom:2}}>{item.label}</div>
            {item.cost > 0 && <div style={{fontSize:11,color:got?'#00b894':'#e17055',fontFamily:'Nunito,sans-serif',fontWeight:800}}>{got?'✓ Owned':`🪙 ${item.cost}`}</div>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#2D1B69,#6C5CE7,#FD79A8)',padding:'16px',fontFamily:'Nunito,sans-serif',position:'relative'}}>
      <FloatingParticles/>
      <div style={{maxWidth:780,margin:'0 auto',position:'relative',zIndex:5}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
          <button onClick={onBack} style={{background:'rgba(255,255,255,0.2)',color:'white',border:'none',borderRadius:50,padding:'10px 20px',cursor:'pointer',fontFamily:"'Fredoka One',cursive",fontSize:15,backdropFilter:'blur(10px)'}}>← Lobby</button>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:'white',flex:1}}>🎨 Avatar Studio</div>
          <div style={{background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'white',borderRadius:50,padding:'8px 18px',fontFamily:"'Fredoka One',cursive",fontSize:16,boxShadow:'0 4px 14px rgba(255,165,0,0.5)',animation:'coinPulse 2.5s ease-in-out infinite'}}>🪙 {coins.toLocaleString()}</div>
        </div>
        <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
          <div style={{background:'rgba(255,255,255,0.95)',borderRadius:24,padding:24,display:'flex',flexDirection:'column',alignItems:'center',gap:12,minWidth:180,flex:'0 0 180px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <div style={{background:'linear-gradient(135deg,#a29bfe,#fd79a8)',borderRadius:16,padding:'16px 12px',display:'flex',justifyContent:'center'}}>
              <AvatarSVG av={av} size={1.2}/>
            </div>
            <div style={{fontFamily:"'Fredoka One',cursive",color:'#444',fontSize:16,textAlign:'center'}}>Your Avatar</div>
            <div style={{fontSize:20,textAlign:'center'}}>{ACCESSORIES.find(a=>a.id===av.accessoryId)?.icon||'🚫'} {HATS.find(h=>h.id===av.hatId)?.icon||'🚫'}</div>
            <MusicBars count={5} color="#6C5CE7" height={24}/>
          </div>
          <div style={{flex:1,minWidth:260}}>
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{background:tab===t.id?'white':'rgba(255,255,255,0.2)',color:tab===t.id?'#6C5CE7':'white',border:'none',borderRadius:50,padding:'8px 14px',fontFamily:"'Fredoka One',cursive",fontSize:13,cursor:'pointer',transition:'all 0.15s',backdropFilter:'blur(8px)'}}>{t.label}</button>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.95)',borderRadius:20,padding:20,boxShadow:'0 6px 24px rgba(0,0,0,0.15)'}}>
              {tab==='skin'  && <ColorGrid items={SKIN_COLORS}  avKey="skinColor"/>}
              {tab==='shirt' && <ColorGrid items={SHIRT_COLORS} avKey="shirtColor"/>}
              {tab==='pants' && <ColorGrid items={PANTS_COLORS} avKey="pantsColor"/>}
              {tab==='hat'   && <ItemGrid  items={HATS}         avKey="hatId"/>}
              {tab==='acc'   && <ItemGrid  items={ACCESSORIES}  avKey="accessoryId"/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ game, onBack }) {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,background:`linear-gradient(135deg, ${game.color}44, ${game.color}22)`,position:'relative'}}>
      <FloatingParticles/>
      <div style={{fontSize:80}}>{game.icon}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:36,color:game.color}}>{game.name}</div>
      <div style={{background:'white',borderRadius:20,padding:'20px 32px',textAlign:'center',boxShadow:`0 8px 32px ${game.color}33`,maxWidth:340}}>
        <div style={{fontSize:40,marginBottom:8}}>🎵</div>
        <div style={{fontFamily:"'Fredoka One',cursive",color:'#444',fontSize:18,marginBottom:8}}>Coming in the next build!</div>
        <div style={{color:'#888',fontSize:14,fontFamily:'Nunito,sans-serif'}}>This game will feature live rhythm mechanics, coin rewards, and a unique musical twist!</div>
        <div style={{marginTop:14,background:`${game.color}22`,borderRadius:10,padding:'8px 16px',fontFamily:"'Fredoka One',cursive",color:game.color,fontSize:13}}>🪙 Earn {game.coinReward} coins per session</div>
      </div>
      <MusicBars count={9} color={game.color} height={40}/>
      <button onClick={onBack} style={{background:game.color,color:'white',border:'none',borderRadius:50,padding:'12px 32px',fontFamily:"'Fredoka One',cursive",fontSize:18,cursor:'pointer',boxShadow:`0 4px 16px ${game.color}55`}}>← Back to Lobby</button>
    </div>
  );
}

// ─── OBBY RUSH GAME ───────────────────────────────────────────────────────────
function ObbyRush({ avatar, onBack, coins, setCoins }) {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    player: { x: 80, y: 260, vy: 0, jumping: false, grounded: true },
    obstacles: [],
    particles: [],
    coins: [],
    score: 0,
    coinsCollected: 0,
    speed: 3.5,
    frame: 0,
    gameOver: false,
    started: false,
    beatPhase: 0,
    highScore: parseInt(localStorage.getItem('obby_high') || '0'),
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(null);

  const GRAVITY = 0.55;
  const JUMP_FORCE = -11;
  const GROUND_Y = 260;
  const CANVAS_W = 480;
  const CANVAS_H = 320;

  const jump = () => {
    const g = gameRef.current;
    if (g.gameOver) return;
    if (!g.started) { g.started = true; setStarted(true); }
    if (g.player.grounded) {
      g.player.vy = JUMP_FORCE;
      g.player.jumping = true;
      g.player.grounded = false;
    }
  };

  useEffect(() => {
    const handleKey = e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const spawnObstacle = () => {
      const g = gameRef.current;
      const types = [
        { w: 28, h: 36, color: '#FF6B6B' },
        { w: 22, h: 52, color: '#e17055' },
        { w: 40, h: 28, color: '#d63031' },
        { w: 18, h: 44, color: '#ff7675' },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      g.obstacles.push({ x: CANVAS_W + 20, y: GROUND_Y + 30 - t.h, w: t.w, h: t.h, color: t.color });
      // Coin above some obstacles
      if (Math.random() > 0.4) {
        g.coins.push({ x: CANVAS_W + 20 + t.w / 2 - 8, y: GROUND_Y + 30 - t.h - 40, w: 16, h: 16, collected: false });
      }
    };

    const loop = () => {
      const g = gameRef.current;
      g.frame++;

      // Beat pulse (120 BPM = every 30 frames at 60fps)
      g.beatPhase = (g.frame % 30) / 30;

      if (g.started && !g.gameOver) {
        // Speed increases over time
        g.speed = 3.5 + Math.floor(g.score / 500) * 0.5;

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
        if (g.frame % Math.max(55, 90 - Math.floor(g.score / 200) * 5) === 0) spawnObstacle();

        // Move obstacles
        g.obstacles.forEach(o => { o.x -= g.speed; });
        g.obstacles = g.obstacles.filter(o => o.x + o.w > -20);

        // Move coins
        g.coins.forEach(c => { c.x -= g.speed; });
        g.coins = g.coins.filter(c => c.x + c.w > -20 && !c.collected);

        // Collision (player hitbox is smaller than visual)
        const px = g.player.x + 6, py = g.player.y + 4, pw = 28, ph = 36;
        for (const o of g.obstacles) {
          if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
            g.gameOver = true;
            setGameOver(true);
            // Spawn crash particles
            for (let i = 0; i < 12; i++) {
              g.particles.push({
                x: g.player.x + 20, y: g.player.y + 20,
                vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
                life: 30 + Math.random() * 20,
                color: ['#FF6B6B', '#FDCB6E', '#6C5CE7', '#FD79A8'][Math.floor(Math.random() * 4)],
                size: 4 + Math.random() * 6,
              });
            }
            if (g.score > g.highScore) {
              g.highScore = g.score;
              localStorage.setItem('obby_high', g.score.toString());
            }
            const earned = g.coinsCollected;
            if (earned > 0) setCoins(c => c + earned);
            break;
          }
        }

        // Coin collection
        for (const c of g.coins) {
          if (!c.collected && px < c.x + c.w && px + pw > c.x && py < c.y + c.h && py + ph > c.y) {
            c.collected = true;
            g.coinsCollected++;
            // Sparkle
            for (let i = 0; i < 6; i++) {
              g.particles.push({
                x: c.x + 8, y: c.y + 8,
                vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                life: 20, color: '#FFD700', size: 3 + Math.random() * 3,
              });
            }
          }
        }

        // Score
        g.score++;
        setDisplayScore(g.score);
        setDisplayCoins(g.coinsCollected);
      }

      // Update particles
      g.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vy += 0.15; });
      g.particles = g.particles.filter(p => p.life > 0);

      // ─── DRAW ───
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
      // Ground pattern
      ctx.fillStyle = 'rgba(108,92,231,0.2)';
      for (let i = 0; i < 20; i++) {
        const gx = ((i * 32) - (g.frame * g.speed) % 32 + CANVAS_W) % CANVAS_W;
        ctx.fillRect(gx, GROUND_Y + 40, 16, 4);
      }

      // Obstacles (blocky style)
      g.obstacles.forEach(o => {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 6);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(o.x + 2, o.y + o.h - 6, o.w - 4, 4);
        // Block lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      });

      // Coins
      g.coins.filter(c => !c.collected).forEach(c => {
        const bounce = Math.sin(g.frame * 0.1 + c.x) * 3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + 8, c.y + 8 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(c.x + 8, c.y + 8 + bounce, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('¢', c.x + 8, c.y + 12 + bounce);
      });

      // Player (blocky avatar)
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
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px2 + 20, py + 14, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
      // Pants
      ctx.fillStyle = avatar.pantsColor;
      ctx.fillRect(px2 + 6, py + 34, 12, 10);
      ctx.fillRect(px2 + 22, py + 34, 12, 10);
      // Arms
      ctx.fillStyle = avatar.shirtColor === 'rainbow' ? '#FF6B6B' : avatar.shirtColor;
      const armSwing = Math.sin(g.frame * 0.2) * (g.player.jumping ? 15 : 5);
      ctx.save();
      ctx.translate(px2 + 4, py + 20);
      ctx.rotate(armSwing * Math.PI / 180);
      ctx.fillRect(-3, 0, 6, 14);
      ctx.restore();
      ctx.save();
      ctx.translate(px2 + 36, py + 20);
      ctx.rotate(-armSwing * Math.PI / 180);
      ctx.fillRect(-3, 0, 6, 14);
      ctx.restore();
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

      // Particles
      g.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(8, 8, 140, 28);
      ctx.fillStyle = 'white';
      ctx.font = "bold 13px 'Fredoka One', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${g.score}`, 16, 26);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`🪙 ${g.coinsCollected}`, 100, 26);

      if (g.score > 0 && g.highScore > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = "10px sans-serif";
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
        ctx.font = "16px sans-serif";
        ctx.fillText('Tap or press Space to jump', CANVAS_W / 2, CANVAS_H / 2 + 15);
        ctx.fillStyle = '#FDCB6E';
        ctx.fillText('Collect coins 🪙 • Dodge blocks!', CANVAS_W / 2, CANVAS_H / 2 + 40);
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
        ctx.font = "18px sans-serif";
        ctx.fillText(`Score: ${g.score}`, CANVAS_W / 2, CANVAS_H / 2 + 5);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🪙 +${g.coinsCollected} coins earned!`, CANVAS_W / 2, CANVAS_H / 2 + 30);
        if (g.score >= g.highScore && g.score > 0) {
          ctx.fillStyle = '#FDCB6E';
          ctx.font = "bold 14px sans-serif";
          ctx.fillText('🏆 NEW HIGH SCORE!', CANVAS_W / 2, CANVAS_H / 2 + 55);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = "14px sans-serif";
        ctx.fillText('Tap or press Space to play again', CANVAS_W / 2, CANVAS_H / 2 + 80);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleTap = () => {
    const g = gameRef.current;
    if (g.gameOver) {
      // Reset
      g.player = { x: 80, y: GROUND_Y, vy: 0, jumping: false, grounded: true };
      g.obstacles = []; g.particles = []; g.coins = [];
      g.score = 0; g.coinsCollected = 0; g.speed = 3.5;
      g.frame = 0; g.gameOver = false; g.started = true;
      setGameOver(false); setStarted(true);
      setDisplayScore(0); setDisplayCoins(0);
    } else {
      jump();
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#1a0533,#2D1B69,#6C5CE7)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,position:'relative',fontFamily:'Nunito,sans-serif'}}>
      <FloatingParticles/>
      <div style={{position:'relative',zIndex:5,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:16,width:'100%',maxWidth:CANVAS_W,justifyContent:'space-between'}}>
          <button onClick={onBack} style={{background:'rgba(255,255,255,0.2)',color:'white',border:'none',borderRadius:50,padding:'8px 18px',cursor:'pointer',fontFamily:"'Fredoka One',cursive",fontSize:14,backdropFilter:'blur(10px)'}}>← Lobby</button>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'white'}}>🏃 Obby Rush</div>
          <div style={{background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'white',borderRadius:50,padding:'6px 14px',fontFamily:"'Fredoka One',cursive",fontSize:14}}>🪙 {coins + displayCoins}</div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleTap}
          onTouchStart={e => { e.preventDefault(); handleTap(); }}
          style={{borderRadius:16,border:'3px solid rgba(255,255,255,0.2)',cursor:'pointer',maxWidth:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}
        />
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:12,textAlign:'center'}}>
          Tap the screen or press Space/↑ to jump
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const SAVE_KEY = 'blockverse_save';

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      coins: data.coins ?? 350,
      owned: new Set(data.owned || []),
      avatar: data.avatar || { skinColor: '#FDBCB4', shirtColor: '#6C5CE7', pantsColor: '#2D3436', hatId: 'cap', accessoryId: 'none' },
    };
  } catch { return null; }
}

function writeSave(coins, owned, avatar) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ coins, owned: [...owned], avatar }));
}

export default function BlockVerse() {
  const save = useRef(loadSave()).current;
  const [screen, setScreen] = useState('lobby');
  const [coins, setCoins] = useState(save?.coins ?? 350);
  const [owned, setOwned] = useState(save?.owned ?? new Set());
  const [avatar, setAvatar] = useState(save?.avatar ?? {
    skinColor: '#FDBCB4', shirtColor: '#6C5CE7',
    pantsColor: '#2D3436', hatId: 'cap', accessoryId: 'none',
  });

  // Auto-save on changes
  useEffect(() => { writeSave(coins, owned, avatar); }, [coins, owned, avatar]);

  const currentGame = GAMES.find(g => g.id === screen);
  if (screen === 'customizer') return <Customizer av={avatar} setAv={setAvatar} coins={coins} setCoins={setCoins} onBack={() => setScreen('lobby')} owned={owned} setOwned={setOwned}/>;
  if (screen === 'obby') return <ObbyRush avatar={avatar} onBack={() => setScreen('lobby')} coins={coins} setCoins={setCoins}/>;
  if (currentGame) return <ComingSoon game={currentGame} onBack={() => setScreen('lobby')}/>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes floatNote { 0%,100%{transform:translateY(0) rotate(-8deg);opacity:0.2;}50%{transform:translateY(-22px) rotate(8deg);opacity:0.45;} }
        @keyframes musicBar { from{height:8px;}to{height:var(--maxH);} }
        @keyframes coinPulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.07);} }
        @keyframes logoShimmer { 0%{background-position:0% center;}100%{background-position:200% center;} }
        @keyframes notesBounce { 0%,100%{transform:translateY(0) rotate(-5deg);}50%{transform:translateY(-10px) rotate(5deg);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
      `}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#1a0533 0%,#2D1B69 40%,#6C5CE7 80%,#FD79A8 100%)',position:'relative',overflow:'hidden',fontFamily:'Nunito,sans-serif'}}>
        <FloatingParticles/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 24px',background:'rgba(255,255,255,0.08)',backdropFilter:'blur(14px)',borderBottom:'1.5px solid rgba(255,255,255,0.15)',position:'relative',zIndex:10}}>
          <MusicBars count={7} color="rgba(255,255,255,0.7)" height={32}/>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:32,background:'linear-gradient(90deg,#fff,#FD79A8,#FDCB6E,#00CEC9,#fff)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'logoShimmer 4s linear infinite',letterSpacing:1}}>🎵 BlockVerse 🧱</div>
          <div style={{background:'linear-gradient(135deg,#FFD700,#FF8C00)',color:'white',borderRadius:50,padding:'9px 20px',fontFamily:"'Fredoka One',cursive",fontSize:17,display:'flex',alignItems:'center',gap:7,boxShadow:'0 4px 18px rgba(255,140,0,0.45)',animation:'coinPulse 2.5s ease-in-out infinite'}}>🪙 {coins.toLocaleString()}</div>
        </div>
        <div style={{maxWidth:960,margin:'0 auto',padding:'28px 18px',position:'relative',zIndex:5}}>
          <div style={{background:'rgba(255,255,255,0.96)',borderRadius:28,padding:28,marginBottom:28,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',boxShadow:'0 12px 40px rgba(0,0,0,0.25)',animation:'slideUp 0.6s ease both'}}>
            <div style={{background:'linear-gradient(135deg,#a29bfe,#fd79a8)',borderRadius:20,padding:'14px 10px',flexShrink:0,display:'flex',alignItems:'center'}}>
              <AvatarSVG av={avatar}/>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:30,color:'#2d3436',marginBottom:4}}>Welcome to BlockVerse! 👋</div>
              <div style={{color:'#636e72',fontSize:15,marginBottom:6,lineHeight:1.5}}>🎵 Every game has a beat. Every block has a rhythm.<br/>Play games, earn coins, and build your ultimate avatar!</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
                <button onClick={() => setScreen('customizer')} style={{background:'linear-gradient(135deg,#6C5CE7,#a29bfe)',color:'white',border:'none',borderRadius:50,padding:'11px 24px',fontFamily:"'Fredoka One',cursive",fontSize:16,cursor:'pointer',boxShadow:'0 4px 16px rgba(108,92,231,0.4)',transition:'transform 0.15s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>🎨 Customize Avatar</button>
                <div style={{background:'#fff5f5',border:'2px solid #FF6B6B',borderRadius:50,padding:'10px 20px',fontFamily:"'Fredoka One',cursive",color:'#FF6B6B',fontSize:14}}>🏆 Level 1 Rookie</div>
              </div>
            </div>
            <div style={{textAlign:'center',opacity:0.85}}>
              <div style={{fontSize:36,animation:'notesBounce 2s ease-in-out infinite'}}>🎶</div>
              <div style={{fontSize:12,fontFamily:"'Fredoka One',cursive",color:'#b2bec3',marginTop:4}}>On Beat!</div>
              <MusicBars count={4} color="#6C5CE7" height={20}/>
            </div>
          </div>
          <div style={{textAlign:'center',marginBottom:20,fontFamily:"'Fredoka One',cursive",fontSize:24,color:'white',textShadow:'0 2px 12px rgba(0,0,0,0.4)',animation:'slideUp 0.7s 0.1s ease both',opacity:0,animationFillMode:'forwards'}}>🎮 Choose Your Game World</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))',gap:16,animation:'slideUp 0.7s 0.2s ease both',opacity:0,animationFillMode:'forwards'}}>
            {GAMES.map(game => <GameCard key={game.id} game={game} onPlay={() => setScreen(game.id)}/>)}
          </div>
          <div style={{marginTop:28,background:'rgba(255,255,255,0.1)',backdropFilter:'blur(12px)',borderRadius:18,padding:'16px 24px',border:'2px dashed rgba(255,255,255,0.3)',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',justifyContent:'center',animation:'slideUp 0.7s 0.3s ease both',opacity:0,animationFillMode:'forwards'}}>
            <MusicBars count={5} color="rgba(255,255,255,0.8)" height={24}/>
            <span style={{fontFamily:"'Fredoka One',cursive",color:'white',fontSize:16,textAlign:'center'}}>🎵 Hit notes on the beat for bonus coins &nbsp;•&nbsp; 🧱 Every block you place plays a sound &nbsp;•&nbsp; 🏆 Top the leaderboard!</span>
            <MusicBars count={5} color="rgba(255,255,255,0.8)" height={24}/>
          </div>
        </div>
      </div>
    </>
  );
}
