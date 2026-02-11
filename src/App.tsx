import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import GameBoard from './components/GameBoard';
import Numpad from './components/Numpad';
import { playCorrectSound, playIncorrectSound, playFinishSound, playTickSound } from './utils/soundEffects';
import './App.css';

function App() {
  const { 
    status, 
    score, 
    timeLeft, 
    streak, 
    currentQuestion, 
    history,
    startGame, 
    submitAnswer,
    resetGame
  } = useGame(60);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const handleStart = (lvl: number) => {
    startGame(lvl);
  };

  const handleInput = (val: string) => {
    if (input.length < 3) {
      setInput(prev => prev + val);
    }
  };

  const handleClear = () => setInput('');

  const handleSubmit = () => {
    if (input === '') return;
    const isCorrect = submitAnswer(parseInt(input, 10));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) playCorrectSound();
    else playIncorrectSound();
    setInput('');
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit the game?')) {
      resetGame();
      setInput('');
    }
  };

  // Clear feedback after 0.8 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle sounds for timer and finish
  useEffect(() => {
    if (status === 'playing') {
      if (timeLeft <= 5 && timeLeft > 0) {
        playTickSound();
      } else if (timeLeft === 0) {
        playFinishSound();
      }
    }
  }, [timeLeft, status]);

  const correctCount = history.filter(h => h.isCorrect).length;

  return (
    <main className="animate-pop">
      <header>
        <h1>NumberRush</h1>
        {status === 'idle' && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>
            Speed Math for Super Kids! 🚀
          </p>
        )}
      </header>
      
      <div className="game-container">
        {status === 'idle' && (
          <div className="dashboard animate-pop">
            <div className="level-selector" style={{ marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Choose Your Level:</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
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
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {selectedLevel === 1 && "Numbers up to 10"}
                {selectedLevel === 2 && "Numbers up to 20"}
                {selectedLevel === 3 && "Numbers up to 50"}
              </p>
            </div>
            <div className="mode-selection">
              <button className="primary" onClick={() => handleStart(selectedLevel)}>Start Blitz Rush! ⚡</button>
              <button disabled style={{ opacity: 0.5 }}>Practice Mode (Soon) 🧠</button>
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
              timeLeft={timeLeft}
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
              <button className="primary" onClick={() => handleStart(selectedLevel)}>Play Again! 🔄</button>
              <button onClick={resetGame}>Change Level 🛠️</button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ marginTop: '3rem', fontSize: '0.875rem', opacity: 0.6 }}>
        <p>Made with ❤️ for simple learning</p>
      </footer>
    </main>
  )
}

export default App
