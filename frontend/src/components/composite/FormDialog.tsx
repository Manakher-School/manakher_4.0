/**
 * FormDialog Component
 * A reusable dialog wrapper for forms with built-in submission handling,
 * loading states, and error management.
 *
 * Usage:
 * ```tsx
 * <FormDialog
 *   isOpen={isOpen}
 *   title="Create User"
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={handleSubmit}
 *   submitLabel="Create"
 * >
 *   <Input label="Name" {...formState} />
 *   <Input label="Email" type="email" {...formState} />
 * </FormDialog>
 * ```
 */

'use client';

import React, { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormErrorAlert } from '@/components/ui/form-alerts';

export interface FormDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;

  /** Dialog title */
  title: string;

  /** Callback when dialog should close */
  onClose: () => void;

  /** Form submission handler - should throw error on failure */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;

  /** Dialog content (form fields) */
  children: ReactNode;

  /** Primary action button label */
  submitLabel?: string;

  /** Cancel button label */
  cancelLabel?: string;

  /** Whether form is currently submitting */
  isLoading?: boolean;

  /** Error message to display, if any */
  error?: string | null;

  /** Custom error callback to clear error state */
  onErrorDismiss?: () => void;

  /** Whether to disable submit button */
  isDisabled?: boolean;

  /** Optional description text below title */
  description?: string;

  /** Submit button variant */
  submitVariant?: 'primary' | 'danger';

  /** Whether to close dialog on successful submission */
  closeOnSubmit?: boolean;

  /** Size of dialog */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * FormDialog Component
 * Combines Dialog + Form handling for common form submission patterns
 */
export function FormDialog({
  isOpen,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  error = null,
  onErrorDismiss,
  isDisabled = false,
  description,
  submitVariant = 'primary',
  closeOnSubmit = true,
  size = 'md',
}: FormDialogProps) {
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await onSubmit(e);

      if (closeOnSubmit) {
        onClose();
      }
    } catch (err) {
      // Error is handled by parent component via error prop
      console.error('FormDialog submission error:', err);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size={size}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
          {description && (
            <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{description}</p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <FormErrorAlert
            error={error}
            onDismiss={onErrorDismiss || (() => {})}
          />
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {children}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={submitVariant}
              disabled={isDisabled || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  {submitLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}

export default FormDialog;
