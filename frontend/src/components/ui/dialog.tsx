import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: DialogAction[];
  size?: "sm" | "md" | "lg";
}

interface DialogAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "danger" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  size = "md",
}: DialogProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={`bg-[var(--color-surface-card)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <h2 id="dialog-title" className="text-lg font-bold text-[var(--color-ink)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              aria-label="Close dialog"
            >
              <X size={20} className="text-[var(--color-ink-secondary)]" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 text-[var(--color-ink)]">{children}</div>

        {/* Footer with actions */}
        {actions.length > 0 && (
          <div className="flex gap-3 justify-end p-6 border-t border-[var(--color-border)]">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "primary"}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                aria-label={action.label}
              >
                {action.loading ? "..." : action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
