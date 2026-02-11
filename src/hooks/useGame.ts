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
  currentQuestion: MathQuestion | null;
  history: Array<{ question: MathQuestion; playerAnswer: number; isCorrect: boolean }>;
}

export const useGame = (initialTime: number = 60) => {
  const [state, setState] = useState<GameState>({
    score: 0,
    streak: 0,
    timeLeft: initialTime,
    status: 'idle',
    mode: 'blitz',
    currentQuestion: null,
    history: [],
  });

  const timerRef = useRef<number | null>(null);

  const startGame = useCallback((level: number = 1, mode: GameMode = 'blitz') => {
    setState({
      score: 0,
      streak: 0,
      timeLeft: initialTime,
      status: 'playing',
      mode,
      currentQuestion: generateQuestion(level),
      history: [],
    });
  }, [initialTime]);

  const submitAnswer = useCallback((playerAnswer: number) => {
    if (state.status !== 'playing' || !state.currentQuestion) return;

    const isCorrect = playerAnswer === state.currentQuestion.answer;
    
    setState(prev => {
      const newScore = isCorrect ? prev.score + (10 * (Math.floor(prev.streak / 5) + 1)) : prev.score;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      return {
        ...prev,
        score: newScore,
        streak: newStreak,
        history: [...prev.history, { question: prev.currentQuestion!, playerAnswer, isCorrect }],
        currentQuestion: generateQuestion(Math.min(3, Math.floor(newScore / 100) + 1)),
      };
    });

    return isCorrect;
  }, [state.status, state.currentQuestion]);

  const endGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'finished' }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', timeLeft: initialTime }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [initialTime]);

  useEffect(() => {
    let interval: number | null = null;

    if (state.status === 'playing' && state.mode === 'blitz') {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (interval) clearInterval(interval);
            return { ...prev, timeLeft: 0, status: 'finished' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status]);

  return {
    ...state,
    startGame,
    submitAnswer,
    endGame,
    resetGame,
  };
};
