import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useGame Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useGame(10));
    expect(result.current.status).toBe('idle');
    expect(result.current.score).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.highScore).toBe(0);
  });

  it('starts a game correctly', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });
    expect(result.current.status).toBe('playing');
    expect(result.current.currentQuestion).not.toBeNull();
  });

  it('starts selected operator and difficulty rounds with tier settings', () => {
    const { result } = renderHook(() => useGame(20));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['division'], 'hard');
    });

    expect(result.current.difficulty).toBe('hard');
    expect(result.current.maxTime).toBe(7);
    expect(result.current.timeLeft).toBe(7);
    expect(result.current.currentQuestion?.operation).toBe('division');
    expect(result.current.currentQuestion!.operandA % result.current.currentQuestion!.operandB).toBe(0);
  });

  it('keeps the hook configuration aligned with generation when operators are empty', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false, []);
    });

    expect(result.current.operations).toEqual(['addition', 'subtraction']);
    expect(['addition', 'subtraction']).toContain(result.current.currentQuestion?.operation);
  });

  it('uses the starting planet tier when no difficulty override is provided', () => {
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(2, 'blitz', false, ['addition']);
    });

    expect(result.current.difficulty).toBe('medium');
    expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(20);

    act(() => {
      result.current.endGame();
      result.current.startGame(3, 'blitz', false, ['addition']);
    });

    expect(result.current.difficulty).toBe('hard');
    expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(50);
  });

  it('raises the tier when score progression reaches the next planet', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['addition']);
    });

    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.score).toBe(110);
    expect(result.current.currentLevel).toBe(2);
    expect(result.current.difficulty).toBe('medium');
    expect(result.current.currentQuestion!.operandA).toBeLessThanOrEqual(20);
  });

  it('uses planet timers without treating the planet tier as a difficulty override', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], undefined, undefined, false, true);
    });

    expect(result.current.difficulty).toBe('easy');
    expect(result.current.maxTime).toBe(15);

    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.difficulty).toBe('medium');
    expect(result.current.maxTime).toBe(10);
    expect(result.current.timeLeft).toBe(10);
  });

  it('raises an explicit easy tier to the next planet minimum at the threshold', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy', undefined, false, true);
    });

    for (let answerNumber = 0; answerNumber < 8; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.currentLevel).toBe(2);
    expect(result.current.difficulty).toBe('medium');
    expect(result.current.maxTime).toBe(10);
  });

  it('keeps an explicit tier at or above the starting planet minimum', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(2, 'blitz', false, ['addition'], 'easy');
    });

    expect(result.current.difficulty).toBe('medium');
  });

  it('adapts an explicit tier after fast accurate answers', () => {
    const { result } = renderHook(() => useGame(20));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy');
    });

    for (let answerNumber = 0; answerNumber < 3; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.difficulty).toBe('medium');
    expect(result.current.maxTime).toBe(10);
  });

  it('preserves a Settings timer override while adaptive difficulty changes', () => {
    const { result } = renderHook(() => useGame(20));
    act(() => {
      result.current.startGame(1, 'blitz', false, ['addition'], 'easy', 20);
    });

    for (let answerNumber = 0; answerNumber < 3; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.difficulty).toBe('medium');
    expect(result.current.maxTime).toBe(20);
    expect(result.current.timeLeft).toBe(20);
  });

  it('keeps a Mars start at or above the selected difficulty', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(2, 'blitz', false);
    });

    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1);
    });

    expect(result.current.currentLevel).toBe(2);
    expect(result.current.playedLevels).toEqual([2]);
    expect(result.current.history[0].level).toBe(2);
  });

  it('records each planet when score thresholds are crossed', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    for (let answerNumber = 0; answerNumber < 12; answerNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.score).toBe(210);
    expect(result.current.currentLevel).toBe(3);
    expect(result.current.playedLevels).toEqual([1, 2, 3]);
    expect(result.current.history.map(entry => entry.level)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2]);

    act(() => {
      result.current.endGame();
    });

    expect(result.current.status).toBe('finished');
    expect(result.current.playedLevels).toEqual([1, 2, 3]);
  });

  it('handles correct answers and updates score/streak', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    const correctAnswer = result.current.currentQuestion!.answer;
    
    act(() => {
      result.current.submitAnswer(correctAnswer);
    });

    expect(result.current.score).toBeGreaterThan(0);
    expect(result.current.streak).toBe(1);
    expect(result.current.totalCorrect).toBe(1);
  });

  it('resets streak on incorrect answer', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });
    
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer);
    });
    
    expect(result.current.streak).toBe(1);

    act(() => {
      // Force an incorrect answer
      result.current.submitAnswer(result.current.currentQuestion!.answer + 100);
    });

    expect(result.current.streak).toBe(0);
  });

  it('returns the expected answer and worked explanation for incorrect submissions', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    const question = result.current.currentQuestion!;
    let feedback;
    act(() => {
      feedback = result.current.submitAnswer(question.answer + 1);
    });

    expect(feedback).toMatchObject({
      question,
      playerAnswer: question.answer + 1,
      expectedAnswer: question.answer,
      isCorrect: false,
      explanation: expect.stringContaining(`= ${question.answer}`),
    });
    expect(result.current.missedQuestions).toHaveLength(1);
    expect(result.current.missedQuestions[0].question).toEqual(question);
  });

  it('keeps missed questions available after starting another round', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });
    const missedQuestion = result.current.currentQuestion!;
    act(() => {
      result.current.submitAnswer(missedQuestion.answer + 1);
      result.current.endGame();
    });

    act(() => {
      result.current.startGame(1, 'practice', false);
      result.current.endGame();
    });

    expect(result.current.missedQuestions).toHaveLength(1);
    act(() => {
      result.current.startTargetedPractice();
    });
    expect(result.current.currentQuestion).toEqual(missedQuestion);
  });

  it('unlocks badges when conditions are met', () => {
    const { result } = renderHook(() => useGame(10));
    
    // Condition: Finish first game (totalCorrect > 0)
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer);
    });

    expect(result.current.unlockedBadges).toContain('first_blastoff');
  });

  it('handles game end logic', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    act(() => {
      result.current.endGame();
    });

    expect(result.current.status).toBe('finished');
    expect(result.current.moonGames).toBe(1);
  });

  it('builds an accurate round summary with response timing and separate streaks', () => {
    const { result } = renderHook(() => useGame(10));
    vi.setSystemTime(0);

    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    vi.setSystemTime(1500);
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer);
    });

    vi.setSystemTime(3500);
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1);
      result.current.endGame();
    });

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
    });
    expect(result.current.streak).toBe(0);
  });

  it('finishes Practice rounds and reports zero-answer metrics safely', () => {
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(1, 'practice', false);
      result.current.endGame();
    });

    expect(result.current.status).toBe('finished');
    expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageResponseTimeMs: null,
      bestStreak: 0,
      mode: 'practice',
    });
  });

  it('captures personal-best baselines before a round starts', () => {
    localStorage.setItem('numberrush_highscore', '50');
    localStorage.setItem('numberrush_beststreak', '3');
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(1, 'practice', false);
    });
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer);
    });
    act(() => {
      result.current.endGame();
    });

    expect(result.current.roundSummary).toMatchObject({
      personalBestScore: 50,
      personalBestStreak: 3,
      allTimeBestStreak: 3,
      isNewPersonalBestScore: false,
      isNewPersonalBestStreak: false,
    });
  });

  it('starts and completes a targeted practice round from missed questions', () => {
    const { result } = renderHook(() => useGame(10));
    let missedQuestionAnswer = 0;

    act(() => {
      result.current.startGame(1, 'blitz', false);
    });
    act(() => {
      missedQuestionAnswer = result.current.currentQuestion!.answer;
      result.current.submitAnswer(missedQuestionAnswer + 1);
    });
    act(() => {
      result.current.endGame();
    });

    const missedQuestion = result.current.history[0].question;
    act(() => {
      result.current.startTargetedPractice();
    });

    expect(result.current.status).toBe('playing');
    expect(result.current.mode).toBe('practice');
    expect(result.current.currentQuestion).toEqual(missedQuestion);
    expect(result.current.missedQuestions).toHaveLength(1);

    act(() => {
      const feedback = result.current.submitAnswer(missedQuestionAnswer + 1);
      expect(feedback?.isCorrect).toBe(false);
    });

    expect(result.current.status).toBe('finished');
    expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 1,
      correctAnswers: 0,
      accuracy: 0,
      mode: 'practice',
    });

    act(() => {
      result.current.startTargetedPractice();
    });
    act(() => {
      const feedback = result.current.submitAnswer(missedQuestionAnswer);
      expect(feedback?.isCorrect).toBe(true);
    });

    expect(result.current.roundSummary).toMatchObject({
      totalQuestions: 1,
      correctAnswers: 1,
      accuracy: 100,
      mode: 'practice',
    });
  });

  it('resets the blitz timer for an answer without pausing the interval', () => {
    const { result } = renderHook(() => useGame(3));
    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1);
    });
    expect(result.current.timeLeft).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(2);
  });

  it('keeps the current planet when targeted practice is exhausted', () => {
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(1, 'blitz', false);
    });

    for (let questionNumber = 0; questionNumber < 10; questionNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer + 1);
      });
    }

    act(() => {
      result.current.endGame();
      result.current.startTargetedPractice();
    });

    for (let questionNumber = 0; questionNumber < 10; questionNumber += 1) {
      act(() => {
        result.current.submitAnswer(result.current.currentQuestion!.answer);
      });
    }

    expect(result.current.status).toBe('finished');
    expect(result.current.currentLevel).toBe(1);
    expect(result.current.playedLevels).toEqual([1]);
    expect(result.current.marsGames).toBe(0);
  });

  it('clears personal-best baselines when progress is reset during a round', () => {
    localStorage.setItem('numberrush_highscore', '50');
    localStorage.setItem('numberrush_beststreak', '3');
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(1, 'practice', false);
      result.current.resetStats();
    });
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer);
      result.current.endGame();
    });

    expect(result.current.roundSummary).toMatchObject({
      personalBestScore: 0,
      personalBestStreak: 0,
      allTimeBestStreak: 1,
      isNewPersonalBestScore: true,
      isNewPersonalBestStreak: true,
    });
  });

  it('records answer-level operator and effective difficulty data in persisted sessions', () => {
    const { result, unmount } = renderHook(() => useGame(10));
    vi.setSystemTime(0);

    act(() => {
      result.current.startGame(1, 'blitz', false, ['multiplication'], 'hard');
    });
    vi.setSystemTime(1500);
    act(() => {
      result.current.submitAnswer(result.current.currentQuestion!.answer + 1);
      result.current.endGame();
    });

    expect(result.current.progressSessions).toHaveLength(1);
    expect(result.current.progressSessions[0].answers[0]).toMatchObject({
      isCorrect: false,
      operations: ['multiplication'],
      difficulty: 'hard',
      responseTimeMs: 1500,
    });
    expect(JSON.parse(localStorage.getItem('numberrush_progress_sessions')!)).toHaveLength(1);

    unmount();
    const reloaded = renderHook(() => useGame(10));
    expect(reloaded.result.current.progressSessions).toHaveLength(1);
    expect(reloaded.result.current.progressMetrics.questionsAttempted).toBe(1);
  });

  it('records a zero-answer finished session and clears progress on reset', () => {
    const { result } = renderHook(() => useGame(10));

    act(() => {
      result.current.startGame(1, 'practice', false);
      result.current.endGame();
    });

    expect(result.current.progressSessions[0]).toMatchObject({ totalQuestions: 0, correctAnswers: 0, averageResponseTimeMs: null });
    act(() => result.current.resetStats());
    expect(result.current.progressSessions).toEqual([]);
    expect(localStorage.getItem('numberrush_progress_sessions')).toBeNull();
  });
});
