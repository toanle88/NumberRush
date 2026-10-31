import { memo } from 'react'
import type { DifficultyTier, MathQuestion } from '../utils/mathLogic'
import { formatOperation } from '../utils/mathLogic'
import { getPlanet } from '../utils/planetProgression'
import { createTranslator, getPlanetTranslationKeys } from '../utils/i18n'
import type { Translator } from '../utils/i18n'
interface GameBoardProps {
  question: MathQuestion
  currentInput: string
  score: number
  timeLeft: number
  maxTime: number
  streak: number
  showTimer: boolean
  level: number
  difficulty?: DifficultyTier
  translate?: Translator
}

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
  translate = createTranslator('en'),
}: GameBoardProps) => {
const planet = getPlanet(level)
const [planetNameKey] = getPlanetTranslationKeys(level)
const spokenOperation = (operation: MathQuestion['operation']) => {
    if (operation === 'addition') return translate('plus')
if (operation === 'subtraction') return translate('minus')
if (operation === 'multiplication') return translate('times')
return translate('dividedBy')
}
const firstQuestionText = `${question.operandA} ${spokenOperation(question.operation)} ${question.operandB}`
const questionText = question.operandC === undefined
  ? `${firstQuestionText} ${translate('questionEquals')}`
  : translate('groupedQuestion', {
    firstQuestion: firstQuestionText,
    secondOperation: spokenOperation(question.operation2!),
    operandC: question.operandC,
    equals: translate('questionEquals'),
  })
  return (
    <div className="board-content">
      <div className="planet-indicator">
        <span className="planet-indicator-icon" aria-hidden="true">{planet.icon}</span>
        <span>{translate(planetNameKey)}</span>
      </div>
      {showTimer && (
        <div className="progress-container">
          <progress
            className={`progress-bar ${timeLeft <= 3 ? 'progress-bar-urgent' : ''}`}
            aria-label={translate('timeRemaining')}
            aria-valuemin={0}
            aria-valuemax={maxTime}
            aria-valuenow={timeLeft}
            aria-valuetext={translate('secondsRemaining', { seconds: timeLeft, hurry: timeLeft <= 3 ? translate('hurry') : '' })}
            value={timeLeft}
            max={maxTime}
          />
        </div>
      )}

      <div className="stats-header">
        <div className="stat-item">
          <span className="label">{translate('difficulty')}</span>
          <span className="value">{translate(difficulty)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{translate('score')}</span>
          <span className="value">{score}</span>
        </div>
        <div className="stat-item streak-stat">
          <span className="label">{translate('streak')}</span>
          <span className="value">🔥 {streak}</span>
        </div>
        {showTimer && (
          <div className="stat-item timer" aria-live="polite">
            <span className="label">{translate('time')}</span>
            <span className="value">{timeLeft}s{timeLeft <= 3 ? translate('timerHurry') : ''}</span>
          </div>
        )}
      </div>

      <div className="question-display" role="group" aria-label={translate('currentAnswer', { question: questionText, answer: currentInput || translate('answerNotEntered') })}>
        <span className="sr-only" role="status" aria-live="polite">{translate('currentAnswer', { question: questionText, answer: currentInput || translate('answerNotEntered') })}</span>
        {question.operandC === undefined ? (
          <>
            <span>{question.operandA}</span>
            <span className="operation-symbol">
              {formatOperation(question.operation)}
            </span>
            <span>{question.operandB}</span>
          </>
        ) : (
          <>
            <span className="grouped-expression">
              <span aria-hidden="true">(</span>
              <span>{question.operandA}</span>
              <span className="operation-symbol">
                {formatOperation(question.operation)}
              </span>
              <span>{question.operandB}</span>
              <span aria-hidden="true">)</span>
            </span>
            <span className="operation-symbol">
              {formatOperation(question.operation2!)}
            </span>
            <span>{question.operandC}</span>
          </>
        )}
        <span className="equals-symbol">=</span>
        <div className="answer-box">
          {currentInput || '?'}
        </div>
      </div>
    </div>
  )
})
export default GameBoard
