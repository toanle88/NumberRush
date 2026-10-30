import { useCallback, useSyncExternalStore } from 'react'

const getSnapshot = (query: string): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia(query).matches
  } catch {
    return false
  }
}

const subscribe = (query: string, onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined
  let mediaQuery: MediaQueryList
  try {
    mediaQuery = window.matchMedia(query)
  } catch {
    return () => undefined
  }
  const handleChange = () => onChange()
  try {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  } catch {
    return () => undefined
  }
  return () => undefined
}

const getServerSnapshot = () => false

export const useMediaQuery = (query: string): boolean => {
  const subscribeToQuery = useCallback(
    (onChange: () => void) => subscribe(query, onChange),
    [query],
  )
  const getQuerySnapshot = useCallback(() => getSnapshot(query), [query])
  return useSyncExternalStore(subscribeToQuery, getQuerySnapshot, getServerSnapshot)
}
