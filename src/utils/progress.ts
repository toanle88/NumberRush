import type { DifficultyTier, Operation } from './mathLogic'
import { readStoredJson, writeStoredJson } from './storage'
import { STORAGE_KEYS } from './storageKeys'
export const PROGRESS_STORAGE_KEY = STORAGE_KEYS.PROGRESS_SESSIONS
export const MAX_PROGRESS_SESSIONS = 60
export const MAX_ANSWERS_PER_SESSION = 200
export const MAX_PROGRESS_QUESTIONS = 10_000
const MAX_PROGRESS_STRING_LENGTH = 128
const MAX_PROGRESS_LEVEL = 1_000
const MAX_RESPONSE_TIME_MS = 86_400_000
const MAX_PROGRESS_SCORE = 1_000_000_000
const MAX_PROGRESS_STREAK = 1_000_000
export interface ProgressAnswer {
  isCorrect: boolean
operations: Operation[]
difficulty: DifficultyTier
level: number
responseTimeMs: number}

export interface ProgressAggregate {
  attempts: number
  solved: number
  totalResponseTimeMs: number
}

export type OperatorProgressAggregates = Record<Operation, ProgressAggregate>
export type DifficultyProgressAggregates = Record<DifficultyTier, ProgressAggregate>

export interface ProgressSession {
  id: string
completedAt: number
mode: 'blitz' | 'practice'
finalScore: number
bestStreak: number
totalQuestions: number
correctAnswers: number
accuracy: number
averageResponseTimeMs: number | null
  operatorAggregates: OperatorProgressAggregates
  difficultyAggregates: DifficultyProgressAggregates
answers: ProgressAnswer[]}

export interface ProgressBreakdown {
  attempts: number
solved: number
accuracy: number
averageResponseTimeMs: number | null}

export interface ProgressTrend {
  accuracyChange: number
averageResponseTimeChangeMs: number | null
solvedChange: number}

export interface ProgressMetrics extends ProgressBreakdown {
  totalSessions: number
questionsAttempted: number
questionsSolved: number
byOperator: Record<Operation, ProgressBreakdown>
byDifficulty: Record<DifficultyTier, ProgressBreakdown>
recentSessions: ProgressSession[]
trend: ProgressTrend | null}

const OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication', 'division']
const DIFFICULTIES: DifficultyTier[] = ['easy', 'medium', 'hard']
const emptyAggregate = (): ProgressAggregate => ({ attempts: 0, solved: 0, totalResponseTimeMs: 0 })
const createAggregateMap = <T extends string>(values: T[]): Record<T, ProgressAggregate> => {
  return values.reduce((result, value) => {
    result[value] = emptyAggregate()
    return result
  }, {} as Record<T, ProgressAggregate>)
}
export const createEmptyOperatorAggregates = (): OperatorProgressAggregates => createAggregateMap(OPERATIONS)
export const createEmptyDifficultyAggregates = (): DifficultyProgressAggregates => createAggregateMap(DIFFICULTIES)
const emptyBreakdown = (): ProgressBreakdown => ({
  attempts: 0,
  solved: 0,
  accuracy: 0,
  averageResponseTimeMs: null,
})
const addAggregate = (aggregate: ProgressAggregate, answer: ProgressAnswer): ProgressAggregate => ({
  attempts: aggregate.attempts + 1,
  solved: aggregate.solved + (answer.isCorrect ? 1 : 0),
  totalResponseTimeMs: aggregate.totalResponseTimeMs + answer.responseTimeMs,
})
export const recordProgressAnswer = (
  operatorAggregates: OperatorProgressAggregates,
  difficultyAggregates: DifficultyProgressAggregates,
  answer: ProgressAnswer,
): { operatorAggregates: OperatorProgressAggregates; difficultyAggregates: DifficultyProgressAggregates } => {
  const nextOperatorAggregates = { ...operatorAggregates }
  for (const operation of new Set(answer.operations)) {
    nextOperatorAggregates[operation] = addAggregate(operatorAggregates[operation], answer)
  }
  return {
    operatorAggregates: nextOperatorAggregates,
    difficultyAggregates: {
      ...difficultyAggregates,
      [answer.difficulty]: addAggregate(difficultyAggregates[answer.difficulty], answer),
    },
  }
}
const getAggregates = (answers: ProgressAnswer[]): { operatorAggregates: OperatorProgressAggregates; difficultyAggregates: DifficultyProgressAggregates } => {
  let operatorAggregates = createEmptyOperatorAggregates()
  let difficultyAggregates = createEmptyDifficultyAggregates()
  for (const answer of answers) {
    const next = recordProgressAnswer(operatorAggregates, difficultyAggregates, answer)
    operatorAggregates = next.operatorAggregates
    difficultyAggregates = next.difficultyAggregates
  }
  return { operatorAggregates, difficultyAggregates }
}
const getBreakdown = (answers: ProgressAnswer[]): ProgressBreakdown => {
  const attempts = answers.length
const solved = answers.filter(answer => answer.isCorrect).length
const totalResponseTimeMs = answers.reduce((total, answer) => total + answer.responseTimeMs, 0)
return {
    attempts,
    solved,
    accuracy: attempts > 0 ? Math.round((solved / attempts) * 100) : 0,
    averageResponseTimeMs: attempts > 0 ? totalResponseTimeMs / attempts : null,
  }
}
const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
export const createProgressSession = (input: {
  completedAt?: number
mode: ProgressSession['mode']
finalScore: number
bestStreak: number
answers: ProgressAnswer[]
operatorAggregates?: OperatorProgressAggregates
difficultyAggregates?: DifficultyProgressAggregates
totalQuestions?: number
correctAnswers?: number
averageResponseTimeMs?: number | null}): ProgressSession => {
  const normalizedAnswers = input.answers.map(answer => ({ ...answer, operations: [...new Set(answer.operations)] }))
  const answers = normalizedAnswers.slice(-MAX_ANSWERS_PER_SESSION)
const breakdown = getBreakdown(normalizedAnswers)
const derivedAggregates = getAggregates(normalizedAnswers)
const requestedTotalQuestions = input.totalQuestions ?? breakdown.attempts
const totalQuestions = Number.isSafeInteger(requestedTotalQuestions) && requestedTotalQuestions >= breakdown.attempts
    ? Math.min(requestedTotalQuestions, MAX_PROGRESS_QUESTIONS)
    : breakdown.attempts
const requestedCorrectAnswers = input.correctAnswers ?? breakdown.solved
const correctAnswers = Number.isSafeInteger(requestedCorrectAnswers) && requestedCorrectAnswers >= 0
    ? Math.min(requestedCorrectAnswers, totalQuestions)
    : breakdown.solved
const averageResponseTimeMs = input.averageResponseTimeMs === undefined
    ? breakdown.averageResponseTimeMs
    : typeof input.averageResponseTimeMs === 'number'
      && Number.isFinite(input.averageResponseTimeMs)
      && input.averageResponseTimeMs >= 0
      && input.averageResponseTimeMs <= MAX_RESPONSE_TIME_MS
      ? input.averageResponseTimeMs
      : breakdown.averageResponseTimeMs
const operatorAggregates = parseAggregateMap(input.operatorAggregates, OPERATIONS, totalQuestions, OPERATIONS.length, false) ?? derivedAggregates.operatorAggregates
const difficultyAggregates = parseAggregateMap(input.difficultyAggregates, DIFFICULTIES, totalQuestions, 1, true) ?? derivedAggregates.difficultyAggregates
return {
    id: createId(),
    completedAt: input.completedAt ?? Date.now(),
    mode: input.mode,
    finalScore: input.finalScore,
    bestStreak: input.bestStreak,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    averageResponseTimeMs,
    operatorAggregates,
    difficultyAggregates,
    answers,
  }
}
const isOperation = (value: unknown): value is Operation => OPERATIONS.includes(value as Operation)
const isDifficulty = (value: unknown): value is DifficultyTier => DIFFICULTIES.includes(value as DifficultyTier)
const parseAnswer = (value: unknown): ProgressAnswer | null => {
  if (!value || typeof value !== 'object') return null
const answer = value as Partial<ProgressAnswer>
if (typeof answer.isCorrect !== 'boolean' || !isDifficulty(answer.difficulty) || typeof answer.level !== 'number' || !Number.isSafeInteger(answer.level) || answer.level < 0 || answer.level > MAX_PROGRESS_LEVEL || typeof answer.responseTimeMs !== 'number' || !Number.isFinite(answer.responseTimeMs) || answer.responseTimeMs < 0 || answer.responseTimeMs > MAX_RESPONSE_TIME_MS || !Array.isArray(answer.operations) || answer.operations.length > OPERATIONS.length) return null
const operations = [...new Set(answer.operations.filter(isOperation))]
if (operations.length === 0) return null
return {
    isCorrect: answer.isCorrect,
    operations,
    difficulty: answer.difficulty,
    level: answer.level,
    responseTimeMs: answer.responseTimeMs,
  }
}
const parseAggregateMap = <T extends string>(value: unknown, values: T[], totalQuestions: number, maxEntriesPerQuestion: number, requireExactAttempts: boolean): Record<T, ProgressAggregate> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== values.length || values.some(key => !Object.prototype.hasOwnProperty.call(record, key))) return null
  const result = {} as Record<T, ProgressAggregate>
  let totalAttempts = 0
  for (const key of values) {
    const aggregate = record[key]
    if (!aggregate || typeof aggregate !== 'object' || Array.isArray(aggregate)) return null
    const candidate = aggregate as Partial<ProgressAggregate>
    const attempts = candidate.attempts
    const solved = candidate.solved
    const totalResponseTimeMs = candidate.totalResponseTimeMs
    if (typeof attempts !== 'number' || !Number.isSafeInteger(attempts) || attempts < 0 || attempts > totalQuestions || typeof solved !== 'number' || !Number.isSafeInteger(solved) || solved < 0 || solved > attempts || typeof totalResponseTimeMs !== 'number' || !Number.isFinite(totalResponseTimeMs) || totalResponseTimeMs < 0 || totalResponseTimeMs > attempts * MAX_RESPONSE_TIME_MS) return null
    result[key] = {
      attempts,
      solved,
      totalResponseTimeMs,
    }
    totalAttempts += attempts
  }
  if (totalAttempts > totalQuestions * maxEntriesPerQuestion || (requireExactAttempts && totalAttempts !== totalQuestions)) return null
  return result
}
const parseSession = (value: unknown): ProgressSession | null => {
  if (!value || typeof value !== 'object') return null
const session = value as Partial<ProgressSession>
if (typeof session.id !== 'string' || session.id.length === 0 || session.id.length > MAX_PROGRESS_STRING_LENGTH || typeof session.completedAt !== 'number' || !Number.isSafeInteger(session.completedAt) || session.completedAt < 0 || (session.mode !== 'blitz' && session.mode !== 'practice') || typeof session.finalScore !== 'number' || !Number.isSafeInteger(session.finalScore) || session.finalScore < 0 || session.finalScore > MAX_PROGRESS_SCORE || typeof session.bestStreak !== 'number' || !Number.isSafeInteger(session.bestStreak) || session.bestStreak < 0 || session.bestStreak > MAX_PROGRESS_STREAK || !Array.isArray(session.answers)) return null
const answers = session.answers.slice(-MAX_ANSWERS_PER_SESSION).map(parseAnswer).filter((answer): answer is ProgressAnswer => answer !== null)
if (session.answers.length > 0 && answers.length === 0) return null
const totalQuestions = session.totalQuestions === undefined
    ? answers.length
    : typeof session.totalQuestions === 'number' && Number.isSafeInteger(session.totalQuestions) && session.totalQuestions >= answers.length && session.totalQuestions <= MAX_PROGRESS_QUESTIONS
      ? session.totalQuestions
      : null
if (totalQuestions === null) return null
const correctAnswers = session.correctAnswers === undefined
    ? answers.filter(answer => answer.isCorrect).length
    : typeof session.correctAnswers === 'number' && Number.isSafeInteger(session.correctAnswers) && session.correctAnswers >= 0 && session.correctAnswers <= totalQuestions
      ? session.correctAnswers
      : null
if (correctAnswers === null) return null
const averageResponseTimeMs = session.averageResponseTimeMs === undefined
    ? getBreakdown(answers).averageResponseTimeMs
    : session.averageResponseTimeMs === null
      ? null
      : typeof session.averageResponseTimeMs === 'number' && Number.isFinite(session.averageResponseTimeMs) && session.averageResponseTimeMs >= 0 && session.averageResponseTimeMs <= MAX_RESPONSE_TIME_MS
        ? session.averageResponseTimeMs
        : null
if (session.averageResponseTimeMs !== undefined && averageResponseTimeMs === null && session.averageResponseTimeMs !== null) return null
const derivedAggregates = getAggregates(answers)
const operatorAggregates = session.operatorAggregates === undefined
    ? derivedAggregates.operatorAggregates
    : parseAggregateMap(session.operatorAggregates, OPERATIONS, totalQuestions, OPERATIONS.length, false)
const difficultyAggregates = session.difficultyAggregates === undefined
    ? derivedAggregates.difficultyAggregates
    : parseAggregateMap(session.difficultyAggregates, DIFFICULTIES, totalQuestions, 1, true)
if (!operatorAggregates || !difficultyAggregates) return null
return {
    id: session.id,
    completedAt: session.completedAt,
    mode: session.mode,
    finalScore: session.finalScore,
    bestStreak: session.bestStreak,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    averageResponseTimeMs,
    operatorAggregates,
    difficultyAggregates,
    answers,
  }
}
export const isValidProgressSessions = (value: unknown): boolean => {
  if (!Array.isArray(value) || value.length > MAX_PROGRESS_SESSIONS) return false
  return value.every(session => {
    if (!parseSession(session)) return false
    const answers = (session as Partial<ProgressSession>).answers
    return Array.isArray(answers)
      && answers.length <= MAX_ANSWERS_PER_SESSION
      && answers.every(answer => parseAnswer(answer) !== null)
  })
}
export const readProgressSessions = (): ProgressSession[] => {
  try {
    const parsed = readStoredJson<unknown>(PROGRESS_STORAGE_KEY)
    if (!parsed) return []
return Array.isArray(parsed)
      ? parsed.slice(-MAX_PROGRESS_SESSIONS).map(parseSession).filter((session): session is ProgressSession => session !== null)
      : []
  } catch {
    return []
}
}
export const writeProgressSessions = (sessions: ProgressSession[]): boolean => {
  return writeStoredJson(PROGRESS_STORAGE_KEY, sessions.slice(-MAX_PROGRESS_SESSIONS))
}
const createBreakdownMap = <T extends string>(values: T[]): Record<T, ProgressBreakdown> => {
  return values.reduce((result, value) => {
    result[value] = emptyBreakdown()
return result
}, {} as Record<T, ProgressBreakdown>)
}
export const calculateProgressMetrics = (sessions: ProgressSession[]): ProgressMetrics => {
const totalQuestions = sessions.reduce((total, session) => total + session.totalQuestions, 0)
const correctAnswers = sessions.reduce((total, session) => total + session.correctAnswers, 0)
const totalResponseTimeMs = sessions.reduce((total, session) => total + (session.averageResponseTimeMs === null ? 0 : session.averageResponseTimeMs * session.totalQuestions), 0)
const overall: ProgressBreakdown = {
    attempts: totalQuestions,
    solved: correctAnswers,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    averageResponseTimeMs: totalQuestions > 0 ? totalResponseTimeMs / totalQuestions : null,
  }
const byOperator = createBreakdownMap(OPERATIONS)
const byDifficulty = createBreakdownMap(DIFFICULTIES)
  for (const session of sessions) {
    for (const operation of OPERATIONS) {
      const aggregate = session.operatorAggregates[operation]
      const operationAnswers = byOperator[operation]
      operationAnswers.attempts += aggregate.attempts
      operationAnswers.solved += aggregate.solved
      operationAnswers.averageResponseTimeMs = (operationAnswers.averageResponseTimeMs ?? 0) + aggregate.totalResponseTimeMs
    }
    for (const difficulty of DIFFICULTIES) {
      const aggregate = session.difficultyAggregates[difficulty]
      const difficultyAnswers = byDifficulty[difficulty]
      difficultyAnswers.attempts += aggregate.attempts
      difficultyAnswers.solved += aggregate.solved
      difficultyAnswers.averageResponseTimeMs = (difficultyAnswers.averageResponseTimeMs ?? 0) + aggregate.totalResponseTimeMs
    }
  }

  for (const breakdown of [...Object.values(byOperator), ...Object.values(byDifficulty)]) {
    breakdown.accuracy = breakdown.attempts > 0 ? Math.round((breakdown.solved / breakdown.attempts) * 100) : 0
breakdown.averageResponseTimeMs = breakdown.attempts > 0 ? (breakdown.averageResponseTimeMs ?? 0) / breakdown.attempts : null
}

  const orderedSessions = [...sessions].sort((left, right) => right.completedAt - left.completedAt)
const latest = orderedSessions[0]
const previous = orderedSessions[1]
const trend = latest && previous ? {
    accuracyChange: latest.accuracy - previous.accuracy,
    averageResponseTimeChangeMs: latest.averageResponseTimeMs !== null && previous.averageResponseTimeMs !== null
      ? latest.averageResponseTimeMs - previous.averageResponseTimeMs
      : null,
    solvedChange: latest.correctAnswers - previous.correctAnswers,
  } : null
  return {
    ...overall,
    totalSessions: sessions.length,
    questionsAttempted: overall.attempts,
    questionsSolved: overall.solved,
    byOperator,
    byDifficulty,
    recentSessions: orderedSessions.slice(0, 10),
    trend,
  }
}
