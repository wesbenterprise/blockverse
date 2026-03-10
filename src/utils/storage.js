import { SAVE_KEY, DEFAULT_AVATAR, STARTING_COINS } from './constants.js';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      coins: data.coins ?? STARTING_COINS,
      xp: data.xp ?? 0,
      owned: new Set(data.owned || []),
      avatar: data.avatar || { ...DEFAULT_AVATAR },
      lastLoginDate: data.lastLoginDate || '',
    };
  } catch {
    return null;
  }
}

export function writeSave(coins, owned, avatar, xp, lastLoginDate) {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      coins,
      owned: [...owned],
      avatar,
      xp,
      lastLoginDate,
    })
  );
}
