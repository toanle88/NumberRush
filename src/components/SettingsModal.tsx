import { useEffect, useRef, useState } from 'react'
import type { AccessibilityPreferences } from '../utils/accessibility'
import { MAX_PLAYER_NAME_LENGTH } from '../utils/playerName'
import { APP_VERSION } from '../version'
import { createTranslator, SUPPORTED_LOCALES } from '../utils/i18n'
import type { Locale, Translator } from '../utils/i18n'
interface SettingsViewProps {
  playerName: string
initialTime: number
  autoIncreaseDifficulty: boolean
preferences: AccessibilityPreferences
onClose: () => void
onUpdateName: (name: string) => void
onUpdateTimer: (time: number) => void
  onUpdateAutoIncreaseDifficulty: (value: boolean) => void
onUpdatePreferences: (preferences: Partial<AccessibilityPreferences>) => void
  locale?: Locale
  onUpdateLocale?: (locale: Locale) => void
  translate?: Translator
  onResetStats: () => void
  onExportProgress?: () => void
  onImportProgress?: (file: File) => void}

const SettingsView = ({
  playerName,
  initialTime,
  autoIncreaseDifficulty,
  preferences,
  onClose,
  onUpdateName,
  onUpdateTimer,
  onUpdateAutoIncreaseDifficulty,
  onUpdatePreferences,
  locale = 'en',
  onUpdateLocale = () => undefined,
  translate = createTranslator('en'),
  onResetStats,
  onExportProgress,
  onImportProgress,
}: SettingsViewProps) => {
  const settingsHeadingRef = useRef<HTMLHeadingElement>(null)
  const [selectedFileName, setSelectedFileName] = useState('')

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    settingsHeadingRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <section className="settings-view animate-pop" role="region" aria-labelledby="settings-title">
      <div className="settings-heading">
      <div>
          <p className="eyebrow">{translate('settingsEyebrow')}</p>
          <h2 ref={settingsHeadingRef} id="settings-title" tabIndex={-1}>{translate('settings')}</h2>
        </div>
        <button type="button" className="settings-back" aria-label={translate('backToGame')} onClick={onClose}>← {translate('backToGame')}</button>
      </div>

      <div className="settings-section setting-item">
        <h3>{translate('profile')}</h3>
          <label htmlFor="player-name">{translate('yourName')}</label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={event => onUpdateName(event.target.value)}
            placeholder={translate('enterName')}
            maxLength={MAX_PLAYER_NAME_LENGTH}
          />
      </div>
      <fieldset className="settings-section setting-item">
          <legend>{translate('appearance')}</legend>
          <label htmlFor="theme-select">{translate('theme')}</label>
          <select
            id="theme-select"
            value={preferences.theme}
            onChange={event => onUpdatePreferences({ theme: event.target.value as AccessibilityPreferences['theme'] })}
          >
            <option value="dark">{translate('dark')}</option>
            <option value="light">{translate('light')}</option>
          </select>
          <label className="checkbox-setting" htmlFor="high-contrast">
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={event => onUpdatePreferences({ highContrast: event.target.checked })}
            />
            {translate('highContrast')}
          </label>
      </fieldset>
      <fieldset className="settings-section setting-item">
          <legend>{translate('accessibility')}</legend>
          <label className="checkbox-setting" htmlFor="reduced-motion">
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={event => onUpdatePreferences({ reducedMotion: event.target.checked })}
            />
            {translate('reducedMotion')}
          </label>
      </fieldset>
      <fieldset className="settings-section setting-item">
          <legend>{translate('feedback')}</legend>
          <label className="checkbox-setting" htmlFor="sound-feedback">
            <input
              id="sound-feedback"
              type="checkbox"
              checked={preferences.sound}
              onChange={event => onUpdatePreferences({ sound: event.target.checked })}
            />
            {translate('soundEffects')}
          </label>
          <label className="checkbox-setting" htmlFor="haptic-feedback">
            <input
              id="haptic-feedback"
              type="checkbox"
              checked={preferences.haptics}
              onChange={event => onUpdatePreferences({ haptics: event.target.checked })}
            />
            {translate('hapticFeedback')}
          </label>
      </fieldset>
      <fieldset className="settings-section setting-item">
          <legend>{translate('language')}</legend>
          <label htmlFor="language-select">{translate('language')}</label>
          <select id="language-select" value={locale} onChange={event => onUpdateLocale(event.target.value as Locale)}>
            {SUPPORTED_LOCALES.map(option => (
              <option key={option} value={option}>{translate(option === 'en' ? 'english' : 'vietnamese')}</option>
            ))}
          </select>
      </fieldset>
      <div className="settings-section setting-item">
          <h3>{translate('gameSpeed')}</h3>
          <p>{translate('speedDescription')}</p>
          <div className="timer-options" role="group" aria-label={translate('blitzTimer')}>
            {[5, 10, 15, 20].map(time => (
              <button
                type="button"
                key={time}
                className={initialTime === time ? 'primary' : ''}
                aria-pressed={initialTime === time}
                onClick={() => onUpdateTimer(time)}
              >
                {initialTime === time ? translate('secondsSelected', { seconds: time }) : `${time}s`}
              </button>
            ))}
          </div>
      </div>
      <fieldset className="settings-section setting-item">
          <legend>{translate('difficultyProgression')}</legend>
          <p id="difficulty-progression-description">{translate('difficultyProgressionDescription')}</p>
          <label htmlFor="difficulty-progression">{translate('difficultyProgression')}</label>
          <select
            id="difficulty-progression"
            aria-describedby="difficulty-progression-description"
            value={autoIncreaseDifficulty ? 'automatic' : 'fixed'}
            onChange={event => onUpdateAutoIncreaseDifficulty(event.target.value === 'automatic')}
          >
            <option value="automatic">{translate('automaticDifficulty')}</option>
            <option value="fixed">{translate('fixedDifficulty')}</option>
          </select>
      </fieldset>
      <div className="settings-section setting-item">
          <h3>{translate('progressData')}</h3>
          <p>{translate('backupDescription')}</p>
          {onExportProgress && (
            <button type="button" onClick={onExportProgress}>{translate('exportProgress')}</button>
          )}
          {onImportProgress && (
            <div className="file-input-group">
              <label className="file-input-label" htmlFor="import-progress">{translate('importProgress')}</label>
              <div className="file-input-control">
                <label className="file-input-trigger" htmlFor="import-progress">
                  {translate('chooseFile')}
                </label>
                <span className="file-input-name" aria-live="polite">
                  {selectedFileName || translate('noFileChosen')}
                </span>
              </div>
              <input
                id="import-progress"
                className="file-input-native"
                type="file"
                accept="application/json,.json"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) {
                    setSelectedFileName(file.name)
                    onImportProgress(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
            </div>
          )}
      </div>
      <div className="settings-section setting-item">
          <h3>{translate('about')}</h3>
          <p>{translate('version', { version: APP_VERSION })}</p>
      </div>
      <div className="settings-reset-section">
        <div className="setting-item">
          <h3>{translate('resetProgress')}</h3>
          <button
            type="button"
            className="danger"
            onClick={() => {
 if (confirm(translate('resetConfirm'))) onResetStats()
}}
          >
            {translate('resetProgress')}
          </button>
        </div>
      </div>
    </section>
  )
}
export default SettingsView
