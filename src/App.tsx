import { useState, useCallback, useRef } from 'react'
import { useGame, BADGES } from './hooks/useGame'
import type { AnswerFeedback, GameMode } from './hooks/useGame'
import type { DifficultyTier, Operation } from './utils/mathLogic'
import { getDifficultyAtLeast, getDifficultyForLevel, SUPPORTED_OPERATIONS } from './utils/mathLogic'
import GameBoard from './components/GameBoard'
import Numpad from './components/Numpad'
import BadgeItem from './components/BadgeItem'
import ProgressDashboard from './components/ProgressDashboard'
import SettingsView from './components/SettingsModal'
import { getPlanet, PLANETS } from './utils/planetProgression'
import { getChallengeProgress } from './utils/dailyChallenges'
import { playCorrectSound, playIncorrectSound } from './utils/soundEffects'
import { triggerHaptic } from './utils/accessibility'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useDocumentPreferences } from './hooks/useDocumentPreferences'
import { useGameFocus } from './hooks/useFocusTrap'
import { useKeyboardGameInput } from './hooks/useKeyboardGameInput'
import { useBadgeUnlockNotice, useFeedbackExpiry, usePlanetTransition } from './hooks/useTimeout'
import { useBlitzSounds, useStreakCelebration } from './hooks/useStreakCelebration'
import { usePlayerSettings } from './hooks/usePlayerSettings'
import { useProgressTransfer } from './hooks/useProgressTransfer'
import { createTranslator, getBadgeTranslationKeys, getChallengeTranslationKeys, getPlanetTranslationKeys } from './utils/i18n'
import type { TranslationKey } from './utils/i18n'
import './App.css'

