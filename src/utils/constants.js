// ─── FLOATING SYMBOLS ─────────────────────────────────────────────────────────
export const FLOATING_SYMBOLS = ['♩','♪','♫','♬','🎵','🎶','🎸','🎹','🥁','🎺','🎻'];

// ─── AVATAR CUSTOMIZATION OPTIONS ─────────────────────────────────────────────
export const SKIN_COLORS = [
  { label: 'Peach', value: '#FDBCB4', cost: 0 },
  { label: 'Tan', value: '#DDA07A', cost: 0 },
  { label: 'Brown', value: '#8B5E3C', cost: 0 },
  { label: 'Deep', value: '#4A2C17', cost: 0 },
  { label: 'Lavender', value: '#C9A7EB', cost: 50 },
  { label: 'Mint', value: '#98E4D0', cost: 50 },
  { label: 'Neon', value: '#39FF14', cost: 100 },
  { label: 'Gold', value: '#FFD700', cost: 150 },
];

export const SHIRT_COLORS = [
  { label: 'Purple', value: '#6C5CE7', cost: 0 },
  { label: 'Coral', value: '#FF6B6B', cost: 0 },
  { label: 'Teal', value: '#00CEC9', cost: 0 },
  { label: 'Yellow', value: '#FDCB6E', cost: 0 },
  { label: 'Pink', value: '#FD79A8', cost: 0 },
  { label: 'Green', value: '#55EFC4', cost: 0 },
  { label: 'Rainbow', value: 'rainbow', cost: 200 },
  { label: 'Galaxy', value: '#2D1B69', cost: 150 },
];

export const PANTS_COLORS = [
  { label: 'Dark', value: '#2D3436', cost: 0 },
  { label: 'Blue', value: '#0984E3', cost: 0 },
  { label: 'Brown', value: '#795548', cost: 0 },
  { label: 'Black', value: '#1a1a2e', cost: 0 },
  { label: 'White', value: '#F5F5F5', cost: 0 },
  { label: 'Camo', value: '#556B2F', cost: 75 },
];

export const HATS = [
  { id: 'none', label: 'No Hat', icon: '🚫', cost: 0 },
  { id: 'cap', label: 'Cool Cap', icon: '🧢', cost: 0 },
  { id: 'tophat', label: 'Top Hat', icon: '🎩', cost: 75 },
  { id: 'crown', label: 'Crown', icon: '👑', cost: 200 },
  { id: 'headphones', label: 'Headphones', icon: '🎧', cost: 150 },
  { id: 'wizard', label: 'Wizard', icon: '🧙', cost: 125 },
];

export const ACCESSORIES = [
  { id: 'none', label: 'None', icon: '🚫', cost: 0 },
  { id: 'guitar', label: 'Guitar', icon: '🎸', cost: 100 },
  { id: 'mic', label: 'Microphone', icon: '🎤', cost: 80 },
  { id: 'drumsticks', label: 'Drum Sticks', icon: '🥁', cost: 120 },
  { id: 'keyboard', label: 'Keyboard', icon: '🎹', cost: 175 },
  { id: 'trumpet', label: 'Trumpet', icon: '🎺', cost: 150 },
];

// ─── DEFAULT AVATAR ───────────────────────────────────────────────────────────
export const DEFAULT_AVATAR = {
  skinColor: '#FDBCB4',
  shirtColor: '#6C5CE7',
  pantsColor: '#2D3436',
  hatId: 'cap',
  accessoryId: 'none',
};

// ─── GAME DEFINITIONS ─────────────────────────────────────────────────────────
export const GAMES = [
  { id: 'obby',    name: 'Obby Rush',     icon: '🏃', color: '#FF6B6B', bg: '#fff5f5', desc: 'Race & jump to the beat!',    note: '♩', coinReward: '10–30' },
  { id: 'sandbox', name: 'Beat Sandbox',  icon: '🧱', color: '#00CEC9', bg: '#f0fffe', desc: 'Build worlds with music!',     note: '♫', coinReward: '5–20'  },
  { id: 'mining',  name: 'Crystal Mine',  icon: '⛏️', color: '#FDCB6E', bg: '#fffdf0', desc: 'Dig ores to the rhythm!',     note: '♬', coinReward: '15–40' },
  { id: 'battle',  name: 'Beat Battle',   icon: '⚔️', color: '#6C5CE7', bg: '#f5f0ff', desc: 'Fight in sync with the beat!', note: '🎵', coinReward: '20–60' },
  { id: 'outfit',  name: 'Style Stage',   icon: '👗', color: '#FD79A8', bg: '#fff0f7', desc: 'Design, perform & get ranked!', note: '🎶', coinReward: '25–100'},
];

