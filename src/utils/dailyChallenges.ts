import { readStorage, writeStorage } from './storage';

export const DAILY_CHALLENGES_STORAGE_KEY = 'numberrush_daily_challenges';

export type DailyChallengeMetric = 'correctAnswers' | 'answers' | 'streak';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  metric: DailyChallengeMetric;
  target: number;
  rewardPoints: number;
}

export interface ChallengeCompletion {
  dateKey: string;
  challengeId: string;
  completedAt: number;
  rewardPoints: number;
}

export interface RecurringProgress {
  dateKey: string;
  dailyCorrectAnswers: number;
  weekStartKey: string;
  weeklyCorrectAnswers: number;
  dailyStreak: number;
  lastCorrectDateKey: string | null;
  challenge: {
    dateKey: string;
    challengeId: string;
    progress: number;
    completed: boolean;
  };
  points: number;
  completionHistory: ChallengeCompletion[];
}

export const DAILY_GOAL = {
  id: 'daily-correct-answers',
  title: 'Daily goal',
  description: 'Solve 10 questions correctly',
  target: 10,
} as const;

export const WEEKLY_GOAL = {
  id: 'weekly-correct-answers',
  title: 'Weekly goal',
  description: 'Solve 50 questions correctly',
  target: 50,
} as const;

const CHALLENGES: readonly DailyChallenge[] = [
  {
    id: 'correct-five',
    title: 'Five for the win',
    description: 'Solve 5 questions correctly',
    metric: 'correctAnswers',
    target: 5,
    rewardPoints: 50,
  },
  {
    id: 'answer-eight',
    title: 'Warm-up lap',
    description: 'Answer 8 questions',
    metric: 'answers',
    target: 8,
    rewardPoints: 40,
  },
  {
    id: 'streak-five',
    title: 'Streak builder',
    description: 'Build a 5-answer streak',
    metric: 'streak',
    target: 5,
    rewardPoints: 60,
  },
  {
    id: 'correct-eight',
    title: 'Sharp shooter',
    description: 'Solve 8 questions correctly',
    metric: 'correctAnswers',
    target: 8,
    rewardPoints: 75,
  },
];

const CHALLENGE_IDS = new Set(CHALLENGES.map(challenge => challenge.id));

const pad = (value: number): string => value.toString().padStart(2, '0');

export const getLocalDateKey = (date: Date = new Date()): string => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

const parseDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
};

export const getWeekStartKey = (date: Date = new Date()): string => {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return getLocalDateKey(weekStart);
};

export const getDailyChallenge = (date: Date = new Date()): DailyChallenge => {
  const dayNumber = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
  return CHALLENGES[Math.abs(dayNumber) % CHALLENGES.length];
};

const isValidNonNegativeInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
);

const isValidDateKey = (value: unknown): value is string => (
  typeof value === 'string' && parseDateKey(value) !== null
);

const createEmptyProgress = (date: Date): RecurringProgress => {
  const dateKey = getLocalDateKey(date);
  return {
    dateKey,
    dailyCorrectAnswers: 0,
    weekStartKey: getWeekStartKey(date),
    weeklyCorrectAnswers: 0,
    dailyStreak: 0,
    lastCorrectDateKey: null,
    challenge: {
      dateKey,
      challengeId: getDailyChallenge(date).id,
      progress: 0,
      completed: false,
    },
    points: 0,
    completionHistory: [],
  };
};

const parseCompletion = (value: unknown): ChallengeCompletion | null => {
  if (!value || typeof value !== 'object') return null;
  const completion = value as Partial<ChallengeCompletion>;
  if (!isValidDateKey(completion.dateKey) || typeof completion.challengeId !== 'string' || !CHALLENGE_IDS.has(completion.challengeId) || !isValidNonNegativeInteger(completion.completedAt) || !isValidNonNegativeInteger(completion.rewardPoints)) return null;
  return {
    dateKey: completion.dateKey,
    challengeId: completion.challengeId,
    completedAt: completion.completedAt,
    rewardPoints: completion.rewardPoints,
  };
};

const parseProgress = (value: unknown): RecurringProgress | null => {
  if (!value || typeof value !== 'object') return null;
  const progress = value as Partial<RecurringProgress>;
  if (!isValidDateKey(progress.dateKey) || !isValidNonNegativeInteger(progress.dailyCorrectAnswers) || !isValidDateKey(progress.weekStartKey) || !isValidNonNegativeInteger(progress.weeklyCorrectAnswers) || !isValidNonNegativeInteger(progress.dailyStreak) || (progress.lastCorrectDateKey !== null && progress.lastCorrectDateKey !== undefined && !isValidDateKey(progress.lastCorrectDateKey)) || !isValidNonNegativeInteger(progress.points) || !progress.challenge || typeof progress.challenge !== 'object' || !isValidDateKey(progress.challenge.dateKey) || typeof progress.challenge.challengeId !== 'string' || !CHALLENGE_IDS.has(progress.challenge.challengeId) || !isValidNonNegativeInteger(progress.challenge.progress) || typeof progress.challenge.completed !== 'boolean' || !Array.isArray(progress.completionHistory)) return null;
  const completionHistory = progress.completionHistory.slice(-60).map(parseCompletion).filter((completion): completion is ChallengeCompletion => completion !== null);
  return {
    dateKey: progress.dateKey,
    dailyCorrectAnswers: progress.dailyCorrectAnswers,
    weekStartKey: progress.weekStartKey,
    weeklyCorrectAnswers: progress.weeklyCorrectAnswers,
    dailyStreak: progress.dailyStreak,
    lastCorrectDateKey: progress.lastCorrectDateKey ?? null,
    challenge: {
      dateKey: progress.challenge.dateKey,
      challengeId: progress.challenge.challengeId,
      progress: progress.challenge.progress,
      completed: progress.challenge.completed,
    },
    points: progress.points,
    completionHistory,
  };
};

