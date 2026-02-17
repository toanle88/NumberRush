import type { MathQuestion } from '../utils/mathLogic';

interface GameBoardProps {
  question: MathQuestion;
  currentInput: string;
  score: number;
  timeLeft: number;
  maxTime: number;
  streak: number;
  showTimer: boolean;
}

const GameBoard = ({
  question,
  currentInput,
  score,
  timeLeft,
  maxTime,
  streak,
  showTimer
}: GameBoardProps) => {
  const progress = (timeLeft / maxTime) * 100;

  return (
    <div className="board-content">
      {showTimer && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              backgroundColor: timeLeft <= 3 ? 'var(--color-error)' : 'var(--color-primary)'
            }}
          />
        </div>
      )}

      <div className="stats-header">
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
          <div className="stat-item timer">
            <span className="label">Time</span>
            <span className="value">{timeLeft}s</span>
          </div>
        )}
      </div>

      <div className="question-display">
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
};

export default GameBoard;
