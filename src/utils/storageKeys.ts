/**
 * Storage format policy: unwrapped JSON is legacy version 0, the existing
 * marker-only format is version 1, and version 2 is the first enveloped
 * format. New JSON records are always written as { version, data }.
 */
export const STORAGE_SCHEMA_VERSION = 2
export const STORAGE_LEGACY_SCHEMA_VERSION = 0

export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'numberrush_storage_version',
  NAME: 'numberrush_name',
  TIMER: 'numberrush_timer',
  HIGH_SCORE: 'numberrush_highscore',
  BEST_STREAK: 'numberrush_beststreak',
  BADGES: 'numberrush_badges',
  TOTAL_CORRECT: 'numberrush_total_correct',
  TOTAL_CHAOS: 'numberrush_total_chaos',
  MOON_GAMES: 'numberrush_moon_games',
  MARS_GAMES: 'numberrush_mars_games',
  SPACE_GAMES: 'numberrush_space_games',
  PROGRESS_SESSIONS: 'numberrush_progress_sessions',
  DAILY_CHALLENGES: 'numberrush_daily_challenges',
  ACCESSIBILITY: 'numberrush_accessibility',
} as const

export const STORAGE_JSON_KEYS = [
  STORAGE_KEYS.BADGES,
  STORAGE_KEYS.PROGRESS_SESSIONS,
  STORAGE_KEYS.DAILY_CHALLENGES,
  STORAGE_KEYS.ACCESSIBILITY,
] as const

export const STORAGE_PROGRESS_KEYS = [
  STORAGE_KEYS.HIGH_SCORE,
  STORAGE_KEYS.BEST_STREAK,
  STORAGE_KEYS.BADGES,
  STORAGE_KEYS.TOTAL_CORRECT,
  STORAGE_KEYS.TOTAL_CHAOS,
  STORAGE_KEYS.MOON_GAMES,
  STORAGE_KEYS.MARS_GAMES,
  STORAGE_KEYS.SPACE_GAMES,
  STORAGE_KEYS.PROGRESS_SESSIONS,
  STORAGE_KEYS.DAILY_CHALLENGES,
] as const
