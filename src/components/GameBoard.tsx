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
    <div className="w-full bg-slate-900/60 rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {showTimer && (
        <div className="absolute top-0 left-0 h-1.5 bg-indigo-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }} />
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-black mb-1">Score</span>
          <span className="text-2xl font-black text-indigo-400 font-mono">{score}</span>
        </div>

        {streak > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full animate-pulse-subtle">
            <span className="text-sm font-black text-amber-500 uppercase tracking-tighter">🔥 {streak} Streak</span>
          </div>
        )}

        {showTimer && (
          <div className="text-right">
            <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-black mb-1">Time</span>
            <span className={`text-2xl font-black font-mono ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[160px] space-y-8">
        <div className="flex items-center justify-center gap-6 text-5xl md:text-7xl font-black text-white">
          <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{question.operandA}</span>
          <span className="text-indigo-400 drop-shadow-none">{question.operation === 'addition' ? '+' : '−'}</span>
          <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{question.operandB}</span>
          {question.operandC !== undefined && (
            <>
              <span className="text-indigo-400">{question.operation2 === 'addition' ? '+' : '−'}</span>
              <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{question.operandC}</span>
            </>
          )}
          <span className="text-slate-600">=</span>
        </div>

        <div className={`w-32 h-20 flex items-center justify-center text-5xl font-black rounded-2xl border-4 transition-all ${currentInput ? 'bg-white/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/20 border-white/5 text-transparent'}`}>
          {currentInput || '?'}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
