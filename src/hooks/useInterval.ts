import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

export const useInterval = (
  callback: () => void,
  delay: number | null,
  intervalRef?: MutableRefObject<number | null>,
): void => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return undefined
    const interval = window.setInterval(() => callbackRef.current(), delay)
    if (intervalRef) intervalRef.current = interval
    return () => {
      window.clearInterval(interval)
      if (intervalRef?.current === interval) intervalRef.current = null
    }
  }, [delay, intervalRef])
}

export const usePageActivity = (callback: () => void, intervalMs: number): void => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') callback()
    }
    const interval = window.setInterval(callback, intervalMs)
    window.addEventListener('focus', callback)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', callback)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [callback, intervalMs])
}

export const useCommittedGameStateRef = <T>(
  value: T,
  pendingSubmissionRef: MutableRefObject<boolean>,
): MutableRefObject<T> => {
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
    pendingSubmissionRef.current = false
  }, [pendingSubmissionRef, value])
  return valueRef
}
