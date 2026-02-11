import React from 'react';
import type { MathQuestion } from '../utils/mathLogic';
import { formatOperation } from '../utils/mathLogic';

interface GameBoardProps {
  question: MathQuestion;
  currentInput: string;
  score: number;
  timeLeft: number;
  maxTime: number;
  streak: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ question, currentInput, score, timeLeft, maxTime, streak }) => {
  
  return (
    <div className="game-board animate-pop">
      {timeLeft < 1000 && (
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${(timeLeft / maxTime) * 100}%`,
              backgroundColor: timeLeft < (maxTime * 0.4) ? 'var(--color-error)' : 'var(--color-primary)'
            }}
          />
        </div>
      )}
      <div className="stats-header">
        <div className="stat-item">
          <span className="label">Score</span>
          <span className="value">{score}</span>
        </div>
        {timeLeft < 1000 && (
          <div className="stat-item timer">
            <span className="label">Time</span>
            <span className="value">{timeLeft}s</span>
          </div>
        )}
        <div className="stat-item streak">
          <span className="label">Streak</span>
          <span className="value">×{streak}</span>
        </div>
      </div>

      <div className="question-display">
        <span className="operand">{question.operandA}</span>
        <span className="operator">{formatOperation(question.operation)}</span>
        <span className="operand">{question.operandB}</span>
        <span className="equals">=</span>
        <div className="answer-box">
          {currentInput || '?'}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
