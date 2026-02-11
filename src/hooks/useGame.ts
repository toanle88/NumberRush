import { useState, useEffect, useCallback, useRef } from 'react';
import type { MathQuestion } from '../utils/mathLogic';
import { generateQuestion } from '../utils/mathLogic';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type GameMode = 'blitz' | 'practice';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (state: GameState) => boolean;
}

interface GameState {
  score: number;
  streak: number;
  timeLeft: number;
  status: GameStatus;
  mode: GameMode;
  isAdvanced: boolean;
  currentQuestion: MathQuestion | null;
  history: Array<{ question: MathQuestion; playerAnswer: number; isCorrect: boolean }>;
  highScore: number;
  bestStreak: number;
  unlockedBadges: string[];
}

const STORAGE_KEYS = {
  HIGH_SCORE: 'numberrush_highscore',
  BEST_STREAK: 'numberrush_beststreak',
  BADGES: 'numberrush_badges',
};

export const BADGES: Badge[] = [
  { id: 'first_blastoff', name: 'First Blastoff', icon: '🚀', description: 'Finish your first game!', condition: state => state.status === 'finished' && state.history.length > 0 },
  { id: 'streak_king', name: 'Streak King', icon: '🔥', description: 'Get a streak of 10!', condition: state => state.bestStreak >= 10 },
  { id: 'blitz_pro', name: 'Blitz Pro', icon: '🎯', description: 'Score over 200 points!', condition: state => state.highScore >= 200 },
  { id: 'chaos_master', name: 'Chaos Master', icon: '🛡️', description: 'Solve 10 chaos questions!', condition: state => state.history.filter(h => h.isCorrect && h.question.operandC).length >= 10 },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Perfect streak of 20!', condition: state => state.bestStreak >= 20 },
];

export const useGame = (initialTime: number = 10) => {
  const [state, setState] = useState<GameState>(() => {
    const savedBadges = localStorage.getItem(STORAGE_KEYS.BADGES);
    return {
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
      unlockedBadges: savedBadges ? JSON.parse(savedBadges) : [],
    };
  });

  const timerRef = useRef<number | null>(null);

  const checkBadges = useCallback((currentState: GameState) => {
    const newUnlocked = BADGES
      .filter(badge => !currentState.unlockedBadges.includes(badge.id))
      .filter(badge => badge.condition(currentState))
      .map(badge => badge.id);

    if (newUnlocked.length > 0) {
      const updatedBadges = [...currentState.unlockedBadges, ...newUnlocked];
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
      return updatedBadges;
    }
    return currentState.unlockedBadges;
  }, []);

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

      const nextState: GameState = {
        ...prev,
        score: newScore,
        streak: newStreak,
        highScore: newHighScore,
        bestStreak: newBestStreak,
        timeLeft: initialTime,
        history: [...prev.history, { question: prev.currentQuestion!, playerAnswer, isCorrect }],
        currentQuestion: generateQuestion(Math.min(3, Math.floor(newScore / 100) + 1), prev.isAdvanced),
      };

      // Check badges immediately on answer
      nextState.unlockedBadges = checkBadges(nextState);

      return nextState;
    });

    return isCorrect;
  }, [state.status, state.currentQuestion, initialTime, checkBadges]);

  const endGame = useCallback(() => {
    setState(prev => {
      const nextState = { ...prev, status: 'finished' as const };
      nextState.unlockedBadges = checkBadges(nextState);
      return nextState;
    });
    if (timerRef.current) clearInterval(timerRef.current);
  }, [checkBadges]);

  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', timeLeft: initialTime }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [initialTime]);

  const resetStats = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
    localStorage.removeItem(STORAGE_KEYS.BEST_STREAK);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    setState(prev => ({ 
      ...prev, 
      highScore: 0, 
      bestStreak: 0, 
      unlockedBadges: [] 
    }));
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    if (state.status === 'playing' && state.mode === 'blitz') {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const finishedState = { ...prev, timeLeft: 0, status: 'finished' as const };
            finishedState.unlockedBadges = checkBadges(finishedState);
            return finishedState;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      timerRef.current = interval;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status, state.mode, checkBadges]);

  return {
    ...state,
    startGame,
    submitAnswer,
    endGame,
    resetGame,
    resetStats,
  };
};
