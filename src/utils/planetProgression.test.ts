import { describe, expect, it } from 'vitest'
import { getLevelForScore, getPlanet, PLANETS } from './planetProgression'

describe('planet progression', () => {
  it('uses the documented score thresholds', () => {
    expect(getLevelForScore(99, 1)).toBe(1)
    expect(getLevelForScore(100, 1)).toBe(2)
    expect(getLevelForScore(199, 1)).toBe(2)
    expect(getLevelForScore(200, 1)).toBe(3)
  })

  it('never moves below the selected starting level', () => {
    expect(getLevelForScore(0, 2)).toBe(2)
    expect(getLevelForScore(99, 3)).toBe(3)
    expect(getLevelForScore(200, 2)).toBe(3)
  })

  it('exposes named planets for UI and results', () => {
    expect(PLANETS.map(planet => planet.name)).toEqual(['Moon', 'Mars', 'Deep Space'])
    expect(getPlanet(3).difficulty).toBe('Advanced')
  })
})
