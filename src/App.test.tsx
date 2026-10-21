import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { DAILY_CHALLENGES_STORAGE_KEY, getDailyChallenge, getLocalDateKey, getWeekStartKey } from './utils/dailyChallenges';

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

  it('opens an empty progress view from the home screen', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /View your progress/i }));

    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByText(/Your progress story starts here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to home/i })).toBeInTheDocument();
  });

  it('shows the daily challenge and recurring goals with visible progress', () => {
    render(<App />);

    expect(screen.getByText('Daily challenge')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recurring goals' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /progress/i })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/Solve 10 questions correctly/)).toBeInTheDocument();
    expect(screen.getByText(/Solve 50 questions correctly/)).toBeInTheDocument();
  });

  it('does not report points added on a later round after the challenge was completed', () => {
    const date = new Date();
    const dateKey = getLocalDateKey(date);
    const challenge = getDailyChallenge(date);
    localStorage.setItem(DAILY_CHALLENGES_STORAGE_KEY, JSON.stringify({
      dateKey,
      dailyCorrectAnswers: challenge.target,
      weekStartKey: getWeekStartKey(date),
      weeklyCorrectAnswers: challenge.target,
      dailyStreak: challenge.target,
      lastCorrectDateKey: dateKey,
      challenge: {
        dateKey,
        challengeId: challenge.id,
        progress: challenge.target,
        completed: true,
      },
      points: challenge.rewardPoints,
      completionHistory: [{
        dateKey,
        challengeId: challenge.id,
        completedAt: date.getTime(),
        rewardPoints: challenge.rewardPoints,
      }],
    }));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Practice Mode/ }));
    fireEvent.click(screen.getByRole('button', { name: /Finish Practice Round/ }));

    expect(screen.queryByText(/points added/)).not.toBeInTheDocument();
  });
});
