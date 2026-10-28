import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame, BADGES } from './hooks/useGame'
import type { AnswerFeedback, GameMode } from './hooks/useGame'
import type { DifficultyTier, Operation } from './utils/mathLogic'
import { getDifficultyAtLeast, getDifficultyForLevel, SUPPORTED_OPERATIONS } from './utils/mathLogic'
import GameBoard from './components/GameBoard'
import Numpad from './components/Numpad'
import BadgeItem from './components/BadgeItem'
import ProgressDashboard from './components/ProgressDashboard'
import SettingsModal from './components/SettingsModal'
import { getPlanet, PLANETS } from './utils/planetProgression'
import { getChallengeProgress } from './utils/dailyChallenges'
import { playCorrectSound, playIncorrectSound, playFinishSound, playTickSound, playCelebrationSound } from './utils/soundEffects'
import { getSystemReducedMotionPreference, readAccessibilityPreferences, saveAccessibilityPreferences, triggerHaptic } from './utils/accessibility'
import type { AccessibilityPreferences } from './utils/accessibility'
import { exportProgress, getStorageStatus, importProgress, readStorage, readStoredNonNegativeInteger, writeStorage } from './utils/storage'
import { STORAGE_KEYS } from './utils/storageKeys'
import confetti from 'canvas-confetti'
import './App.css'
interface PlanetTransition {
  from: number
to: number}

