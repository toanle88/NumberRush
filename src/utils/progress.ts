import type { DifficultyTier, Operation } from './mathLogic';

export const PROGRESS_STORAGE_KEY = 'numberrush_progress_sessions';

export interface ProgressAnswer {
  isCorrect: boolean;
  operations: Operation[];
  difficulty: DifficultyTier;
  level: number;
  responseTimeMs: number;
}

export interface ProgressSession {
  id: string;
  completedAt: number;
  mode: 'blitz' | 'practice';
  finalScore: number;
  bestStreak: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTimeMs: number | null;
  answers: ProgressAnswer[];
}

export interface ProgressBreakdown {
  attempts: number;
  solved: number;
  accuracy: number;
  averageResponseTimeMs: number | null;
}

export interface ProgressTrend {
  accuracyChange: number;
  averageResponseTimeChangeMs: number | null;
  solvedChange: number;
}

export interface ProgressMetrics extends ProgressBreakdown {
  totalSessions: number;
  questionsAttempted: number;
  questionsSolved: number;
  byOperator: Record<Operation, ProgressBreakdown>;
  byDifficulty: Record<DifficultyTier, ProgressBreakdown>;
  recentSessions: ProgressSession[];
  trend: ProgressTrend | null;
}

const OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
const DIFFICULTIES: DifficultyTier[] = ['easy', 'medium', 'hard'];

const emptyBreakdown = (): ProgressBreakdown => ({
  attempts: 0,
  solved: 0,
  accuracy: 0,
  averageResponseTimeMs: null,
});

const getBreakdown = (answers: ProgressAnswer[]): ProgressBreakdown => {
  const attempts = answers.length;
  const solved = answers.filter(answer => answer.isCorrect).length;
  const totalResponseTimeMs = answers.reduce((total, answer) => total + answer.responseTimeMs, 0);
  return {
    attempts,
    solved,
    accuracy: attempts > 0 ? Math.round((solved / attempts) * 100) : 0,
    averageResponseTimeMs: attempts > 0 ? totalResponseTimeMs / attempts : null,
  };
};

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createProgressSession = (input: {
  completedAt?: number;
  mode: ProgressSession['mode'];
  finalScore: number;
  bestStreak: number;
  answers: ProgressAnswer[];
}): ProgressSession => {
  const answers = input.answers.map(answer => ({ ...answer, operations: [...new Set(answer.operations)] }));
  const breakdown = getBreakdown(answers);
  return {
    id: createId(),
    completedAt: input.completedAt ?? Date.now(),
    mode: input.mode,
    finalScore: input.finalScore,
    bestStreak: input.bestStreak,
    totalQuestions: breakdown.attempts,
    correctAnswers: breakdown.solved,
    accuracy: breakdown.accuracy,
    averageResponseTimeMs: breakdown.averageResponseTimeMs,
    answers,
  };
};

const isOperation = (value: unknown): value is Operation => OPERATIONS.includes(value as Operation);
const isDifficulty = (value: unknown): value is DifficultyTier => DIFFICULTIES.includes(value as DifficultyTier);

const parseAnswer = (value: unknown): ProgressAnswer | null => {
  if (!value || typeof value !== 'object') return null;
  const answer = value as Partial<ProgressAnswer>;
  if (typeof answer.isCorrect !== 'boolean' || !isDifficulty(answer.difficulty) || typeof answer.level !== 'number' || !Number.isFinite(answer.level) || typeof answer.responseTimeMs !== 'number' || !Number.isFinite(answer.responseTimeMs) || !Array.isArray(answer.operations)) return null;
  const operations = [...new Set(answer.operations.filter(isOperation))];
  if (operations.length === 0) return null;
  return {
    isCorrect: answer.isCorrect,
    operations,
    difficulty: answer.difficulty,
    level: answer.level,
    responseTimeMs: Math.max(0, answer.responseTimeMs),
  };
};

