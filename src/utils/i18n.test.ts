import { beforeEach, describe, expect, it } from 'vitest'
import { createTranslator, isLocale, readLocale, saveLocale, TRANSLATION_KEYS, TRANSLATIONS } from './i18n'
import type { Locale } from './i18n'
import { STORAGE_KEYS } from './storageKeys'

describe('locale service', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to English and rejects invalid stored locales', () => {
    expect(readLocale()).toBe('en')
    localStorage.setItem(STORAGE_KEYS.LOCALE, 'fr')
    expect(readLocale()).toBe('en')
    expect(isLocale('vi')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(createTranslator('fr' as Locale)('settings')).toBe('Settings')
  })

  it('persists supported locales and interpolates translated messages', () => {
    expect(saveLocale('vi')).toBe(true)
    expect(readLocale()).toBe('vi')
    expect(createTranslator('vi')('appGreeting', { name: 'Linh' })).toContain('Chào Linh')
    expect(createTranslator('en')('appGreeting', { name: 'Linh' })).toContain('Hey Linh')
  })

  it('uses grammatical Vietnamese progress text for singular and plural rounds', () => {
    const translate = createTranslator('vi')

    expect(translate('newPersonalBest', { plural: '' })).toBe('Kỷ lục cá nhân mới! ✨')
    expect(translate('newPersonalBest', { plural: 's' })).toBe('Kỷ lục cá nhân mới! ✨')
    expect(translate('roundsBuilt', { count: 1, roundWord: translate('round') }))
      .toBe('Dựa trên 1 ván chơi đã hoàn thành trên thiết bị này.')
    expect(translate('roundsBuilt', { count: 2, roundWord: translate('rounds') }))
      .toBe('Dựa trên 2 ván chơi đã hoàn thành trên thiết bị này.')
  })

  it('keeps every supported locale aligned with the typed dictionary', () => {
    for (const locale of ['en', 'vi'] as const) {
      expect(Object.keys(TRANSLATIONS[locale]).sort()).toEqual([...TRANSLATION_KEYS].sort())
      for (const key of TRANSLATION_KEYS) {
        expect(TRANSLATIONS[locale][key]).toEqual(expect.any(String))
      }
    }
  })
})
