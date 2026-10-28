import { readStoredJson, writeStoredJson } from './storage'
import { STORAGE_KEYS } from './storageKeys'
export type Theme = 'dark' | 'light'
export interface AccessibilityPreferences {
  theme: Theme
highContrast: boolean
reducedMotion: boolean
sound: boolean
haptics: boolean}

export const ACCESSIBILITY_STORAGE_KEY = STORAGE_KEYS.ACCESSIBILITY
export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  theme: 'dark',
  highContrast: false,
  reducedMotion: false,
  sound: true,
  haptics: true,
}
const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'
export const readAccessibilityPreferences = (): AccessibilityPreferences => {
  try {
    const parsed = readStoredJson<Partial<AccessibilityPreferences>>(ACCESSIBILITY_STORAGE_KEY)
    if (!parsed) return DEFAULT_ACCESSIBILITY_PREFERENCES
return {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      ...parsed,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_ACCESSIBILITY_PREFERENCES.theme,
      highContrast: parsed.highContrast === true,
      reducedMotion: parsed.reducedMotion === true,
      sound: parsed.sound !== false,
      haptics: parsed.haptics !== false,
    }
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFERENCES
  }
}
export const saveAccessibilityPreferences = (preferences: AccessibilityPreferences): boolean => (
  writeStoredJson(ACCESSIBILITY_STORAGE_KEY, preferences)
)
export const getSystemReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
export const triggerHaptic = (enabled: boolean, pattern: number | number[]) => {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Haptics are optional and some browsers expose a throwing stub.
  }
}
