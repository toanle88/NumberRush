import { memo } from 'react'
import type { DifficultyTier, MathQuestion } from '../utils/mathLogic'
import { formatOperation } from '../utils/mathLogic'
import { getPlanet } from '../utils/planetProgression'
interface GameBoardProps {
  question: MathQuestion
currentInput: string
score: number
timeLeft: number
maxTime: number
streak: number
showTimer: boolean
level: number
difficulty?: DifficultyTier}

const GameBoard = memo(({
  question,
  currentInput,
  score,
  timeLeft,
  maxTime,
  streak,
  showTimer,
  level,
  difficulty = 'easy',
}: GameBoardProps) => {
  const progress = (timeLeft / maxTime) * 100
const planet = getPlanet(level)
const spokenOperation = (operation: MathQuestion['operation']) => {
    if (operation === 'addition') return 'plus'
if (operation === 'subtraction') return 'minus'
if (operation === 'multiplication') return 'times'
return 'divided by'
}
const questionText = `${question.operandA} ${spokenOperation(question.operation)} ${question.operandB}${question.operandC === undefined ? '' : ` ${spokenOperation(question.operation2!)} ${question.operandC}`} equals`
  return (
    <div className="board-content">
      {showTimer && (
        <div className="progress-container">
          <div
            className="progress-bar"
            role="progressbar"
            aria-label="Time remaining"
            aria-valuemin={0}
            aria-valuemax={maxTime}
            aria-valuenow={timeLeft}
            aria-valuetext={`${timeLeft} seconds remaining${timeLeft <= 3 ? ', hurry' : ''}`}
            style={{
              width: `${Math.max(0, progress)}%`,
              backgroundColor: timeLeft <= 3 ? 'var(--color-error)' : 'var(--color-primary)',
            }}
          />
        </div>
      )}

      <div className="stats-header">
        <div className="stat-item planet-stat">
          <span className="label">Planet</span>
          <span className="value">{planet.icon} {planet.name}</span>
        </div>
        <div className="stat-item">
          <span className="label">Difficulty</span>
          <span className="value">{difficulty[0].toUpperCase() + difficulty.slice(1)}</span>
        </div>
        <div className="stat-item">
          <span className="label">Score</span>
          <span className="value">{score}</span>
        </div>
        {streak > 0 && (
          <div className="stat-item" style={{ color: 'var(--color-secondary)' }}>
            <span className="label">Streak</span>
            <span className="value">🔥 {streak}</span>
          </div>
        )}
        {showTimer && (
          <div className="stat-item timer" aria-live="polite">
            <span className="label">Time</span>
            <span className="value">{timeLeft}s{timeLeft <= 3 ? ' — hurry' : ''}</span>
          </div>
        )}
      </div>

      <div className="question-display" role="group" aria-label={`${questionText} current answer ${currentInput || 'not entered'}`}>
        <span className="sr-only" role="status" aria-live="polite">{questionText} Your current answer is {currentInput || 'not entered'}.</span>
        <span>{question.operandA}</span>
        <span style={{ color: 'var(--color-primary)' }}>
          {formatOperation(question.operation)}
        </span>
        <span>{question.operandB}</span>
        {question.operandC !== undefined && (
          <>
            <span style={{ color: 'var(--color-primary)' }}>
              {formatOperation(question.operation2!)}
            </span>
            <span>{question.operandC}</span>
          </>
        )}
        <span style={{ color: 'var(--text-secondary)' }}>=</span>
        <div className="answer-box">
          {currentInput || '?'}
        </div>
      </div>
    </div>
  )
})
export default GameBoard
