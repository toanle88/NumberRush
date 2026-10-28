import { afterEach, describe, expect, it, vi } from 'vitest'

describe('storage initialization', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('does not throw when the browser localStorage accessor throws', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('localStorage is blocked')
      },
    })

    try {
      const storage = await import('./storage')
      expect(storage.getStorageStatus()).toBe('unavailable')
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
      else delete (globalThis as Partial<typeof globalThis>).localStorage
    }
  })
})
