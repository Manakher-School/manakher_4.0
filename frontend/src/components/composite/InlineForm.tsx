/**
 * InlineForm Component
 * A compact, single-row form for inline add/edit operations.
 * Ideal for quick data entry without modal dialogs.
 *
 * Usage:
 * ```tsx
 * <InlineForm
 *   fields={[
 *     { name: 'text', label: 'Subject', type: 'text', required: true },
 *     { name: 'select', label: 'Grade', type: 'select', options: [...] },
 *   ]}
 *   onSubmit={handleAdd}
 *   onCancel={handleCancel}
 * />
 * ```
 */

'use client';

import React, { ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';

export type FormFieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'hidden';

export interface FormFieldOption {
  id: string;
  label: string;
}

export interface FormField {
  /** Field name/key */
  name: string;

  /** Display label */
  label?: string;

  /** Field type */
  type?: FormFieldType;

  /** Placeholder text */
  placeholder?: string;

  /** Is field required */
  required?: boolean;

  /** Validation pattern or function */
  validate?: RegExp | ((value: string) => boolean | string);

  /** Error message */
  errorMessage?: string;

  /** For select fields: available options */
  options?: FormFieldOption[];

  /** Default value */
  defaultValue?: string;

  /** CSS class for input */
  className?: string;

  /** Read-only field */
  readOnly?: boolean;

  /** Helper text below field */
  helperText?: string;
}

export interface InlineFormProps {
  /** Form field definitions */
  fields: FormField[];

  /** Submit handler - receives form data object */
  onSubmit: (data: Record<string, string>) => Promise<void> | void;

  /** Cancel handler */
  onCancel: () => void;

  /** Whether form is submitting */
  isLoading?: boolean;

  /** Submit button label */
  submitLabel?: string;

  /** Cancel button label */
  cancelLabel?: string;

  /** CSS class for form container */
  className?: string;

  /** Initial values override */
  initialValues?: Record<string, string>;

  /** Callback on validation error */
  onValidationError?: (errors: Record<string, string>) => void;
}

/**
 * InlineForm Component
 * Single-row or compact form for inline data entry
 */
export function InlineForm({
  fields,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  className = '',
  initialValues = {},
  onValidationError,
}: InlineFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: initialValues[field.name] || field.defaultValue || '',
      }),
      {}
    )
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Validate a single field
  const validateField = (field: FormField, value: string): string | null => {
    // Required validation
    if (field.required && (!value || value.trim() === '')) {
      return `${field.label || field.name} is required`;
    }

    // Pattern validation
    if (field.validate) {
      if (field.validate instanceof RegExp) {
        if (!field.validate.test(value)) {
          return field.errorMessage || `${field.label || field.name} is invalid`;
        }
      } else if (typeof field.validate === 'function') {
        const result = field.validate(value);
        if (result !== true && typeof result === 'string') {
          return result;
        }
      }
    }

    return null;
  };

  // Validate all fields
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    return newErrors;
  };

  // Handle field change
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear error for this field if user is correcting it
    if (errors[fieldName]) {
      const field = fields.find((f) => f.name === fieldName);
      if (field) {
        const error = validateField(field, value);
        if (!error) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
        }
      }
    }
  };

  // Handle field blur
  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => new Set([...prev, fieldName]));

    const field = fields.find((f) => f.name === fieldName);
    if (field) {
      const error = validateField(field, formData[fieldName]);
      if (error) {
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      onValidationError?.(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('InlineForm submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          if (field.type === 'hidden') {
            return null;
          }

          const fieldValue = formData[field.name] || '';
          const fieldError = errors[field.name];
          const isFieldTouched = touched.has(field.name);
          const showError = fieldError && isFieldTouched;

          return (
            <div key={field.name} className="flex flex-col gap-1">
              {field.label && (
                <label className="text-xs font-medium text-[var(--color-ink)]">
                  {field.label}
                  {field.required && <span className="text-role-danger ml-1">*</span>}
                </label>
              )}

              {field.type === 'select' ? (
                <Dropdown
                  label={field.label || field.name}
                  options={field.options || []}
                  selected={fieldValue}
                  onSelect={(value) => handleFieldChange(field.name, Array.isArray(value) ? value[0] : value)}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={fieldValue}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  onBlur={() => handleFieldBlur(field.name)}
                  placeholder={field.placeholder}
                  disabled={field.readOnly || isLoading}
                  rows={3}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-placeholder)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ) : (
              <input
                type={field.type || 'text'}
                name={field.name}
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                onBlur={() => handleFieldBlur(field.name)}
                placeholder={field.placeholder}
                aria-label={field.label || field.placeholder}
                disabled={field.readOnly || isLoading}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-placeholder)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              )}

              {/* Field Error */}
              {showError && (
                <p className="text-xs text-role-danger">{fieldError}</p>
              )}

              {/* Helper Text */}
              {field.helperText && !showError && (
                <p className="text-xs text-[var(--color-ink-secondary)]">{field.helperText}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={isLoading}
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

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-1" />
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}

export default InlineForm;
