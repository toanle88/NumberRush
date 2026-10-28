export const STORAGE_SCHEMA_VERSION = 1

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
