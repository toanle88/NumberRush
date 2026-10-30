import { useState } from 'react'
import { readAccessibilityPreferences, saveAccessibilityPreferences } from '../utils/accessibility'
import type { AccessibilityPreferences } from '../utils/accessibility'
import { readStorage, readStoredBoolean, readStoredNonNegativeInteger, writeStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../utils/storageKeys'
import { normalizePlayerName } from '../utils/playerName'
import { readLocale, saveLocale } from '../utils/i18n'
import type { Locale } from '../utils/i18n'

export const usePlayerSettings = () => {
  const [initialTime, setInitialTime] = useState(() => (
    Math.min(20, Math.max(1, readStoredNonNegativeInteger(STORAGE_KEYS.TIMER, 10, 20)))
  ))
  const [hasStoredTimer, setHasStoredTimer] = useState(() => readStorage(STORAGE_KEYS.TIMER) !== null)
  const [autoIncreaseDifficulty, setAutoIncreaseDifficulty] = useState(() => readStoredBoolean(STORAGE_KEYS.AUTO_INCREASE_DIFFICULTY, true))
  const [playerName, setPlayerName] = useState(() => normalizePlayerName(readStorage(STORAGE_KEYS.NAME)))
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readAccessibilityPreferences)
  const [locale, setLocale] = useState<Locale>(readLocale)
  const [settingsPersistenceFailed, setSettingsPersistenceFailed] = useState(false)

  const updateName = (value: string) => {
    setPlayerName(value)
    setSettingsPersistenceFailed(!writeStorage(STORAGE_KEYS.NAME, value))
  }

  const updateTimer = (value: number) => {
    setInitialTime(value)
    setHasStoredTimer(true)
    setSettingsPersistenceFailed(!writeStorage(STORAGE_KEYS.TIMER, value.toString()))
  }

  const updateAutoIncreaseDifficulty = (value: boolean) => {
    setAutoIncreaseDifficulty(value)
    setSettingsPersistenceFailed(!writeStorage(STORAGE_KEYS.AUTO_INCREASE_DIFFICULTY, value.toString()))
  }

  const updatePreferences = (patch: Partial<AccessibilityPreferences>) => {
    const nextPreferences = { ...preferences, ...patch }
    setPreferences(nextPreferences)
    setSettingsPersistenceFailed(!saveAccessibilityPreferences(nextPreferences))
  }

  const updateLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setSettingsPersistenceFailed(!saveLocale(nextLocale))
  }

  return {
    initialTime,
    hasStoredTimer,
    autoIncreaseDifficulty,
    playerName,
    preferences,
    locale,
    settingsPersistenceFailed,
    updateName,
    updateTimer,
    updateAutoIncreaseDifficulty,
    updatePreferences,
    updateLocale,
  }
}
