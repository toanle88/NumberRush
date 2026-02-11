export type Operation = 'addition' | 'subtraction';

export interface MathQuestion {
  id: string;
  operandA: number;
  operandB: number;
  operandC?: number; // Optional 3rd operand
  operation: Operation;
  operation2?: Operation; // Optional 2nd operation
  answer: number;
}

export interface DifficultySettings {
  maxNum: number;
  allowNegative: boolean;
}

const DIFFICULTY_MAP: Record<number, DifficultySettings> = {
  1: { maxNum: 10, allowNegative: false },
  2: { maxNum: 20, allowNegative: false },
  3: { maxNum: 50, allowNegative: false },
};

export const generateQuestion = (level: number = 1, isAdvanced: boolean = false): MathQuestion => {
  const settings = DIFFICULTY_MAP[level] || DIFFICULTY_MAP[1];
  
  if (isAdvanced) {
    // 3 Numbers mode: A ± B ± C
    const op1: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
    const op2: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
    
    let a = Math.floor(Math.random() * settings.maxNum) + 5;
    let b = Math.floor(Math.random() * settings.maxNum) + 1;
    let c = Math.floor(Math.random() * settings.maxNum) + 1;

    let current = op1 === 'addition' ? a + b : a - b;
    
    // Safety check for kids: avoid negative intermediate results
    if (current < 0) {
      current = a + b; // Force addition if negative
    }

    let answer = op2 === 'addition' ? current + c : current - c;

    // Safety check for final answer
    if (answer < 0) {
      answer = current + c;
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      operandA: a,
      operandB: b,
      operandC: c,
      operation: op1,
      operation2: op2,
      answer,
    };
  }

  // Standard mode
  const operation: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
  let a = Math.floor(Math.random() * settings.maxNum) + 1;
  let b = Math.floor(Math.random() * settings.maxNum) + 1;

  if (operation === 'subtraction' && !settings.allowNegative) {
    if (a < b) [a, b] = [b, a];
  }

  const answer = operation === 'addition' ? a + b : a - b;

  return {
    id: Math.random().toString(36).substring(2, 9),
    operandA: a,
    operandB: b,
    operation,
    answer,
  };
};

export const formatOperation = (op: Operation): string => {
  return op === 'addition' ? '+' : '−';
};
