import { describe, it, expect, vi } from 'vitest'
import {
  generateQuestion,
  formatOperation,
  getAdaptiveDifficulty,
  getDifficultyAtLeast,
  getDifficultyForLevel,
  getDifficultySettings,
  getQuestionExplanation,
  normalizeOperations,
} from './mathLogic'
describe('mathLogic', () => {
  describe('generateQuestion', () => {
    it('generates a valid standard question (2 operands)', () => {
      const question = generateQuestion(1, false)
expect(question.operandA).toBeDefined()
expect(question.operandB).toBeDefined()
expect(question.operandC).toBeUndefined()
expect(question.answer).toBeGreaterThanOrEqual(0)
      // Verification of answer
      const calc = question.operation === 'addition'
        ? question.operandA + question.operandB
        : question.operandA - question.operandB
expect(question.answer).toBe(calc)
})
    it('generates a valid chaos question (3 operands)', () => {
      const question = generateQuestion(1, true)
expect(question.operandA).toBeDefined()
expect(question.operandB).toBeDefined()
expect(question.operandC).toBeDefined()
expect(question.operation2).toBeDefined()
expect(question.answer).toBeGreaterThanOrEqual(0)
      // Verification of intermediate and final answer
      const firstPart = question.operation === 'addition'
        ? question.operandA + question.operandB
        : question.operandA - question.operandB
      expect(firstPart).toBeGreaterThanOrEqual(0)
      const secondPart = question.operation2 === 'addition'
        ? firstPart + question.operandC!
        : firstPart - question.operandC!
      expect(question.answer).toBe(secondPart)
expect(question.answer).toBeGreaterThanOrEqual(0)
})
    it('never generates negative answers across 1000 samples', () => {
      for (let i = 0; i < 1000; i++) {
        const standard = generateQuestion(Math.floor(Math.random() * 3) + 1, false)
expect(standard.answer, `Failed on standard: ${standard.operandA} ${standard.operation} ${standard.operandB}`).toBeGreaterThanOrEqual(0)
        const chaos = generateQuestion(Math.floor(Math.random() * 3) + 1, true)
expect(chaos.answer, `Failed on chaos: ${chaos.operandA} ${chaos.operation} ${chaos.operandB} ${chaos.operation2} ${chaos.operandC}`).toBeGreaterThanOrEqual(0)
        // Check intermediate step in chaos
        const firstPart = chaos.operation === 'addition'
          ? chaos.operandA + chaos.operandB
          : chaos.operandA - chaos.operandB
expect(firstPart, `Failed on chaos intermediate: ${chaos.operandA} ${chaos.operation} ${chaos.operandB}`).toBeGreaterThanOrEqual(0)
}
    })
    it('respects difficulty settings (Level 1 max 10)', () => {
      const question = generateQuestion(1, false)
expect(question.operandA).toBeLessThanOrEqual(10)
expect(question.operandB).toBeLessThanOrEqual(10)
})
    it('generates multiplication and division questions with intentional answers', () => {
      for (const operation of ['multiplication', 'division'] as const) {
        for (let index = 0; index < 100; index += 1) {
          const question = generateQuestion('medium', false, [operation])
const answer = operation === 'multiplication'
            ? question.operandA * question.operandB
            : question.operandA / question.operandB
expect(question.operation).toBe(operation)
expect(Number.isInteger(answer)).toBe(true)
expect(question.answer).toBe(answer)
}
      }
    })
    it('normalizes empty or duplicate operator selections to supported defaults', () => {
      expect(normalizeOperations([])).toEqual(['addition', 'subtraction'])
expect(normalizeOperations(['division', 'division', 'multiplication'])).toEqual(['division', 'multiplication'])
})
    it('supports every operator in three-number chaos mode', () => {
      for (let index = 0; index < 100; index += 1) {
        const question = generateQuestion('hard', true, ['addition', 'subtraction', 'multiplication', 'division'])
const firstAnswer = question.operation === 'multiplication'
          ? question.operandA * question.operandB
          : question.operation === 'division'
            ? question.operandA / question.operandB
            : question.operation === 'addition'
              ? question.operandA + question.operandB
              : question.operandA - question.operandB
const answer = question.operation2 === 'multiplication'
          ? firstAnswer * question.operandC!
          : question.operation2 === 'division'
            ? firstAnswer / question.operandC!
            : question.operation2 === 'addition'
              ? firstAnswer + question.operandC!
              : firstAnswer - question.operandC!
expect(Number.isInteger(firstAnswer)).toBe(true)
expect(Number.isInteger(answer)).toBe(true)
expect(question.answer).toBe(answer)
}
    })
    it('keeps the second operation within a subtraction-only selection', () => {
      for (let index = 0; index < 100; index += 1) {
        const question = generateQuestion('easy', true, ['subtraction'])
expect(question.operation).toBe('subtraction')
expect(question.operation2).toBe('subtraction')
expect(question.answer).toBe(question.operandA - question.operandB - question.operandC!)
}
    })
    it('keeps subtraction-only chaos finite at the lowest random boundary', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
      try {
        const question = generateQuestion('easy', true, ['subtraction'])
expect(question.operandA).toBeGreaterThan(question.operandB)
expect(question.answer).toBe(question.operandA - question.operandB - question.operandC!)
} finally {
        randomSpy.mockRestore()
}
    })
    it('keeps hard three-number multiplication answers within four input digits', () => {
      for (let index = 0; index < 100; index += 1) {
        const question = generateQuestion('hard', true, ['multiplication'])
expect(question.answer).toBe(question.operandA * question.operandB * question.operandC!)
expect(question.answer).toBeLessThanOrEqual(9999)
}
    })
})
  describe('formatOperation', () => {
    it('formats addition and subtraction correctly', () => {
      expect(formatOperation('addition')).toBe('+')
expect(formatOperation('subtraction')).toBe('−')
expect(formatOperation('multiplication')).toBe('×')
expect(formatOperation('division')).toBe('÷')
})
})
  describe('getQuestionExplanation', () => {
    it('explains a standard question as a worked calculation', () => {
      expect(getQuestionExplanation({
        id: 'standard',
        operandA: 9,
        operandB: 4,
        operation: 'subtraction',
        answer: 5,
      })).toBe('9 − 4 = 5')
})
    it('includes the intermediate result for a chaos question', () => {
      expect(getQuestionExplanation({
        id: 'chaos',
        operandA: 8,
        operandB: 3,
        operandC: 2,
        operation: 'subtraction',
        operation2: 'addition',
        answer: 7,
      })).toBe('8 − 3 = 5; 5 + 2 = 7')
})
    it('explains multiplication and division steps', () => {
      expect(getQuestionExplanation({
        id: 'division',
        operandA: 24,
        operandB: 6,
        operandC: 3,
        operation: 'division',
        operation2: 'multiplication',
        answer: 12,
      })).toBe('24 ÷ 6 = 4; 4 × 3 = 12')
})
})
  describe('difficulty', () => {
    it('maps planets to their minimum difficulty tiers', () => {
      expect(getDifficultyForLevel(1)).toBe('easy')
expect(getDifficultyForLevel(2)).toBe('medium')
expect(getDifficultyForLevel(3)).toBe('hard')
expect(getDifficultyAtLeast('easy', 'medium')).toBe('medium')
expect(getDifficultyAtLeast('hard', 'medium')).toBe('hard')
})
    it('exposes distinct operand ranges and timers', () => {
      expect(getDifficultySettings('easy').maxNum).toBeLessThan(getDifficultySettings('medium').maxNum)
expect(getDifficultySettings('medium').maxNum).toBeLessThan(getDifficultySettings('hard').maxNum)
expect(getDifficultySettings('easy').timerSeconds).toBeGreaterThan(getDifficultySettings('hard').timerSeconds)
})
    it('adapts after a strong or weak recent run', () => {
      const fastCorrect = Array.from({ length: 3 }, () => ({ isCorrect: true, responseTimeMs: 100 }))
const mostlyWrong = [
        { isCorrect: false, responseTimeMs: 100 },
        { isCorrect: false, responseTimeMs: 100 },
        { isCorrect: true, responseTimeMs: 100 },
      ]
expect(getAdaptiveDifficulty('easy', fastCorrect)).toBe('medium')
expect(getAdaptiveDifficulty('hard', fastCorrect)).toBe('hard')
expect(getAdaptiveDifficulty('hard', mostlyWrong)).toBe('medium')
})
})
})
