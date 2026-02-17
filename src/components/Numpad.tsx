interface NumpadProps {
  onInput: (val: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const Numpad = ({ onInput, onClear, onSubmit }: NumpadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] mx-auto pt-4">
      {keys.map((key) => {
        const isSubmit = key === '✓';
        const isClear = key === 'C';

        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (isClear) onClear();
              else if (isSubmit) onSubmit();
              else onInput(key);
            }}
            className={`h-16 flex items-center justify-center text-2xl font-black rounded-2xl transition-all active:scale-95 ${isSubmit
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
              : isClear
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

export default Numpad;
