export const MAX_PLAYER_NAME_LENGTH = 20

export const normalizePlayerName = (value: unknown, fallback = 'Super Kid'): string => {
  if (typeof value !== 'string') return fallback

  const normalized = value.trim().slice(0, MAX_PLAYER_NAME_LENGTH)
  return normalized || fallback
}
