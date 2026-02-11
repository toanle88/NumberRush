import { useState } from 'react';
import { useGame } from './hooks/useGame';
import GameBoard from './components/GameBoard';
import Numpad from './components/Numpad';
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
    submitAnswer 
  } = useGame(60);

  const [input, setInput] = useState('');

  const handleInput = (val: string) => {
    if (input.length < 3) {
      setInput(prev => prev + val);
    }
  };

  const handleClear = () => setInput('');

  const handleSubmit = () => {
    if (input === '') return;
    submitAnswer(parseInt(input, 10));
    setInput('');
  };

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
          <div className="mode-selection">
            <button className="primary" onClick={startGame}>Start Blitz Rush! ⚡</button>
            <button disabled style={{ opacity: 0.5 }}>Practice Mode (Soon) 🧠</button>
          </div>
        )}

        {status === 'playing' && currentQuestion && (
          <>
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
          </>
        )}

        {status === 'finished' && (
          <div className="results-screen animate-pop">
            <h2 style={{ fontSize: '2.5rem', color: 'var(--color-secondary)' }}>Time's Up! 🏁</h2>
            <div className="final-stats" style={{ margin: '2rem 0', display: 'grid', gap: '1rem' }}>
              <p style={{ fontSize: '1.5rem' }}>Final Score: <strong style={{ color: 'var(--color-primary)' }}>{score}</strong></p>
              <p>Correct Answers: <strong>{correctCount}</strong></p>
              <p>Best Streak: <strong>{streak}</strong></p>
            </div>
            <button className="primary" onClick={startGame}>Play Again! 🔄</button>
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
