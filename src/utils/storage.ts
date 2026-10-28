import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION } from './storageKeys'

export const readStorage = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key)
  } catch {
    return null
  }
}

export const writeStorage = (key: string, value: string): boolean => {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export const readStoredJson = <T>(key: string): T | null => {
  const raw = readStorage(key)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && 'data' in parsed) {
      return (parsed as { data: T }).data
    }
    return parsed as T
  } catch {
    return null
  }
}

export const removeStorage = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable or full; in-memory state remains authoritative.
  }
}

export const readStoredNonNegativeInteger = (key: string, fallback = 0, maximum = Number.MAX_SAFE_INTEGER): number => {
  const raw = readStorage(key)?.trim() ?? ''
  if (!/^\d+$/.test(raw)) return fallback
  const value = Number(raw)
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : fallback
}

export const ensureStorageSchema = (): boolean => (
  readStorage(STORAGE_KEYS.SCHEMA_VERSION) === String(STORAGE_SCHEMA_VERSION)
    || writeStorage(STORAGE_KEYS.SCHEMA_VERSION, String(STORAGE_SCHEMA_VERSION))
)
