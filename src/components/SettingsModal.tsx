import { useEffect, useRef } from 'react'
import type { AccessibilityPreferences } from '../utils/accessibility'
import { APP_VERSION } from '../version'
interface SettingsModalProps {
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

const SettingsModal = ({
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
}: SettingsModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)
const initialFocusRef = useRef<HTMLInputElement>(null)
const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
initialFocusRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
onClose()
return
}

      if (event.key !== 'Tab' || !dialogRef.current) return
const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
      )).filter(element => !element.hasAttribute('disabled'))
if (focusable.length === 0) return
const first = focusable[0]
const last = focusable[focusable.length - 1]
if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
last.focus()
} else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
first.focus()
}
    }
    document.addEventListener('keydown', handleKeyDown)
return () => {
      document.removeEventListener('keydown', handleKeyDown)
previouslyFocusedRef.current?.focus()
}
}, [onClose])
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-content animate-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={event => event.stopPropagation()}
      >
        <h2 id="settings-title">Settings</h2>
        <div className="setting-item">
          <label htmlFor="player-name">Your name</label>
          <input
            ref={initialFocusRef}
            id="player-name"
            type="text"
            value={playerName}
            onChange={event => onUpdateName(event.target.value)}
            placeholder="Enter your name"
            maxLength={20}
          />
        </div>
        <fieldset className="setting-item">
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
        <fieldset className="setting-item">
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
        <fieldset className="setting-item">
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
        <div className="setting-item">
          <label>Speed (seconds)</label>
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
        <div className="setting-item">
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
        <div className="setting-item">
          <h3>About</h3>
          <p>NumberRush version {APP_VERSION}</p>
        </div>
        <div className="setting-item">
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
        <button type="button" className="close-modal" onClick={onClose}>Close settings</button>
      </div>
    </div>
  )
}
export default SettingsModal
