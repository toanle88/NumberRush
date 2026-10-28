export interface PlanetInfo {
  level: number
name: string
icon: string
difficulty: string
minimumScore: number}

export const PLANETS: readonly PlanetInfo[] = [
  { level: 1, name: 'Moon', icon: '🌙', difficulty: 'Beginner', minimumScore: 0 },
  { level: 2, name: 'Mars', icon: '🔴', difficulty: 'Intermediate', minimumScore: 100 },
  { level: 3, name: 'Deep Space', icon: '🌌', difficulty: 'Advanced', minimumScore: 200 },
]
export const getPlanet = (level: number): PlanetInfo => {
  return PLANETS.find(planet => planet.level === level) || PLANETS[0]
}
export const getLevelForScore = (score: number, startingLevel: number): number => {
  const scoreLevel = Math.min(PLANETS.length, Math.floor(score / 100) + 1)
return Math.max(startingLevel, scoreLevel)
}
