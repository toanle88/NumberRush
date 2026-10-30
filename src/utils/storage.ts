import {
  STORAGE_JSON_KEYS,
  STORAGE_KEYS,
  STORAGE_LEGACY_SCHEMA_VERSION,
  STORAGE_PROGRESS_KEYS,
  STORAGE_SCHEMA_VERSION,
} from './storageKeys'

export type StorageStatus = 'available' | 'unavailable' | 'unsupported'

export interface StoredEnvelope<T> {
  version: number
  data: T
}

export interface ProgressExport {
  app: 'number-rush'
  version: number
  exportedAt: number
  data: Partial<Record<(typeof STORAGE_PROGRESS_KEYS)[number], string | null>>
}

export type ProgressImportResult =
  | { ok: true; importedKeys: number }
  | { ok: false; reason: 'malformed' | 'unsupported' | 'too-large' | 'unavailable' }

export const MAX_IMPORT_LENGTH = 1_500_000
const getInitialStorageStatus = (): StorageStatus => {
  try {
    return typeof localStorage === 'undefined' ? 'unavailable' : 'available'
  } catch {
    return 'unavailable'
  }
}

let storageStatus: StorageStatus = getInitialStorageStatus()

const setStorageStatus = (status: StorageStatus): void => {
  storageStatus = status
}

const markStorageAvailable = (): void => {
  if (storageStatus !== 'unsupported') storageStatus = 'available'
}

export const getStorageStatus = (): StorageStatus => storageStatus

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

const isUnsupportedVersion = (value: unknown): boolean => (
  typeof value === 'number'
    ? !Number.isSafeInteger(value) || value < STORAGE_LEGACY_SCHEMA_VERSION || value > STORAGE_SCHEMA_VERSION
    : false
)

const hasUnsupportedStoredValue = (key: string): boolean => {
  const raw = localStorage.getItem(key)
  if (key === STORAGE_KEYS.SCHEMA_VERSION) {
    if (raw === null) return false
    return isUnsupportedVersion(Number(raw))
  }
  if (raw === null) return false
  try {
    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) && isUnsupportedVersion(parsed.version)
  } catch {
    return false
  }
}

type StorageMigration = (data: unknown) => unknown
const STORAGE_MIGRATIONS: Record<number, StorageMigration> = {
  0: data => data,
  1: data => data,
}

const migrateRecord = (version: number, data: unknown): unknown | null => {
  if (!Number.isSafeInteger(version) || version < STORAGE_LEGACY_SCHEMA_VERSION) return null
  if (version > STORAGE_SCHEMA_VERSION) {
    setStorageStatus('unsupported')
    return null
  }

  // Version 0 was the unwrapped JSON format and version 1 only recorded a
  // global marker. Both have the same record payload, so their migrations are
  // intentionally identity migrations. Keeping the registry explicit makes
  // future schema changes additive and testable.
  let migrated = data
  for (let current = version; current < STORAGE_SCHEMA_VERSION; current += 1) {
    const migration = STORAGE_MIGRATIONS[current]
    if (!migration) return null
    migrated = migration(migrated)
  }
  return migrated
}

export const readStorage = (key: string): string | null => {
  try {
    if (typeof localStorage === 'undefined') {
      setStorageStatus('unavailable')
      return null
    }
    const value = localStorage.getItem(key)
    markStorageAvailable()
    return value
  } catch {
    setStorageStatus('unavailable')
    return null
  }
}

export const writeStorage = (key: string, value: string): boolean => {
  try {
    if (typeof localStorage === 'undefined') {
      setStorageStatus('unavailable')
      return false
    }
    if (hasUnsupportedStoredValue(STORAGE_KEYS.SCHEMA_VERSION) || hasUnsupportedStoredValue(key)) {
      setStorageStatus('unsupported')
      return false
    }
    localStorage.setItem(key, value)
    markStorageAvailable()
    return true
  } catch {
    setStorageStatus('unavailable')
    return false
  }
}

export const serializeStoredJson = <T>(value: T): string | null => {
  try {
    return JSON.stringify({ version: STORAGE_SCHEMA_VERSION, data: value } satisfies StoredEnvelope<T>)
  } catch {
    return null
  }
}

export const writeStoredJson = <T>(key: string, value: T): boolean => {
  const serialized = serializeStoredJson(value)
  return serialized === null ? false : writeStorage(key, serialized)
}

