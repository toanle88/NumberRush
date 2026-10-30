import { useEffect, useRef } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import type { GameStatus } from './useGame'

export const useGameFocus = (
  status: GameStatus,
  gameAreaRef: RefObject<HTMLElement | null>,
  resultsHeadingRef: RefObject<HTMLElement | null>,
  startButtonRef: RefObject<HTMLElement | null>,
  restoreStartFocusRef: MutableRefObject<boolean>,
): void => {
  useEffect(() => {
    if (status === 'playing') gameAreaRef.current?.focus()
    if (status === 'finished') resultsHeadingRef.current?.focus()
    if (status === 'idle' && restoreStartFocusRef.current) {
      restoreStartFocusRef.current = false
      startButtonRef.current?.focus()
    }
  }, [gameAreaRef, resultsHeadingRef, restoreStartFocusRef, startButtonRef, status])
}

export const useFocusTrap = (
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void => {
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
  }, [dialogRef, initialFocusRef, onClose])
}
