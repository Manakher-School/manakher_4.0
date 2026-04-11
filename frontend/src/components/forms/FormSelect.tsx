"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface FormSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
  error?: string;
  disabled?: boolean;
}

/**
 * Reusable form select component with label and error
 * Consolidates: label, select button, dropdown, error message
 * Reduces ~50+ lines per select across pages
 */
export function FormSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  error,
  disabled = false,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition-colors"
        aria-label={label}
      >
        <span
          className={
            selected
              ? "text-[var(--color-ink)]"
              : "text-[var(--color-ink-placeholder)]"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]">
          <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm">
            <input
              type="radio"
              name={label}
              value=""
              checked={value === ""}
              onChange={() => {
                onChange("");
                setOpen(false);
              }}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-[var(--color-ink-placeholder)]">—</span>
          </label>
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm"
            >
              <input
                type="radio"
                name={label}
                value={option.id}
                checked={value === option.id}
                onChange={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="accent-[var(--color-accent)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-[var(--color-danger-text)] mt-1">{error}</p>
      )}
    </div>
  );
}
