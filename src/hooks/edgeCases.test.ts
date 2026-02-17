import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';

describe('useGame Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('should handle empty answer submission gracefully', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz');
    });
    
    const initialScore = result.current.score;
    act(() => {
      // @ts-ignore
      result.current.submitAnswer(undefined);
    });
    
    expect(result.current.score).toBe(initialScore);
    expect(result.current.streak).toBe(0);
  });

  it('should handle rapid consecutive submissions', () => {
    const { result } = renderHook(() => useGame(10));
    act(() => {
      result.current.startGame(1, 'blitz');
    });

    const correctAnswer = result.current.currentQuestion!.answer;
    
    act(() => {
      result.current.submitAnswer(correctAnswer);
      result.current.submitAnswer(correctAnswer); // This should be for a NEW question
    });

    expect(result.current.streak).toBe(2);
  });

  it('should end game exactly when timer hits zero', () => {
    const { result } = renderHook(() => useGame(3));
    act(() => {
      result.current.startGame(1, 'blitz');
    });

    expect(result.current.status).toBe('playing');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.status).toBe('finished');
  });

  it('should handle very long player name in local storage without crashing', () => {
    localStorage.setItem('numberrush_name', 'A'.repeat(1000));
    const { result } = renderHook(() => useGame(10));
    expect(result.current.status).toBe('idle');
  });
});
