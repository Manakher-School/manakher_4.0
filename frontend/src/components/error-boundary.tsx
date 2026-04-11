'use client';

import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="bg-surface-card rounded-xl shadow-md p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-role-danger" aria-hidden="true" />
          <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
        </div>

        <p className="text-ink-secondary mb-4 text-sm">
          An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 p-3 bg-surface rounded-lg border border-border-subtle">
            <summary className="font-semibold text-ink cursor-pointer mb-2">
              Error details (Development only)
            </summary>
            <pre className="text-xs text-ink-secondary overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {error.toString()}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          <Button onClick={onReset} variant="primary" size="default" className="flex-1">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            size="default"
            className="flex-1"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
