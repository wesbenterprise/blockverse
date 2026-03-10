import { useState } from 'react';
import AvatarSVG from './AvatarSVG.jsx';
import MusicBars from './MusicBars.jsx';
import FloatingParticles from './FloatingParticles.jsx';
import {
  SKIN_COLORS, SHIRT_COLORS, PANTS_COLORS,
  HATS, ACCESSORIES,
} from '../utils/constants.js';

const TABS = [
  { id: 'skin', label: '🎨 Skin' },
  { id: 'shirt', label: '👕 Shirt' },
  { id: 'pants', label: '👖 Pants' },
  { id: 'hat', label: '🎩 Hat' },
  { id: 'acc', label: '🎸 Accessory' },
];

function ColorGrid({ items, avKey, av, coins, tryBuy, isOwned, cantAfford }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      {items.map(item => {
        const active = av[avKey] === item.value;
        const got = isOwned(avKey, item.value, item.cost);
        const shaking = cantAfford && cantAfford.key === avKey && cantAfford.value === item.value;
        return (
          <div key={item.value} onClick={() => tryBuy(avKey, item.value, item.cost)}
            style={{
              borderRadius: 12, padding: '10px 6px', cursor: 'pointer', textAlign: 'center',
              border: active ? '3px solid #6C5CE7' : '3px solid transparent',
              background: active ? '#f0eeff' : '#f8f8f8',
              transition: 'all 0.15s',
              opacity: (!got && coins < item.cost) ? 0.5 : 1,
              animation: shaking ? 'custShake 0.3s ease' : 'none',
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, margin: '0 auto 6px',
              background: item.value === 'rainbow'
                ? 'linear-gradient(90deg,#FF6B6B,#FDCB6E,#6C5CE7,#00CEC9)'
                : item.value === '#2D1B69'
                ? 'linear-gradient(135deg,#2D1B69,#6C5CE7,#FD79A8)'
                : item.value,
              border: '2px solid rgba(0,0,0,0.1)',
            }} />
            <div style={{ fontSize: 10, fontFamily: 'Nunito,sans-serif', color: '#555', fontWeight: 700 }}>
              {item.label}
            </div>
            {item.cost > 0 && (
              <div style={{ fontSize: 10, color: got ? '#00b894' : '#e17055', fontFamily: 'Nunito,sans-serif', fontWeight: 800 }}>
                {got ? '✓ Owned' : `🪙 ${item.cost}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItemGrid({ items, avKey, av, coins, tryBuy, isOwned, cantAfford }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {items.map(item => {
        const active = av[avKey] === item.id;
        const got = isOwned(avKey, item.id, item.cost);
        const shaking = cantAfford && cantAfford.key === avKey && cantAfford.value === item.id;
        return (
          <div key={item.id} onClick={() => tryBuy(avKey, item.id, item.cost)}
            style={{
              borderRadius: 14, padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
              border: active ? '3px solid #6C5CE7' : '3px solid #eee',
              background: active ? '#f0eeff' : 'white',
              transition: 'all 0.15s',
              opacity: (!got && coins < item.cost) ? 0.5 : 1,
              animation: shaking ? 'custShake 0.3s ease' : 'none',
            }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontFamily: "'Fredoka One',cursive", color: '#444', marginBottom: 2 }}>
              {item.label}
            </div>
            {item.cost > 0 && (
              <div style={{ fontSize: 11, color: got ? '#00b894' : '#e17055', fontFamily: 'Nunito,sans-serif', fontWeight: 800 }}>
                {got ? '✓ Owned' : `🪙 ${item.cost}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Customizer({ av, setAv, coins, setCoins, onBack, owned, setOwned }) {
  const [tab, setTab] = useState('skin');
  const [cantAfford, setCantAfford] = useState(null);

  const tryBuy = (key, value, cost) => {
    const itemKey = `${key}:${value}`;
    if (owned.has(itemKey) || cost === 0) {
      setAv(a => ({ ...a, [key]: value }));
    } else if (coins >= cost) {
      setCoins(c => c - cost);
      setOwned(s => new Set([...s, itemKey]));
      setAv(a => ({ ...a, [key]: value }));
    } else {
      setCantAfford({ key, value, need: cost - coins });
      setTimeout(() => setCantAfford(null), 1500);
    }
  };

  const isOwned = (key, value, cost) => cost === 0 || owned.has(`${key}:${value}`);

  const gridProps = { av, coins, tryBuy, isOwned, cantAfford };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#2D1B69,#6C5CE7,#FD79A8)',
      padding: '16px',
      fontFamily: 'Nunito,sans-serif',
      position: 'relative',
    }}>
      <FloatingParticles />

      {cantAfford && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#e17055,#d63031)', color: 'white',
          borderRadius: 16, padding: '12px 28px',
          fontFamily: "'Fredoka One',cursive", fontSize: 16,
          boxShadow: '0 6px 24px rgba(214,48,49,0.5)', zIndex: 100,
          animation: 'slideUp 0.4s ease',
        }}>
          Need {cantAfford.need} more coins!
        </div>
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
            borderRadius: 50, padding: '10px 20px', cursor: 'pointer',
            fontFamily: "'Fredoka One',cursive", fontSize: 15, backdropFilter: 'blur(10px)',
          }}>← Lobby</button>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: 'white', flex: 1 }}>
            🎨 Avatar Studio
          </div>
          <div style={{
            background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: 'white',
            borderRadius: 50, padding: '8px 18px',
            fontFamily: "'Fredoka One',cursive", fontSize: 16,
            boxShadow: '0 4px 14px rgba(255,165,0,0.5)',
            animation: 'coinPulse 2.5s ease-in-out infinite',
          }}>🪙 {coins.toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar Preview */}
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            minWidth: 180, flex: '0 0 180px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg,#a29bfe,#fd79a8)', borderRadius: 16,
              padding: '16px 12px', display: 'flex', justifyContent: 'center',
            }}>
              <AvatarSVG av={av} size={1.2} />
            </div>
            <div style={{ fontFamily: "'Fredoka One',cursive", color: '#444', fontSize: 16, textAlign: 'center' }}>
              Your Avatar
            </div>
            <div style={{ fontSize: 20, textAlign: 'center' }}>
              {ACCESSORIES.find(a => a.id === av.accessoryId)?.icon || '🚫'}{' '}
              {HATS.find(h => h.id === av.hatId)?.icon || '🚫'}
            </div>
            <MusicBars count={5} color="#6C5CE7" height={24} />
          </div>

          {/* Options Panel */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  background: tab === t.id ? 'white' : 'rgba(255,255,255,0.2)',
                  color: tab === t.id ? '#6C5CE7' : 'white',
                  border: 'none', borderRadius: 50, padding: '8px 14px',
                  fontFamily: "'Fredoka One',cursive", fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s', backdropFilter: 'blur(8px)',
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20,
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            }}>
              {tab === 'skin' && <ColorGrid items={SKIN_COLORS} avKey="skinColor" {...gridProps} />}
              {tab === 'shirt' && <ColorGrid items={SHIRT_COLORS} avKey="shirtColor" {...gridProps} />}
              {tab === 'pants' && <ColorGrid items={PANTS_COLORS} avKey="pantsColor" {...gridProps} />}
              {tab === 'hat' && <ItemGrid items={HATS} avKey="hatId" {...gridProps} />}
              {tab === 'acc' && <ItemGrid items={ACCESSORIES} avKey="accessoryId" {...gridProps} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
