import { renderHook, act } from '@testing-library/react'
import { createElement, StrictMode, type ReactNode } from 'react'
import { useGame } from './useGame'
import { MAX_LIVE_HISTORY, MAX_MISSED_QUESTIONS } from './useGame'
import { describe, it, expect, beforeEach, vi } from 'vitest'
// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
 store[key] = value.toString()
},
    removeItem: (key: string) => {
 delete store[key]
},
    clear: () => {
 store = {}
},
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const StrictModeWrapper = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children)
describe('useGame Hook', () => {
  beforeEach(() => {
    localStorage.clear()
vi.useFakeTimers()
})
  it('initializes with default state', () => {
    const { result } = renderHook(() => useGame(10))
expect(result.current.status).toBe('idle')
expect(result.current.score).toBe(0)
expect(result.current.streak).toBe(0)
expect(result.current.highScore).toBe(0)
expect(result.current.recurringProgress.dailyCorrectAnswers).toBe(0)
})
  it('ignores malformed badge storage during initialization', () => {
    localStorage.setItem('numberrush_badges', '{bad json')
    const { result } = renderHook(() => useGame(10))
    expect(result.current.unlockedBadges).toEqual([])
})
  it('completes and persists the stable daily challenge without double-awarding points', () => {
    vi.setSystemTime(new Date(2026, 4, 12, 12))
const { result, unmount } = renderHook(() => useGame(10))
const target = result.current.dailyChallenge.target
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
for (let answer = 0; answer < target; answer += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}

    expect(result.current.recurringProgress.challenge.completed).toBe(true)
const points = result.current.recurringProgress.points
expect(result.current.recurringProgress.completionHistory).toHaveLength(1)
    act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
expect(result.current.recurringProgress.points).toBe(points)
expect(result.current.recurringProgress.completionHistory).toHaveLength(1)
    unmount()
const reloaded = renderHook(() => useGame(10))
expect(reloaded.result.current.recurringProgress.challenge.completed).toBe(true)
expect(reloaded.result.current.recurringProgress.points).toBe(points)
})
  it('only marks the round that earns the challenge reward as newly completed', () => {
    vi.setSystemTime(new Date(2026, 4, 12, 12))
const { result } = renderHook(() => useGame(10))
const target = result.current.dailyChallenge.target
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
for (let answer = 0; answer < target; answer += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}

    expect(result.current.challengeCompletedThisRound).toBe(true)
act(() => result.current.endGame())
expect(result.current.challengeCompletedThisRound).toBe(true)
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
expect(result.current.challengeCompletedThisRound).toBe(false)
act(() => result.current.endGame())
expect(result.current.challengeCompletedThisRound).toBe(false)
})
  it('refreshes the active challenge when the local day changes', () => {
    vi.setSystemTime(new Date(2026, 4, 12, 23, 59))
const { result } = renderHook(() => useGame(10))
expect(result.current.recurringProgress.dateKey).toBe('2026-05-12')
    vi.setSystemTime(new Date(2026, 4, 13, 0, 1))
act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.recurringProgress.dateKey).toBe('2026-05-13')
expect(result.current.recurringProgress.dailyCorrectAnswers).toBe(0)
})
  it('starts a game correctly', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
expect(result.current.status).toBe('playing')
expect(result.current.currentQuestion).not.toBeNull()
})
  it('reuses progress metrics while the blitz timer changes unrelated state', () => {
    const { result } = renderHook(() => useGame(10))
act(() => result.current.startGame(1, 'blitz', false, ['addition']))
const metrics = result.current.progressMetrics
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.progressMetrics).toBe(metrics)
})
  it('starts selected operator and difficulty rounds with tier settings', () => {
    const { result } = renderHook(() => useGame(20))
act(() => {
      result.current.startGame(1, 'blitz', false, ['division'], 'hard')
})
    expect(result.current.difficulty).toBe('hard')
expect(result.current.maxTime).toBe(7)
expect(result.current.timeLeft).toBe(7)
expect(result.current.currentQuestion?.operation).toBe('division')
expect(result.current.currentQuestion!.operandA % result.current.currentQuestion!.operandB).toBe(0)
})
  it('keeps the hook configuration aligned with generation when operators are empty', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false, [])
})
    expect(result.current.operations).toEqual(['addition', 'subtraction'])
expect(['addition', 'subtraction']).toContain(result.current.currentQuestion?.operation)
})
  it('uses the starting planet tier when no difficulty override is provided', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(2, 'blitz', false, ['addition'])
})
    expect(result.current.difficulty).toBe('medium')
expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(20)
    act(() => {
      result.current.endGame()
result.current.startGame(3, 'blitz', false, ['addition'])
})
    expect(result.current.difficulty).toBe('hard')
expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(50)
})
  it('raises the tier when score progression reaches the next planet', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'])
})
    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.score).toBe(110)
expect(result.current.currentLevel).toBe(2)
expect(result.current.difficulty).toBe('medium')
expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(20)
})
  it('uses planet timers without treating the planet tier as a difficulty override', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], undefined, undefined, false, true)
})
    expect(result.current.difficulty).toBe('easy')
expect(result.current.maxTime).toBe(15)
    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.difficulty).toBe('medium')
expect(result.current.maxTime).toBe(10)
expect(result.current.timeLeft).toBe(10)
})
  it('raises an explicit easy tier to the next planet minimum at the threshold', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy', undefined, false, true)
})
    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.currentLevel).toBe(2)
expect(result.current.difficulty).toBe('medium')
expect(result.current.maxTime).toBe(10)
})
  it('keeps an explicit tier at or above the starting planet minimum', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(2, 'blitz', false, ['addition'], 'easy')
})
    expect(result.current.difficulty).toBe('medium')
})
  it('adapts an explicit tier after fast accurate answers', () => {
    const { result } = renderHook(() => useGame(20))
act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy')
})
    for (let answerNumber = 0; answerNumber < 3; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.difficulty).toBe('medium')
expect(result.current.maxTime).toBe(10)
})
  it('preserves a Settings timer override while adaptive difficulty changes', () => {
    const { result } = renderHook(() => useGame(20))
act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy', 20)
})
    for (let answerNumber = 0; answerNumber < 3; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.difficulty).toBe('medium')
expect(result.current.maxTime).toBe(20)
expect(result.current.timeLeft).toBe(20)
})
  it('keeps a Mars start at or above the selected difficulty', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(2, 'blitz', false)
})
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
})
    expect(result.current.currentLevel).toBe(2)
expect(result.current.playedLevels).toEqual([2])
expect(result.current.history[0].level).toBe(2)
})
  it('records each planet when score thresholds are crossed', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    for (let answerNumber = 0; answerNumber < 12; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.score).toBe(210)
expect(result.current.currentLevel).toBe(3)
expect(result.current.playedLevels).toEqual([1, 2, 3])
expect(result.current.history.map(entry => entry.level)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2])
    act(() => {
      result.current.endGame()
})
    expect(result.current.status).toBe('finished')
expect(result.current.playedLevels).toEqual([1, 2, 3])
})
  it('handles correct answers and updates score/streak', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    const correctAnswer = result.current.currentQuestion!.answer
    act(() => {
      result.current.submitAnswer(correctAnswer)
})
    expect(result.current.score).toBeGreaterThan(0)
expect(result.current.streak).toBe(1)
expect(result.current.totalCorrect).toBe(1)
})
  it('resets streak on incorrect answer', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer)
})
    expect(result.current.streak).toBe(1)
    act(() => {
      // Force an incorrect answer
      result.current.submitAnswer(result.current.currentQuestion!.answer + 100)
})
    expect(result.current.streak).toBe(0)
})
  it('returns the expected answer and worked explanation for incorrect submissions', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    const question = result.current.currentQuestion!
let feedback
act(() => {
      feedback = result.current.submitAnswer(question.answer + 1)
})
    expect(feedback).toMatchObject({
      question,
      playerAnswer: question.answer + 1,
      expectedAnswer: question.answer,
      isCorrect: false,
      explanation: expect.stringContaining(`= ${question.answer}`),
    })
expect(result.current.missedQuestions).toHaveLength(1)
expect(result.current.missedQuestions[0].question).toEqual(question)
})
  it('keeps missed questions available after starting another round', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
const missedQuestion = result.current.currentQuestion!
act(() => {
      result.current.submitAnswer(missedQuestion.answer + 1)
result.current.endGame()
})
    act(() => {
      result.current.startGame(1, 'practice', false)
result.current.endGame()
})
    expect(result.current.missedQuestions).toHaveLength(1)
act(() => {
      result.current.startTargetedPractice()
})
expect(result.current.currentQuestion).toEqual(missedQuestion)
})
  it('unlocks First Blastoff only after the first game finishes', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'blitz', false)
})
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer)
})
    expect(result.current.unlockedBadges).not.toContain('first_blastoff')
