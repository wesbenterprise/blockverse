import { useState, useEffect, useRef } from 'react';

// Components
import Lobby from './components/Lobby.jsx';
import ObbyRush from './components/ObbyRush.jsx';
import BeatSandbox from './components/BeatSandbox.jsx';
import Customizer from './components/Customizer.jsx';
import ComingSoon from './components/ComingSoon.jsx';
import CrystalMine from './components/CrystalMine.jsx';

// Utilities
import { resumeAudioCtx, startProceduralMusic } from './utils/audio.js';
import { loadSave, writeSave } from './utils/storage.js';
import { getLevel } from './utils/levels.js';
import {
  GAMES, DEFAULT_AVATAR, STARTING_COINS,
  DAILY_LOGIN_BONUS, LEVEL_UP_COIN_MULTIPLIER, TOAST_DURATION_MS,
} from './utils/constants.js';

export default function BlockVerse() {
  const [save] = useState(() => loadSave());
  const [screen, setScreen] = useState('lobby');
  const [coins, setCoins] = useState(save?.coins ?? STARTING_COINS);
  const [xp, setXp] = useState(save?.xp ?? 0);
  const [owned, setOwned] = useState(save?.owned ?? new Set());
  const [avatar, setAvatar] = useState(save?.avatar ?? { ...DEFAULT_AVATAR });
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [dailyToast, setDailyToast] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState(0);
  const musicRef = useRef(null);
  const lastLoginRef = useRef(save?.lastLoginDate || '');
  const prevLevelRef = useRef(getLevel(save?.xp ?? 0));

  // Daily login bonus
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastLoginRef.current !== today) {
      setCoins(c => c + DAILY_LOGIN_BONUS);
      lastLoginRef.current = today;
      setDailyToast(true);
      setTimeout(() => setDailyToast(false), TOAST_DURATION_MS);
    }
  }, []);

  // Level up detection
  useEffect(() => {
    const newLevel = getLevel(xp);
    if (newLevel > prevLevelRef.current) {
      setCoins(c => c + newLevel * LEVEL_UP_COIN_MULTIPLIER);
      setLevelUpToast(newLevel);
      setTimeout(() => setLevelUpToast(0), TOAST_DURATION_MS);
    }
    prevLevelRef.current = newLevel;
  }, [xp]);

  // Procedural background music toggle
  const toggleMusic = () => {
    if (musicPlaying) {
      if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; }
    } else {
      resumeAudioCtx();
      musicRef.current = startProceduralMusic();
    }
    setMusicPlaying(!musicPlaying);
  };

  // Auto-save on changes (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      writeSave(coins, owned, avatar, xp, lastLoginRef.current);
    }, 500);
    return () => clearTimeout(id);
  }, [coins, owned, avatar, xp]);

  // Route to screens
  const goToLobby = () => setScreen('lobby');

  if (screen === 'customizer') {
    return <Customizer av={avatar} setAv={setAvatar} coins={coins} setCoins={setCoins} onBack={goToLobby} owned={owned} setOwned={setOwned} />;
  }
  if (screen === 'obby') {
    return <ObbyRush avatar={avatar} onBack={goToLobby} coins={coins} setCoins={setCoins} setXp={setXp} />;
  }
  if (screen === 'sandbox' || screen === 'beats') {
    return <BeatSandbox onBack={goToLobby} coins={coins} setCoins={setCoins} setXp={setXp} />;
  }
  if (screen === 'mining') {
    return <CrystalMine onBack={goToLobby} coins={coins} setCoins={setCoins} setXp={setXp} />;
  }

  const currentGame = GAMES.find(g => g.id === screen);
  if (currentGame) {
    return <ComingSoon game={currentGame} onBack={goToLobby} />;
  }

  return (
    <Lobby
      avatar={avatar}
      coins={coins}
      xp={xp}
      onNavigate={setScreen}
      onToggleMusic={toggleMusic}
      musicPlaying={musicPlaying}
      dailyToast={dailyToast}
      levelUpToast={levelUpToast}
    />
  );
}
