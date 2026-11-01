import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureStorageSchema,
  exportProgress,
  getStorageStatus,
  importProgress,
  readStoredBoolean,
  removeStorage,
  readStoredJson,
  writeStorage,
  writeStoredJson,
} from './storage'
import { STORAGE_KEYS, STORAGE_SCHEMA_VERSION } from './storageKeys'

describe('versioned storage', () => {
  beforeEach(() => localStorage.clear())

  it('reads persisted boolean settings defensively', () => {
    expect(readStoredBoolean('setting', true)).toBe(true)
    localStorage.setItem('setting', 'false')
    expect(readStoredBoolean('setting', true)).toBe(false)
    localStorage.setItem('setting', 'not-a-boolean')
    expect(readStoredBoolean('setting', false)).toBe(false)
  })

  it('reads legacy unwrapped records and migrates them idempotently', () => {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(['first_blastoff']))

    expect(readStoredJson<string[]>(STORAGE_KEYS.BADGES)).toEqual(['first_blastoff'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)!)).toEqual({
      version: STORAGE_SCHEMA_VERSION,
      data: ['first_blastoff'],
    })
    expect(readStoredJson<string[]>(STORAGE_KEYS.BADGES)).toEqual(['first_blastoff'])
  })

  it('accepts the previous marker version and preserves its payload', () => {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify({ version: 1, data: ['streak_king'] }))

    expect(readStoredJson<string[]>(STORAGE_KEYS.BADGES)).toEqual(['streak_king'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)!)).toMatchObject({ version: STORAGE_SCHEMA_VERSION })
  })

  it('rejects malformed and future envelopes without throwing or overwriting future data', () => {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify({ version: '2', data: [] }))
    expect(() => readStoredJson(STORAGE_KEYS.BADGES)).not.toThrow()
    expect(readStoredJson(STORAGE_KEYS.BADGES)).toBeNull()

    const future = JSON.stringify({ version: STORAGE_SCHEMA_VERSION + 1, data: ['future'] })
    localStorage.setItem(STORAGE_KEYS.BADGES, future)
    expect(readStoredJson(STORAGE_KEYS.BADGES)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.BADGES)).toBe(future)
  })
  it('does not throw for fuzzed malformed imported JSON records', () => {
    const malformedRecords = [
      null,
      [],
      { app: 'number-rush', version: 2, data: null },
      { app: 'number-rush', version: 2, data: { numberrush_highscore: { value: 1 } } },
      ...Array.from({ length: 100 }, (_, index) => ({
        app: index % 2 === 0 ? 'number-rush' : 'unknown',
        version: index % 3 === 0 ? Number.MAX_SAFE_INTEGER + 1 : '2',
        data: index % 4 === 0 ? { numberrush_badges: ['unexpected', index] } : 'not-an-object',
      })),
    ]

    for (const record of malformedRecords) {
      expect(() => importProgress(JSON.stringify(record))).not.toThrow()
    }
  })

  it('returns migrated data when writing the recovery envelope fails', () => {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(['safe']))
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(readStoredJson<string[]>(STORAGE_KEYS.BADGES)).toEqual(['safe'])
    expect(getStorageStatus()).toBe('unavailable')
    setItem.mockRestore()
    expect(readStoredJson<string[]>(STORAGE_KEYS.BADGES)).toEqual(['safe'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)!)).toMatchObject({ version: STORAGE_SCHEMA_VERSION })
  })

  it('does not replace the marker when a future schema is present', () => {
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(STORAGE_SCHEMA_VERSION + 1))

    expect(ensureStorageSchema()).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION)).toBe(String(STORAGE_SCHEMA_VERSION + 1))
  })

  it('does not write or remove records while a future schema marker is present', () => {
    const futureVersion = String(STORAGE_SCHEMA_VERSION + 1)
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, futureVersion)
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify({ version: STORAGE_SCHEMA_VERSION + 1, data: ['future'] }))

    expect(writeStorage(STORAGE_KEYS.HIGH_SCORE, '10')).toBe(false)
    expect(writeStoredJson(STORAGE_KEYS.BADGES, ['current'])).toBe(false)
    removeStorage(STORAGE_KEYS.BADGES)
    expect(localStorage.getItem(STORAGE_KEYS.BADGES)).toContain('future')

    localStorage.removeItem(STORAGE_KEYS.SCHEMA_VERSION)
    expect(ensureStorageSchema()).toBe(true)
    expect(writeStoredJson(STORAGE_KEYS.BADGES, ['current'])).toBe(false)
  })

  it('handles serialization failures and scoped progress backup/restore', () => {
    const circular: { self?: unknown } = {}
    circular.self = circular
    expect(writeStoredJson(STORAGE_KEYS.BADGES, circular)).toBe(false)

    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '42')
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify({ version: 2, data: ['first_blastoff'] }))
    const backup = exportProgress()
    expect(backup).not.toBeNull()

    localStorage.clear()
    expect(importProgress(backup!)).toMatchObject({ ok: true })
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('42')
    expect(readStoredJson(STORAGE_KEYS.BADGES)).toEqual(['first_blastoff'])
  })

  it('rejects an export when a progress read fails', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage read failed')
    })

    expect(exportProgress()).toBeNull()
    expect(getStorageStatus()).toBe('unavailable')
    getItem.mockRestore()
  })

  it('rolls back an import when a later progress write fails', () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '10')
    localStorage.setItem(STORAGE_KEYS.BEST_STREAK, '20')
    const originalSetItem = Storage.prototype.setItem.bind(localStorage)
    let failed = false
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (!failed && key === STORAGE_KEYS.BEST_STREAK) {
        failed = true
        throw new Error('quota exceeded')
      }
      originalSetItem(key, value)
    })

    const result = importProgress(JSON.stringify({
      app: 'number-rush',
      version: STORAGE_SCHEMA_VERSION,
      data: {
        [STORAGE_KEYS.HIGH_SCORE]: '11',
        [STORAGE_KEYS.BEST_STREAK]: '30',
      },
    }))

    expect(result).toEqual({ ok: false, reason: 'unavailable' })
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('10')
    expect(localStorage.getItem(STORAGE_KEYS.BEST_STREAK)).toBe('20')
    setItem.mockRestore()
  })

  it('rejects invalid progress values before changing storage', () => {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '42')
    localStorage.setItem(STORAGE_KEYS.PROGRESS_SESSIONS, JSON.stringify({ version: 2, data: [] }))
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    setItem.mockClear()

    const invalidHighScore = importProgress(JSON.stringify({
      app: 'number-rush',
      version: STORAGE_SCHEMA_VERSION,
      data: { [STORAGE_KEYS.HIGH_SCORE]: 'invalid' },
    }))
    expect(invalidHighScore).toEqual({ ok: false, reason: 'malformed' })
    expect(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)).toBe('42')

    const invalidSession = importProgress(JSON.stringify({
      app: 'number-rush',
      version: STORAGE_SCHEMA_VERSION,
      data: {
        [STORAGE_KEYS.PROGRESS_SESSIONS]: JSON.stringify({
          version: STORAGE_SCHEMA_VERSION,
          data: [{
            id: 'session-1',
            completedAt: 1,
            mode: 'blitz',
            finalScore: 'invalid',
            bestStreak: 0,
            answers: [],
          }],
        }),
      },
    }))
    expect(invalidSession).toEqual({ ok: false, reason: 'malformed' })
    expect(localStorage.getItem(STORAGE_KEYS.PROGRESS_SESSIONS)).toBe(JSON.stringify({ version: 2, data: [] }))
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('rejects malformed, unsupported, and oversized imports', () => {
    expect(importProgress('{bad')).toEqual({ ok: false, reason: 'malformed' })
    expect(importProgress(JSON.stringify({ app: 'number-rush', version: STORAGE_SCHEMA_VERSION + 1, data: {} }))).toEqual({ ok: false, reason: 'unsupported' })
    expect(importProgress('x'.repeat(1_500_001))).toEqual({ ok: false, reason: 'too-large' })
  })
})
