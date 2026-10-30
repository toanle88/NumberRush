export const calculateAnswerScore = (score: number, streak: number, isCorrect: boolean): number => (
  isCorrect ? score + (10 * (Math.floor(streak / 5) + 1)) : score
)

export const calculateNextStreak = (streak: number, isCorrect: boolean): number => (
  isCorrect ? streak + 1 : 0
)