// ─── OBBY RUSH GAME CONSTANTS ─────────────────────────────────────────────────
export const OBBY = {
  GRAVITY: 0.55,
  JUMP_FORCE: -11,
  GROUND_Y: 260,
  CANVAS_W: 480,
  CANVAS_H: 320,
  BASE_SPEED: 3.5,
  SPEED_INCREMENT: 0.5,
  SPEED_SCORE_INTERVAL: 500,
  INITIAL_LIVES: 3,
  MAX_LIVES: 3,
  INVINCIBILITY_FRAMES: 90,
  BOUNCE_FORCE_MULTIPLIER: 0.7,
  LANDING_BONUS_SCORE: 25,
  XP_PER_SCORE_UNIT: 50,
  COIN_COLLECTION_PADDING: 12,
  MAGNET_DURATION_FRAMES: 300,
  MAGNET_ATTRACT_RADIUS: 150,
  MAGNET_ATTRACT_STRENGTH: 0.15,
  MAGNET_SPAWN_SCORE_THRESHOLD: 200,
  MAGNET_SPAWN_CHANCE: 0.03,
  HEART_SPAWN_CHANCE: 0.08,
  COIN_SPAWN_CHANCE: 0.6,
  GAP_OBSTACLE_SCORE_THRESHOLD: 500,
  GAP_OBSTACLE_CHANCE: 0.15,
  MOVING_OBSTACLE_SCORE_THRESHOLD: 300,
  MOVING_OBSTACLE_CHANCE: 0.2,
  BASE_SPAWN_INTERVAL: 90,
  MIN_SPAWN_INTERVAL: 55,
  SPAWN_INTERVAL_REDUCTION_PER_STEP: 5,
  SPAWN_INTERVAL_SCORE_STEP: 200,
  BEAT_BPM: 120,
  BEAT_FRAMES_PER_BEAT: 30,
  OBSTACLE_TYPES: [
    { w: 28, h: 36, color: '#FF6B6B' },
    { w: 22, h: 52, color: '#e17055' },
    { w: 40, h: 28, color: '#d63031' },
    { w: 18, h: 44, color: '#ff7675' },
  ],
  PLAYER_HITBOX: { xOffset: 6, yOffset: 4, w: 28, h: 36 },
  LANDING_THRESHOLD: 10,
  COMBO_BONUS_INTERVAL: 5,
  HIGH_SCORE_KEY: 'obby_high',
};

// ─── BEAT SANDBOX CONSTANTS ───────────────────────────────────────────────────
export const SANDBOX = {
  STEPS: 16,
  BPM_OPTIONS: [80, 100, 120, 140, 160],
  DEFAULT_BPM: 120,
  MAX_COIN_REWARD: 20,
  COINS_PER_INSTRUMENT: 2,
  MAX_XP_PER_SESSION: 10,
  XP_INTERVAL_SECONDS: 15,
  GRID_SAVE_KEY: 'beat_sandbox_grid',
  INSTRUMENTS: [
    { id: 'kick',    label: '🥁', name: 'Kick',    freq: 80,  type: 'kick',    color: '#FF6B6B' },
    { id: 'snare',   label: '🪘', name: 'Snare',   freq: 200, type: 'snare',   color: '#FDCB6E' },
    { id: 'hihat',   label: '🔔', name: 'Hi-Hat',  freq: 800, type: 'hihat',   color: '#6C5CE7' },
    { id: 'bass',    label: '🎸', name: 'Bass',    freq: 110, type: 'bass',    color: '#00b894' },
    { id: 'synth1',  label: '🎹', name: 'Synth C', freq: 262, type: 'synth',   color: '#e17055' },
    { id: 'synth2',  label: '🎵', name: 'Synth E', freq: 330, type: 'synth',   color: '#FD79A8' },
    { id: 'synth3',  label: '🎶', name: 'Synth G', freq: 392, type: 'synth',   color: '#74b9ff' },
    { id: 'clap',    label: '👏', name: 'Clap',    freq: 400, type: 'clap',    color: '#a29bfe' },
  ],
  RANDOM_DENSITIES: {
    kick: 0.25,
    snare: 0.15,
    hihat: 0.4,
    default: 0.12,
  },
};

// ─── LOBBY / APP CONSTANTS ────────────────────────────────────────────────────
export const DAILY_LOGIN_BONUS = 25;
export const LEVEL_UP_COIN_MULTIPLIER = 10;
export const STARTING_COINS = 350;
export const SAVE_KEY = 'blockverse_save';
export const TOAST_DURATION_MS = 3000;
export const COIN_TOAST_DURATION_MS = 2500;

// ─── PROCEDURAL MUSIC CONSTANTS ───────────────────────────────────────────────
export const MUSIC = {
  BPM: 90,
  MASTER_VOLUME: 0.12,
  PAD_FREQUENCIES: [130.81, 164.81, 196.00, 246.94],
  PAD_VOLUME: 0.06,
  KICK_FREQ_START: 60,
  KICK_FREQ_END: 25,
  KICK_VOLUME: 0.15,
  OFFBEAT_FREQ_START: 50,
  OFFBEAT_FREQ_END: 25,
  OFFBEAT_VOLUME: 0.08,
};
