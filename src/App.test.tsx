import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { DAILY_CHALLENGES_STORAGE_KEY, getDailyChallenge, getLocalDateKey, getWeekStartKey } from './utils/dailyChallenges';

const openRoundCustomizer = () => {
  fireEvent.click(screen.getByText('Customize round'));
};

const openCustomRoundCustomizer = () => {
  openRoundCustomizer();
  fireEvent.click(screen.getByRole('button', { name: /^Custom$/ }));
};

describe('App keyboard gameplay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('renders correct feedback inline without covering the keypad', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    const question = screen.getByRole('group', { name: /current answer not entered/i });
    const questionLabel = question.getAttribute('aria-label')!;
    const [, left, operation, right] = questionLabel.match(/(\d+) (plus|minus) (\d+) equals/)!;
    const answer = operation === 'plus' ? Number(left) + Number(right) : Number(left) - Number(right);

    for (const digit of String(answer)) fireEvent.keyDown(window, { key: digit });
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });

    const feedback = screen.getByText('Correct').closest('[role="status"]');
    const keypad = screen.getByRole('group', { name: 'Answer keypad' });
    expect(feedback).toBeInTheDocument();
    expect(feedback).toHaveClass('feedback-inline', 'feedback-inline-correct');
    expect(feedback).not.toHaveClass('feedback-overlay');
    expect(feedback!.compareDocumentPosition(keypad) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByText('Correct answer:')).not.toBeInTheDocument();
  });

  it('clears in-round feedback after its brief display duration', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    const question = screen.getByRole('group', { name: /current answer not entered/i });
    const [, left, operation, right] = question.getAttribute('aria-label')!.match(/(\d+) (plus|minus) (\d+) equals/)!;
    const answer = operation === 'plus' ? Number(left) + Number(right) : Number(left) - Number(right);

    for (const digit of String(answer)) fireEvent.keyDown(window, { key: digit });
    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText('Correct')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1399));
    expect(screen.getByText('Correct')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
  });

  it('renders incorrect feedback with the correct answer and accepts another submission', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    for (const digit of '9999') fireEvent.keyDown(window, { key: digit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));

    const feedback = screen.getByText(/Correct answer:/).closest('[role="status"]');
    expect(feedback).toHaveClass('feedback-inline', 'feedback-inline-incorrect');
    expect(feedback).toHaveTextContent(/^Correct answer: \d+$/);
    expect(screen.getByRole('group', { name: /current answer not entered/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(screen.getByRole('group', { name: /current answer not entered/i })).toBeInTheDocument();
  });

  it('keeps the final incorrect answer feedback when the timer ends the round', () => {
    localStorage.setItem('numberrush_timer', '1');
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    for (const digit of '9999') fireEvent.keyDown(window, { key: digit });
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }));
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText(/Correct answer:/).closest('.results-feedback')).toBeInTheDocument();
  });

  it('lets players choose division and a named difficulty tier before starting', () => {
    render(<App />);

    openCustomRoundCustomizer();
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

    openCustomRoundCustomizer();
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

    openCustomRoundCustomizer();
    fireEvent.click(screen.getByRole('button', { name: /Deep Space/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuemax', '7');
  });

  it('accepts four-digit answers for hard three-number multiplication', () => {
    render(<App />);

    openCustomRoundCustomizer();
    fireEvent.click(screen.getByRole('checkbox', { name: /Addition/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Subtraction/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Multiplication/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Hard$/ }));
    fireEvent.click(screen.getByText('More options'));
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

  it('shows presets before custom controls and keeps Chaos behind More options', () => {
    render(<App />);

    openRoundCustomizer();

    expect(screen.getByRole('button', { name: /^Quick Start$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Challenge$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Custom$/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Starting planet' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Addition/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Custom$/ }));
    expect(screen.getByRole('heading', { name: 'Starting planet' })).toBeInTheDocument();
    expect(screen.getByText('More options')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /3-Number Chaos/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('More options'));
    expect(screen.getByRole('button', { name: /3-Number Chaos OFF/ })).toBeInTheDocument();
  });

  it('applies the recommended Challenge preset through the existing start contract', () => {
    render(<App />);

    openRoundCustomizer();
    fireEvent.click(screen.getByRole('button', { name: /^Challenge$/ }));

    expect(screen.getByRole('button', { name: /^Challenge$/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Start Blitz Rush/ }));

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuemax', '10');
  });

  it('puts the daily challenge and default start before collapsed round controls', () => {
    render(<App />);

    const dailyChallenge = screen.getByText('Daily challenge');
    const startButton = screen.getByRole('button', { name: /Start Blitz Rush/ });
    const customizeSummary = screen.getByText('Customize round');
    const practiceButton = screen.getByRole('button', { name: /Practice Mode/ });

    expect(dailyChallenge).toBeInTheDocument();
    expect(startButton).toBeInTheDocument();
    expect(dailyChallenge.compareDocumentPosition(startButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(startButton.compareDocumentPosition(customizeSummary) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(customizeSummary.compareDocumentPosition(practiceButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(customizeSummary.tagName).toBe('SUMMARY');
    expect(customizeSummary.closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('progressbar', { name: /progress/i })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByRole('heading', { name: 'Recurring goals' })).not.toBeInTheDocument();
  });

  it('preserves round selections when customization is closed and reopened', () => {
    render(<App />);

    openCustomRoundCustomizer();
    fireEvent.click(screen.getByRole('button', { name: /Mars/ }));
    fireEvent.click(screen.getByText('More options'));
    fireEvent.click(screen.getByRole('button', { name: /3-Number Chaos OFF/ }));
    fireEvent.click(screen.getByText('Customize round'));
    fireEvent.click(screen.getByText('Customize round'));

    expect(screen.getByRole('button', { name: /^Custom$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Mars.*\(selected\)/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /3-Number Chaos ON/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps recurring goals behind the progress view', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /View your progress/i }));

    expect(screen.getByRole('heading', { name: 'Recurring goals' })).toBeInTheDocument();
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