export const normalizeRecurringProgress = (saved: RecurringProgress | null, date: Date = new Date()): RecurringProgress => {
  const fresh = createEmptyProgress(date);
  if (!saved) return fresh;

  const dateKey = getLocalDateKey(date);
  const weekStartKey = getWeekStartKey(date);
  return {
    ...saved,
    dateKey,
    dailyCorrectAnswers: saved.dateKey === dateKey ? saved.dailyCorrectAnswers : 0,
    weekStartKey,
    weeklyCorrectAnswers: saved.weekStartKey === weekStartKey ? saved.weeklyCorrectAnswers : 0,
    challenge: saved.challenge.dateKey === dateKey && saved.challenge.challengeId === fresh.challenge.challengeId
      ? saved.challenge
      : fresh.challenge,
    completionHistory: saved.completionHistory.slice(-60),
  };
};

export const readRecurringProgress = (date: Date = new Date()): RecurringProgress => {
  const saved = readStorage(DAILY_CHALLENGES_STORAGE_KEY);
  if (!saved) return createEmptyProgress(date);
  try {
    return normalizeRecurringProgress(parseProgress(JSON.parse(saved)), date);
  } catch {
    return createEmptyProgress(date);
  }
};

export const writeRecurringProgress = (progress: RecurringProgress): void => {
  writeStorage(DAILY_CHALLENGES_STORAGE_KEY, JSON.stringify(progress));
};

const wasCompleted = (progress: RecurringProgress): boolean => (
  progress.completionHistory.some(completion => completion.dateKey === progress.dateKey && completion.challengeId === progress.challenge.challengeId)
);

export const recordAnswerForRecurringProgress = (
  saved: RecurringProgress,
  input: { isCorrect: boolean; currentStreak: number; answeredAt?: Date },
): RecurringProgress => {
  const answeredAt = input.answeredAt ?? new Date();
  const previous = normalizeRecurringProgress(saved, answeredAt);
  const dateKey = getLocalDateKey(answeredAt);
  const challenge = getDailyChallenge(answeredAt);
  const dailyCorrectAnswers = previous.dailyCorrectAnswers + (input.isCorrect ? 1 : 0);
  const weeklyCorrectAnswers = previous.weeklyCorrectAnswers + (input.isCorrect ? 1 : 0);
  const dailyStreak = input.isCorrect && previous.lastCorrectDateKey !== dateKey
    ? previous.lastCorrectDateKey && getLocalDateKey(new Date(answeredAt.getFullYear(), answeredAt.getMonth(), answeredAt.getDate() - 1)) === previous.lastCorrectDateKey
      ? previous.dailyStreak + 1
      : 1
    : previous.dailyStreak;
  const progressValue = challenge.metric === 'answers'
    ? previous.challenge.progress + 1
    : challenge.metric === 'correctAnswers'
      ? previous.challenge.progress + (input.isCorrect ? 1 : 0)
      : Math.max(previous.challenge.progress, input.currentStreak);
  const completed = previous.challenge.completed || progressValue >= challenge.target;
  const shouldReward = completed && !previous.challenge.completed && !wasCompleted(previous);
  const completionHistory = shouldReward
    ? [...previous.completionHistory, { dateKey, challengeId: challenge.id, completedAt: answeredAt.getTime(), rewardPoints: challenge.rewardPoints }].slice(-60)
    : previous.completionHistory;

  const nextProgress: RecurringProgress = {
    ...previous,
    dateKey,
    dailyCorrectAnswers,
    weeklyCorrectAnswers,
    dailyStreak,
    lastCorrectDateKey: input.isCorrect ? dateKey : previous.lastCorrectDateKey,
    challenge: { dateKey, challengeId: challenge.id, progress: Math.min(progressValue, challenge.target), completed },
    points: previous.points + (shouldReward ? challenge.rewardPoints : 0),
    completionHistory,
  };
  writeRecurringProgress(nextProgress);
  return nextProgress;
};

export const getChallengeProgress = (challenge: DailyChallenge, progress: RecurringProgress): number => (
  Math.min(progress.challenge.challengeId === challenge.id ? progress.challenge.progress : 0, challenge.target)
);