type RoundPreset = 'quick' | 'challenge' | 'custom'
const QUICK_START_OPERATIONS: Operation[] = ['addition', 'subtraction']
const CHALLENGE_OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication']
const DIFFICULTY_HELP: Record<DifficultyTier, string> = {
  easy: '15 second starting timer with smaller number ranges',
  medium: '10 second starting timer with wider number ranges',
  hard: '7 second starting timer with challenging number ranges',
}
const FEEDBACK_DURATION_MS = 1400
const safeConfetti = (options: Parameters<typeof confetti>[0]): void => {
  try {
    confetti(options)
  } catch {
    // Celebrations are optional and must not interrupt gameplay.
  }
}
function App() {
  const [view, setView] = useState<'home' | 'progress'>('home')
const [initialTime, setInitialTime] = useState(() =>
    Math.min(20, Math.max(1, readStoredNonNegativeInteger(STORAGE_KEYS.TIMER, 10, 20))),
  )
const [playerName, setPlayerName] = useState(() =>
    readStorage(STORAGE_KEYS.NAME) || 'Super Kid',
  )
const [settingsOpen, setSettingsOpen] = useState(false)
const [preferences, setPreferences] = useState<AccessibilityPreferences>(readAccessibilityPreferences)
const [systemReducedMotion, setSystemReducedMotion] = useState(getSystemReducedMotionPreference)
const closeSettings = useCallback(() => setSettingsOpen(false), [])
const [isAdvanced, setIsAdvanced] = useState(false)
const [roundPreset, setRoundPreset] = useState<RoundPreset>('quick')
const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier | undefined>()
const [selectedOperations, setSelectedOperations] = useState<Operation[]>(QUICK_START_OPERATIONS)
const [lastUnlockedBadge, setLastUnlockedBadge] = useState<string | null>(null)
const [settingsPersistenceFailed, setSettingsPersistenceFailed] = useState(false)
const [dataMessage, setDataMessage] = useState<string | null>(null)
const previousBadgeCountRef = useRef(0)
const hasInitializedBadgesRef = useRef(false)
  const {
    status, score, timeLeft, streak, mode, currentQuestion,
    highScore, bestStreak, unlockedBadges, currentLevel, difficulty, maxTime, playedLevels, missedQuestions,
    roundSummary, isTargetedPractice, progressMetrics, recurringProgress, dailyChallenge, challengeCompletedThisRound, startGame, startTargetedPractice, submitAnswer, endGame, resetGame, resetStats, storageStatus, hasPendingPersistence,
  } = useGame(initialTime)
  const [input, setInput] = useState('')
const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
const [selectedLevel, setSelectedLevel] = useState(1)
const [shakeClass, setShakeClass] = useState('')
const [planetTransition, setPlanetTransition] = useState<PlanetTransition | null>(null)
const previousLevelRef = useRef<number | null>(null)
const gameAreaRef = useRef<HTMLDivElement>(null)
const resultsHeadingRef = useRef<HTMLHeadingElement>(null)
const previousStreakRef = useRef(0)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    let mediaQuery: MediaQueryList
    try {
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {
      return
    }
const handleChange = (event: MediaQueryListEvent) => setSystemReducedMotion(event.matches)
    try {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange)
        return () => {
          try {
            mediaQuery.removeEventListener('change', handleChange)
          } catch {
            // Reduced-motion listeners are optional.
          }
        }
      }
      if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleChange)
        return () => {
          try {
            mediaQuery.removeListener(handleChange)
          } catch {
            // Reduced-motion listeners are optional.
          }
        }
      }
    } catch {
      // Some embedded browsers expose a matchMedia object whose listeners throw.
    }
  }, [])
  useEffect(() => {
    const level = status === 'playing' ? currentLevel : selectedLevel
document.body.className = `planet-${level}`
}, [selectedLevel, status, currentLevel])
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
document.documentElement.dataset.highContrast = preferences.highContrast ? 'true' : 'false'
document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false'
}, [preferences])
  useEffect(() => {
    if (status !== 'playing') {
      previousLevelRef.current = null
return
}

    const previousLevel = previousLevelRef.current
if (previousLevel !== null && previousLevel !== currentLevel) {
      setPlanetTransition({ from: previousLevel, to: currentLevel })
const timer = window.setTimeout(() => setPlanetTransition(null), 4000)
previousLevelRef.current = currentLevel
return () => window.clearTimeout(timer)
}

    previousLevelRef.current = currentLevel
}, [status, currentLevel])
  useEffect(() => {
    if (status === 'playing') gameAreaRef.current?.focus()
if (status === 'finished') resultsHeadingRef.current?.focus()
}, [status])
  useEffect(() => {
    if (!hasInitializedBadgesRef.current) {
      previousBadgeCountRef.current = unlockedBadges.length
hasInitializedBadgesRef.current = true
return
}

    if (unlockedBadges.length > previousBadgeCountRef.current) {
      const latest = unlockedBadges[unlockedBadges.length - 1]
const showTimer = setTimeout(() => setLastUnlockedBadge(latest), 0)
const clearTimer = setTimeout(() => setLastUnlockedBadge(null), 4000)
previousBadgeCountRef.current = unlockedBadges.length
return () => {
        clearTimeout(showTimer)
clearTimeout(clearTimer)
}
}

    previousBadgeCountRef.current = unlockedBadges.length
}, [unlockedBadges])
  const handleStart = (m: GameMode) => {
    setView('home')
setPlanetTransition(null)
setFeedback(null)
const hasDifficultyOverride = selectedDifficulty !== undefined
const timerOverride = readStorage(STORAGE_KEYS.TIMER) !== null ? initialTime : undefined
startGame(selectedLevel, m, isAdvanced, selectedOperations, selectedDifficulty, timerOverride, hasDifficultyOverride, true)
}
  const selectRoundPreset = (preset: RoundPreset) => {
    setRoundPreset(preset)
if (preset === 'quick') {
      setSelectedLevel(1)
setIsAdvanced(false)
setSelectedOperations(QUICK_START_OPERATIONS)
setSelectedDifficulty(undefined)
setMoreOptionsOpen(false)
}
    if (preset === 'challenge') {
      setSelectedLevel(2)
setIsAdvanced(false)
setSelectedOperations(CHALLENGE_OPERATIONS)
setSelectedDifficulty('medium')
setMoreOptionsOpen(false)
}
  }
  const toggleOperation = (operation: Operation) => {
    setRoundPreset('custom')
setSelectedOperations(previous => {
      if (previous.includes(operation)) {
        return previous.length === 1 ? previous : previous.filter(item => item !== operation)
}
      return [...previous, operation]
})
}
  const handleInput = useCallback((val: string) => {
    setInput(prev => (prev.length < 4 ? prev + val : prev))
}, [])
  const handleClear = useCallback(() => setInput(''), [])
  const handleSubmit = useCallback(() => {
    if (input === '') return
const answerFeedback = submitAnswer(parseInt(input, 10))
if (!answerFeedback) return
setFeedback(answerFeedback)
if (answerFeedback.isCorrect) playCorrectSound(preferences.sound)
else playIncorrectSound(preferences.sound)
triggerHaptic(preferences.haptics, answerFeedback.isCorrect ? 20 : [50, 50, 50])
setInput('')
}, [input, preferences.haptics, preferences.sound, submitAnswer])
  const handleExit = useCallback(() => {
    setPlanetTransition(null)
setFeedback(null)
resetGame()
setInput('')
}, [resetGame])
  const handleTargetedPractice = useCallback(() => {
    setPlanetTransition(null)
setFeedback(null)
startTargetedPractice()
setInput('')
}, [startTargetedPractice])
  const updateName = (val: string) => {
    setPlayerName(val)
    setSettingsPersistenceFailed(!writeStorage(STORAGE_KEYS.NAME, val))
}
  const updateTimer = (val: number) => {
    setInitialTime(val)
    setSettingsPersistenceFailed(!writeStorage(STORAGE_KEYS.TIMER, val.toString()))
}
  const handleExportProgress = useCallback(() => {
    const serialized = exportProgress()
    if (!serialized || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setDataMessage(getStorageStatus() === 'unavailable'
        ? 'Progress could not be exported because storage is unavailable on this device.'
        : 'Progress could not be exported on this device.')
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }))
    link.download = `number-rush-progress-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setDataMessage('Progress exported successfully.')
  }, [])
  const handleImportProgress = useCallback((file: File) => {
    void file.text().then(serialized => {
      const result = importProgress(serialized)
      if (!result.ok) {
        setDataMessage(result.reason === 'unsupported'
          ? 'This progress file is from an unsupported version.'
          : 'Progress file could not be imported.')
        return
      }
      window.location.reload()
    }).catch(() => setDataMessage('Progress file could not be imported.'))
  }, [])
  const updatePreferences = (patch: Partial<AccessibilityPreferences>) => {
    const nextPreferences = { ...preferences, ...patch }
    setPreferences(nextPreferences)
    setSettingsPersistenceFailed(!saveAccessibilityPreferences(nextPreferences))
}
  useEffect(() => {
    if (!feedback || status !== 'playing') return
const timer = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS)
return () => clearTimeout(timer)
}, [feedback, status])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || settingsOpen) return
if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, summary, [role="button"], [contenteditable="true"]')) return
if ((e.key >= '0' && e.key <= '9') || (e.code.startsWith('Numpad') && e.key >= '0' && e.key <= '9')) {
        e.preventDefault()
handleInput(e.key)
} else if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        e.preventDefault()
handleSubmit()
} else if (e.key === 'Backspace') handleClear()
else if (e.key === 'Escape') handleExit()
}
window.addEventListener('keydown', handleKeyDown)
return () => window.removeEventListener('keydown', handleKeyDown)
}, [status, handleInput, handleSubmit, handleClear, handleExit, settingsOpen])
  useEffect(() => {
    const previousStreak = previousStreakRef.current
previousStreakRef.current = streak
    if (streak <= 0 || streak <= previousStreak || streak % 10 !== 0) return
    playCelebrationSound(preferences.sound)
if (preferences.reducedMotion || systemReducedMotion) return
    let shake = 'shake-small'
let confettiInterval: number | null = null
    if (streak >= 30) {
      shake = 'shake-hard'
const duration = 1500
const animationEnd = Date.now() + duration
const random = (min: number, max: number) => Math.random() * (max - min) + min
      confettiInterval = window.setInterval(() => {
        const tLeft = animationEnd - Date.now()
if (tLeft <= 0) {
          window.clearInterval(confettiInterval!)
return
}
        const pCount = 40
        safeConfetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } })
safeConfetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } })
}, 250)
} else if (streak >= 20) {
      shake = 'shake-medium'
safeConfetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } })
} else {
safeConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] })
}

    let clearShakeTimer: number | null = null
let animationFrame: number | null = null
let usesAnimationFrame = false
try {
      if (typeof window.requestAnimationFrame === 'function') {
        usesAnimationFrame = true
        animationFrame = window.requestAnimationFrame(() => {
          setShakeClass(shake)
          clearShakeTimer = window.setTimeout(() => setShakeClass(''), 1000)
        })
      } else {
        animationFrame = window.setTimeout(() => {
          setShakeClass(shake)
          clearShakeTimer = window.setTimeout(() => setShakeClass(''), 1000)
        }, 0)
      }
    } catch {
      // Animation is optional; the game remains usable without it.
    }
    return () => {
      if (animationFrame !== null) {
        try {
          if (usesAnimationFrame && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(animationFrame)
          else window.clearTimeout(animationFrame)
        } catch {
          // Animation cleanup is optional.
        }
      }
if (clearShakeTimer !== null) window.clearTimeout(clearShakeTimer)
if (confettiInterval !== null) window.clearInterval(confettiInterval)
}
}, [preferences.reducedMotion, preferences.sound, streak, systemReducedMotion])
  useEffect(() => {
    if (status === 'playing' && mode === 'blitz') {
      if (timeLeft <= 3 && timeLeft > 0) playTickSound(preferences.sound)
else if (timeLeft === 0) playFinishSound(preferences.sound)
}
  }, [timeLeft, status, mode, preferences.sound])
  const displayedDifficulty = getDifficultyAtLeast(
    selectedDifficulty || getDifficultyForLevel(selectedLevel),
    getDifficultyForLevel(selectedLevel),
  )
  const persistenceMessage = dataMessage
    || (storageStatus === 'unsupported'
      ? 'Saved progress uses a newer version and was not changed.'
      : storageStatus === 'unavailable'
        ? 'Progress cannot be saved on this device right now. Your current game is still safe.'
        : hasPendingPersistence || settingsPersistenceFailed
          ? 'Progress is waiting to be saved. Keep this page open while storage recovers.'
          : null)
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

        {persistenceMessage && (
          <div role="status" aria-live="polite" style={{ margin: '0 auto 1rem', maxWidth: '42rem', color: 'var(--text-secondary)' }}>
            {persistenceMessage}
          </div>
        )}

        <div className="game-container">
          {status === 'idle' && (
            view === 'progress' ? (
              <ProgressDashboard metrics={progressMetrics} recurringProgress={recurringProgress} onBack={() => setView('home')} />
            ) : (
              <div className="dashboard animate-pop">
              <div className="best-stats">
                <div className="stat-card"><span>High Score</span><strong>{highScore}</strong></div>
                <div className="stat-card"><span>Best Streak</span><strong>{bestStreak}</strong></div>
              </div>

              <section className="daily-challenge-card" aria-labelledby="daily-challenge-heading">
                <div className="daily-challenge-heading">
                  <div>
                    <p className="eyebrow">Daily challenge</p>
                    <h2 id="daily-challenge-heading">{dailyChallenge.title}</h2>
                    <p>{dailyChallenge.description}</p>
                  </div>
                  <span className="challenge-icon" aria-hidden="true">🎯</span>
                </div>
                <div className="challenge-progress-line">
                  <div
                    className="challenge-progress-bar"
                    role="progressbar"
                    aria-label={`${dailyChallenge.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={dailyChallenge.target}
                    aria-valuenow={getChallengeProgress(dailyChallenge, recurringProgress)}
                  >
                    <span style={{ width: `${(getChallengeProgress(dailyChallenge, recurringProgress) / dailyChallenge.target) * 100}%` }} />
                  </div>
                  <strong>{getChallengeProgress(dailyChallenge, recurringProgress)}/{dailyChallenge.target}</strong>
                </div>
                <p className="challenge-status" role="status">
                  {recurringProgress.challenge.completed
                    ? `Completed today! +${dailyChallenge.rewardPoints} points earned.`
                    : `Reward: ${dailyChallenge.rewardPoints} points`}
                </p>
                <p className="challenge-points">Challenge points: <strong>{recurringProgress.points}</strong></p>
              </section>

              <div className="primary-action">
                <button type="button" className="primary" onClick={() => handleStart('blitz')}>Start Blitz Rush! ⚡</button>
              </div>

              <details className="customize-round">
                <summary>Customize round <span aria-hidden="true">⌄</span></summary>
                <div className="customize-round-content">
                  <fieldset className="preset-selector">
                    <legend className="selector-title">Choose a preset</legend>
                    <div className="preset-grid" role="group" aria-label="Round presets">
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'quick' ? 'primary' : ''}`}
                        aria-label="Quick Start"
                        aria-describedby="quick-start-description"
                        aria-pressed={roundPreset === 'quick'}
                        onClick={() => selectRoundPreset('quick')}
                      >
                        <strong>Quick Start</strong>
                        <small id="quick-start-description">Moon · + − · Easy</small>
                      </button>
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'challenge' ? 'primary' : ''}`}
                        aria-label="Challenge"
                        aria-describedby="challenge-description"
                        aria-pressed={roundPreset === 'challenge'}
                        onClick={() => selectRoundPreset('challenge')}
                      >
                        <strong>Challenge</strong>
                        <small id="challenge-description">Mars · mixed · Medium</small>
                      </button>
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'custom' ? 'primary' : ''}`}
                        aria-label="Custom"
                        aria-describedby="custom-description"
                        aria-pressed={roundPreset === 'custom'}
                        onClick={() => selectRoundPreset('custom')}
                      >
                        <strong>Custom</strong>
                        <small id="custom-description">Choose each setting</small>
                      </button>
                    </div>
                  </fieldset>

                  {roundPreset === 'custom' && (
                    <div className="custom-round-settings">
                      <section className="setting-group" aria-labelledby="starting-planet-heading">
                        <h3 id="starting-planet-heading" className="setting-title">Starting planet</h3>
                        <div className="planet-choice-grid">
                          {PLANETS.map(planet => (
                            <button
                              type="button"
                              key={planet.level}
                              className={selectedLevel === planet.level ? 'primary' : ''}
                              onClick={() => {
                                setRoundPreset('custom')
setSelectedLevel(planet.level)
}}
                              aria-pressed={selectedLevel === planet.level}
                              title={`${planet.minimumScore === 0 ? 'Starting planet' : `Available after ${planet.minimumScore} points`}. Starts at ${getDifficultyForLevel(planet.level)} difficulty.`}
                            >
                              {planet.name} {planet.icon}{selectedLevel === planet.level ? ' (selected)' : ''}
                            </button>
                          ))}
                        </div>
                      </section>

                      <fieldset className="setting-group operator-selector">
                        <legend className="setting-title">Operators</legend>
                        <div className="choice-grid" role="group" aria-label="Math operators">
                          {SUPPORTED_OPERATIONS.map(operation => {
                            const labels: Record<Operation, string> = {
                              addition: 'Addition +',
                              subtraction: 'Subtraction −',
                              multiplication: 'Multiplication ×',
                              division: 'Division ÷',
                            }
return (
                              <label className="choice-chip" key={operation}>
                                <input
                                  type="checkbox"
                                  checked={selectedOperations.includes(operation)}
                                  onChange={() => toggleOperation(operation)}
                                />
                                {labels[operation]}
                              </label>
                            )
})}
                        </div>
                      </fieldset>

                      <fieldset className="setting-group difficulty-selector">
                        <legend className="setting-title">Difficulty</legend>
                        <div className="choice-grid" role="group" aria-label="Difficulty tier">
                          {(['easy', 'medium', 'hard'] as DifficultyTier[]).map(tier => (
                            <button
                              type="button"
                              key={tier}
                              className={displayedDifficulty === tier ? 'primary' : ''}
                              onClick={() => {
                                setRoundPreset('custom')
setSelectedDifficulty(tier)
}}
                              aria-pressed={displayedDifficulty === tier}
                              title={DIFFICULTY_HELP[tier]}
                            >
                              {tier[0].toUpperCase() + tier.slice(1)}{displayedDifficulty === tier ? ' (selected)' : ''}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <details className="more-options">
                        <summary onClick={() => setMoreOptionsOpen(previous => !previous)}>More options <span aria-hidden="true">⌄</span></summary>
                        <div className="more-options-content" hidden={!moreOptionsOpen}>
                          <button
                            type="button"
                            className={isAdvanced ? 'primary' : ''}
                            aria-pressed={isAdvanced}
                            onClick={() => setIsAdvanced(!isAdvanced)}
                          >
                            {isAdvanced ? '🔥 3-Number Chaos ON' : '💡 3-Number Chaos OFF'}
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </details>

              <div className="mode-selection">
                <button type="button" onClick={() => handleStart('practice')}>Practice Mode 🧠</button>
                <button type="button" className="progress-link" onClick={() => setView('progress')}>
                  View your progress 📈
                </button>
              </div>

              <div className="badge-gallery">
                {BADGES.map(badge => (
                  <BadgeItem key={badge.id} badge={badge} isUnlocked={unlockedBadges.includes(badge.id)} />
                ))}
              </div>
              </div>
            )
          )}

          {status === 'playing' && currentQuestion && (
            <div
              ref={gameAreaRef}
              className="game-area"
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
                  <small>{difficulty[0].toUpperCase() + difficulty.slice(1)} difficulty · {score} points reached</small>
                </div>
              )}
              <div className="board-wrapper">
                <GameBoard
                  question={currentQuestion}
                  currentInput={input}
                  score={score}
                  timeLeft={timeLeft}
                  maxTime={maxTime}
                  streak={streak}
                  showTimer={mode === 'blitz'}
                  level={currentLevel}
                  difficulty={difficulty}
                />
                <div
                  className={`feedback-inline ${feedback ? `feedback-inline-${feedback.isCorrect ? 'correct' : 'incorrect'}` : 'feedback-inline-empty'}`}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {feedback?.isCorrect && (
                    <>
                      <span className="feedback-inline-icon" aria-hidden="true">✓</span>
                      <span>Correct</span>
                    </>
                  )}
                  {feedback && !feedback.isCorrect && (
                    <span>Correct answer: <strong>{feedback.expectedAnswer}</strong></span>
                  )}
                </div>
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
              {challengeCompletedThisRound && (
                <div className="challenge-complete-banner" role="status">
                  <strong>Daily challenge complete! 🎉</strong>
                  <span>{dailyChallenge.rewardPoints} points added. Total challenge points: {recurringProgress.points}.</span>
                </div>
              )}
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
                      const planet = getPlanet(level)
return (
                        <span className="progression-chip" key={level}>
                          {planet.icon} {planet.name}
                          <small>{planet.difficulty}</small>
                        </span>
                      )
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
            onExportProgress={handleExportProgress}
            onImportProgress={handleImportProgress}
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
  )
}

export default App
