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
  settingsViewOpen: boolean,
  { handleInput, handleSubmit, handleClear, handleExit }: GameInputHandlers,
): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (status !== 'playing' || settingsViewOpen) return
      const target = event.target instanceof Element ? event.target : null
      const isKeypadButton = Boolean(target?.closest('.numpad button'))
      const isDigit = (event.key >= '0' && event.key <= '9')
        || (event.code.startsWith('Numpad') && event.key >= '0' && event.key <= '9')
      if (target?.closest('button, input, select, textarea, a, summary, [role="button"], [contenteditable="true"]') && (!isKeypadButton || !isDigit)) return
      if (isDigit) {
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
  }, [handleClear, handleExit, handleInput, handleSubmit, settingsViewOpen, status])
}
