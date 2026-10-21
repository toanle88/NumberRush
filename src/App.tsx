import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame, BADGES } from './hooks/useGame';
import type { AnswerFeedback, GameMode } from './hooks/useGame';
import GameBoard from './components/GameBoard';
import Numpad from './components/Numpad';
import BadgeItem from './components/BadgeItem';
import SettingsModal from './components/SettingsModal';
import { getPlanet, PLANETS } from './utils/planetProgression';
import { playCorrectSound, playIncorrectSound, playFinishSound, playTickSound, playCelebrationSound } from './utils/soundEffects';
import { getSystemReducedMotionPreference, readAccessibilityPreferences, saveAccessibilityPreferences, triggerHaptic } from './utils/accessibility';
import type { AccessibilityPreferences } from './utils/accessibility';
import confetti from 'canvas-confetti';
import './App.css';

interface PlanetTransition {
  from: number;
  to: number;
}

function App() {
  const [initialTime, setInitialTime] = useState(() =>
    parseInt(localStorage.getItem('numberrush_timer') || '10', 10)
  );
  const [playerName, setPlayerName] = useState(() =>
    localStorage.getItem('numberrush_name') || 'Super Kid'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readAccessibilityPreferences);
  const [systemReducedMotion, setSystemReducedMotion] = useState(getSystemReducedMotionPreference);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [lastUnlockedBadge, setLastUnlockedBadge] = useState<string | null>(null);
  const previousBadgeCountRef = useRef(0);
  const hasInitializedBadgesRef = useRef(false);

  const {
    status, score, timeLeft, streak, mode, currentQuestion,
    highScore, bestStreak, unlockedBadges, currentLevel, playedLevels, missedQuestions,
    roundSummary, isTargetedPractice, startGame, startTargetedPractice, submitAnswer, endGame, resetGame, resetStats
  } = useGame(initialTime);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [shakeClass, setShakeClass] = useState('');
  const [planetTransition, setPlanetTransition] = useState<PlanetTransition | null>(null);
  const previousLevelRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStreakRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setSystemReducedMotion(event.matches);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  useEffect(() => {
    const level = status === 'playing' ? currentLevel : selectedLevel;
    document.body.className = `planet-${level}`;
  }, [selectedLevel, status, currentLevel]);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.highContrast = preferences.highContrast ? 'true' : 'false';
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false';
    saveAccessibilityPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (status !== 'playing') {
      previousLevelRef.current = null;
      return;
    }

    const previousLevel = previousLevelRef.current;
    if (previousLevel !== null && previousLevel !== currentLevel) {
      setPlanetTransition({ from: previousLevel, to: currentLevel });
      const timer = window.setTimeout(() => setPlanetTransition(null), 4000);
      previousLevelRef.current = currentLevel;
      return () => window.clearTimeout(timer);
    }

    previousLevelRef.current = currentLevel;
  }, [status, currentLevel]);

  useEffect(() => {
    if (status === 'playing') gameAreaRef.current?.focus();
    if (status === 'finished') resultsHeadingRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (!hasInitializedBadgesRef.current) {
      previousBadgeCountRef.current = unlockedBadges.length;
      hasInitializedBadgesRef.current = true;
      return;
    }

    if (unlockedBadges.length > previousBadgeCountRef.current) {
      const latest = unlockedBadges[unlockedBadges.length - 1];
      const showTimer = setTimeout(() => setLastUnlockedBadge(latest), 0);
      const clearTimer = setTimeout(() => setLastUnlockedBadge(null), 4000);
      previousBadgeCountRef.current = unlockedBadges.length;
      return () => {
        clearTimeout(showTimer);
        clearTimeout(clearTimer);
      };
    }

    previousBadgeCountRef.current = unlockedBadges.length;
  }, [unlockedBadges]);

  const handleStart = (m: GameMode) => {
    setPlanetTransition(null);
    setFeedback(null);
    startGame(selectedLevel, m, isAdvanced);
  };

  const handleInput = useCallback((val: string) => {
    setInput(prev => (prev.length < 3 ? prev + val : prev));
  }, []);

  const handleClear = useCallback(() => setInput(''), []);

  const handleSubmit = useCallback(() => {
    if (input === '') return;
    const answerFeedback = submitAnswer(parseInt(input, 10));
    if (!answerFeedback) return;
    setFeedback(answerFeedback);
    if (answerFeedback.isCorrect) playCorrectSound(preferences.sound);
    else playIncorrectSound(preferences.sound);
    triggerHaptic(preferences.haptics, answerFeedback.isCorrect ? 20 : [50, 50, 50]);
    setInput('');
  }, [input, preferences.haptics, preferences.sound, submitAnswer]);

  const handleExit = useCallback(() => {
    setPlanetTransition(null);
    setFeedback(null);
    resetGame();
    setInput('');
  }, [resetGame]);

  const handleTargetedPractice = useCallback(() => {
    setPlanetTransition(null);
    setFeedback(null);
    startTargetedPractice();
    setInput('');
  }, [startTargetedPractice]);

  const updateName = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('numberrush_name', val);
  };

  const updateTimer = (val: number) => {
    setInitialTime(val);
    localStorage.setItem('numberrush_timer', val.toString());
  };

  const updatePreferences = (patch: Partial<AccessibilityPreferences>) => {
    setPreferences(previous => ({ ...previous, ...patch }));
  };

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || settingsOpen) return;
      if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, summary, [role="button"], [contenteditable="true"]')) return;
      if ((e.key >= '0' && e.key <= '9') || (e.code.startsWith('Numpad') && e.key >= '0' && e.key <= '9')) {
        e.preventDefault();
        handleInput(e.key);
      }
      else if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        e.preventDefault();
        handleSubmit();
      }
      else if (e.key === 'Backspace') handleClear();
      else if (e.key === 'Escape') handleExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleInput, handleSubmit, handleClear, handleExit, settingsOpen]);

  useEffect(() => {
    const previousStreak = previousStreakRef.current;
    previousStreakRef.current = streak;

    if (streak <= 0 || streak <= previousStreak || streak % 10 !== 0) return;

    playCelebrationSound(preferences.sound);
    if (preferences.reducedMotion || systemReducedMotion) return;

    let shake = 'shake-small';
    let confettiInterval: number | null = null;

    if (streak >= 30) {
      shake = 'shake-hard';
      const duration = 1500;
      const animationEnd = Date.now() + duration;
      const random = (min: number, max: number) => Math.random() * (max - min) + min;

      confettiInterval = window.setInterval(() => {
        const tLeft = animationEnd - Date.now();
        if (tLeft <= 0) {
          window.clearInterval(confettiInterval!);
          return;
        }
        const pCount = 40;
        confetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } else if (streak >= 20) {
      shake = 'shake-medium';
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    } else {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
    }

    let clearShakeTimer: number | null = null;
    const animationFrame = requestAnimationFrame(() => {
      setShakeClass(shake);
      clearShakeTimer = window.setTimeout(() => setShakeClass(''), 1000);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      if (clearShakeTimer !== null) window.clearTimeout(clearShakeTimer);
      if (confettiInterval !== null) window.clearInterval(confettiInterval);
    };
  }, [preferences.reducedMotion, preferences.sound, streak, systemReducedMotion]);

  useEffect(() => {
    if (status === 'playing' && mode === 'blitz') {
      if (timeLeft <= 3 && timeLeft > 0) playTickSound(preferences.sound);
      else if (timeLeft === 0) playFinishSound(preferences.sound);
    }
  }, [timeLeft, status, mode, preferences.sound]);

  const selectedPlanet = getPlanet(selectedLevel);

  return (
    <main className="animate-pop">
      <div className={shakeClass}>
        <header>
          <div className="header-top">
            <h1>NumberRush</h1>
            <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Open settings">⚙️</button>
          </div>
          {status === 'idle' && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>
              Hey {playerName}! Speed Math for Super Kids! 🚀
            </p>
          )}
        </header>

        <div className="game-container">
          {status === 'idle' && (
            <div className="dashboard animate-pop">
              <div className="best-stats">
                <div className="stat-card"><span>High Score</span><strong>{highScore}</strong></div>
                <div className="stat-card"><span>Best Streak</span><strong>{bestStreak}</strong></div>
              </div>

              <div className="level-selector" style={{ marginBottom: '2rem' }}>
                <p className="selector-title">Choose Your Starting Planet:</p>
                <p className="selector-description">
                  Your choice sets the first difficulty. Reach 100 points for Mars and 200 points for Deep Space.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {PLANETS.map(planet => (
                    <button
                      type="button"
                      key={planet.level}
                      className={selectedLevel === planet.level ? 'primary' : ''}
                      onClick={() => setSelectedLevel(planet.level)}
                      aria-pressed={selectedLevel === planet.level}
                      style={{ padding: '0.5rem 1.5rem' }}
                    >
                      {planet.name} {planet.icon}{selectedLevel === planet.level ? ' (selected)' : ''}
                    </button>
                  ))}
                </div>
                <div className="progression-guide" aria-label="Planet progression thresholds">
                  {PLANETS.map(planet => (
                    <span key={planet.level}>
                      <strong>{planet.icon} {planet.name}</strong>
                      <small>{planet.minimumScore === 0 ? 'Start here' : `${planet.minimumScore}+ points`}</small>
                    </span>
                  ))}
                </div>
                <p className="selected-planet-note">
                  Starting on {selectedPlanet.name} begins at {selectedPlanet.difficulty.toLowerCase()} difficulty; progression only moves forward.
                </p>
              </div>

              <div className="advanced-toggle" style={{ marginBottom: '2rem' }}>
                <button
                  type="button"
                  className={isAdvanced ? 'primary' : ''}
                  aria-pressed={isAdvanced}
                  onClick={() => setIsAdvanced(!isAdvanced)}
                  style={{ width: '100%', maxWidth: '320px' }}
                >
                  {isAdvanced ? '🔥 3-Number Chaos ON' : '💡 3-Number Chaos OFF'}
                </button>
              </div>

              <div className="mode-selection">
                <button type="button" className="primary" onClick={() => handleStart('blitz')}>Start Blitz Rush! ⚡</button>
                <button type="button" onClick={() => handleStart('practice')}>Practice Mode 🧠</button>
              </div>

              <div className="badge-gallery">
                {BADGES.map(badge => (
                  <BadgeItem key={badge.id} badge={badge} isUnlocked={unlockedBadges.includes(badge.id)} />
                ))}
              </div>
            </div>
          )}

          {status === 'playing' && currentQuestion && (
            <div
              ref={gameAreaRef}
              className={`game-area ${feedback ? `feedback-${feedback.isCorrect ? 'correct' : 'incorrect'}` : ''}`}
              role="region"
              aria-label="Math game"
              tabIndex={-1}
            >
              <button type="button" className="exit-btn" onClick={handleExit} title="Exit Game" aria-label="Exit game">✕</button>
              {planetTransition && (
                <div className="planet-transition" role="status" aria-live="polite">
                  <span>{getPlanet(planetTransition.from).icon} {getPlanet(planetTransition.from).name}</span>
                  <span aria-hidden="true">→</span>
                  <strong>Now entering {getPlanet(planetTransition.to).icon} {getPlanet(planetTransition.to).name}!</strong>
                  <small>{getPlanet(planetTransition.to).difficulty} difficulty · {score} points reached</small>
                </div>
              )}
              <div className="board-wrapper" style={{ position: 'relative', width: '100%' }}>
                <GameBoard
                  question={currentQuestion}
                  currentInput={input}
                  score={score}
                  timeLeft={timeLeft}
                  maxTime={initialTime}
                  streak={streak}
                  showTimer={mode === 'blitz'}
                  level={currentLevel}
                />
                {feedback && (
                  <div className="feedback-overlay" role="status" aria-live="polite">
                    <div className="feedback-content">
                      <span className="feedback-title">{feedback.isCorrect ? 'Correct answer' : 'Incorrect answer'}</span>
                      {!feedback.isCorrect && (
                        <>
                          <span className="feedback-answer">Correct answer: <strong>{feedback.expectedAnswer}</strong></span>
                          <small>{feedback.explanation}</small>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Numpad onInput={handleInput} onClear={handleClear} onSubmit={handleSubmit} />
              {mode === 'practice' && (
                <button type="button" className="finish-practice-btn" onClick={endGame}>Finish Practice Round</button>
              )}
            </div>
          )}

          {status === 'finished' && roundSummary && (
            <div className="results-screen animate-pop">
              <h2 ref={resultsHeadingRef} tabIndex={-1}>{mode === 'blitz' ? "Time's Up! 🏁" : isTargetedPractice ? 'Missed Questions Reviewed! 🎯' : 'Round Complete! 🎉'}</h2>
              {feedback && !feedback.isCorrect && (
                <div className="results-feedback" role="status" aria-live="polite">
                  <strong>❌ Correct answer: {feedback.expectedAnswer}</strong>
                  <span>{feedback.explanation}</span>
                </div>
              )}
              <div className="final-stats">
                <p className="final-score">Final Score: <strong>{roundSummary.finalScore}</strong></p>
                <div className="results-metrics">
                  <div className="results-metric"><span>Questions</span><strong>{roundSummary.totalQuestions}</strong></div>
                  <div className="results-metric"><span>Correct</span><strong>{roundSummary.correctAnswers}</strong></div>
                  <div className="results-metric"><span>Accuracy</span><strong>{roundSummary.accuracy}%</strong></div>
                  <div className="results-metric"><span>Avg. response</span><strong>{roundSummary.averageResponseTimeMs === null ? '—' : `${(roundSummary.averageResponseTimeMs / 1000).toFixed(1)}s`}</strong></div>
                  <div className="results-metric"><span>Round best streak</span><strong>🔥 {roundSummary.bestStreak}</strong></div>
                  <div className="results-metric"><span>All-time best streak</span><strong>🔥 {roundSummary.allTimeBestStreak}</strong></div>
                </div>
                <div className="personal-best-comparison">
                  <span className="results-label">Personal best comparison</span>
                  <p>Previous best score: <strong>{roundSummary.personalBestScore}</strong> · Previous best streak: <strong>{roundSummary.personalBestStreak}</strong></p>
                  {(roundSummary.isNewPersonalBestScore || roundSummary.isNewPersonalBestStreak) ? (
                    <strong className="personal-best-message">New personal best{roundSummary.isNewPersonalBestScore && roundSummary.isNewPersonalBestStreak ? 's' : ''}! ✨</strong>
                  ) : (
                    <span className="personal-best-message">Keep going to beat your personal best.</span>
                  )}
                </div>
                <div className="results-progression">
                  <span className="results-label">Planets played</span>
                  <div className="progression-path" aria-label="Planets played during this round">
                    {playedLevels.map(level => {
                      const planet = getPlanet(level);
                      return (
                        <span className="progression-chip" key={level}>
                          {planet.icon} {planet.name}
                          <small>{planet.difficulty}</small>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="results-actions">
                <button type="button" className="primary" onClick={() => handleStart(mode)}>Play Again! 🔄</button>
                {missedQuestions.length > 0 ? (
                  <button type="button" onClick={handleTargetedPractice}>Practice Missed Questions 🎯</button>
                ) : (
                  <p className="next-action">Next action: replay and try to extend your perfect run!</p>
                )}
                <button type="button" onClick={resetGame}>Change Planet 🛠️</button>
              </div>
            </div>
          )}
        </div>

        {settingsOpen && (
          <SettingsModal
            playerName={playerName}
            initialTime={initialTime}
            preferences={preferences}
            onClose={closeSettings}
            onUpdateName={updateName}
            onUpdateTimer={updateTimer}
            onUpdatePreferences={updatePreferences}
            onResetStats={resetStats}
          />
        )}

        {lastUnlockedBadge && (
          <div className="unlocked-toast">
            <span style={{ fontSize: '2rem' }}>{BADGES.find(b => b.id === lastUnlockedBadge)?.icon}</span>
            <div>
              <strong>Badge Unlocked!</strong>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>{BADGES.find(b => b.id === lastUnlockedBadge)?.name}</p>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '3rem', fontSize: '0.875rem', opacity: 0.6 }}>
          <p>Made with ❤️ for simple learning</p>
        </footer>
      </div>
    </main>
  );
}

export default App;
