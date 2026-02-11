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
});