act(() => result.current.endGame())
expect(result.current.unlockedBadges).toContain('first_blastoff')
})
  it('unlocks First Blastoff for a completed zero-answer game', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
result.current.endGame()
})
    expect(result.current.unlockedBadges).toContain('first_blastoff')
})
  it('limits Perfect Flight to five-answer Blitz rounds', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
for (let answerNumber = 0; answerNumber < 5; answerNumber += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}
    act(() => result.current.endGame())
expect(result.current.unlockedBadges).not.toContain('perfect_flight')
    act(() => result.current.startGame(1, 'blitz', false, ['addition']))
for (let answerNumber = 0; answerNumber < 4; answerNumber += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}
    act(() => result.current.endGame())
expect(result.current.unlockedBadges).not.toContain('perfect_flight')
    act(() => result.current.startGame(1, 'blitz', false, ['addition']))
for (let answerNumber = 0; answerNumber < 5; answerNumber += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}
    act(() => result.current.endGame())
expect(result.current.unlockedBadges).toContain('perfect_flight')
})
  it('bounds live practice state while retaining exact round and persisted aggregates', () => {
    const { result } = renderHook(() => useGame(10))
const answerCount = MAX_LIVE_HISTORY * 2 + 25
let correctAnswers = 0
let totalResponseTimeMs = 0
    vi.setSystemTime(0)
act(() => result.current.startGame(1, 'practice', false, ['addition']))
for (let answerNumber = 0; answerNumber < answerCount; answerNumber += 1) {
      const responseTimeMs = answerNumber + 1
vi.advanceTimersByTime(responseTimeMs)
totalResponseTimeMs += responseTimeMs
const isCorrect = answerNumber % 2 === 0
if (isCorrect) correctAnswers += 1
act(() => result.current.submitAnswer(isCorrect
        ? result.current.currentQuestion!.answer
        : result.current.currentQuestion!.answer + 1))
}
    act(() => result.current.endGame())
    expect(result.current.history).toHaveLength(MAX_LIVE_HISTORY)
expect(result.current.missedQuestions).toHaveLength(MAX_MISSED_QUESTIONS)
expect(result.current.roundSummary).toMatchObject({
      totalQuestions: answerCount,
      correctAnswers,
      accuracy: Math.round((correctAnswers / answerCount) * 100),
      averageResponseTimeMs: totalResponseTimeMs / answerCount,
    })
expect(result.current.progressSessions[0]).toMatchObject({
      totalQuestions: answerCount,
      correctAnswers,
      averageResponseTimeMs: totalResponseTimeMs / answerCount,
    })
expect(result.current.progressMetrics.questionsAttempted).toBe(answerCount)
expect(result.current.progressMetrics.questionsSolved).toBe(correctAnswers)
})
  it('handles game end logic', () => {
    const { result } = renderHook(() => useGame(10))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    act(() => {
      result.current.endGame()
})
    expect(result.current.status).toBe('finished')
expect(result.current.moonGames).toBe(1)
})
  it('finalizes exactly once when manual ending is repeated under Strict Mode', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    const { result } = renderHook(() => useGame(10), { wrapper: StrictModeWrapper })
    act(() => result.current.startGame(1, 'blitz', false))
    act(() => {
      result.current.endGame()
      result.current.endGame()
    })
    expect(result.current.moonGames).toBe(1)
    expect(result.current.progressSessions).toHaveLength(1)
    expect(setItemSpy.mock.calls.filter(([key]) => key === 'numberrush_moon_games')).toHaveLength(1)
    expect(setItemSpy.mock.calls.filter(([key]) => key === 'numberrush_progress_sessions')).toHaveLength(1)
    setItemSpy.mockRestore()
  })
  it('lets timer expiry win the boundary race and persist one session', () => {
    const { result } = renderHook(() => useGame(1), { wrapper: StrictModeWrapper })
    act(() => result.current.startGame(1, 'blitz', false))
    const answer = result.current.currentQuestion!.answer
    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.status).toBe('finished')
    expect(result.current.submitAnswer(answer)).toBeNull()
    expect(result.current.progressSessions).toHaveLength(1)
    expect(result.current.moonGames).toBe(1)
  })
  it('ignores a rapid second submission after a round has finished', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
      result.current.endGame()
    })
    act(() => result.current.startTargetedPractice())
    const answer = result.current.currentQuestion!.answer
    let secondFeedback
    act(() => {
      result.current.submitAnswer(answer)
      secondFeedback = result.current.submitAnswer(answer)
    })
    expect(secondFeedback).toBeNull()
    expect(result.current.status).toBe('finished')
    expect(result.current.progressSessions).toHaveLength(2)
  })
  it('rejects a same-turn double submission before the next state commits', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
    const answer = result.current.currentQuestion!.answer
    let secondFeedback
    act(() => {
      result.current.submitAnswer(answer)
      secondFeedback = result.current.submitAnswer(answer)
    })
    expect(secondFeedback).toBeNull()
    expect(result.current.roundTotalQuestions).toBe(1)
    expect(result.current.history).toHaveLength(1)
    expect(result.current.recurringProgress.dailyCorrectAnswers).toBe(1)
  })
  it('retries a failed finalization write without creating another session', () => {
    let failProgressWrite = true
    const originalSetItem = localStorage.setItem.bind(localStorage)
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (failProgressWrite && key === 'numberrush_progress_sessions') throw new Error('temporary storage failure')
      originalSetItem(key, value)
    })
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
      result.current.endGame()
    })
    expect(result.current.progressSessions).toHaveLength(1)
    expect(localStorage.getItem('numberrush_progress_sessions')).toBeNull()
    failProgressWrite = false
    act(() => vi.advanceTimersByTime(1_000))
    expect(JSON.parse(localStorage.getItem('numberrush_progress_sessions')!)).toHaveLength(1)
    setItemSpy.mockRestore()
  })
  it('persists aggregate changes when targeted practice finishes on its final answer', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'blitz', false, ['addition']))
    act(() => result.current.submitAnswer(result.current.currentQuestion!.answer + 1))
    act(() => result.current.endGame())
    act(() => result.current.startTargetedPractice())
    act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
    expect(result.current.status).toBe('finished')
    expect(localStorage.getItem('numberrush_highscore')).toBe('10')
    expect(localStorage.getItem('numberrush_beststreak')).toBe('1')
    expect(localStorage.getItem('numberrush_total_correct')).toBe('1')
  })
  it('does not retry a stale aggregate snapshot after a newer write succeeds', () => {
    let failHighScore = true
    const originalSetItem = localStorage.setItem.bind(localStorage)
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (failHighScore && key === 'numberrush_highscore') throw new Error('temporary storage failure')
      originalSetItem(key, value)
    })
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'practice', false, ['addition']))
    act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
    expect(localStorage.getItem('numberrush_highscore')).toBeNull()
    failHighScore = false
    act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
    expect(localStorage.getItem('numberrush_highscore')).toBe('20')
    act(() => vi.advanceTimersByTime(1_000))
    expect(localStorage.getItem('numberrush_highscore')).toBe('20')
    setItemSpy.mockRestore()
  })
  it('counts a game on the planet where it finishes', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => result.current.startGame(1, 'blitz', false, ['addition']))
