import './App.css'

function App() {
  return (
    <main className="animate-pop">
      <header>
        <h1>NumberRush</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>
          Speed Math for Super Kids! 🚀
        </p>
      </header>
      
      <div className="game-container">
        <div className="mode-selection" style={{ display: 'grid', gap: '1rem' }}>
          <button className="primary">Start Blitz Rush! ⚡</button>
          <button>Practice Mode 🧠</button>
          <button style={{ color: 'var(--color-accent)' }}>High Scores 🏆</button>
        </div>
      </div>

      <footer style={{ marginTop: '3rem', fontSize: '0.875rem', opacity: 0.6 }}>
        <p>Made with ❤️ for simple learning</p>
      </footer>
    </main>
  )
}

export default App
