"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  );
}