interface NumpadProps {
  onInput: (val: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const Numpad = ({ onInput, onClear, onSubmit }: NumpadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  return (
    <div className="numpad">
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
            className={`num-btn ${isClear ? 'clear-btn' : ''} ${isSubmit ? 'submit-btn primary' : ''}`}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

export default Numpad;
