import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameBoard from './GameBoard'
import Numpad from './Numpad'
import { createTranslator } from '../utils/i18n'

const chaosQuestions = [
  {
    question: { id: 'addition-multiplication', operandA: 2, operandB: 3, operandC: 4, operation: 'addition' as const, operation2: 'multiplication' as const, answer: 20 },
    visible: '(2 + 3) × 4 = ?',
    spoken: 'open parenthesis 2 plus 3 close parenthesis times 4 equals',
  },
  {
    question: { id: 'subtraction-division', operandA: 8, operandB: 3, operandC: 1, operation: 'subtraction' as const, operation2: 'division' as const, answer: 5 },
    visible: '(8 − 3) ÷ 1 = ?',
    spoken: 'open parenthesis 8 minus 3 close parenthesis divided by 1 equals',
  },
  {
    question: { id: 'multiplication-addition', operandA: 2, operandB: 3, operandC: 4, operation: 'multiplication' as const, operation2: 'addition' as const, answer: 10 },
    visible: '(2 × 3) + 4 = ?',
    spoken: 'open parenthesis 2 times 3 close parenthesis plus 4 equals',
  },
  {
    question: { id: 'division-multiplication', operandA: 24, operandB: 6, operandC: 3, operation: 'division' as const, operation2: 'multiplication' as const, answer: 12 },
    visible: '(24 ÷ 6) × 3 = ?',
    spoken: 'open parenthesis 24 divided by 6 close parenthesis times 3 equals',
  },
] as const

const boardProps = {
  currentInput: '',
  score: 10,
  timeLeft: 10,
  maxTime: 10,
  streak: 1,
  showTimer: false,
  level: 1,
}

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
expect(screen.getByRole('group', { name: /8 minus 3 equals Your current answer is not entered/i })).toBeInTheDocument()
})

  it.each(chaosQuestions)('groups the first operation in the visible Chaos expression: $question.id', ({ question, visible, spoken }) => {
    const { unmount } = render(<GameBoard {...boardProps} question={question} />)
    const group = screen.getByRole('group', { name: new RegExp(spoken) })

    expect(group).toHaveTextContent(visible.replaceAll(' ', ''))
    unmount()
  })

  it('speaks grouped Chaos expressions in Vietnamese', () => {
    const { unmount } = render(
      <GameBoard
        {...boardProps}
        question={chaosQuestions[0].question}
        translate={createTranslator('vi')}
      />,
    )

    expect(screen.getByRole('group', { name: /mở ngoặc 2 cộng 3 đóng ngoặc nhân 4 bằng/i })).toBeInTheDocument()
    unmount()
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
