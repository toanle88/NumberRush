export type Operation = 'addition' | 'subtraction';

export interface MathQuestion {
  id: string;
  operandA: number;
  operandB: number;
  operation: Operation;
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

export const generateQuestion = (level: number = 1): MathQuestion => {
  const settings = DIFFICULTY_MAP[level] || DIFFICULTY_MAP[1];
  const operation: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
  
  let a = Math.floor(Math.random() * settings.maxNum) + 1;
  let b = Math.floor(Math.random() * settings.maxNum) + 1;

  // For subtraction, ensure result isn't negative for kids
  if (operation === 'subtraction' && !settings.allowNegative) {
    if (a < b) {
      [a, b] = [b, a];
    }
  }

  const answer = operation === 'addition' ? a + b : a - b;

  return {
    id: Math.random().toString(36).substr(2, 9),
    operandA: a,
    operandB: b,
    operation,
    answer,
  };
};

export const formatOperation = (op: Operation): string => {
  return op === 'addition' ? '+' : '−';
};
