import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  getSystemReducedMotionPreference,
  readAccessibilityPreferences,
  saveAccessibilityPreferences,
  triggerHaptic,
} from './accessibility'
describe('accessibility preferences', () => {
  beforeEach(() => {
    localStorage.clear()
})
  it('returns defaults and persists every preference', () => {
    expect(readAccessibilityPreferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
    const preferences = {
      theme: 'light' as const,
      highContrast: true,
      reducedMotion: true,
      sound: false,
      haptics: false,
    }
saveAccessibilityPreferences(preferences)
    expect(JSON.parse(localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)!)).toEqual(preferences)
expect(readAccessibilityPreferences()).toEqual(preferences)
})
  it('recovers from malformed or partial saved data', () => {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, '{bad json')
expect(readAccessibilityPreferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify({ theme: 'neon', sound: false }))
expect(readAccessibilityPreferences()).toEqual({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, sound: false })
})
  it('uses vibration only when enabled and supported', () => {
    const vibrate = vi.fn()
Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
    triggerHaptic(false, 20)
expect(vibrate).not.toHaveBeenCalled()
triggerHaptic(true, [50, 50])
expect(vibrate).toHaveBeenCalledWith([50, 50])
})
  it('reads the operating system reduced-motion preference when available', () => {
    const originalMatchMedia = window.matchMedia
const matchMedia = vi.fn().mockReturnValue({ matches: true })
Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia })
    expect(getSystemReducedMotionPreference()).toBe(true)
expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
})
})
