import { useEffect } from 'react'
import type { GameStatus } from './useGame'

interface GameInputHandlers {
  handleInput: (value: string) => void
  handleSubmit: () => void
  handleClear: () => void
  handleExit: () => void
}

export const useKeyboardGameInput = (
  status: GameStatus,
  settingsOpen: boolean,
  { handleInput, handleSubmit, handleClear, handleExit }: GameInputHandlers,
): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (status !== 'playing' || settingsOpen) return
      if (event.target instanceof Element && event.target.closest('button, input, select, textarea, a, summary, [role="button"], [contenteditable="true"]')) return
      if ((event.key >= '0' && event.key <= '9') || (event.code.startsWith('Numpad') && event.key >= '0' && event.key <= '9')) {
        event.preventDefault()
        handleInput(event.key)
      } else if (event.key === 'Enter' || event.key === 'NumpadEnter') {
        event.preventDefault()
        handleSubmit()
      } else if (event.key === 'Backspace') handleClear()
      else if (event.key === 'Escape') handleExit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClear, handleExit, handleInput, handleSubmit, settingsOpen, status])
}
