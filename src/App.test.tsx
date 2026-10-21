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

  it('lets players choose division and a named difficulty tier before starting', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Division/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Addition/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Subtraction/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Hard$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuemax', '7');
    expect(screen.getByRole('group', { name: /divided by/i })).toBeInTheDocument();
  });

  it('uses the selected starting planet difficulty by default', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Mars/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('uses the easy tier timer when no difficulty override is selected', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuemax', '15');
  });

  it('uses the hard timer for a default Deep Space start', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Deep Space/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuemax', '7');
  });

  it('accepts four-digit answers for hard three-number multiplication', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Addition/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Subtraction/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Multiplication/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Hard$/ }));
    fireEvent.click(screen.getByRole('button', { name: /3-Number Chaos OFF/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: '3' });
    fireEvent.keyDown(window, { key: '4' });

    expect(screen.getByRole('group', { name: /current answer 1234/i })).toBeInTheDocument();
  });
});