export const readStoredJson = <T>(key: string): T | null => {
  const raw = readStorage(key)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    let version = STORAGE_LEGACY_SCHEMA_VERSION
    let data = parsed
    if (isRecord(parsed) && ('version' in parsed || 'data' in parsed)) {
      if (!('version' in parsed) || !('data' in parsed) || typeof parsed.version !== 'number') return null
      version = parsed.version
      data = parsed.data
    }
    const migrated = migrateRecord(version, data)
    if (migrated === null) return null
    if (version !== STORAGE_SCHEMA_VERSION) writeStoredJson(key, migrated)
    return migrated as T
  } catch {
    return null
  }
}

export const removeStorage = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (hasUnsupportedStoredValue(STORAGE_KEYS.SCHEMA_VERSION) || hasUnsupportedStoredValue(key)) {
        setStorageStatus('unsupported')
        return
      }
      localStorage.removeItem(key)
      markStorageAvailable()
    }
  } catch {
    setStorageStatus('unavailable')
    // Storage can be unavailable or full; in-memory state remains authoritative.
  }
}

export const readStoredNonNegativeInteger = (key: string, fallback = 0, maximum = Number.MAX_SAFE_INTEGER): number => {
  const raw = readStorage(key)?.trim() ?? ''
  if (!/^\d+$/.test(raw)) return fallback
  const value = Number(raw)
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : fallback
}

export const ensureStorageSchema = (): boolean => {
  const rawVersion = readStorage(STORAGE_KEYS.SCHEMA_VERSION)
  if (rawVersion !== null) {
    const version = Number(rawVersion)
    if (!Number.isSafeInteger(version) || version > STORAGE_SCHEMA_VERSION) {
      setStorageStatus('unsupported')
      return false
    }
  }

  const markerWritten = rawVersion === String(STORAGE_SCHEMA_VERSION)
    || writeStorage(STORAGE_KEYS.SCHEMA_VERSION, String(STORAGE_SCHEMA_VERSION))
  if (!markerWritten) return false

  // Migrate known legacy records eagerly, while each reader remains defensive
  // if migration cannot be written because storage is temporarily unavailable.
  STORAGE_JSON_KEYS.forEach(key => readStoredJson(key))
  return true
}

export const exportProgress = (): string | null => {
  const data: ProgressExport['data'] = {}
  for (const key of STORAGE_PROGRESS_KEYS) {
    const value = readStorage(key)
    if (value === null && getStorageStatus() === 'unavailable') return null
    data[key] = value
  }
  try {
    return JSON.stringify({
      app: 'number-rush',
      version: STORAGE_SCHEMA_VERSION,
      exportedAt: Date.now(),
      data,
    } satisfies ProgressExport)
  } catch {
    return null
  }
}

export const importProgress = (serialized: string): ProgressImportResult => {
  if (serialized.length > MAX_IMPORT_LENGTH) return { ok: false, reason: 'too-large' }
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (!isRecord(parsed) || parsed.app !== 'number-rush' || typeof parsed.version !== 'number' || !isRecord(parsed.data)) {
    return { ok: false, reason: 'malformed' }
  }
  if (!Number.isSafeInteger(parsed.version) || parsed.version < STORAGE_LEGACY_SCHEMA_VERSION || parsed.version > STORAGE_SCHEMA_VERSION) {
    return { ok: false, reason: 'unsupported' }
  }

  const importedValues = new Map<string, string>()
  for (const key of STORAGE_PROGRESS_KEYS) {
    const value = parsed.data[key]
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > MAX_IMPORT_LENGTH)) {
      return { ok: false, reason: 'malformed' }
    }
    if (typeof value === 'string') importedValues.set(key, value)
    else if (value === null) importedValues.set(key, '')
  }

  const snapshot = new Map<string, string | null>()
  for (const key of importedValues.keys()) {
    const previousValue = readStorage(key)
    if (previousValue === null && getStorageStatus() === 'unavailable') {
      return { ok: false, reason: 'unavailable' }
    }
    snapshot.set(key, previousValue)
  }

  let importedKeys = 0
  for (const [key, value] of importedValues) {
    if (!writeStorage(key, value)) {
      // localStorage has no transaction API. Restore every touched key so a
      // quota or browser-policy failure cannot leave a partially imported
      // backup in place.
      try {
        if (typeof localStorage === 'undefined') {
          setStorageStatus('unavailable')
        } else {
          snapshot.forEach((previousValue, snapshotKey) => {
            if (previousValue === null) localStorage.removeItem(snapshotKey)
            else localStorage.setItem(snapshotKey, previousValue)
          })
        }
      } catch {
        setStorageStatus('unavailable')
      }
      return { ok: false, reason: 'unavailable' }
    }
    importedKeys += 1
  }
  return { ok: true, importedKeys }
}
