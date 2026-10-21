import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App keyboard gameplay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts digits and backspace from the keyboard during a round', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByRole('group', { name: /current answer 1/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(screen.getByRole('group', { name: /current answer not entered/i })).toBeInTheDocument();
  });

  it('preserves native Enter activation for focused game controls', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    fireEvent.keyDown(window, { key: '1' });
    const digitButton = screen.getByRole('button', { name: 'Enter 2' });

    fireEvent.keyDown(digitButton, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('group', { name: /current answer 1/i })).toBeInTheDocument();
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument();
    expect(screen.queryByText('Incorrect answer')).not.toBeInTheDocument();

    // Browsers dispatch the button's click after an unhandled Enter keydown.
    fireEvent.click(digitButton);
    expect(screen.getByRole('group', { name: /current answer 12/i })).toBeInTheDocument();
  });
});
