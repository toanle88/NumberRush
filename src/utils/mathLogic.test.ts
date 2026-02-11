import { describe, it, expect } from 'vitest';
import { generateQuestion, formatOperation } from './mathLogic';

describe('mathLogic', () => {
  describe('generateQuestion', () => {
    it('generates a valid standard question (2 operands)', () => {
      const question = generateQuestion(1, false);
      expect(question.operandA).toBeDefined();
      expect(question.operandB).toBeDefined();
      expect(question.operandC).toBeUndefined();
      expect(question.answer).toBeGreaterThanOrEqual(0);
      
      // Verification of answer
      const calc = question.operation === 'addition' 
        ? question.operandA + question.operandB 
        : question.operandA - question.operandB;
      expect(question.answer).toBe(calc);
    });

    it('generates a valid chaos question (3 operands)', () => {
      const question = generateQuestion(1, true);
      expect(question.operandA).toBeDefined();
      expect(question.operandB).toBeDefined();
      expect(question.operandC).toBeDefined();
      expect(question.operation2).toBeDefined();
      expect(question.answer).toBeGreaterThanOrEqual(0);

      // Verification of intermediate and final answer
      const firstPart = question.operation === 'addition'
        ? question.operandA + question.operandB
        : question.operandA - question.operandB;
      
      expect(firstPart).toBeGreaterThanOrEqual(0);

      const secondPart = question.operation2 === 'addition'
        ? firstPart + question.operandC!
        : firstPart - question.operandC!;
      
      expect(question.answer).toBe(secondPart);
      expect(question.answer).toBeGreaterThanOrEqual(0);
    });

    it('never generates negative answers across 1000 samples', () => {
      for (let i = 0; i < 1000; i++) {
        const standard = generateQuestion(Math.floor(Math.random() * 3) + 1, false);
        expect(standard.answer, `Failed on standard: ${standard.operandA} ${standard.operation} ${standard.operandB}`).toBeGreaterThanOrEqual(0);

        const chaos = generateQuestion(Math.floor(Math.random() * 3) + 1, true);
        expect(chaos.answer, `Failed on chaos: ${chaos.operandA} ${chaos.operation} ${chaos.operandB} ${chaos.operation2} ${chaos.operandC}`).toBeGreaterThanOrEqual(0);
        
        // Check intermediate step in chaos
        const firstPart = chaos.operation === 'addition'
          ? chaos.operandA + chaos.operandB
          : chaos.operandA - chaos.operandB;
        expect(firstPart, `Failed on chaos intermediate: ${chaos.operandA} ${chaos.operation} ${chaos.operandB}`).toBeGreaterThanOrEqual(0);
      }
    });

    it('respects difficulty settings (Level 1 max 10)', () => {
      const question = generateQuestion(1, false);
      expect(question.operandA).toBeLessThanOrEqual(10);
      expect(question.operandB).toBeLessThanOrEqual(10);
    });
  });

  describe('formatOperation', () => {
    it('formats addition and subtraction correctly', () => {
      expect(formatOperation('addition')).toBe('+');
      expect(formatOperation('subtraction')).toBe('−');
    });
  });
});
