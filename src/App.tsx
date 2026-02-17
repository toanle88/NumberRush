import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGame, BADGES } from './hooks/useGame';
import type { GameMode } from './hooks/useGame';
import GameBoard from './components/GameBoard';
import Numpad from './components/Numpad';
import BadgeItem from './components/BadgeItem';
import SettingsModal from './components/SettingsModal';
import { playCorrectSound, playIncorrectSound, playFinishSound, playTickSound, playCelebrationSound } from './utils/soundEffects';
import confetti from 'canvas-confetti';
import './App.css';

function App() {
  const [initialTime, setInitialTime] = useState(() =>
    parseInt(localStorage.getItem('numberrush_timer') || '10', 10)
  );
  const [playerName, setPlayerName] = useState(() =>
    localStorage.getItem('numberrush_name') || 'Super Kid'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [lastUnlockedBadge, setLastUnlockedBadge] = useState<string | null>(null);
  const previousBadgeCountRef = useRef(0);
  const hasInitializedBadgesRef = useRef(false);

  const {
    status, score, timeLeft, streak, mode, currentQuestion, history,
    highScore, bestStreak, unlockedBadges, currentLevel,
    startGame, submitAnswer, resetGame, resetStats
  } = useGame(initialTime);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [shakeClass, setShakeClass] = useState('');

  useEffect(() => {
    const level = status === 'playing' ? currentLevel : selectedLevel;
    document.body.className = `planet-${level}`;
  }, [selectedLevel, status, currentLevel]);

  useEffect(() => {
    if (!hasInitializedBadgesRef.current) {
      previousBadgeCountRef.current = unlockedBadges.length;
      hasInitializedBadgesRef.current = true;
      return;
    }

    if (unlockedBadges.length > previousBadgeCountRef.current) {
      const latest = unlockedBadges[unlockedBadges.length - 1];
      const showTimer = setTimeout(() => setLastUnlockedBadge(latest), 0);
      const clearTimer = setTimeout(() => setLastUnlockedBadge(null), 4000);
      previousBadgeCountRef.current = unlockedBadges.length;
      return () => {
        clearTimeout(showTimer);
        clearTimeout(clearTimer);
      };
    }

    previousBadgeCountRef.current = unlockedBadges.length;
  }, [unlockedBadges]);

  const handleStart = (m: GameMode) => {
    startGame(selectedLevel, m, isAdvanced);
  };

  const handleInput = useCallback((val: string) => {
    setInput(prev => (prev.length < 3 ? prev + val : prev));
  }, []);

  const handleClear = useCallback(() => setInput(''), []);

  const handleSubmit = useCallback(() => {
    if (input === '') return;
    const isCorrect = submitAnswer(parseInt(input, 10));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) playCorrectSound();
    else playIncorrectSound();
    setInput('');
  }, [input, submitAnswer]);

  const handleExit = useCallback(() => {
    resetGame();
    setInput('');
  }, [resetGame]);

  const updateName = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('numberrush_name', val);
  };

  const updateTimer = (val: number) => {
    setInitialTime(val);
    localStorage.setItem('numberrush_timer', val.toString());
  };

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || settingsOpen) return;
      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Backspace') handleClear();
      else if (e.key === 'Escape') handleExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleInput, handleSubmit, handleClear, handleExit, settingsOpen]);

  useEffect(() => {
    if (status === 'playing' && mode === 'blitz') {
      if (timeLeft <= 3 && timeLeft > 0) playTickSound();
      else if (timeLeft === 0) playFinishSound();
    }
  }, [timeLeft, status, mode]);

  useEffect(() => {
    if (streak > 0 && streak % 10 === 0) {
      playCelebrationSound();

      let shake = 'animate-[shake-small_0.6s_ease-in-out]';

      if (streak >= 30) {
        shake = 'animate-[shake-hard_0.6s_ease-in-out]';
        const duration = 1500;
        const animationEnd = Date.now() + duration;
        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
          const tLeft = animationEnd - Date.now();
          if (tLeft <= 0) return clearInterval(interval);
          const pCount = 40;
          confetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ particleCount: pCount, startVelocity: 30, spread: 360, ticks: 60, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      } else if (streak >= 20) {
        shake = 'animate-[shake-medium_0.6s_ease-in-out]';
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      } else {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
      }

      setShakeClass(shake);
      const timer = setTimeout(() => setShakeClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const correctCount = useMemo(() => history.filter(h => h.isCorrect).length, [history]);

  return (
    <main className={`animate-pop-in ${shakeClass} w-full max-w-xl mx-auto px-6 text-center`}>
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">NumberRush</h1>
          <button
            type="button"
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            ⚙️
          </button>
        </div>
        {status === 'idle' && (
          <p className="text-slate-400 text-lg md:text-xl">
            Hey {playerName}! Speed Math for Super Kids! 🚀
          </p>
        )}
      </header>

      <div className="relative">
        {status === 'idle' && (
          <div className="space-y-8 animate-pop-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">High Score</span>
                <strong className="text-3xl text-indigo-400">{highScore}</strong>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Best Streak</span>
                <strong className="text-3xl text-amber-500">{bestStreak}</strong>
              </div>
            </div>

            <div className="space-y-4">
              <p className="font-bold text-white uppercase tracking-widest text-sm">Choose Your Planet:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Moon', 'Mars', 'Space'].map((name, i) => (
                  <button
                    type="button"
                    key={name}
                    className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-bold border transition-all ${selectedLevel === i + 1 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                    onClick={() => setSelectedLevel(i + 1)}
                  >
                    {name} {i === 0 ? '🌙' : i === 1 ? '🔴' : '🌌'}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto">
              <button
                type="button"
                className={`w-full py-4 rounded-2xl border font-bold transition-all ${isAdvanced ? 'bg-pink-600/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                onClick={() => setIsAdvanced(!isAdvanced)}
              >
                {isAdvanced ? '🔥 3-Number Chaos ON' : '💡 3-Number Chaos OFF'}
              </button>
            </div>

            <div className="grid gap-3 w-full max-w-sm mx-auto">
              <button
                type="button"
                className="py-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                onClick={() => handleStart('blitz')}
              >
                Start Blitz Rush! ⚡
              </button>
              <button
                type="button"
                className="py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all font-mono"
                onClick={() => handleStart('practice')}
              >
                Practice Mode 🧠
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-6">
              {BADGES.map(badge => (
                <BadgeItem key={badge.id} badge={badge} isUnlocked={unlockedBadges.includes(badge.id)} />
              ))}
            </div>
          </div>
        )}

        {status === 'playing' && currentQuestion && (
          <div className={`space-y-6 ${feedback ? `feedback-${feedback}` : ''}`}>
            <button
              type="button"
              className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 transition-all z-10"
              onClick={handleExit}
              aria-label="Exit game"
            >
              ✕
            </button>

            <div className="relative">
              <GameBoard
                question={currentQuestion}
                currentInput={input}
                score={score}
                timeLeft={timeLeft}
                maxTime={initialTime}
                streak={streak}
                showTimer={mode === 'blitz'}
              />

              {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className={`flex flex-col items-center gap-2 p-8 rounded-3xl backdrop-blur-xl border ${feedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'} animate-pop-in`}>
                    <span className="text-5xl">{feedback === 'correct' ? '✅' : '❌'}</span>
                    <span className={`text-2xl font-black ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {feedback === 'correct' ? 'Correct!' : 'Oops!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Numpad onInput={handleInput} onClear={handleClear} onSubmit={handleSubmit} />
          </div>
        )}

        {status === 'finished' && (
          <div className="space-y-8 animate-pop-in py-8">
            <h2 className="text-5xl font-black text-amber-500 mb-8">Time's Up! 🏁</h2>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
              <p className="text-xl">Final Score</p>
              <strong className="block text-7xl text-indigo-400 mb-4">{score}</strong>
              <div className="flex justify-center gap-6 text-slate-400 font-bold">
                <span>Correct: <strong className="text-emerald-400">{correctCount}</strong></span>
                <span>Best Streak: <strong className="text-amber-500">{streak}</strong></span>
              </div>
            </div>

            <div className="grid gap-3 w-full max-w-sm mx-auto">
              <button
                type="button"
                className="py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                onClick={() => handleStart(mode)}
              >
                Play Again! 🔄
              </button>
              <button
                type="button"
                className="py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all font-mono"
                onClick={resetGame}
              >
                Change Planet 🛠️
              </button>
            </div>
          </div>
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          playerName={playerName}
          initialTime={initialTime}
          onClose={() => setSettingsOpen(false)}
          onUpdateName={updateName}
          onUpdateTimer={updateTimer}
          onResetStats={resetStats}
        />
      )}

      {lastUnlockedBadge && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-900 border border-indigo-500 shadow-2xl shadow-indigo-500/20 animate-pop-in z-[200]">
          <span className="text-3xl">{BADGES.find(b => b.id === lastUnlockedBadge)?.icon}</span>
          <div className="text-left">
            <strong className="block text-white">Badge Unlocked!</strong>
            <p className="text-sm text-slate-400">{BADGES.find(b => b.id === lastUnlockedBadge)?.name}</p>
          </div>
        </div>
      )}

      <footer className="mt-12 py-8 text-slate-600 text-sm font-medium">
        <p>Made with ❤️ for simple learning</p>
      </footer>
    </main>
  );
}

export default App;
