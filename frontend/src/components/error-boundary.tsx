'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-surface p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-danger shrink-0" />
              <div>
                <h1 className="text-lg font-bold text-ink">
                  Something went wrong
                </h1>
                <p className="text-sm text-ink-secondary">
                  An unexpected error occurred. Please try again.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-xs font-mono text-danger break-words">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer font-semibold text-danger hover:underline">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 text-danger/80">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <Button
              onClick={this.handleReset}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return children;
  }
}
