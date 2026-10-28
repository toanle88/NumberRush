import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('renders a privacy-safe recovery screen for component errors', () => {
    vi.stubEnv('DEV', false)
    const sensitiveMessage = 'saved-name-and-progress-secret'

    const BrokenChild = () => {
      throw new Error(sensitiveMessage)
    }

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: /little snag/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(screen.queryByText(sensitiveMessage)).not.toBeInTheDocument()
    expect(screen.queryByText(/development details/i)).not.toBeInTheDocument()
  })

  it('remounts children when the user tries again', () => {
    let shouldThrow = true
    const RecoverableChild = () => {
      if (shouldThrow) throw new Error('temporary failure')
      return <p>Game ready</p>
    }

    render(
      <ErrorBoundary>
        <RecoverableChild />
      </ErrorBoundary>,
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Game ready')).toBeInTheDocument()
  })

  it('only requests a reload after the reload action is selected', () => {
    const originalWindow = window
    const reload = vi.fn()
    try {
      const BrokenChild = () => {
        throw new Error('temporary failure')
      }
      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      )

      expect(reload).not.toHaveBeenCalled()
      vi.stubGlobal('window', { location: { reload } })
      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }))
      expect(reload).toHaveBeenCalledOnce()
    } finally {
      vi.stubGlobal('window', originalWindow)
    }
  })

  it('shows only sanitized diagnostic details during development', () => {
    vi.stubEnv('DEV', true)
    const BrokenChild = () => {
      throw new Error('user-token=do-not-display')
    }

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/Error type: Error/)).toBeInTheDocument()
    expect(screen.queryByText(/do-not-display/)).not.toBeInTheDocument()
  })
})
