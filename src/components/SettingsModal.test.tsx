import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SettingsView from './SettingsModal'
import type { AccessibilityPreferences } from '../utils/accessibility'
import { APP_VERSION } from '../version'
const preferences: AccessibilityPreferences = {
  theme: 'dark',
  highContrast: false,
  reducedMotion: false,
  sound: true,
  haptics: true,
}
const renderSettings = (onClose = vi.fn()) => render(
  <SettingsView
    playerName="Super Kid"
    initialTime={10}
    autoIncreaseDifficulty={true}
    preferences={preferences}
    onClose={onClose}
    onUpdateName={vi.fn()}
    onUpdateTimer={vi.fn()}
    onUpdateAutoIncreaseDifficulty={vi.fn()}
    onUpdatePreferences={vi.fn()}
    onResetStats={vi.fn()}
  />,
)
describe('SettingsView', () => {
  it('has view semantics and associated labels', () => {
    expect(renderSettings()).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Settings' })).toBeInTheDocument()
expect(screen.getByLabelText('Your name')).toBeInTheDocument()
expect(screen.getByLabelText('Theme')).toHaveValue('dark')
expect(screen.getByLabelText('High contrast')).toBeInTheDocument()
expect(screen.getByLabelText('Reduce motion and animation')).toBeInTheDocument()
expect(screen.getByLabelText('Difficulty progression')).toHaveValue('automatic')
expect(screen.getByLabelText('Sound effects')).toBeInTheDocument()
expect(screen.getByLabelText('Haptic feedback when supported')).toBeInTheDocument()
expect(screen.getByText(`NumberRush version ${APP_VERSION}`)).toBeInTheDocument()
})
  it('focuses the settings view, closes with Back to game, and restores focus', () => {
    const trigger = document.createElement('button')
document.body.appendChild(trigger)
trigger.focus()
const onClose = vi.fn()
const { unmount } = renderSettings(onClose)
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Settings' }))
fireEvent.click(screen.getByRole('button', { name: 'Back to game' }))
expect(onClose).toHaveBeenCalledTimes(1)
unmount()
expect(document.activeElement).toBe(trigger)
trigger.remove()
})
  it('provides a clear back control', () => {
    renderSettings()
    expect(screen.getByRole('button', { name: 'Back to game' })).toBeInTheDocument()
})
  it('uses translated file-picker text and separates the import label from the control', () => {
    const onImportProgress = vi.fn()
    render(
      <SettingsView
        playerName="Super Kid"
        initialTime={10}
        autoIncreaseDifficulty={true}
        preferences={preferences}
        locale="vi"
        translate={key => {
          const translations = {
            importProgress: 'Nhập tiến trình',
            chooseFile: 'Chọn tệp',
            noFileChosen: 'Chưa chọn tệp',
          }
          return translations[key as keyof typeof translations] ?? String(key)
        }}
        onClose={vi.fn()}
        onUpdateName={vi.fn()}
        onUpdateTimer={vi.fn()}
        onUpdateAutoIncreaseDifficulty={vi.fn()}
        onUpdatePreferences={vi.fn()}
        onUpdateLocale={vi.fn()}
        onResetStats={vi.fn()}
        onImportProgress={onImportProgress}
      />,
    )

    expect(screen.getByText('Nhập tiến trình')).toBeInTheDocument()
    expect(screen.getByText('Chọn tệp')).toBeInTheDocument()
    expect(screen.getByText('Chưa chọn tệp')).toBeInTheDocument()
    expect(screen.getByLabelText('Nhập tiến trình')).toHaveClass('file-input-native')
  })
  it('closes when Escape is pressed', () => {
    const onClose = vi.fn()
    renderSettings(onClose)
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })

    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
