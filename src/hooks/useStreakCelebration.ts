import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { playCelebrationSound, playFinishSound, playTickSound } from '../utils/soundEffects'
import type { GameMode, GameStatus } from './useGame'

const confettiWithoutWorker = confetti.create(undefined, { resize: true, useWorker: false })

const safeConfetti = (options: Parameters<typeof confetti>[0]): void => {
  try {
    confettiWithoutWorker(options)
  } catch {
    // Celebrations are optional and must not interrupt gameplay.
  }
}

export const useStreakCelebration = (
  streak: number,
  soundEnabled: boolean,
  reducedMotion: boolean,
  systemReducedMotion: boolean,
): string => {
  const [shakeClass, setShakeClass] = useState('')
  const previousStreakRef = useRef(0)

  useEffect(() => {
    const previousStreak = previousStreakRef.current
    previousStreakRef.current = streak
    if (streak <= 0 || streak <= previousStreak || streak % 10 !== 0) return
    playCelebrationSound(soundEnabled)
    if (reducedMotion || systemReducedMotion) return

    let shake = 'shake-small'
    let confettiInterval: number | null = null
    if (streak >= 30) {
      shake = 'shake-hard'
      const animationEnd = Date.now() + 1500
      const random = (min: number, max: number) => Math.random() * (max - min) + min
      confettiInterval = window.setInterval(() => {
        if (animationEnd - Date.now() <= 0) {
          window.clearInterval(confettiInterval!)
          return
        }
        const particleCount = 40
        safeConfetti({ particleCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } })
        safeConfetti({ particleCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } })
      }, 250)
    } else if (streak >= 20) {
      shake = 'shake-medium'
      safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } })
    } else {
      safeConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] })
    }

    let clearShakeTimer: number | null = null
    let animationFrame: number | null = null
    let usesAnimationFrame = false
    try {
      if (typeof window.requestAnimationFrame === 'function') {
        usesAnimationFrame = true
        animationFrame = window.requestAnimationFrame(() => {
          setShakeClass(shake)
          clearShakeTimer = window.setTimeout(() => setShakeClass(''), 1000)
        })
      } else {
        animationFrame = window.setTimeout(() => {
          setShakeClass(shake)
          clearShakeTimer = window.setTimeout(() => setShakeClass(''), 1000)
        }, 0)
      }
    } catch {
      // Animation is optional; the game remains usable without it.
    }
    return () => {
      if (animationFrame !== null) {
        try {
          if (usesAnimationFrame && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(animationFrame)
          else window.clearTimeout(animationFrame)
        } catch {
          // Animation cleanup is optional.
        }
      }
      if (clearShakeTimer !== null) window.clearTimeout(clearShakeTimer)
      if (confettiInterval !== null) window.clearInterval(confettiInterval)
    }
  }, [reducedMotion, soundEnabled, streak, systemReducedMotion])

  return shakeClass
}

export const useBlitzSounds = (
  timeLeft: number,
  status: GameStatus,
  mode: GameMode,
  soundEnabled: boolean,
): void => {
  useEffect(() => {
    if (status === 'playing' && mode === 'blitz') {
      if (timeLeft <= 3 && timeLeft > 0) playTickSound(soundEnabled)
      else if (timeLeft === 0) playFinishSound(soundEnabled)
    }
  }, [mode, soundEnabled, status, timeLeft])
}
