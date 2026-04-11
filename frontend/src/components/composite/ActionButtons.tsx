"use client";

import { Pencil, Trash2, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ActionButtonsProps {
  /** Callback for edit button */
  onEdit?: () => void;
  /** Callback for delete button */
  onDelete?: () => void;
  /** Whether edit button is disabled */
  editDisabled?: boolean;
  /** Whether delete button is disabled */
  deleteDisabled?: boolean;
  /** Whether delete button is loading */
  deleteLoading?: boolean;
  /** Edit button aria-label */
  editLabel?: string;
  /** Delete button aria-label */
  deleteLabel?: string;
  /** Optional additional actions */
  children?: ReactNode;
}

/**
 * Reusable action buttons component
 * Consolidates: edit/delete button styling, loading states, hover effects
 * Reduces ~15 lines per list item
 */
export function ActionButtons({
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
  deleteLoading = false,
  editLabel = "Edit",
  deleteLabel = "Delete",
  children,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <button
          onClick={onEdit}
          disabled={editDisabled}
          className="rounded-md p-1.5 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          aria-label={editLabel}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={deleteDisabled || deleteLoading}
          className="rounded-md p-1.5 text-[var(--color-danger)] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label={deleteLabel}
        >
          {deleteLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}

      {children}
    </div>
  );
}
