import type { ErrorInfo } from 'react'

import { Component } from 'react'

import type { ToolErrorBoundaryProps } from '@/types'

type ToolErrorBoundaryState = {
  hasError: boolean
}

export class ToolErrorBoundary extends Component<ToolErrorBoundaryProps, ToolErrorBoundaryState> {
  state: ToolErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ToolErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ToolErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <div role="alert">{this.props.fallback}</div>
      }
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
          <p className="text-body-sm text-error">Something went wrong</p>
          <button
            className="rounded-md border border-error px-3 py-1 text-body-sm text-error hover:bg-error/10"
            onClick={this.handleReset}
            type="button"
          >
            Reset
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
