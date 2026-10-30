import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { AnswerFeedback, GameStatus } from './useGame'

export interface PlanetTransition {
  from: number
  to: number
}

export const useTimeout = (callback: () => void, delay: number | null): void => {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return undefined
    const timer = window.setTimeout(() => callbackRef.current(), delay)
    return () => window.clearTimeout(timer)
  }, [delay])
}

export const usePlanetTransition = (
  status: GameStatus,
  currentLevel: number,
): {
  planetTransition: PlanetTransition | null
  setPlanetTransition: Dispatch<SetStateAction<PlanetTransition | null>>
} => {
  const [planetTransition, setPlanetTransition] = useState<PlanetTransition | null>(null)
  const previousLevelRef = useRef<number | null>(null)
  useEffect(() => {
    if (status !== 'playing') {
      previousLevelRef.current = null
      return
    }
    const previousLevel = previousLevelRef.current
    if (previousLevel !== null && previousLevel !== currentLevel) {
      setPlanetTransition({ from: previousLevel, to: currentLevel })
      previousLevelRef.current = currentLevel
      return
    }
    previousLevelRef.current = currentLevel
  }, [currentLevel, status])
  useTimeout(() => setPlanetTransition(null), planetTransition === null ? null : 4000)
  return { planetTransition, setPlanetTransition }
}

export const useFeedbackExpiry = (
  feedback: AnswerFeedback | null,
  status: GameStatus,
  onExpire: () => void,
): void => {
  useTimeout(onExpire, feedback && status === 'playing' ? 1400 : null)
}

export const useBadgeUnlockNotice = (unlockedBadges: string[]): string | null => {
  const [lastUnlockedBadge, setLastUnlockedBadge] = useState<string | null>(null)
  const previousBadgeCountRef = useRef(0)
  const hasInitializedBadgesRef = useRef(false)
  useEffect(() => {
    if (!hasInitializedBadgesRef.current) {
      previousBadgeCountRef.current = unlockedBadges.length
      hasInitializedBadgesRef.current = true
      return
    }
    if (unlockedBadges.length > previousBadgeCountRef.current) {
      const latest = unlockedBadges[unlockedBadges.length - 1]
      const showTimer = window.setTimeout(() => setLastUnlockedBadge(latest), 0)
      const clearTimer = window.setTimeout(() => setLastUnlockedBadge(null), 4000)
      previousBadgeCountRef.current = unlockedBadges.length
      return () => {
        window.clearTimeout(showTimer)
        window.clearTimeout(clearTimer)
      }
    }
    previousBadgeCountRef.current = unlockedBadges.length
  }, [unlockedBadges])
  return lastUnlockedBadge
}
