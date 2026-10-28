export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division'
export type DifficultyTier = 'easy' | 'medium' | 'hard'
export const SUPPORTED_OPERATIONS: readonly Operation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
export const DEFAULT_OPERATIONS: readonly Operation[] = ['addition', 'subtraction']
export interface MathQuestion {
  id: string
operandA: number
operandB: number
operandC?: number
operation: Operation
operation2?: Operation
answer: number}

export interface DifficultySettings {
  maxNum: number
multiplicationMax: number
divisionMax: number
timerSeconds: number
allowNegative: boolean}

export const DIFFICULTY_SETTINGS: Record<DifficultyTier, DifficultySettings> = {
  easy: { maxNum: 10, multiplicationMax: 5, divisionMax: 5, timerSeconds: 15, allowNegative: false },
  medium: { maxNum: 20, multiplicationMax: 10, divisionMax: 10, timerSeconds: 10, allowNegative: false },
  hard: { maxNum: 50, multiplicationMax: 12, divisionMax: 12, timerSeconds: 7, allowNegative: false },
}
const getTierForLevel = (level: number): DifficultyTier => {
  if (level >= 3) return 'hard'
if (level === 2) return 'medium'
return 'easy'
}
export const getDifficultyForLevel = (level: number): DifficultyTier => getTierForLevel(level)
const DIFFICULTY_ORDER: readonly DifficultyTier[] = ['easy', 'medium', 'hard']
export const getDifficultyAtLeast = (difficulty: DifficultyTier, minimumDifficulty: DifficultyTier): DifficultyTier => {
  return DIFFICULTY_ORDER.indexOf(difficulty) >= DIFFICULTY_ORDER.indexOf(minimumDifficulty)
    ? difficulty
    : minimumDifficulty
}
export const getDifficultySettings = (difficulty: DifficultyTier): DifficultySettings => {
  return DIFFICULTY_SETTINGS[difficulty]
}
const choose = <T, >(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)]
const randomInteger = (max: number, min = 1): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
export const normalizeOperations = (operations: readonly Operation[]): Operation[] => {
  const validOperations = operations.filter(operation => SUPPORTED_OPERATIONS.includes(operation))
return validOperations.length > 0 ? [...new Set(validOperations)] : [...DEFAULT_OPERATIONS]
}
const getOperandLimit = (operation: Operation, settings: DifficultySettings): number => {
  return operation === 'multiplication' || operation === 'division'
    ? operation === 'multiplication' ? settings.multiplicationMax : settings.divisionMax
    : settings.maxNum
}
const applyOperation = (left: number, operation: Operation, right: number): number | null => {
  if (operation === 'addition') return left + right
if (operation === 'subtraction') return left - right
if (operation === 'multiplication') return left * right
if (right === 0 || left % right !== 0) return null
return left / right
}
const isValidAnswer = (answer: number | null, settings: DifficultySettings): answer is number => {
  return answer !== null
    && Number.isInteger(answer)
    && (settings.allowNegative || answer >= 0)
}
const createFirstOperands = (operation: Operation, settings: DifficultySettings): [number, number] => {
  if (operation === 'division') {
    const divisor = randomInteger(Math.min(settings.divisionMax, settings.maxNum))
const quotient = randomInteger(Math.floor(settings.maxNum / divisor))
return [divisor * quotient, divisor]
}

  const limit = getOperandLimit(operation, settings)
if (operation === 'subtraction') {
    const largerOperand = randomInteger(limit, 2)
return [largerOperand, randomInteger(largerOperand - 1)]
}

  const a = randomInteger(limit)
const b = randomInteger(limit)
return [a, b]
}
const createSecondOperand = (operation: Operation, current: number, settings: DifficultySettings): number | null => {
  if (operation === 'subtraction') {
    if (current < 1) return null
return randomInteger(Math.min(settings.maxNum, current))
}
  if (operation === 'division') {
    const divisors = Array.from({ length: Math.min(settings.divisionMax, current) }, (_, index) => index + 1)
      .filter(divisor => current % divisor === 0)
return divisors.length > 0 ? choose(divisors) : null
}
  return randomInteger(getOperandLimit(operation, settings))
}
const createQuestionId = (): string => Math.random().toString(36).substring(2, 9)
export const generateQuestion = (
  levelOrDifficulty: number | DifficultyTier = 1,
  isAdvanced = false,
  requestedOperations: readonly Operation[] = DEFAULT_OPERATIONS,
): MathQuestion => {
  const difficulty = typeof levelOrDifficulty === 'number'
    ? getTierForLevel(levelOrDifficulty)
    : levelOrDifficulty
const settings = getDifficultySettings(difficulty)
const operations = normalizeOperations(requestedOperations)
const operation = choose(operations)
const [operandA, operandB] = createFirstOperands(operation, settings)
  if (!isAdvanced) {
    const answer = applyOperation(operandA, operation, operandB)
if (!isValidAnswer(answer, settings)) {
      return generateQuestion(levelOrDifficulty, false, [operation])
}
    return { id: createQuestionId(), operandA, operandB, operation, answer }
}

  const firstAnswer = applyOperation(operandA, operation, operandB)
if (!isValidAnswer(firstAnswer, settings)) {
    return generateQuestion(levelOrDifficulty, true, operations)
}

  const availableSecondOperations = operations.filter(candidate => (
    candidate === 'subtraction' || candidate === 'division'
      ? firstAnswer > 0
      : true
  ))
  if (availableSecondOperations.length === 0) {
    return generateQuestion(levelOrDifficulty, true, operations)
}

  const operation2 = choose(availableSecondOperations)
const operandC = createSecondOperand(operation2, firstAnswer, settings)
if (operandC === null) {
    return generateQuestion(levelOrDifficulty, true, operations)
}
  const answer = applyOperation(firstAnswer, operation2, operandC)
if (!isValidAnswer(answer, settings)) {
    return generateQuestion(levelOrDifficulty, true, operations)
}

  return {
    id: createQuestionId(),
    operandA,
    operandB,
    operandC,
    operation,
    operation2,
    answer,
  }
}
export const formatOperation = (op: Operation): string => {
  if (op === 'addition') return '+'
if (op === 'subtraction') return '−'
if (op === 'multiplication') return '×'
return '÷'
}
export const getQuestionExplanation = (question: MathQuestion): string => {
  const firstStep = `${question.operandA} ${formatOperation(question.operation)} ${question.operandB}`
const firstAnswer = applyOperation(question.operandA, question.operation, question.operandB)
  if (question.operandC === undefined || question.operation2 === undefined || firstAnswer === null) {
    return `${firstStep} = ${question.answer}`
}

  return `${firstStep} = ${firstAnswer}; ${firstAnswer} ${formatOperation(question.operation2)} ${question.operandC} = ${question.answer}`
}
export const getAdaptiveDifficulty = (
  currentDifficulty: DifficultyTier,
  recentAnswers: readonly { isCorrect: boolean; responseTimeMs: number }[],
): DifficultyTier => {
  if (recentAnswers.length < 3) return currentDifficulty
  const recent = recentAnswers.slice(-5)
const accuracy = recent.filter(answer => answer.isCorrect).length / recent.length
const averageResponseTime = recent.reduce((total, answer) => total + answer.responseTimeMs, 0) / recent.length
const currentTimerMs = getDifficultySettings(currentDifficulty).timerSeconds * 1000
const tiers: DifficultyTier[] = ['easy', 'medium', 'hard']
const tierIndex = tiers.indexOf(currentDifficulty)
  if (accuracy >= 0.8 && averageResponseTime <= currentTimerMs * 0.6 && tierIndex < tiers.length - 1) {
    return tiers[tierIndex + 1]
}
  if (accuracy <= 0.4 && tierIndex > 0) return tiers[tierIndex - 1]
return currentDifficulty
}
