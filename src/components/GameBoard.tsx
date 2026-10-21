import { memo } from 'react';
import type { MathQuestion } from '../utils/mathLogic';
import { getPlanet } from '../utils/planetProgression';

interface GameBoardProps {
  question: MathQuestion;
  currentInput: string;
  score: number;
  timeLeft: number;
  maxTime: number;
  streak: number;
  showTimer: boolean;
  level: number;
}

const GameBoard = memo(({
  question,
  currentInput,
  score,
  timeLeft,
  maxTime,
  streak,
  showTimer,
  level
}: GameBoardProps) => {
  const progress = (timeLeft / maxTime) * 100;
  const planet = getPlanet(level);
  const questionText = `${question.operandA} ${question.operation === 'addition' ? 'plus' : 'minus'} ${question.operandB}${question.operandC === undefined ? '' : ` ${question.operation2 === 'addition' ? 'plus' : 'minus'} ${question.operandC}`} equals`;

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
              backgroundColor: timeLeft <= 3 ? 'var(--color-error)' : 'var(--color-primary)'
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
          {question.operation === 'addition' ? '+' : '−'}
        </span>
        <span>{question.operandB}</span>
        {question.operandC !== undefined && (
          <>
            <span style={{ color: 'var(--color-primary)' }}>
              {question.operation2 === 'addition' ? '+' : '−'}
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
  );
});

export default GameBoard;
