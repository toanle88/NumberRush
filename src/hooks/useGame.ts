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
  currentLevel: number;
  totalCorrect: number;
  totalChaosSolved: number;
  moonGames: number;
  marsGames: number;
  spaceGames: number;
}

const STORAGE_KEYS = {
  HIGH_SCORE: 'numberrush_highscore',
  BEST_STREAK: 'numberrush_beststreak',
  BADGES: 'numberrush_badges',
  TOTAL_CORRECT: 'numberrush_total_correct',
  TOTAL_CHAOS: 'numberrush_total_chaos',
  MOON_GAMES: 'numberrush_moon_games',
  MARS_GAMES: 'numberrush_mars_games',
  SPACE_GAMES: 'numberrush_space_games',
};

export const BADGES: Badge[] = [
  { id: 'first_blastoff', name: 'First Blastoff', icon: '🚀', description: 'Finish your first game!', condition: state => state.totalCorrect > 0 },
  { id: 'streak_king', name: 'Streak King', icon: '🔥', description: 'Get a streak of 10!', condition: state => state.bestStreak >= 10 },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Perfect streak of 20!', condition: state => state.bestStreak >= 20 },
  { id: 'math_marathon', name: 'Math Marathon', icon: '🏃', description: 'Solve 50 questions total!', condition: state => state.totalCorrect >= 50 },
  { id: 'perfect_flight', name: 'Perfect Flight', icon: '⭐', description: '100% accuracy in a Blitz game!', condition: state => state.status === 'finished' && state.history.length >= 5 && state.history.every(h => h.isCorrect) },
  { id: 'blitz_pro', name: 'Blitz Pro', icon: '🎯', description: 'Score over 200 points!', condition: state => state.highScore >= 200 },
  { id: 'chaos_legend', name: 'Chaos Legend', icon: '🛡️', description: 'Solve 25 chaos questions!', condition: state => state.totalChaosSolved >= 25 },
  { id: 'brainiac', name: 'Brainiac', icon: '🧠', description: 'Reach 500 points!', condition: state => state.highScore >= 500 },
  { id: 'moon_walker', name: 'Moon Walker', icon: '🌙', description: 'Finish 5 games on the Moon!', condition: state => state.moonGames >= 5 },
  { id: 'mars_colonist', name: 'Mars Colonist', icon: '🔴', description: 'Finish 5 games on Mars!', condition: state => state.marsGames >= 5 },
  { id: 'galaxy_guide', name: 'Galaxy Guide', icon: '🌌', description: 'Finish 5 games in Deep Space!', condition: state => state.spaceGames >= 5 },
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
      currentLevel: 1,
      totalCorrect: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CORRECT) || '0', 10),
      totalChaosSolved: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CHAOS) || '0', 10),
      moonGames: parseInt(localStorage.getItem(STORAGE_KEYS.MOON_GAMES) || '0', 10),
      marsGames: parseInt(localStorage.getItem(STORAGE_KEYS.MARS_GAMES) || '0', 10),
      spaceGames: parseInt(localStorage.getItem(STORAGE_KEYS.SPACE_GAMES) || '0', 10),
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

  const finalizeGameState = useCallback((previousState: GameState, overrides: Partial<GameState> = {}): GameState => {
    if (previousState.status === 'finished') return previousState;

    let moonGames = previousState.moonGames;
    let marsGames = previousState.marsGames;
    let spaceGames = previousState.spaceGames;

    if (previousState.currentLevel === 1) {
      moonGames++;
      localStorage.setItem(STORAGE_KEYS.MOON_GAMES, moonGames.toString());
    } else if (previousState.currentLevel === 2) {
      marsGames++;
      localStorage.setItem(STORAGE_KEYS.MARS_GAMES, marsGames.toString());
    } else if (previousState.currentLevel === 3) {
      spaceGames++;
      localStorage.setItem(STORAGE_KEYS.SPACE_GAMES, spaceGames.toString());
    }

    const finishedState: GameState = {
      ...previousState,
      ...overrides,
      status: 'finished',
      moonGames,
      marsGames,
      spaceGames,
    };
    finishedState.unlockedBadges = checkBadges(finishedState);
    return finishedState;
  }, [checkBadges]);

  const startGame = useCallback((level: number = 1, mode: GameMode = 'blitz', isAdvanced: boolean = false) => {
    setState(prev => ({
      ...prev,
      score: 0,
      streak: 0,
      timeLeft: initialTime,
      status: 'playing',
      mode,
      isAdvanced,
      currentLevel: level,
      currentQuestion: generateQuestion(level, isAdvanced),
      history: [],
    }));
  }, [initialTime]);

  const submitAnswer = useCallback((playerAnswer: number): boolean => {
    if (state.status !== 'playing' || !state.currentQuestion) return false;

    const isCorrect = playerAnswer === state.currentQuestion.answer;
    const isChaos = state.currentQuestion.operandC !== undefined;
    
    setState(prev => {
      const newScore = isCorrect ? prev.score + (10 * (Math.floor(prev.streak / 5) + 1)) : prev.score;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      const newHighScore = Math.max(prev.highScore, newScore);
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newTotalCorrect = isCorrect ? prev.totalCorrect + 1 : prev.totalCorrect;
      const newTotalChaos = (isCorrect && isChaos) ? prev.totalChaosSolved + 1 : prev.totalChaosSolved;

      if (newHighScore > prev.highScore) localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newHighScore.toString());
      if (newBestStreak > prev.bestStreak) localStorage.setItem(STORAGE_KEYS.BEST_STREAK, newBestStreak.toString());
      if (isCorrect) localStorage.setItem(STORAGE_KEYS.TOTAL_CORRECT, newTotalCorrect.toString());
      if (isCorrect && isChaos) localStorage.setItem(STORAGE_KEYS.TOTAL_CHAOS, newTotalChaos.toString());

      const nextLevel = Math.min(3, Math.floor(newScore / 100) + 1);

      const nextState: GameState = {
        ...prev,
        score: newScore,
        streak: newStreak,
        highScore: newHighScore,
        bestStreak: newBestStreak,
        totalCorrect: newTotalCorrect,
        totalChaosSolved: newTotalChaos,
        timeLeft: initialTime,
        history: [...prev.history, { question: prev.currentQuestion!, playerAnswer, isCorrect }],
        currentLevel: nextLevel,
        currentQuestion: generateQuestion(nextLevel, prev.isAdvanced),
      };

      nextState.unlockedBadges = checkBadges(nextState);
      return nextState;
    });

    return isCorrect;
  }, [state.status, state.currentQuestion, initialTime, checkBadges]);

  const endGame = useCallback(() => {
    setState(prev => finalizeGameState(prev));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [finalizeGameState]);

  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', timeLeft: initialTime }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [initialTime]);

  const resetStats = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setState(prev => ({ 
      ...prev, 
      highScore: 0, 
      bestStreak: 0, 
      unlockedBadges: [],
      totalCorrect: 0,
      totalChaosSolved: 0,
      moonGames: 0,
      marsGames: 0,
      spaceGames: 0
    }));
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    if (state.status === 'playing' && state.mode === 'blitz') {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            
            return finalizeGameState(prev, { timeLeft: 0 });
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      timerRef.current = interval;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.status, state.mode, finalizeGameState]);

  return {
    ...state,
    startGame,
    submitAnswer,
    endGame,
    resetGame,
    resetStats,
  };
};
