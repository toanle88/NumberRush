import { useEffect, useRef } from 'react'
import type { AccessibilityPreferences } from '../utils/accessibility'
import { MAX_PLAYER_NAME_LENGTH } from '../utils/playerName'
import { APP_VERSION } from '../version'
interface SettingsViewProps {
  playerName: string
initialTime: number
preferences: AccessibilityPreferences
onClose: () => void
onUpdateName: (name: string) => void
onUpdateTimer: (time: number) => void
onUpdatePreferences: (preferences: Partial<AccessibilityPreferences>) => void
  onResetStats: () => void
  onExportProgress?: () => void
  onImportProgress?: (file: File) => void}

const SettingsView = ({
  playerName,
  initialTime,
  preferences,
  onClose,
  onUpdateName,
  onUpdateTimer,
  onUpdatePreferences,
  onResetStats,
  onExportProgress,
  onImportProgress,
}: SettingsViewProps) => {
  const settingsHeadingRef = useRef<HTMLHeadingElement>(null)

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
          <p className="eyebrow">Your preferences</p>
          <h2 ref={settingsHeadingRef} id="settings-title" tabIndex={-1}>Settings</h2>
        </div>
        <button type="button" className="settings-back" aria-label="Back to game" onClick={onClose}>← Back to game</button>
      </div>

      <div className="settings-section setting-item">
        <h3>Profile</h3>
          <label htmlFor="player-name">Your name</label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={event => onUpdateName(event.target.value)}
            placeholder="Enter your name"
            maxLength={MAX_PLAYER_NAME_LENGTH}
          />
      </div>
      <fieldset className="settings-section setting-item">
          <legend>Appearance</legend>
          <label htmlFor="theme-select">Theme</label>
          <select
            id="theme-select"
            value={preferences.theme}
            onChange={event => onUpdatePreferences({ theme: event.target.value as AccessibilityPreferences['theme'] })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <label className="checkbox-setting" htmlFor="high-contrast">
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={event => onUpdatePreferences({ highContrast: event.target.checked })}
            />
            High contrast
          </label>
      </fieldset>
      <fieldset className="settings-section setting-item">
          <legend>Accessibility</legend>
          <label className="checkbox-setting" htmlFor="reduced-motion">
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={event => onUpdatePreferences({ reducedMotion: event.target.checked })}
            />
            Reduce motion and animation
          </label>
      </fieldset>
      <fieldset className="settings-section setting-item">
          <legend>Feedback</legend>
          <label className="checkbox-setting" htmlFor="sound-feedback">
            <input
              id="sound-feedback"
              type="checkbox"
              checked={preferences.sound}
              onChange={event => onUpdatePreferences({ sound: event.target.checked })}
            />
            Sound effects
          </label>
          <label className="checkbox-setting" htmlFor="haptic-feedback">
            <input
              id="haptic-feedback"
              type="checkbox"
              checked={preferences.haptics}
              onChange={event => onUpdatePreferences({ haptics: event.target.checked })}
            />
            Haptic feedback when supported
          </label>
      </fieldset>
      <div className="settings-section setting-item">
          <h3>Game speed</h3>
          <p>Choose how much time you get for each Blitz Rush.</p>
          <div className="timer-options" role="group" aria-label="Blitz timer duration">
            {[5, 10, 15, 20].map(time => (
              <button
                type="button"
                key={time}
                className={initialTime === time ? 'primary' : ''}
                aria-pressed={initialTime === time}
                onClick={() => onUpdateTimer(time)}
              >
                {time}s{initialTime === time ? ' (selected)' : ''}
              </button>
            ))}
          </div>
      </div>
      <div className="settings-section setting-item">
          <h3>Progress data</h3>
          <p>Save a backup of your progress or restore one from this app.</p>
          {onExportProgress && (
            <button type="button" onClick={onExportProgress}>Export progress</button>
          )}
          {onImportProgress && (
            <label>
              Import progress
              <input
                type="file"
                accept="application/json,.json"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) onImportProgress(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          )}
      </div>
      <div className="settings-section setting-item">
          <h3>About</h3>
          <p>NumberRush version {APP_VERSION}</p>
      </div>
      <div className="settings-reset-section">
        <div className="setting-item">
          <h3>Reset progress</h3>
          <button
            type="button"
            className="danger"
            onClick={() => {
 if (confirm('Reset all stats?')) onResetStats()
}}
          >
            Reset progress
          </button>
        </div>
      </div>
    </section>
  )
}
export default SettingsView