type RoundPreset = 'quick' | 'challenge' | 'custom'
const QUICK_START_OPERATIONS: Operation[] = ['addition', 'subtraction']
const CHALLENGE_OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication']
const DIFFICULTY_HELP: Record<DifficultyTier, TranslationKey> = {
  easy: 'easyHelp', medium: 'mediumHelp', hard: 'hardHelp',
}
function App() {
  const [view, setView] = useState<'home' | 'progress' | 'settings'>('home')
  const {
    initialTime, hasStoredTimer, playerName, preferences, settingsPersistenceFailed,
    updateName, updateTimer, updatePreferences, locale, updateLocale,
  } = usePlayerSettings()
  const translate = createTranslator(locale)
  const [dataMessage, setDataMessage] = useState<string | null>(null)
  const { handleExportProgress, handleImportProgress } = useProgressTransfer(setDataMessage, translate)
const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const settingsReturnViewRef = useRef<'home' | 'progress'>('home')
const [isAdvanced, setIsAdvanced] = useState(false)
const [roundPreset, setRoundPreset] = useState<RoundPreset>('quick')
const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier | undefined>()
const [selectedOperations, setSelectedOperations] = useState<Operation[]>(QUICK_START_OPERATIONS)
  const {
    status, score, timeLeft, streak, mode, currentQuestion,
    highScore, bestStreak, unlockedBadges, currentLevel, difficulty, maxTime, playedLevels, missedQuestions,
    roundSummary, isTargetedPractice, progressMetrics, recurringProgress, dailyChallenge, challengeCompletedThisRound, startGame, startTargetedPractice, submitAnswer, endGame, resetGame, resetStats, storageStatus, hasPendingPersistence,
  } = useGame(initialTime)
  const [input, setInput] = useState('')
const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
const [selectedLevel, setSelectedLevel] = useState(1)
const gameAreaRef = useRef<HTMLDivElement>(null)
const resultsHeadingRef = useRef<HTMLHeadingElement>(null)
const startButtonRef = useRef<HTMLButtonElement>(null)
const settingsButtonRef = useRef<HTMLButtonElement>(null)
const restoreStartFocusRef = useRef(false)
  const { planetTransition, setPlanetTransition } = usePlanetTransition(status, currentLevel)
  const currentPlanetLevel = status === 'playing' ? currentLevel : selectedLevel
  useDocumentPreferences(currentPlanetLevel, preferences, locale)
  useGameFocus(status, gameAreaRef, resultsHeadingRef, startButtonRef, restoreStartFocusRef)
  const lastUnlockedBadge = useBadgeUnlockNotice(unlockedBadges)
  const openSettings = useCallback(() => {
    if (view === 'settings') return
    settingsReturnViewRef.current = view === 'progress' ? 'progress' : 'home'
    setView('settings')
  }, [view])
  const closeSettings = useCallback(() => setView(settingsReturnViewRef.current), [])
  const handleStart = (m: GameMode) => {
    setView('home')
setPlanetTransition(null)
setFeedback(null)
const hasDifficultyOverride = selectedDifficulty !== undefined
  const timerOverride = hasStoredTimer ? initialTime : undefined
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
    restoreStartFocusRef.current = true
resetGame()
setInput('')
}, [resetGame, setPlanetTransition])
  const handleTargetedPractice = useCallback(() => {
    setPlanetTransition(null)
setFeedback(null)
startTargetedPractice()
setInput('')
}, [setPlanetTransition, startTargetedPractice])
  const clearFeedback = useCallback(() => setFeedback(null), [])
  useFeedbackExpiry(feedback, status, clearFeedback)
  useKeyboardGameInput(status, view === 'settings', { handleInput, handleSubmit, handleClear, handleExit })
  const shakeClass = useStreakCelebration(streak, preferences.sound, preferences.reducedMotion, systemReducedMotion)
  useBlitzSounds(timeLeft, status, mode, preferences.sound)
  const displayedDifficulty = getDifficultyAtLeast(
    selectedDifficulty || getDifficultyForLevel(selectedLevel),
    getDifficultyForLevel(selectedLevel),
  )
  const persistenceMessage = dataMessage
    || (storageStatus === 'unsupported'
      ? translate('savedProgressNewer')
      : storageStatus === 'unavailable'
        ? translate('progressSaveUnavailable')
        : hasPendingPersistence || settingsPersistenceFailed
          ? translate('progressSavePending')
          : null)
  return (
    <main className="animate-pop">
      <div className={shakeClass}>
        <header>
          <div className="header-top">
            <h1>NumberRush</h1>
            <button ref={settingsButtonRef} type="button" className="settings-btn" onClick={openSettings} aria-label={translate('openSettings')}>⚙️</button>
          </div>
          {status === 'idle' && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>
              {translate('appGreeting', { name: playerName })}
            </p>
          )}
        </header>

        {persistenceMessage && (
          <div role="status" aria-live="polite" style={{ margin: '0 auto 1rem', maxWidth: '42rem', color: 'var(--text-secondary)' }}>
            {persistenceMessage}
          </div>
        )}

        <div className="game-container">
          {view === 'settings' ? (
            <SettingsView
              playerName={playerName}
              initialTime={initialTime}
              preferences={preferences}
              onClose={closeSettings}
              onUpdateName={updateName}
              onUpdateTimer={updateTimer}
              onUpdatePreferences={updatePreferences}
              locale={locale}
              onUpdateLocale={updateLocale}
              translate={translate}
              onResetStats={resetStats}
              onExportProgress={handleExportProgress}
              onImportProgress={handleImportProgress}
            />
          ) : (
            <>
          {status === 'idle' && (
            view === 'progress' ? (
              <ProgressDashboard metrics={progressMetrics} recurringProgress={recurringProgress} onBack={() => setView('home')} locale={locale} translate={translate} />
            ) : (
              <div className="dashboard animate-pop">
              <div className="best-stats">
                <div className="stat-card"><span>{translate('highScore')}</span><strong>{highScore}</strong></div>
                <div className="stat-card"><span>{translate('bestStreak')}</span><strong>{bestStreak}</strong></div>
              </div>

              <section className="daily-challenge-card" aria-labelledby="daily-challenge-heading">
                <div className="daily-challenge-heading">
                  <div>
                    <p className="eyebrow">{translate('dailyChallenge')}</p>
                    <h2 id="daily-challenge-heading">{translate(getChallengeTranslationKeys(dailyChallenge.id)[0])}</h2>
                    <p>{translate(getChallengeTranslationKeys(dailyChallenge.id)[1])}</p>
                  </div>
                  <span className="challenge-icon" aria-hidden="true">🎯</span>
                </div>
                <div className="challenge-progress-line">
                  <div
                    className="challenge-progress-bar"
                    role="progressbar"
                    aria-label={translate('challengeProgress', { title: translate(getChallengeTranslationKeys(dailyChallenge.id)[0]) })}
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
                    ? translate('challengeCompleted', { points: dailyChallenge.rewardPoints })
                    : translate('challengeReward', { points: dailyChallenge.rewardPoints })}
                </p>
                <p className="challenge-points">{translate('challengePoints')} <strong>{recurringProgress.points}</strong></p>
              </section>

              <div className="primary-action">
                <button ref={startButtonRef} type="button" className="primary" onClick={() => handleStart('blitz')}>{translate('startBlitz')}</button>
              </div>

              <details className="customize-round">
                <summary>{translate('customizeRound')} <span aria-hidden="true">⌄</span></summary>
                <div className="customize-round-content">
                  <fieldset className="preset-selector">
                    <legend className="selector-title">{translate('choosePreset')}</legend>
                    <div className="preset-grid" role="group" aria-label={translate('roundPresets')}>
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'quick' ? 'primary' : ''}`}
                        aria-label={translate('quickStart')}
                        aria-describedby="quick-start-description"
                        aria-pressed={roundPreset === 'quick'}
                        onClick={() => selectRoundPreset('quick')}
                      >
                        <strong>{translate('quickStart')}</strong>
                        <small id="quick-start-description">{translate('quickStartDescription')}</small>
                      </button>
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'challenge' ? 'primary' : ''}`}
                        aria-label={translate('challenge')}
                        aria-describedby="challenge-description"
                        aria-pressed={roundPreset === 'challenge'}
                        onClick={() => selectRoundPreset('challenge')}
                      >
                        <strong>{translate('challenge')}</strong>
                        <small id="challenge-description">{translate('challengeDescription')}</small>
                      </button>
                      <button
                        type="button"
                        className={`preset-choice ${roundPreset === 'custom' ? 'primary' : ''}`}
                        aria-label={translate('custom')}
                        aria-describedby="custom-description"
                        aria-pressed={roundPreset === 'custom'}
                        onClick={() => selectRoundPreset('custom')}
                      >
                        <strong>{translate('custom')}</strong>
                        <small id="custom-description">{translate('customDescription')}</small>
                      </button>
                    </div>
                  </fieldset>

                  {roundPreset === 'custom' && (
                    <div className="custom-round-settings">
                      <section className="setting-group" aria-labelledby="starting-planet-heading">
                        <h3 id="starting-planet-heading" className="setting-title">{translate('startingPlanet')}</h3>
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
                              title={`${planet.minimumScore === 0 ? translate('startingPlanetTitle') : translate('availableAfter', { points: planet.minimumScore })}. ${translate('startsAtDifficulty', { difficulty: translate(getPlanetTranslationKeys(planet.level)[1]) })}`}
                            >
                              {translate(getPlanetTranslationKeys(planet.level)[0])} {planet.icon}{selectedLevel === planet.level ? ` (${translate('selected')})` : ''}
                            </button>
                          ))}
                        </div>
                      </section>

                      <fieldset className="setting-group operator-selector">
                        <legend className="setting-title">{translate('operators')}</legend>
                        <div className="choice-grid" role="group" aria-label={translate('mathOperators')}>
                          {SUPPORTED_OPERATIONS.map(operation => {
return (
                              <label className="choice-chip" key={operation}>
                                <input
                                  type="checkbox"
                                  checked={selectedOperations.includes(operation)}
                                  onChange={() => toggleOperation(operation)}
                                />
                                {translate(operation)}
                              </label>
                            )
})}
                        </div>
                      </fieldset>

                      <fieldset className="setting-group difficulty-selector">
                        <legend className="setting-title">{translate('difficulty')}</legend>
                        <div className="choice-grid" role="group" aria-label={translate('difficultyTier')}>
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
                              title={translate(DIFFICULTY_HELP[tier])}
                            >
                              {translate(tier)}{displayedDifficulty === tier ? ` (${translate('selected')})` : ''}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <details className="more-options">
                        <summary onClick={() => setMoreOptionsOpen(previous => !previous)}>{translate('moreOptions')} <span aria-hidden="true">⌄</span></summary>
                        <div className="more-options-content" hidden={!moreOptionsOpen}>
                          <button
                            type="button"
                            className={isAdvanced ? 'primary' : ''}
                            aria-pressed={isAdvanced}
                            onClick={() => setIsAdvanced(!isAdvanced)}
                          >
                            {isAdvanced ? translate('chaosOn') : translate('chaosOff')}
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </details>

              <div className="mode-selection">
                <button type="button" onClick={() => handleStart('practice')}>{translate('practiceMode')}</button>
                <button type="button" className="progress-link" onClick={() => setView('progress')}>
                  {translate('viewProgress')}
                </button>
              </div>

              <div className="badge-gallery">
                {BADGES.map(badge => (
                  <BadgeItem key={badge.id} badge={badge} isUnlocked={unlockedBadges.includes(badge.id)} translate={translate} />
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
              aria-label={translate('mathGame')}
              tabIndex={-1}
            >
              <button type="button" className="exit-btn" onClick={handleExit} title={translate('exitGame')} aria-label={translate('exitGame')}>✕</button>
              {planetTransition && (
                <div className="planet-transition" role="status" aria-live="polite">
                  <span>{getPlanet(planetTransition.from).icon} {translate(getPlanetTranslationKeys(planetTransition.from)[0])}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{translate('nowEntering', { planet: `${getPlanet(planetTransition.to).icon} ${translate(getPlanetTranslationKeys(planetTransition.to)[0])}` })}</strong>
                  <small>{translate('reachedPoints', { difficulty: translate(difficulty), score })}</small>
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
                  translate={translate}
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
                      <span>{translate('correct')}</span>
                    </>
                  )}
                  {feedback && !feedback.isCorrect && (
                    <span>{translate('correctAnswer', { answer: feedback.expectedAnswer })}</span>
                  )}
                </div>
              </div>
              <Numpad onInput={handleInput} onClear={handleClear} onSubmit={handleSubmit} translate={translate} />
              {mode === 'practice' && (
                <button type="button" className="finish-practice-btn" onClick={endGame}>{translate('finishPractice')}</button>
              )}
            </div>
          )}

          {status === 'finished' && roundSummary && (
            <div className="results-screen animate-pop">
              <h2 ref={resultsHeadingRef} tabIndex={-1}>{mode === 'blitz' ? translate('timesUp') : isTargetedPractice ? translate('missedReviewed') : translate('roundComplete')}</h2>
              {challengeCompletedThisRound && (
                <div className="challenge-complete-banner" role="status">
                  <strong>{translate('dailyChallengeComplete')}</strong>
                  <span>{translate('pointsAdded', { points: dailyChallenge.rewardPoints, total: recurringProgress.points })}</span>
                </div>
              )}
              {feedback && !feedback.isCorrect && (
                <div className="results-feedback" role="status" aria-live="polite">
                  <strong>❌ {translate('correctAnswer', { answer: feedback.expectedAnswer })}</strong>
                  <span>{feedback.explanation}</span>
                </div>
              )}
              <div className="final-stats">
                <p className="final-score">{translate('finalScore')} <strong>{roundSummary.finalScore}</strong></p>
                <div className="results-metrics">
                  <div className="results-metric"><span>{translate('questions')}</span><strong>{roundSummary.totalQuestions}</strong></div>
                  <div className="results-metric"><span>{translate('correctLabel')}</span><strong>{roundSummary.correctAnswers}</strong></div>
                  <div className="results-metric"><span>{translate('accuracy')}</span><strong>{roundSummary.accuracy}%</strong></div>
                  <div className="results-metric"><span>{translate('averageResponse')}</span><strong>{roundSummary.averageResponseTimeMs === null ? '—' : `${(roundSummary.averageResponseTimeMs / 1000).toFixed(1)}s`}</strong></div>
                  <div className="results-metric"><span>{translate('roundBestStreak')}</span><strong>🔥 {roundSummary.bestStreak}</strong></div>
                  <div className="results-metric"><span>{translate('allTimeBestStreak')}</span><strong>🔥 {roundSummary.allTimeBestStreak}</strong></div>
                </div>
                <div className="personal-best-comparison">
                  <span className="results-label">{translate('personalBestComparison')}</span>
                  <p>{translate('previousBest', { score: roundSummary.personalBestScore, streak: roundSummary.personalBestStreak })}</p>
                  {(roundSummary.isNewPersonalBestScore || roundSummary.isNewPersonalBestStreak) ? (
                    <strong className="personal-best-message">{translate('newPersonalBest', { plural: roundSummary.isNewPersonalBestScore && roundSummary.isNewPersonalBestStreak ? 's' : '' })}</strong>
                  ) : (
                    <span className="personal-best-message">{translate('keepGoing')}</span>
                  )}
                </div>
                <div className="results-progression">
                  <span className="results-label">{translate('planetsPlayed')}</span>
                  <div className="progression-path" aria-label={translate('planetsPlayedRound')}>
                    {playedLevels.map(level => {
                      const planet = getPlanet(level)
return (
                        <span className="progression-chip" key={level}>
                          {planet.icon} {translate(getPlanetTranslationKeys(level)[0])}
                          <small>{translate(getPlanetTranslationKeys(level)[1])}</small>
                        </span>
                      )
})}
                  </div>
                </div>
              </div>
              <div className="results-actions">
                <button type="button" className="primary" onClick={() => handleStart(mode)}>{translate('playAgain')}</button>
                {missedQuestions.length > 0 ? (
                  <button type="button" onClick={handleTargetedPractice}>{translate('practiceMissed')}</button>
                ) : (
                  <p className="next-action">{translate('nextAction')}</p>
                )}
                <button type="button" onClick={resetGame}>{translate('changePlanet')}</button>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {lastUnlockedBadge && (
          <div className="unlocked-toast">
            <span style={{ fontSize: '2rem' }}>{BADGES.find(b => b.id === lastUnlockedBadge)?.icon}</span>
            <div>
              <strong>{translate('badgeUnlocked')}</strong>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>{(() => {
 const badge = BADGES.find(b => b.id === lastUnlockedBadge); return badge ? translate(getBadgeTranslationKeys(badge.id)[0]) : ''
})()}</p>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '3rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p>{translate('madeWithLove')}</p>
        </footer>
      </div>
    </main>
  )
}

export default App
