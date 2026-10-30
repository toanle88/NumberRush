import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'
import { createTranslator, readLocale } from '../utils/i18n'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: unknown
  componentStack: string | null
  retryKey: number
}

const BOUNDARY_ID = 'root'

const getErrorType = (error: unknown): string => {
  if (error instanceof Error && error.name) return error.name
  return typeof error === 'object' && error !== null ? 'ObjectError' : typeof error
}

const sanitizeDiagnosticText = (value: string): string => (
  value
    .replace(/[^a-zA-Z0-9_.$<>/():,\-\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
)

const getSafeComponentStack = (componentStack: string | null | undefined): string | null => {
  if (!componentStack) return null
  const sanitized = sanitizeDiagnosticText(componentStack)
  return sanitized || null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    componentStack: null,
    retryKey: 0,
  }

  public static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const componentStack = getSafeComponentStack(errorInfo.componentStack)
    this.setState({ hasError: true, error, componentStack })

    // Keep diagnostics limited to an error category and React's component names.
    // In particular, do not log error.message, which can contain user data.
    console.error('[NumberRush] React error boundary', {
      boundary: BOUNDARY_ID,
      errorType: sanitizeDiagnosticText(getErrorType(error)),
      componentStack,
    })
  }

  private handleRetry = (): void => {
    this.setState(previous => ({
      hasError: false,
      error: null,
      componentStack: null,
      retryKey: previous.retryKey + 1,
    }))
  }

  private handleReload = (): void => {
    try {
      if (typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
        window.location.reload()
      }
    } catch {
      // A browser or test environment can expose a non-functional location API.
    }
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
    }

    const errorType = sanitizeDiagnosticText(getErrorType(this.state.error))
    const showDevelopmentDetails = import.meta.env.DEV
    const translate = createTranslator(readLocale())

    return (
      <main className="error-boundary-screen" role="alert" aria-labelledby="error-boundary-heading">
        <section className="error-boundary-card">
          <p className="eyebrow">{translate('errorEyebrow')}</p>
          <h1 id="error-boundary-heading">{translate('errorTitle')}</h1>
          <p>{translate('errorDescription')}</p>
          <div className="error-boundary-actions">
            <button type="button" className="primary" onClick={this.handleRetry}>{translate('errorTryAgain')}</button>
            <button type="button" onClick={this.handleReload}>{translate('errorReload')}</button>
          </div>
          <p className="error-boundary-help">{translate('errorHelp')}</p>
          {showDevelopmentDetails && (
            <details className="error-boundary-details">
              <summary>{translate('errorDetails')}</summary>
              <p>{translate('boundary')} {BOUNDARY_ID}</p>
              <p>{translate('errorType')} {errorType || translate('unknown')}</p>
              {this.state.componentStack && <p>{translate('componentStack')} {this.state.componentStack}</p>}
            </details>
          )}
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
