import { afterEach, describe, expect, it, vi } from 'vitest'
import { playCelebrationSound, playCorrectSound } from './soundEffects'

describe('sound effects', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores browsers that expose an unavailable audio context', () => {
    vi.useFakeTimers()
    const originalAudioContext = Object.getOwnPropertyDescriptor(window, 'AudioContext')
    class ThrowingAudioContext {
      public constructor() {
        throw new Error('audio is unavailable')
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: ThrowingAudioContext,
    })

    try {
      expect(() => playCorrectSound()).not.toThrow()
      expect(() => playCelebrationSound()).not.toThrow()
      expect(() => vi.runAllTimers()).not.toThrow()
    } finally {
      if (originalAudioContext) Object.defineProperty(window, 'AudioContext', originalAudioContext)
      else Reflect.deleteProperty(window, 'AudioContext')
    }
  })
})
