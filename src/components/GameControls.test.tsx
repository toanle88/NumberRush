import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameBoard from './GameBoard'
import Numpad from './Numpad'
describe('game accessibility controls', () => {
  it('exposes timer progress and a non-color urgency label', () => {
    render(
      <GameBoard
        question={{ id: 'question', operandA: 8, operandB: 3, operation: 'subtraction', answer: 5 }}
        currentInput=""
        score={10}
        timeLeft={2}
        maxTime={10}
        streak={1}
        showTimer
        level={1}
      />,
    )
    expect(screen.getByRole('progressbar', { name: 'Time remaining' })).toHaveAttribute('aria-valuenow', '2')
expect(screen.getByText('2s — hurry')).toBeInTheDocument()
expect(screen.getByRole('group', { name: /8 minus 3 equals current answer not entered/i })).toBeInTheDocument()
})
  it('gives descriptive names to clear and submit actions', () => {
    const onClear = vi.fn()
const onSubmit = vi.fn()
render(<Numpad onInput={vi.fn()} onClear={onClear} onSubmit={onSubmit} />)
    expect(screen.getByRole('button', { name: 'Clear answer' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Submit answer' })).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: 'Clear answer' }))
fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }))
expect(onClear).toHaveBeenCalledOnce()
expect(onSubmit).toHaveBeenCalledOnce()
})
})
