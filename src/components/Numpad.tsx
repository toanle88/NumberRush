import React from 'react';

interface NumpadProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

const Numpad: React.FC<NumpadProps> = ({ onInput, onClear, onSubmit }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="numpad">
      {numbers.map((num) => (
        <button key={num} onClick={() => onInput(num.toString())} className="num-btn">
          {num}
        </button>
      ))}
      <button onClick={onClear} className="clear-btn">C</button>
      <button onClick={onSubmit} className="submit-btn primary">GO!</button>
    </div>
  );
};

export default Numpad;