const parseSession = (value: unknown): ProgressSession | null => {
  if (!value || typeof value !== 'object') return null;
  const session = value as Partial<ProgressSession>;
  if (typeof session.id !== 'string' || typeof session.completedAt !== 'number' || !Number.isFinite(session.completedAt) || (session.mode !== 'blitz' && session.mode !== 'practice') || typeof session.finalScore !== 'number' || !Number.isFinite(session.finalScore) || typeof session.bestStreak !== 'number' || !Number.isFinite(session.bestStreak) || !Array.isArray(session.answers)) return null;
  const parsedAnswers = session.answers.map(parseAnswer);
  if (parsedAnswers.some(answer => answer === null)) return null;
  const answers = parsedAnswers as ProgressAnswer[];
  const breakdown = getBreakdown(answers);
  return {
    id: session.id,
    completedAt: session.completedAt,
    mode: session.mode,
    finalScore: session.finalScore,
    bestStreak: session.bestStreak,
    totalQuestions: breakdown.attempts,
    correctAnswers: breakdown.solved,
    accuracy: breakdown.accuracy,
    averageResponseTimeMs: breakdown.averageResponseTimeMs,
    answers,
  };
};

export const readProgressSessions = (): ProgressSession[] => {
  const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.map(parseSession).filter((session): session is ProgressSession => session !== null)
      : [];
  } catch {
    return [];
  }
};

export const writeProgressSessions = (sessions: ProgressSession[]): void => {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(sessions));
};

const createBreakdownMap = <T extends string>(values: T[]): Record<T, ProgressBreakdown> => {
  return values.reduce((result, value) => {
    result[value] = emptyBreakdown();
    return result;
  }, {} as Record<T, ProgressBreakdown>);
};

export const calculateProgressMetrics = (sessions: ProgressSession[]): ProgressMetrics => {
  const answers = sessions.flatMap(session => session.answers);
  const overall = getBreakdown(answers);
  const byOperator = createBreakdownMap(OPERATIONS);
  const byDifficulty = createBreakdownMap(DIFFICULTIES);

  for (const answer of answers) {
    for (const operation of answer.operations) {
      const operationAnswers = byOperator[operation];
      operationAnswers.attempts += 1;
      operationAnswers.solved += answer.isCorrect ? 1 : 0;
      operationAnswers.averageResponseTimeMs = (operationAnswers.averageResponseTimeMs ?? 0) + answer.responseTimeMs;
    }
    const difficultyAnswers = byDifficulty[answer.difficulty];
    difficultyAnswers.attempts += 1;
    difficultyAnswers.solved += answer.isCorrect ? 1 : 0;
    difficultyAnswers.averageResponseTimeMs = (difficultyAnswers.averageResponseTimeMs ?? 0) + answer.responseTimeMs;
  }

  for (const breakdown of [...Object.values(byOperator), ...Object.values(byDifficulty)]) {
    breakdown.accuracy = breakdown.attempts > 0 ? Math.round((breakdown.solved / breakdown.attempts) * 100) : 0;
    breakdown.averageResponseTimeMs = breakdown.attempts > 0 ? (breakdown.averageResponseTimeMs ?? 0) / breakdown.attempts : null;
  }

  const orderedSessions = [...sessions].sort((left, right) => right.completedAt - left.completedAt);
  const latest = orderedSessions[0];
  const previous = orderedSessions[1];
  const trend = latest && previous ? {
    accuracyChange: latest.accuracy - previous.accuracy,
    averageResponseTimeChangeMs: latest.averageResponseTimeMs !== null && previous.averageResponseTimeMs !== null
      ? latest.averageResponseTimeMs - previous.averageResponseTimeMs
      : null,
    solvedChange: latest.correctAnswers - previous.correctAnswers,
  } : null;

  return {
    ...overall,
    totalSessions: sessions.length,
    questionsAttempted: overall.attempts,
    questionsSolved: overall.solved,
    byOperator,
    byDifficulty,
    recentSessions: orderedSessions.slice(0, 10),
    trend,
  };
};
