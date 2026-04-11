"use client";

import { Suspense, lazy, ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface LazyComponentProps {
  fallback?: ReactNode;
}

/**
 * Higher-order component for lazy loading components
 * Wraps lazy() import with Suspense boundary
 * Reduces initial bundle size by deferring non-critical code
 */
export function withLazyLoad<P extends object>(
  Component: Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(() => Component);

  return function LazyLoadedComponent(props: P) {
    return (
      <Suspense
        fallback={
          fallback || (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </div>
          )
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
