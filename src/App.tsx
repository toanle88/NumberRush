import { useState, useEffect, useCallback } from 'react';
import { useGame } from './hooks/useGame';
import type { GameMode } from './hooks/useGame';
import GameBoard from './components/GameBoard';
import Numpad from './components/Numpad';
import { playCorrectSound, playIncorrectSound, playFinishSound, playTickSound, playCelebrationSound } from './utils/soundEffects';
import confetti from 'canvas-confetti';
import './App.css';

function App() {
  // Load settings from localStorage
  const [initialTime, setInitialTime] = useState(() => 
    parseInt(localStorage.getItem('numberrush_timer') || '10', 10)
  );
  const [playerName, setPlayerName] = useState(() => 
    localStorage.getItem('numberrush_name') || 'Super Kid'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const { 
    status, 
    score, 
    timeLeft, 
    streak, 
    mode,
    currentQuestion, 
    history,
    highScore,
    bestStreak,
    startGame, 
    submitAnswer,
    resetGame,
    resetStats
  } = useGame(initialTime);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const handleStart = (m: GameMode) => {
    startGame(selectedLevel, m, isAdvanced);
  };

  const handleInput = useCallback((val: string) => {
    setInput(prev => {
      if (prev.length < 3) return prev + val;
      return prev;
    });
  }, []);

  const handleClear = useCallback(() => setInput(''), []);

  const handleSubmit = useCallback(() => {
    setInput(prev => {
      if (prev === '') return prev;
      const isCorrect = submitAnswer(parseInt(prev, 10));
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) playCorrectSound();
      else playIncorrectSound();
      return '';
    });
  }, [submitAnswer]);

  const handleExit = useCallback(() => {
    resetGame();
    setInput('');
  }, [resetGame]);

  const handleResetProgress = () => {
    if (confirm('Reset all high scores and streaks?')) {
      resetStats();
    }
  };

  const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    localStorage.setItem('numberrush_name', newName);
  };

  const updateTimer = (val: number) => {
    setInitialTime(val);
    localStorage.setItem('numberrush_timer', val.toString());
  };

  // Clear feedback after 0.8 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || settingsOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleClear();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleInput, handleSubmit, handleClear, handleExit, settingsOpen]);

  // Handle sounds for timer and finish
  useEffect(() => {
    if (status === 'playing' && mode === 'blitz') {
      if (timeLeft <= 3 && timeLeft > 0) {
        playTickSound();
      } else if (timeLeft === 0) {
        playFinishSound();
      }
    }
  }, [timeLeft, status, mode]);

  // Handle milestone celebrations
  useEffect(() => {
    if (streak > 0 && streak % 10 === 0) {
      playCelebrationSound();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    }
  }, [streak]);

  const correctCount = history.filter(h => h.isCorrect).length;

  return (
    <main className="animate-pop">
      <header>
        <div className="header-top">
          <h1>NumberRush</h1>
          <button className="settings-btn" onClick={() => setSettingsOpen(true)}>⚙️</button>
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
              <div className="stat-card">
                <span>Best Score:</span>
                <strong>{highScore}</strong>
              </div>
              <div className="stat-card">
                <span>Best Streak:</span>
                <strong>{bestStreak}</strong>
              </div>
            </div>

            <div className="level-selector" style={{ marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Choose Your Level:</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1, 2, 3].map(lvl => (
                  <button 
                    key={lvl}
                    className={selectedLevel === lvl ? 'primary' : ''}
                    onClick={() => setSelectedLevel(lvl)}
                    style={{ padding: '0.5rem 1.5rem' }}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                {selectedLevel === 1 && "Numbers up to 10"}
                {selectedLevel === 2 && "Numbers up to 20"}
                {selectedLevel === 3 && "Numbers up to 50"}
              </p>
            </div>

            <div className="advanced-toggle" style={{ marginBottom: '2rem' }}>
              <button 
                className={isAdvanced ? 'primary' : ''} 
                onClick={() => setIsAdvanced(!isAdvanced)}
                style={{ width: '100%', maxWidth: '320px' }}
              >
                {isAdvanced ? '🔥 3-Number Chaos ON' : '💡 3-Number Chaos OFF'}
              </button>
            </div>

            <div className="mode-selection" style={{ display: 'grid', gap: '1rem' }}>
              <button className="primary" onClick={() => handleStart('blitz')}>Start Blitz Rush! ⚡</button>
              <button onClick={() => handleStart('practice')}>Practice Mode 🧠</button>
            </div>
          </div>
        )}

        {status === 'playing' && currentQuestion && (
          <div className={`game-area ${feedback ? `feedback-${feedback}` : ''}`}>
             <button className="exit-btn" onClick={handleExit} title="Exit Game">
              ✕
            </button>
            <GameBoard 
              question={currentQuestion}
              currentInput={input}
              score={score}
              timeLeft={mode === 'practice' ? 9999 : timeLeft}
              maxTime={initialTime}
              streak={streak}
            />
            <Numpad 
              onInput={handleInput}
              onClear={handleClear}
              onSubmit={handleSubmit}
            />
            {feedback && (
              <div className="feedback-overlay animate-pop">
                {feedback === 'correct' ? '✅ Correct!' : '❌ Oops!'}
              </div>
            )}
          </div>
        )}

        {status === 'finished' && (
          <div className="results-screen animate-pop">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--color-secondary)' }}>Time's Up! 🏁</h2>
            <div className="final-stats" style={{ margin: '2rem 0', display: 'grid', gap: '1rem' }}>
              <p style={{ fontSize: '1.5rem' }}>Final Score: <strong style={{ color: 'var(--color-primary)' }}>{score}</strong></p>
              <p>Correct Answers: <strong>{correctCount}</strong></p>
              <p>Best Streak: <strong>{streak}</strong></p>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <button className="primary" onClick={() => handleStart(mode)}>Play Again! 🔄</button>
              <button onClick={resetGame}>Change Level 🛠️</button>
            </div>
          </div>
        )}
      </div>

      {settingsOpen && (
        <div className="modal-overlay animate-pop" onClick={() => setSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Settings ⚙️</h3>
            
            <div className="setting-item">
              <label>Your Name:</label>
              <input 
                type="text" 
                value={playerName} 
                onChange={updateName} 
                placeholder="Enter your name" 
              />
            </div>

            <div className="setting-item">
              <label>Question Speed (Seconds):</label>
              <div className="timer-options">
                {[5, 10, 15, 20].map(t => (
                  <button 
                    key={t}
                    className={initialTime === t ? 'primary' : ''}
                    onClick={() => updateTimer(t)}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <button className="danger" onClick={handleResetProgress}>Reset All Progress 🗑️</button>
            </div>

            <button className="close-modal" onClick={() => setSettingsOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '3rem', fontSize: '0.875rem', opacity: 0.6 }}>
        <p>Made with ❤️ for simple learning</p>
      </footer>
    </main>
  )
}

export default App
