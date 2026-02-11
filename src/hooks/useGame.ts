import { useState, useEffect, useCallback, useRef } from 'react';
import type { MathQuestion } from '../utils/mathLogic';
import { generateQuestion } from '../utils/mathLogic';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type GameMode = 'blitz' | 'practice';

interface GameState {
  score: number;
  streak: number;
  timeLeft: number;
  status: GameStatus;
  mode: GameMode;
  isAdvanced: boolean; // 3 numbers mode
  currentQuestion: MathQuestion | null;
  history: Array<{ question: MathQuestion; playerAnswer: number; isCorrect: boolean }>;
  highScore: number;
  bestStreak: number;
}

const STORAGE_KEYS = {
  HIGH_SCORE: 'numberrush_highscore',
  BEST_STREAK: 'numberrush_beststreak',
};

export const useGame = (initialTime: number = 10) => {
  const [state, setState] = useState<GameState>({
    score: 0,
    streak: 0,
    timeLeft: initialTime,
    status: 'idle',
    mode: 'blitz',
    isAdvanced: false,
    currentQuestion: null,
    history: [],
    highScore: parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10),
    bestStreak: parseInt(localStorage.getItem(STORAGE_KEYS.BEST_STREAK) || '0', 10),
  });

  const timerRef = useRef<number | null>(null);

  const startGame = useCallback((level: number = 1, mode: GameMode = 'blitz', isAdvanced: boolean = false) => {
    setState(prev => ({
      ...prev,
      score: 0,
      streak: 0,
      timeLeft: initialTime,
      status: 'playing',
      mode,
      isAdvanced,
      currentQuestion: generateQuestion(level, isAdvanced),
      history: [],
    }));
  }, [initialTime]);

  const submitAnswer = useCallback((playerAnswer: number) => {
    if (state.status !== 'playing' || !state.currentQuestion) return;

    const isCorrect = playerAnswer === state.currentQuestion.answer;
    
    setState(prev => {
      const newScore = isCorrect ? prev.score + (10 * (Math.floor(prev.streak / 5) + 1)) : prev.score;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      const newHighScore = Math.max(prev.highScore, newScore);
      const newBestStreak = Math.max(prev.bestStreak, newStreak);

      if (newHighScore > prev.highScore) localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newHighScore.toString());
      if (newBestStreak > prev.bestStreak) localStorage.setItem(STORAGE_KEYS.BEST_STREAK, newBestStreak.toString());

      return {
        ...prev,
        score: newScore,
        streak: newStreak,
        highScore: newHighScore,
        bestStreak: newBestStreak,
        timeLeft: initialTime,
        history: [...prev.history, { question: prev.currentQuestion!, playerAnswer, isCorrect }],
        currentQuestion: generateQuestion(Math.min(3, Math.floor(newScore / 100) + 1), prev.isAdvanced),
      };
    });

    return isCorrect;
  }, [state.status, state.currentQuestion, initialTime]);

  const endGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'finished' }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', timeLeft: initialTime }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [initialTime]);

  const resetStats = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
    localStorage.removeItem(STORAGE_KEYS.BEST_STREAK);
    setState(prev => ({ ...prev, highScore: 0, bestStreak: 0 }));
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    if (state.status === 'playing' && state.mode === 'blitz') {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, timeLeft: 0, status: 'finished' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      timerRef.current = interval;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status, state.mode]);

  return {
    ...state,
    startGame,
    submitAnswer,
    endGame,
    resetGame,
    resetStats,
  };
};
