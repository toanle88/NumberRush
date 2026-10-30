import { describe, expect, it } from 'vitest'
import { calculateAnswerScore, calculateNextStreak } from './gameScoring'

describe('game scoring', () => {
  it('awards an increasing streak bonus without changing misses', () => {
    expect(calculateAnswerScore(20, 0, true)).toBe(30)
    expect(calculateAnswerScore(20, 5, true)).toBe(40)
    expect(calculateAnswerScore(20, 5, false)).toBe(20)
  })

  it('resets the streak after an incorrect answer', () => {
    expect(calculateNextStreak(3, true)).toBe(4)
    expect(calculateNextStreak(3, false)).toBe(0)
  })
})
