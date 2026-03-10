// ─── LEVEL SYSTEM ────────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 170, 230, 300];

const LEVEL_TITLES = {
  1: 'Rookie',
  2: 'Listener',
  3: 'Beat Maker',
  4: 'Groove Finder',
  5: 'Rhythm Star',
  6: 'Sound Surfer',
  7: 'Mix Master',
  8: 'Music Master',
  9: 'Melody King',
  10: 'BlockVerse Legend',
};

const MAX_LEVEL = 10;

export function getLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelTitle(level) {
  return LEVEL_TITLES[level] || 'Rookie';
}

export function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  if (lvl >= MAX_LEVEL) return 1;
  const cur = LEVEL_THRESHOLDS[lvl - 1];
  const next = LEVEL_THRESHOLDS[lvl];
  return (xp - cur) / (next - cur);
}

export function getNextLevelXp(xp) {
  const lvl = getLevel(xp);
  if (lvl >= MAX_LEVEL) return null;
  return LEVEL_THRESHOLDS[lvl];
}

export { MAX_LEVEL, LEVEL_THRESHOLDS };