for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => result.current.submitAnswer(result.current.currentQuestion!.answer))
}
    act(() => result.current.endGame())
    expect(result.current.currentLevel).toBe(2)
expect(result.current.moonGames).toBe(0)
expect(result.current.marsGames).toBe(1)
expect(result.current.spaceGames).toBe(0)
})
  it('builds an accurate round summary with response timing and separate streaks', () => {
    const { result } = renderHook(() => useGame(10))
vi.setSystemTime(0)
    act(() => {
      result.current.startGame(1, 'blitz', false)
})
    vi.setSystemTime(1500)
act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer)
})
    vi.setSystemTime(3500)
act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
result.current.endGame()
})
    expect(result.current.roundSummary).toMatchObject({
      finalScore: 10,
      totalQuestions: 2,
      correctAnswers: 1,
      accuracy: 50,
      averageResponseTimeMs: 1750,
      bestStreak: 1,
      allTimeBestStreak: 1,
      personalBestScore: 0,
      personalBestStreak: 0,
      isNewPersonalBestScore: true,
      isNewPersonalBestStreak: true,
      mode: 'blitz',
    })
expect(result.current.streak).toBe(0)
})
  it('finishes Practice rounds and reports zero-answer metrics safely', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
result.current.endGame()
})
    expect(result.current.status).toBe('finished')
expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageResponseTimeMs: null,
      bestStreak: 0,
      mode: 'practice',
    })
})
  it('captures personal-best baselines before a round starts', () => {
    localStorage.setItem('numberrush_highscore', '50')
localStorage.setItem('numberrush_beststreak', '3')
const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
})
act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer)
})
act(() => {
      result.current.endGame()
})
    expect(result.current.roundSummary).toMatchObject({
      personalBestScore: 50,
      personalBestStreak: 3,
      allTimeBestStreak: 3,
      isNewPersonalBestScore: false,
      isNewPersonalBestStreak: false,
    })
})
  it('starts and completes a targeted practice round from missed questions', () => {
    const { result } = renderHook(() => useGame(10))
let missedQuestionAnswer = 0
    act(() => {
      result.current.startGame(1, 'blitz', false)
})
act(() => {
      missedQuestionAnswer = result.current.currentQuestion!.answer
result.current.submitAnswer(missedQuestionAnswer + 1)
})
act(() => {
      result.current.endGame()
})
    const missedQuestion = result.current.history[0].question
act(() => {
      result.current.startTargetedPractice()
})
    expect(result.current.status).toBe('playing')
expect(result.current.mode).toBe('practice')
expect(result.current.currentQuestion).toEqual(missedQuestion)
expect(result.current.missedQuestions).toHaveLength(1)
    act(() => {
      const feedback = result.current.submitAnswer(missedQuestionAnswer + 1)
expect(feedback?.isCorrect).toBe(false)
})
    expect(result.current.status).toBe('finished')
expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 1,
      correctAnswers: 0,
      accuracy: 0,
      mode: 'practice',
    })
    act(() => {
      result.current.startTargetedPractice()
})
act(() => {
      const feedback = result.current.submitAnswer(missedQuestionAnswer)
expect(feedback?.isCorrect).toBe(true)
})
    expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 1,
      correctAnswers: 1,
      accuracy: 100,
      mode: 'practice',
    })
})
  it('resets the blitz timer for an answer without pausing the interval', () => {
    const { result } = renderHook(() => useGame(3))
act(() => {
      result.current.startGame(1, 'blitz', false)
})
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
})
expect(result.current.timeLeft).toBe(3)
    act(() => {
      vi.advanceTimersByTime(1000)
})
expect(result.current.timeLeft).toBe(2)
})
  it('keeps the current planet when targeted practice is exhausted', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'blitz', false)
})
    for (let questionNumber = 0; questionNumber < 10; questionNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
})
}

    act(() => {
      result.current.endGame()
result.current.startTargetedPractice()
})
    for (let questionNumber = 0; questionNumber < 10; questionNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer)
})
}

    expect(result.current.status).toBe('finished')
expect(result.current.currentLevel).toBe(1)
expect(result.current.playedLevels).toEqual([1])
expect(result.current.marsGames).toBe(0)
})
  it('clears personal-best baselines when progress is reset during a round', () => {
    localStorage.setItem('numberrush_highscore', '50')
localStorage.setItem('numberrush_beststreak', '3')
const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
result.current.resetStats()
})
act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer)
result.current.endGame()
})
    expect(result.current.roundSummary).toMatchObject({
      personalBestScore: 0,
      personalBestStreak: 0,
      allTimeBestStreak: 1,
      isNewPersonalBestScore: true,
      isNewPersonalBestStreak: true,
    })
})
  it('records answer-level operator and effective difficulty data in persisted sessions', () => {
    const { result, unmount } = renderHook(() => useGame(10))
vi.setSystemTime(0)
    act(() => {
      result.current.startGame(1, 'blitz', false, ['multiplication'], 'hard')
})
vi.setSystemTime(1500)
act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1)
result.current.endGame()
})
    expect(result.current.progressSessions).toHaveLength(1)
expect(result.current.progressSessions[0].answers[0]).toMatchObject({
      isCorrect: false,
      operations: ['multiplication'],
      difficulty: 'hard',
      responseTimeMs: 1500,
    })
expect(JSON.parse(localStorage.getItem('numberrush_progress_sessions')!)).toHaveLength(1)
    unmount()
const reloaded = renderHook(() => useGame(10))
expect(reloaded.result.current.progressSessions).toHaveLength(1)
expect(reloaded.result.current.progressMetrics.questionsAttempted).toBe(1)
})
  it('records a zero-answer finished session and clears progress on reset', () => {
    const { result } = renderHook(() => useGame(10))
    act(() => {
      result.current.startGame(1, 'practice', false)
result.current.endGame()
})
    expect(result.current.progressSessions[0]).toMatchObject({ totalQuestions: 0, correctAnswers: 0, averageResponseTimeMs: null })
act(() => result.current.resetStats())
expect(result.current.progressSessions).toEqual([])
expect(localStorage.getItem('numberrush_progress_sessions')).toBeNull()
})
})
