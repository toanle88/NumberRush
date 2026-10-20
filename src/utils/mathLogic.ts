export type Operation = 'addition' | 'subtraction';

export interface MathQuestion {
  id: string;
  operandA: number;
  operandB: number;
  operandC?: number;
  operation: Operation;
  operation2?: Operation;
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
    const op1: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
    const op2: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
    
    const a = Math.floor(Math.random() * settings.maxNum) + 5;
    const b = Math.floor(Math.random() * Math.min(settings.maxNum, a)) + 1;
    
    const current = op1 === 'addition' ? a + b : a - b;

    let c: number;
    let finalOp2 = op2;

    if (finalOp2 === 'subtraction') {
      if (current === 0) {
        finalOp2 = 'addition';
        c = Math.floor(Math.random() * settings.maxNum) + 1;
      } else {
        c = Math.floor(Math.random() * current) + 1;
      }
    } else {
      c = Math.floor(Math.random() * settings.maxNum) + 1;
    }

    const answer = finalOp2 === 'addition' ? current + c : current - c;

    return {
      id: Math.random().toString(36).substring(2, 9),
      operandA: a,
      operandB: b,
      operandC: c,
      operation: op1,
      operation2: finalOp2,
      answer,
    };
  }

  const operation: Operation = Math.random() > 0.5 ? 'addition' : 'subtraction';
  let a = Math.floor(Math.random() * settings.maxNum) + 1;
  let b = Math.floor(Math.random() * settings.maxNum) + 1;

  if (operation === 'subtraction') {
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

export const getQuestionExplanation = (question: MathQuestion): string => {
  const firstStep = `${question.operandA} ${formatOperation(question.operation)} ${question.operandB}`;

  if (question.operandC === undefined || question.operation2 === undefined) {
    return `${firstStep} = ${question.answer}`;
  }

  const intermediateAnswer = question.operation === 'addition'
    ? question.operandA + question.operandB
    : question.operandA - question.operandB;
  return `${firstStep} = ${intermediateAnswer}; ${intermediateAnswer} ${formatOperation(question.operation2)} ${question.operandC} = ${question.answer}`;
};
