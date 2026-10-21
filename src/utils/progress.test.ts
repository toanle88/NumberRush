import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateProgressMetrics,
  createProgressSession,
  PROGRESS_STORAGE_KEY,
  readProgressSessions,
  writeProgressSessions,
} from './progress';

describe('progress metrics', () => {
  beforeEach(() => localStorage.clear());

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
    ];

    const metrics = calculateProgressMetrics(sessions);

    expect(metrics).toMatchObject({
      totalSessions: 2,
      questionsAttempted: 3,
      questionsSolved: 2,
      accuracy: 67,
      averageResponseTimeMs: 3000,
      trend: { accuracyChange: 50, averageResponseTimeChangeMs: 3000, solvedChange: 0 },
    });
    expect(metrics.byOperator.addition).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 2000 });
    expect(metrics.byOperator.multiplication).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 4000 });
    expect(metrics.byDifficulty.easy).toMatchObject({ attempts: 2, solved: 1, accuracy: 50, averageResponseTimeMs: 2000 });
    expect(metrics.byDifficulty.hard).toMatchObject({ attempts: 1, solved: 1, accuracy: 100, averageResponseTimeMs: 5000 });
    expect(metrics.byOperator.division.attempts).toBe(0);
    expect(metrics.recentSessions[0].completedAt).toBe(200);
  });

  it('persists and validates session records for offline reloads', () => {
    const session = createProgressSession({
      completedAt: 100,
      mode: 'blitz',
      finalScore: 10,
      bestStreak: 1,
      answers: [{ isCorrect: true, operations: ['division'], difficulty: 'medium', level: 2, responseTimeMs: 1200 }],
    });
    writeProgressSessions([session]);

    expect(readProgressSessions()).toEqual([session]);
    localStorage.setItem(PROGRESS_STORAGE_KEY, '{bad json');
    expect(readProgressSessions()).toEqual([]);
  });

  it('keeps empty metrics safe for a new player', () => {
    const metrics = calculateProgressMetrics([]);

    expect(metrics.totalSessions).toBe(0);
    expect(metrics.questionsSolved).toBe(0);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.averageResponseTimeMs).toBeNull();
    expect(metrics.trend).toBeNull();
  });
});
