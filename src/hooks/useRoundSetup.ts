import { useState } from 'react'
import type { DifficultyTier, Operation } from '../utils/mathLogic'

export type RoundPreset = 'quick' | 'challenge' | 'custom'

const QUICK_START_OPERATIONS: Operation[] = ['addition', 'subtraction']
const CHALLENGE_OPERATIONS: Operation[] = ['addition', 'subtraction', 'multiplication']

export const useRoundSetup = () => {
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [roundPreset, setRoundPreset] = useState<RoundPreset>('quick')
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier | undefined>()
  const [selectedOperations, setSelectedOperations] = useState<Operation[]>(QUICK_START_OPERATIONS)
  const [selectedLevel, setSelectedLevel] = useState(1)

  const selectRoundPreset = (preset: RoundPreset) => {
    setRoundPreset(preset)
    if (preset === 'quick') {
      setSelectedLevel(1)
      setIsAdvanced(false)
      setSelectedOperations(QUICK_START_OPERATIONS)
      setSelectedDifficulty(undefined)
      setMoreOptionsOpen(false)
    }
    if (preset === 'challenge') {
      setSelectedLevel(2)
      setIsAdvanced(false)
      setSelectedOperations(CHALLENGE_OPERATIONS)
      setSelectedDifficulty('medium')
      setMoreOptionsOpen(false)
    }
  }

  const selectPlanet = (level: number) => {
    setRoundPreset('custom')
    setSelectedLevel(level)
  }

  const toggleOperation = (operation: Operation) => {
    setRoundPreset('custom')
    setSelectedOperations(previous => {
      if (previous.includes(operation)) {
        return previous.length === 1 ? previous : previous.filter(item => item !== operation)
      }
      return [...previous, operation]
    })
  }

  const selectDifficulty = (difficulty: DifficultyTier) => {
    setRoundPreset('custom')
    setSelectedDifficulty(difficulty)
  }

  return {
    isAdvanced,
    roundPreset,
    moreOptionsOpen,
    selectedDifficulty,
    selectedOperations,
    selectedLevel,
    selectRoundPreset,
    selectPlanet,
    toggleOperation,
    selectDifficulty,
    toggleAdvanced: () => setIsAdvanced(previous => !previous),
    toggleMoreOptions: () => setMoreOptionsOpen(previous => !previous),
  }
}
