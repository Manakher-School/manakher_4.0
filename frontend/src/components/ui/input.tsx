import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export function Input({ label, id, className = "", required, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-[var(--color-ink)]"
      >
        {label}
        {required === true && <span className="text-[var(--color-danger)] ms-1">*</span>}
        {required === false && <span className="text-xs text-[var(--color-ink-secondary)] ms-1">(optional)</span>}
      </label>
      <input
        id={id}
        {...props}
        className={`w-full rounded-[var(--radius-md)] border ${error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"} bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-placeholder)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:bg-white ${className}`}
      />
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
