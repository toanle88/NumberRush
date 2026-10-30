import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateProgressMetrics,
  createProgressSession,
  MAX_ANSWERS_PER_SESSION,
  MAX_PROGRESS_QUESTIONS,
  MAX_PROGRESS_SESSIONS,
  PROGRESS_STORAGE_KEY,
  readProgressSessions,
  writeProgressSessions,
} from './progress'
describe('progress metrics', () => {
  beforeEach(() => localStorage.clear())
  it('calculates weighted overall, operator, and difficulty metrics from attempts', () => {
    const sessions = [
      createProgressSession({
        completedAt: 100,
        mode: 'blitz',
        finalScore: 10,
        bestStreak: 1,
        answers: [
          { isCorrect: true, operations: ['addition'], difficulty: 'easy', level: 1, responseTimeMs: 1000 },
          { isCorrect: false, operations: ['addition', 'addition', 'multiplication'], difficulty: 'easy', level: 1, responseTimeMs: 3000 },
        ],
      }),
      createProgressSession({
        completedAt: 200,
        mode: 'practice',
        finalScore: 20,
        bestStreak: 2,
        answers: [
          { isCorrect: true, operations: ['multiplication'], difficulty: 'hard', level: 3, responseTimeMs: 5000 },
        ],
      }),
    ]
    const metrics = calculateProgressMetrics(sessions)
    expect(metrics).toMatchObject({
      totalSessions: 2,
      questionsAttempted: 3,
      questionsSolved: 2,
      accuracy: 67,
      averageResponseTimeMs: 3000,
      trend: { accuracyChange: 50, averageResponseTimeChangeMs: 3000, solvedChange: 0 },
    })
expect(metrics.byOperator.addition).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 2000 })
expect(metrics.byOperator.multiplication).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 4000 })
expect(metrics.byDifficulty.easy).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 2000 })
expect(metrics.byDifficulty.hard).toMatchObject({ attempts: 1, solved: 1, accuracy: 100, averageResponseTimeMs: 5000 })
expect(metrics.byOperator.division.attempts).toBe(0)
expect(metrics.recentSessions[0].completedAt).toBe(200)
})
  it('persists and validates session records for offline reloads', () => {
    const session = createProgressSession({
      completedAt: 100,
      mode: 'blitz',
      finalScore: 10,
      bestStreak: 1,
      answers: [{ isCorrect: true, operations: ['division'], difficulty: 'medium', level: 2, responseTimeMs: 1200 }],
    })
writeProgressSessions([session])
    expect(readProgressSessions()).toEqual([session])
localStorage.setItem(PROGRESS_STORAGE_KEY, '{bad json')
expect(readProgressSessions()).toEqual([])
})
  it('limits untrusted session and answer arrays before parsing them', () => {
    const answer = {
      isCorrect: true,
      operations: ['addition'],
      difficulty: 'easy',
      level: 1,
      responseTimeMs: 100,
    }
const stored = Array.from({ length: MAX_PROGRESS_SESSIONS + 5 }, (_, sessionIndex) => ({
      id: `session-${sessionIndex}`,
      completedAt: sessionIndex,
      mode: 'practice',
      finalScore: 0,
      bestStreak: 0,
      answers: Array.from({ length: MAX_ANSWERS_PER_SESSION + 5 }, () => answer),
    }))
localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(stored))
    const sessions = readProgressSessions()
    expect(sessions).toHaveLength(MAX_PROGRESS_SESSIONS)
expect(sessions[0].completedAt).toBe(5)
expect(sessions[0].answers).toHaveLength(MAX_ANSWERS_PER_SESSION)
})
  it('rejects persisted progress values outside supported bounds', () => {
    const answer = {
      isCorrect: true,
      operations: ['addition'],
      difficulty: 'easy',
      level: 1,
      responseTimeMs: 100,
    }
localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify([
      { id: 'too-large-score', completedAt: 1, mode: 'practice', finalScore: 1_000_000_001, bestStreak: 0, answers: [answer] },
      { id: 'too-large-streak', completedAt: 2, mode: 'practice', finalScore: 0, bestStreak: 1_000_001, answers: [answer] },
      { id: 'too-many-operations', completedAt: 3, mode: 'practice', finalScore: 0, bestStreak: 0, answers: [{ ...answer, operations: ['addition', 'subtraction', 'multiplication', 'division', 'addition'] }] },
    ]))
    expect(readProgressSessions()).toEqual([])
})
  it('keeps empty metrics safe for a new player', () => {
    const metrics = calculateProgressMetrics([])
    expect(metrics.totalSessions).toBe(0)
expect(metrics.questionsSolved).toBe(0)
expect(metrics.accuracy).toBe(0)
expect(metrics.averageResponseTimeMs).toBeNull()
expect(metrics.trend).toBeNull()
})
  it('bounds persisted progress history and ignores storage failures', () => {
    const sessions = Array.from({ length: MAX_PROGRESS_SESSIONS + 5 }, (_, sessionIndex) => createProgressSession({
      completedAt: sessionIndex,
      mode: 'practice',
      finalScore: sessionIndex,
      bestStreak: 0,
      answers: Array.from({ length: MAX_ANSWERS_PER_SESSION + 5 }, (_, answerIndex) => ({
        isCorrect: answerIndex % 2 === 0,
        operations: ['addition' as const],
        difficulty: 'easy' as const,
        level: 1,
        responseTimeMs: answerIndex,
      })),
    }))
    writeProgressSessions(sessions)
const saved = readProgressSessions()
expect(saved).toHaveLength(MAX_PROGRESS_SESSIONS)
expect(saved[0].completedAt).toBe(5)
expect(saved[0].answers).toHaveLength(MAX_ANSWERS_PER_SESSION)
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
})
expect(() => writeProgressSessions(saved)).not.toThrow()
setItem.mockRestore()
})
  it('preserves session aggregates when the answer review queue is capped', () => {
    const session = createProgressSession({
      completedAt: 100,
      mode: 'practice',
      finalScore: 100,
      bestStreak: 4,
      answers: Array.from({ length: MAX_ANSWERS_PER_SESSION + 10 }, (_, index) => ({
        isCorrect: index % 2 === 0,
        operations: ['addition' as const],
        difficulty: 'easy' as const,
        level: 1,
        responseTimeMs: 100,
      })),
      totalQuestions: MAX_ANSWERS_PER_SESSION + 10,
      correctAnswers: 105,
      averageResponseTimeMs: 100,
    })
writeProgressSessions([session])
    const loaded = readProgressSessions()[0]
expect(loaded).toMatchObject({
      totalQuestions: MAX_ANSWERS_PER_SESSION + 10,
      correctAnswers: 105,
      accuracy: 50,
      averageResponseTimeMs: 100,
    })
expect(calculateProgressMetrics([loaded]).questionsAttempted).toBe(MAX_ANSWERS_PER_SESSION + 10)
})
  it('rejects untrusted aggregate values outside their supported bounds', () => {
    const answer = {
      isCorrect: true,
      operations: ['addition'],
      difficulty: 'easy',
      level: 1,
      responseTimeMs: 100,
    }
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify([
      { id: 'too-many-questions', completedAt: 1, mode: 'practice', finalScore: 0, bestStreak: 0, totalQuestions: MAX_PROGRESS_QUESTIONS + 1, correctAnswers: 1, averageResponseTimeMs: 100, answers: [answer] },
      { id: 'too-slow', completedAt: 2, mode: 'practice', finalScore: 0, bestStreak: 0, totalQuestions: 1, correctAnswers: 1, averageResponseTimeMs: 86_400_001, answers: [answer] },
    ]))

    expect(readProgressSessions()).toEqual([])
  })
  it('does not throw for fuzzed malformed session records', () => {
    const malformedRecords = Array.from({ length: 100 }, (_, index) => ({
      id: index % 2 === 0 ? 'valid-looking' : ['unexpected', index],
      completedAt: index % 3 === 0 ? Number.POSITIVE_INFINITY : 'not-a-date',
      mode: index % 2 === 0 ? 'practice' : 'unknown',
      totalQuestions: index % 4 === 0 ? Number.MAX_SAFE_INTEGER + 1 : { value: index },
      answers: index % 5 === 0 ? [null, {}, 'answer'] : 'not-an-array',
    }))
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(malformedRecords))

    expect(() => readProgressSessions()).not.toThrow()
  })
})
