import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsModal from './SettingsModal';
import type { AccessibilityPreferences } from '../utils/accessibility';

const preferences: AccessibilityPreferences = {
  theme: 'dark',
  highContrast: false,
  reducedMotion: false,
  sound: true,
  haptics: true,
};

const renderModal = (onClose = vi.fn()) => render(
  <SettingsModal
    playerName="Super Kid"
    initialTime={10}
    preferences={preferences}
    onClose={onClose}
    onUpdateName={vi.fn()}
    onUpdateTimer={vi.fn()}
    onUpdatePreferences={vi.fn()}
    onResetStats={vi.fn()}
  />
);

describe('SettingsModal', () => {
  it('has dialog semantics and associated labels', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme')).toHaveValue('dark');
    expect(screen.getByLabelText('High contrast')).toBeInTheDocument();
    expect(screen.getByLabelText('Reduce motion and animation')).toBeInTheDocument();
    expect(screen.getByLabelText('Sound effects')).toBeInTheDocument();
    expect(screen.getByLabelText('Haptic feedback when supported')).toBeInTheDocument();
  });

  it('focuses the first field, closes on Escape, and restores focus', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const { unmount } = renderModal(onClose);

    expect(document.activeElement).toBe(screen.getByLabelText('Your name'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('wraps focus when tabbing from the last control', () => {
    renderModal();
    const closeButton = screen.getByRole('button', { name: 'Close settings' });
    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'));
  });
});
