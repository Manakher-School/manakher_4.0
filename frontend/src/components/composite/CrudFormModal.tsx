"use client";

import { ReactNode } from "react";
import { X, Loader2 } from "lucide-react";
import { FormErrorAlert } from "@/components/ui/form-alerts";

interface CrudFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isLoading: boolean;
  error?: string;
  onErrorDismiss?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * Reusable CRUD form modal component
 * Consolidates: modal wrapper, close button, error handling, submit/cancel buttons
 * Reduces ~50+ lines per page using create/edit forms
 */
export function CrudFormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  isLoading,
  error,
  onErrorDismiss,
  onSubmit,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: CrudFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[var(--color-ink)]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)] rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          aria-label={cancelLabel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && onErrorDismiss && (
        <div className="mb-4">
          <FormErrorAlert error={error} onDismiss={onErrorDismiss} />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        <div className="flex gap-2 justify-end pt-2 border-t border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
