import { useState, useEffect, useCallback, useRef } from 'react';
import type { DifficultyTier, MathQuestion, Operation } from '../utils/mathLogic';
import { DEFAULT_OPERATIONS, generateQuestion, getAdaptiveDifficulty, getDifficultyAtLeast, getDifficultyForLevel, getDifficultySettings, getQuestionExplanation, normalizeOperations } from '../utils/mathLogic';
import { getLevelForScore } from '../utils/planetProgression';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type GameMode = 'blitz' | 'practice';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (state: GameState) => boolean;
}

export interface AnswerRecord {
  question: MathQuestion;
  playerAnswer: number;
  isCorrect: boolean;
  level: number;
  responseTimeMs: number;
}

export interface AnswerFeedback {
  question: MathQuestion;
  playerAnswer: number;
  expectedAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface RoundSummary {
  finalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTimeMs: number | null;
  bestStreak: number;
  allTimeBestStreak: number;
  personalBestScore: number;
  personalBestStreak: number;
  isNewPersonalBestScore: boolean;
  isNewPersonalBestStreak: boolean;
  mode: GameMode;
}

interface TargetedQuestion {
  question: MathQuestion;
  level: number;
  difficulty: DifficultyTier;
  operations: Operation[];
}

interface GameState {
  score: number;
  streak: number;
  timeLeft: number;
  maxTime: number;
  status: GameStatus;
  mode: GameMode;
  isAdvanced: boolean;
  operations: Operation[];
  difficulty: DifficultyTier;
  adaptiveDifficulty: boolean;
  timerOverride: number | null;
  useDifficultyTimer: boolean;
  currentQuestion: MathQuestion | null;
  history: AnswerRecord[];
  missedQuestions: TargetedQuestion[];
  highScore: number;
  bestStreak: number;
  roundBestStreak: number;
  roundPersonalBestScore: number;
  roundPersonalBestStreak: number;
  roundSummary: RoundSummary | null;
  questionStartedAt: number;
  isTargetedPractice: boolean;
  practiceQueue: TargetedQuestion[];
  unlockedBadges: string[];
  currentLevel: number;
  startingLevel: number;
  playedLevels: number[];
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

const enforcePlanetDifficulty = (difficulty: DifficultyTier, level: number): DifficultyTier => {
  return getDifficultyAtLeast(difficulty, getDifficultyForLevel(level));
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

export const createRoundSummary = (state: Pick<GameState, 'score' | 'history' | 'roundBestStreak' | 'bestStreak' | 'roundPersonalBestScore' | 'roundPersonalBestStreak' | 'mode'>): RoundSummary => {
  const totalQuestions = state.history.length;
  const correctAnswers = state.history.filter(entry => entry.isCorrect).length;
  const totalResponseTimeMs = state.history.reduce((total, entry) => total + entry.responseTimeMs, 0);
  const averageResponseTimeMs = totalQuestions > 0 ? totalResponseTimeMs / totalQuestions : null;

  return {
    finalScore: state.score,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    averageResponseTimeMs,
    bestStreak: state.roundBestStreak,
    allTimeBestStreak: state.bestStreak,
    personalBestScore: state.roundPersonalBestScore,
    personalBestStreak: state.roundPersonalBestStreak,
    isNewPersonalBestScore: state.score > state.roundPersonalBestScore,
    isNewPersonalBestStreak: state.roundBestStreak > state.roundPersonalBestStreak,
    mode: state.mode,
  };
};

export const useGame = (initialTime: number = 10) => {
  const [state, setState] = useState<GameState>(() => {
    const savedBadges = localStorage.getItem(STORAGE_KEYS.BADGES);
    return {
      score: 0,
      streak: 0,
      timeLeft: initialTime,
      maxTime: initialTime,
      status: 'idle',
      mode: 'blitz',
      isAdvanced: false,
      operations: [...DEFAULT_OPERATIONS],
      difficulty: 'easy',
      adaptiveDifficulty: false,
      timerOverride: null,
      useDifficultyTimer: false,
      currentQuestion: null,
      history: [],
      missedQuestions: [],
      highScore: parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10),
      bestStreak: parseInt(localStorage.getItem(STORAGE_KEYS.BEST_STREAK) || '0', 10),
      roundBestStreak: 0,
      roundPersonalBestScore: 0,
      roundPersonalBestStreak: 0,
      roundSummary: null,
      questionStartedAt: 0,
      isTargetedPractice: false,
      practiceQueue: [],
      unlockedBadges: savedBadges ? JSON.parse(savedBadges) : [],
      currentLevel: 1,
      startingLevel: 1,
      playedLevels: [],
      totalCorrect: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CORRECT) || '0', 10),
      totalChaosSolved: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CHAOS) || '0', 10),
      moonGames: parseInt(localStorage.getItem(STORAGE_KEYS.MOON_GAMES) || '0', 10),
      marsGames: parseInt(localStorage.getItem(STORAGE_KEYS.MARS_GAMES) || '0', 10),
      spaceGames: parseInt(localStorage.getItem(STORAGE_KEYS.SPACE_GAMES) || '0', 10),
    };
  });

  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<GameState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
    finishedState.roundSummary = createRoundSummary(finishedState);
    finishedState.unlockedBadges = checkBadges(finishedState);
    return finishedState;
  }, [checkBadges]);

  const startGame = useCallback((level: number = 1, mode: GameMode = 'blitz', isAdvanced = false, operations: readonly Operation[] = DEFAULT_OPERATIONS, selectedDifficulty?: DifficultyTier, timerOverride?: number, adaptDifficulty = selectedDifficulty !== undefined, useDifficultyTimer = selectedDifficulty !== undefined) => {
    const difficulty = enforcePlanetDifficulty(selectedDifficulty || getDifficultyForLevel(level), level);
    const roundOperations = normalizeOperations(operations);
    const maxTime = timerOverride ?? (useDifficultyTimer ? getDifficultySettings(difficulty).timerSeconds : initialTime);
    setState(prev => ({
      ...prev,
      score: 0,
      streak: 0,
      timeLeft: maxTime,
      maxTime,
      status: 'playing',
      mode,
      isAdvanced,
      operations: roundOperations,
      difficulty,
      adaptiveDifficulty: adaptDifficulty,
      timerOverride: timerOverride ?? null,
      useDifficultyTimer,
      currentLevel: level,
      startingLevel: level,
      playedLevels: [level],
      currentQuestion: generateQuestion(difficulty, isAdvanced, roundOperations),
      history: [],
      roundBestStreak: 0,
      roundPersonalBestScore: prev.highScore,
      roundPersonalBestStreak: prev.bestStreak,
      roundSummary: null,
      questionStartedAt: Date.now(),
      isTargetedPractice: false,
      practiceQueue: [],
    }));
  }, [initialTime]);

  const startTargetedPractice = useCallback(() => {
    setState(prev => {
      const missedQuestions = prev.missedQuestions;

      if (missedQuestions.length === 0) return prev;

      const [firstQuestion, ...practiceQueue] = missedQuestions;
      return {
        ...prev,
        score: 0,
        streak: 0,
        timeLeft: prev.maxTime,
        maxTime: prev.maxTime,
        status: 'playing',
        mode: 'practice',
        currentQuestion: firstQuestion.question,
        currentLevel: firstQuestion.level,
        difficulty: firstQuestion.difficulty,
        operations: firstQuestion.operations,
        startingLevel: firstQuestion.level,
        playedLevels: [firstQuestion.level],
        history: [],
        roundBestStreak: 0,
        roundPersonalBestScore: prev.highScore,
        roundPersonalBestStreak: prev.bestStreak,
        roundSummary: null,
        questionStartedAt: Date.now(),
        isTargetedPractice: true,
        practiceQueue,
      };
    });
  }, []);

  const submitAnswer = useCallback((playerAnswer: number): AnswerFeedback | null => {
    const submissionState = stateRef.current;
    const question = submissionState.currentQuestion;
    if (submissionState.status !== 'playing' || !question || typeof playerAnswer !== 'number' || !Number.isFinite(playerAnswer)) return null;

    const feedback: AnswerFeedback = {
      question,
      playerAnswer,
      expectedAnswer: question.answer,
      isCorrect: playerAnswer === question.answer,
      explanation: getQuestionExplanation(question),
    };
    const answerIsCorrect = feedback.isCorrect;
    const isChaos = question.operandC !== undefined;
    const newScore = answerIsCorrect ? submissionState.score + (10 * (Math.floor(submissionState.streak / 5) + 1)) : submissionState.score;
    const newStreak = answerIsCorrect ? submissionState.streak + 1 : 0;
    const newRoundBestStreak = Math.max(submissionState.roundBestStreak, newStreak);
    const responseTimeMs = Math.max(0, Date.now() - submissionState.questionStartedAt);

    const newHighScore = Math.max(submissionState.highScore, newScore);
    const newBestStreak = Math.max(submissionState.bestStreak, newStreak);
    const newTotalCorrect = answerIsCorrect ? submissionState.totalCorrect + 1 : submissionState.totalCorrect;
    const newTotalChaos = (answerIsCorrect && isChaos) ? submissionState.totalChaosSolved + 1 : submissionState.totalChaosSolved;

    if (newHighScore > submissionState.highScore) localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newHighScore.toString());
    if (newBestStreak > submissionState.bestStreak) localStorage.setItem(STORAGE_KEYS.BEST_STREAK, newBestStreak.toString());
    if (answerIsCorrect) localStorage.setItem(STORAGE_KEYS.TOTAL_CORRECT, newTotalCorrect.toString());
    if (answerIsCorrect && isChaos) localStorage.setItem(STORAGE_KEYS.TOTAL_CHAOS, newTotalChaos.toString());

    const nextLevel = getLevelForScore(newScore, submissionState.startingLevel);
    const nextTargetedQuestion = submissionState.practiceQueue[0];
    const nextQuestionLevel = submissionState.isTargetedPractice
      ? nextTargetedQuestion?.level ?? submissionState.currentLevel
      : nextLevel;
    const playedLevels = submissionState.playedLevels.includes(nextQuestionLevel)
      ? submissionState.playedLevels
      : [...submissionState.playedLevels, nextQuestionLevel];
    const nextHistory = [...submissionState.history, {
      question,
      playerAnswer,
      isCorrect: answerIsCorrect,
      level: submissionState.currentLevel,
      responseTimeMs,
    }];
    const nextDifficulty = submissionState.isTargetedPractice
      ? nextTargetedQuestion?.difficulty ?? submissionState.difficulty
      : enforcePlanetDifficulty(
        submissionState.adaptiveDifficulty
          ? getAdaptiveDifficulty(submissionState.difficulty, nextHistory)
          : getDifficultyForLevel(nextQuestionLevel),
        nextQuestionLevel,
      );
    const nextMaxTime = submissionState.timerOverride ?? (
      submissionState.useDifficultyTimer || submissionState.adaptiveDifficulty
        ? getDifficultySettings(nextDifficulty).timerSeconds
        : submissionState.maxTime
    );
    const hasFinishedTargetedPractice = submissionState.isTargetedPractice && !nextTargetedQuestion;
    const nextState: GameState = {
      ...submissionState,
      score: newScore,
      streak: newStreak,
      roundBestStreak: newRoundBestStreak,
      highScore: newHighScore,
      bestStreak: newBestStreak,
      totalCorrect: newTotalCorrect,
      totalChaosSolved: newTotalChaos,
      timeLeft: nextMaxTime,
      maxTime: nextMaxTime,
      difficulty: nextDifficulty,
      history: nextHistory,
      missedQuestions: answerIsCorrect || submissionState.isTargetedPractice
        ? submissionState.missedQuestions
        : [...submissionState.missedQuestions, {
          question,
          level: submissionState.currentLevel,
          difficulty: submissionState.difficulty,
          operations: submissionState.operations,
        }],
      currentLevel: nextQuestionLevel,
      playedLevels,
      currentQuestion: hasFinishedTargetedPractice
        ? null
        : submissionState.isTargetedPractice
          ? nextTargetedQuestion.question
          : generateQuestion(nextDifficulty, submissionState.isAdvanced, submissionState.operations),
      questionStartedAt: Date.now(),
      practiceQueue: submissionState.isTargetedPractice ? submissionState.practiceQueue.slice(1) : [],
    };

    nextState.unlockedBadges = checkBadges(nextState);
    const completedState = hasFinishedTargetedPractice ? finalizeGameState(nextState) : nextState;
    stateRef.current = completedState;
    setState(prev => {
      if (prev.status !== 'playing' || !prev.currentQuestion || prev.currentQuestion.id !== question.id) return prev;
      return completedState;
    });

    return feedback;
  }, [checkBadges, finalizeGameState]);

  const endGame = useCallback(() => {
    setState(prev => prev.status === 'playing' ? finalizeGameState(prev) : prev);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [finalizeGameState]);

  const resetGame = useCallback(() => {
    setState(prev => ({ ...prev, status: 'idle', timeLeft: prev.maxTime }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetStats = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setState(prev => ({ 
      ...prev, 
      highScore: 0, 
      bestStreak: 0, 
      roundPersonalBestScore: 0,
      roundPersonalBestStreak: 0,
      unlockedBadges: [],
      totalCorrect: 0,
      totalChaosSolved: 0,
      moonGames: 0,
      marsGames: 0,
      spaceGames: 0,
      missedQuestions: []
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
    startTargetedPractice,
    submitAnswer,
    endGame,
    resetGame,
    resetStats,
  };
};
