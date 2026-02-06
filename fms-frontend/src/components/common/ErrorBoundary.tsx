import { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, Button } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Alert
          type="error"
          message="Something went wrong"
          description={this.state.error?.message}
          action={
            <Button size="small" onClick={() => this.setState({ hasError: false })}>
              Retry
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}
