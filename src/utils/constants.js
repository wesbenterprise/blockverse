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
  { id: 'towers',  name: 'Echo Towers',   icon: '🏗️', color: '#F5A623', bg: '#fff8f0', desc: 'Build musical towers!',        note: '🎵', coinReward: '20-60' },
  { id: 'battle',  name: 'Beat Battle',   icon: '⚔️', color: '#6C5CE7', bg: '#f5f0ff', desc: 'Fight in sync with the beat!', note: '🎵', coinReward: '20–60' },
  { id: 'outfit',  name: 'Style Stage',   icon: '👗', color: '#FD79A8', bg: '#fff0f7', desc: 'Design, perform & get ranked!', note: '🎶', coinReward: '25–100'},
];

// ─── OBBY RUSH GAME CONSTANTS ─────────────────────────────────────────────────
export const OBBY = {
  GRAVITY: 0.55,
  JUMP_FORCE: -11,
  GROUND_Y: 260,
  CANVAS_W: 800,
  CANVAS_H: 500,
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
  BEAT_TIMING_WINDOW: 5, // ±5 frames from beat peak for on-beat detection
  CHECKPOINT_SCORE_INTERVAL: 500,
  CHECKPOINT_COINS: 15,
  CHECKPOINT_WIDTH: 60,
  CHECKPOINT_HEIGHT: 20,
  CHECKPOINT_COLOR: '#FFD700',
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
  MAX_COINS_PER_SESSION: 40,
  MIN_LOOPS_FOR_REWARD: 2,
  GRID_SAVE_KEY: 'beat_sandbox_grid',
  BEAT_SAVES_KEY: 'beat_sandbox_saves',
  MAX_SAVES: 10,
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
export const PLAYABLE_GAME_IDS = ['obby', 'sandbox', 'mining', 'towers', 'outfit'];
export const COIN_TOAST_DURATION_MS = 2500;

// ─── CRYSTAL MINE CONSTANTS ──────────────────────────────────────────────────
export const CRYSTAL_MINE = {
  CANVAS_W: 480,
  CANVAS_H: 400,
  HUD_TOP_H: 40,
  HUD_BOTTOM_H: 36,
  SHAFT_Y: 40,
  SHAFT_H: 324,
  BLOCK_SIZE: 80,
  BLOCK_GAP: 8,
  GRID_COLS: 3,
  GRID_X_OFFSET: 112, // (480 - 256) / 2
  GRID_WIDTH: 256,     // 80+8+80+8+80
  VISIBLE_ROWS: 4,
  ORES_PER_LAYER: 8,
  MAX_MISSES: 5,
  MISS_TIMEOUT_BEATS: 2,
  HIGH_SCORE_KEY: 'crystal_mine_best',

  // Column cycle for 8 ores: center, left, right, center, left, right, center, left
  COLUMN_CYCLE: [1, 0, 2, 1, 0, 2, 1, 0],

  // Colors
  BG_SHAFT: '#1a1a2e',
  WALL_COLOR: '#2d2d44',
  WALL_ACCENT: '#3d3d5c',
  HUD_BG: '#0f0f1b',
  HUD_TEXT: '#e0e0e0',
  HEART_FULL: '#ff4757',
  HEART_EMPTY: '#4a4a4a',
  BEAT_INDICATOR_COLOR: '#ffd700',
  HIGHLIGHT_GLOW: 'rgba(255,255,255,0.4)',
  MISS_CRACK_COLOR: '#8b4513',
  DEPTH_TEXT_COLOR: '#00d2ff',
  COIN_COLOR: '#ffd700',
  XP_BAR_FILL: '#7c4dff',
  XP_BAR_BG: '#2a2a3e',

  // Ore types in order
  ORE_TYPES: [
    { id: 'coal',     name: 'Coal',     color: '#4a4a4a', accent: '#6a6a6a', coinValue: 1,  freq: 262, waveform: 'triangle', minLayer: 1  },
    { id: 'copper',   name: 'Copper',   color: '#cd7f32', accent: '#e8a84c', coinValue: 2,  freq: 330, waveform: 'square',   minLayer: 1  },
    { id: 'iron',     name: 'Iron',     color: '#8a8a8a', accent: '#b0b0b0', coinValue: 3,  freq: 294, waveform: 'sawtooth', minLayer: 3  },
    { id: 'gold',     name: 'Gold',     color: '#ffd700', accent: '#fff44f', coinValue: 5,  freq: 392, waveform: 'sine',     minLayer: 6  },
    { id: 'ruby',     name: 'Ruby',     color: '#e0115f', accent: '#ff4488', coinValue: 8,  freq: 440, waveform: 'sine',     minLayer: 10 },
    { id: 'sapphire', name: 'Sapphire', color: '#0f52ba', accent: '#4488ff', coinValue: 10, freq: 524, waveform: 'triangle', minLayer: 15 },
    { id: 'emerald',  name: 'Emerald',  color: '#50c878', accent: '#80ffaa', coinValue: 12, freq: 588, waveform: 'square',   minLayer: 20 },
    { id: 'diamond',  name: 'Diamond',  color: '#b9f2ff', accent: '#ffffff', coinValue: 20, freq: 784, waveform: 'sine',     minLayer: 28 },
    { id: 'echo',     name: 'Echo Ore', color: '#9B59B6', accent: '#D4AAFF', coinValue: 25, freq: 523, waveform: 'sine',     minLayer: 20 },
  ],

  ECHO_ORE_DISCOVERY_KEY: 'crystal_mine_echo_found',

  // BPM by layer range: [maxLayer, bpm] — first match where layer <= maxLayer
  BPM_TABLE: [
    [2,  100],
    [5,  108],
    [9,  116],
    [14, 128],
    [19, 140],
    [24, 152],
    [27, 164],
    [32, 176],
    [Infinity, 180],
  ],

  // Timing windows by layer range: [maxLayer, windowMs]
  TIMING_TABLE: [
    [5,  150],
    [14, 110],
    [24, 90],
    [32, 75],
    [Infinity, 65],
  ],

  // Spawn distributions: [maxLayer, { oreId: weight, ... }]
  SPAWN_TABLE: [
    [2,  { coal: 60, copper: 40 }],
    [5,  { coal: 40, copper: 30, iron: 30 }],
    [9,  { coal: 20, copper: 25, iron: 30, gold: 25 }],
    [14, { coal: 10, copper: 15, iron: 25, gold: 30, ruby: 20 }],
    [19, { coal: 5, copper: 10, iron: 15, gold: 25, ruby: 25, sapphire: 20 }],
    [27, { copper: 5, iron: 10, gold: 20, ruby: 25, sapphire: 20, emerald: 19, echo: 1 }],
    [Infinity, { iron: 5, gold: 15, ruby: 20, sapphire: 20, emerald: 19, diamond: 20, echo: 1 }],
  ],

  // Particle settings
  ORE_BREAK_PARTICLES: { count: [8, 12], size: [4, 8], speed: [60, 180], gravity: 200, life: [400, 600] },
  COLLAPSE_PARTICLES: { count: [6, 10], size: [12, 20], color: '#5c3a1a', speed: [300, 500] },
  COIN_PARTICLES: { count: [3, 5], size: 4, floatDist: 60, life: 500 },

  // Shake
  MISS_SHAKE_PX: 4,
  MISS_SHAKE_MS: 100,
  COLLAPSE_SHAKE_PX: 8,
  COLLAPSE_SHAKE_MS: 300,

  // Scroll animation
  SCROLL_DURATION_MS: 200,
};

// ─── ECHO TOWERS CONSTANTS ──────────────────────────────────────────────────
export const ECHO_TOWERS = {
  CANVAS_W: 400,
  CANVAS_H: 700,
  COLS: 7,
  ROWS: 12,
  BLOCK_SIZE: 48,
  GRID_X_OFFSET: 12, // (400 - 7*48 - 6*4) / 2 ≈ 12
  GRID_GAP: 4,
  GROUND_Y: 640,
  HUD_TOP_H: 60,
  HIGH_SCORE_KEY: 'echo_towers_best',

  // Column note frequencies (C major pentatonic + 2)
  NOTE_FREQS: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33],
  NOTE_NAMES: ['C', 'D', 'E', 'G', 'A', "C'", "D'"],

  // Octave bands: rows 0-3 = ×1, 4-6 = ×2, 7-9 = ×4, 10-11 = ×8
  OCTAVE_BANDS: [1, 1, 1, 1, 2, 2, 2, 4, 4, 4, 8, 8],

  // BPM
  BASE_BPM: 90,
  BPM_INCREMENT: 5,
  BPM_BLOCK_INTERVAL: 12,

  // Timing
  BEAT_WINDOW_MS: 100,
  ROUND_DURATION: 60,

  // Scoring
  BASE_POINTS: 10,
  MULTIPLIER_INCREMENT: 0.25,
  ECHO_BLOCK_POINTS: 50,
  ECHO_SEQUENCE_LENGTH: [3, 4], // min, max notes
  ECHO_SEQUENCES_PER_ROUND: 4,
  MELODY_HISTORY_SIZE: 4,

  // Economy
  COINS_PER_BLOCK: 1,
  COINS_PER_ON_BEAT: 1,
  COINS_PER_ECHO_BLOCK: 15,
  MELODY_STAR_COIN_MULTIPLIER: 5,

  // Colors
  COLUMN_COLORS: ['#FF6B6B', '#FFA651', '#FFE66D', '#4ECDC4', '#45B7D1', '#A78BFA', '#F472B6'],
  BG_TOP: '#1A0A2E',
  BG_BOTTOM: '#2D1B69',
  GROUND_COLOR: '#F5A623',
  GROUND_PULSE_COLOR: '#FFD700',
  GRID_LINE_COLOR: 'rgba(61,43,107,0.3)',
  HUD_TEXT: '#F0F0F0',
  SCORE_COLOR: '#FFD700',
  MULTIPLIER_COLOR: '#00F5FF',
  ON_BEAT_GLOW: 'rgba(255,255,255,0.4)',

  // Animation
  DROP_DURATION_MS: 200,
  PLAYBACK_ROW_MS: 100,
  STAR_COUNT: 30,
};

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
