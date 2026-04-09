/**
 * FormErrorAlert Component
 * Displays form submission errors with dismissible UI
 * Used across all pages with form submissions
 */

"use client";

import { AlertCircle, X } from "lucide-react";
import { useCallback } from "react";

interface FormErrorAlertProps {
  error: string;
  onDismiss: () => void;
  className?: string;
}

export function FormErrorAlert({
  error,
  onDismiss,
  className = "",
}: FormErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      className={`rounded-[var(--radius-md)] bg-red-50 border border-red-300 p-4 flex items-start gap-3 ${className}`}
    >
      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-900">{error}</p>
        <p className="text-xs text-red-700 mt-1">
          Please review your input and try again.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-600 hover:text-red-900 shrink-0"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * FormSuccessAlert Component
 * Displays successful form submission feedback
 */

interface FormSuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  className?: string;
}

export function FormSuccessAlert({
  message,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 3000,
  className = "",
}: FormSuccessAlertProps) {
  // Auto-dismiss after delay
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Note: Auto-dismiss timer should be managed by parent component
  // This component only handles manual dismissal

  if (!message) return null;

  return (
    <div
      className={`rounded-[var(--radius-md)] bg-green-50 border border-green-300 p-4 flex items-start gap-3 ${className}`}
    >
      <div className="h-2 w-2 bg-green-600 rounded-full shrink-0 mt-2" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-green-900">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="text-green-600 hover:text-green-900 shrink-0"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * useFormError Hook
 * Manages form error state and provides auto-dismiss functionality
 */

import { useState, useEffect } from "react";

export function useFormError(autoDismissDelay: number = 0) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (error && autoDismissDelay > 0) {
      const timer = setTimeout(() => setError(""), autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [error, autoDismissDelay]);

  useEffect(() => {
    if (success && autoDismissDelay > 0) {
      const timer = setTimeout(() => setSuccess(""), autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [success, autoDismissDelay]);

  return {
    error,
    setError,
    clearError: () => setError(""),
    success,
    setSuccess,
    clearSuccess: () => setSuccess(""),
  };
}
