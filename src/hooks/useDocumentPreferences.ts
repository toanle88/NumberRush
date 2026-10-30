import { useEffect } from 'react'
import type { AccessibilityPreferences } from '../utils/accessibility'
import type { Locale } from '../utils/i18n'

export const useDocumentPreferences = (
  planetLevel: number,
  preferences: AccessibilityPreferences,
  locale: Locale = 'en',
): void => {
  useEffect(() => {
    document.body.className = `planet-${planetLevel}`
  }, [planetLevel])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.dataset.highContrast = preferences.highContrast ? 'true' : 'false'
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false'
    document.documentElement.lang = locale
  }, [locale, preferences.highContrast, preferences.reducedMotion, preferences.theme])
}
