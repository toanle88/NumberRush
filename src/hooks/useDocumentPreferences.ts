import { useEffect } from 'react'
import type { AccessibilityPreferences } from '../utils/accessibility'

export const useDocumentPreferences = (
  planetLevel: number,
  preferences: AccessibilityPreferences,
): void => {
  useEffect(() => {
    document.body.className = `planet-${planetLevel}`
  }, [planetLevel])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.dataset.highContrast = preferences.highContrast ? 'true' : 'false'
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false'
  }, [preferences.highContrast, preferences.reducedMotion, preferences.theme])
}
