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
        <button type="button" key={num} onClick={() => onInput(num.toString())} className="num-btn" aria-label={`Enter ${num}`}>
          {num}
        </button>
      ))}
      <button type="button" onClick={onClear} className="clear-btn" aria-label="Clear input">C</button>
      <button type="button" onClick={onSubmit} className="submit-btn primary" aria-label="Submit answer">GO!</button>
    </div>
  );
};

export default Numpad;
