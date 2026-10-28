import { beforeEach, describe, expect, it } from 'vitest';
import {
  DAILY_CHALLENGES_STORAGE_KEY,
  getDailyChallenge,
  getLocalDateKey,
  getWeekStartKey,
  normalizeRecurringProgress,
  readRecurringProgress,
  recordAnswerForRecurringProgress,
} from './dailyChallenges';

describe('daily challenges', () => {
  beforeEach(() => localStorage.clear());

  it('uses the same local-calendar challenge throughout a day and changes on the next day', () => {
    const lateNight = new Date(2026, 4, 12, 23, 59);
    const sameDay = new Date(2026, 4, 12, 1, 0);
    const nextDay = new Date(2026, 4, 13, 0, 1);

    expect(getLocalDateKey(lateNight)).toBe('2026-05-12');
    expect(getDailyChallenge(lateNight)).toEqual(getDailyChallenge(sameDay));
    expect(getDailyChallenge(nextDay).id).not.toBe(getDailyChallenge(lateNight).id);
  });

  it('tracks completion, awards the reward once, and persists it offline', () => {
    const date = new Date(2026, 4, 12, 12);
    const challenge = getDailyChallenge(date);
    let progress = normalizeRecurringProgress(null, date);

    for (let answer = 1; answer <= challenge.target; answer += 1) {
      progress = recordAnswerForRecurringProgress(progress, { isCorrect: true, currentStreak: answer, answeredAt: date });
    }

    expect(progress.challenge).toMatchObject({ challengeId: challenge.id, progress: challenge.target, completed: true });
    expect(progress.points).toBe(challenge.rewardPoints);
    expect(progress.completionHistory).toHaveLength(1);

    const repeated = recordAnswerForRecurringProgress(progress, { isCorrect: true, currentStreak: challenge.target + 1, answeredAt: date });
    expect(repeated.points).toBe(challenge.rewardPoints);
    expect(repeated.completionHistory).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(DAILY_CHALLENGES_STORAGE_KEY)!)).toMatchObject({ points: challenge.rewardPoints });
    expect(readRecurringProgress(date)).toEqual(repeated);
  });

  it('resets daily and weekly counters safely at date boundaries while retaining rewards', () => {
    const monday = new Date(2026, 4, 11, 12);
    const tuesday = new Date(2026, 4, 12, 12);
    const nextMonday = new Date(2026, 4, 18, 12);
    let progress = normalizeRecurringProgress(null, monday);
    progress = recordAnswerForRecurringProgress(progress, { isCorrect: true, currentStreak: 1, answeredAt: monday });

    const nextDay = normalizeRecurringProgress(progress, tuesday);
    expect(nextDay.dailyCorrectAnswers).toBe(0);
    expect(nextDay.weeklyCorrectAnswers).toBe(1);
    expect(nextDay.points).toBe(progress.points);

    const nextWeek = normalizeRecurringProgress(nextDay, nextMonday);
    expect(getWeekStartKey(nextMonday)).toBe('2026-05-18');
    expect(nextWeek.weeklyCorrectAnswers).toBe(0);
    expect(nextWeek.dailyCorrectAnswers).toBe(0);
    expect(nextWeek.completionHistory).toEqual(progress.completionHistory);
  });

  it('ignores unsafe counters and unknown persisted challenge completions', () => {
    const date = new Date(2026, 4, 12, 12);
    const currentChallenge = getDailyChallenge(date);
    localStorage.setItem(DAILY_CHALLENGES_STORAGE_KEY, JSON.stringify({
      dateKey: '2026-05-12',
      dailyCorrectAnswers: Number.MAX_SAFE_INTEGER + 1,
      weeklyCorrectAnswers: 0,
      weekStartKey: '2026-05-11',
      dailyStreak: 0,
      lastCorrectDateKey: null,
      challenge: {
        dateKey: '2026-05-12',
        challengeId: currentChallenge.id,
        progress: 0,
        completed: false,
      },
      points: 0,
      completionHistory: [{
        dateKey: '2026-05-12',
        challengeId: 'untrusted-challenge',
        completedAt: Date.now(),
        rewardPoints: 100,
      }],
    }));

    const progress = readRecurringProgress(date);

    expect(progress.dailyCorrectAnswers).toBe(0);
    expect(progress.completionHistory).toEqual([]);

    localStorage.setItem(DAILY_CHALLENGES_STORAGE_KEY, JSON.stringify({
      dateKey: '2026-05-12',
      dailyCorrectAnswers: 0,
      weeklyCorrectAnswers: 0,
      weekStartKey: '2026-05-11',
      dailyStreak: 0,
      lastCorrectDateKey: null,
      challenge: {
        dateKey: '2026-05-12',
        challengeId: currentChallenge.id,
        progress: 0,
        completed: false,
      },
      points: 0,
      completionHistory: [{
        dateKey: '2026-05-12',
        challengeId: 'untrusted-challenge',
        completedAt: Date.now(),
        rewardPoints: 100,
      }],
    }));

    expect(readRecurringProgress(date).completionHistory).toEqual([]);
  });

  it('resets an unknown active challenge from persisted progress', () => {
    const date = new Date(2026, 4, 12, 12);
    localStorage.setItem(DAILY_CHALLENGES_STORAGE_KEY, JSON.stringify({
      dateKey: '2026-05-12',
      dailyCorrectAnswers: 2,
      weeklyCorrectAnswers: 2,
      weekStartKey: '2026-05-11',
      dailyStreak: 1,
      lastCorrectDateKey: '2026-05-12',
      challenge: {
        dateKey: '2026-05-12',
        challengeId: 'untrusted-challenge',
        progress: 999,
        completed: true,
      },
      points: 100,
      completionHistory: [],
    }));

    const progress = readRecurringProgress(date);

    expect(progress.challenge).toEqual({
      dateKey: '2026-05-12',
      challengeId: getDailyChallenge(date).id,
      progress: 0,
      completed: false,
    });
  });
});
