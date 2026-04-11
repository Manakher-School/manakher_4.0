/**
 * DataTable Component
 * A reusable table component with consistent styling, sorting, pagination,
 * and action buttons for edit/delete operations.
 *
 * Usage:
 * ```tsx
 * <DataTable
 *   columns={[
 *     { key: 'name', label: 'Name', render: (item) => item.name_ar || item.name_en },
 *     { key: 'email', label: 'Email' },
 *   ]}
 *   data={users}
 *   isLoading={loading}
 *   onEdit={(user) => setEditingUser(user)}
 *   onDelete={(user) => deleteUser(user.id)}
 * />
 * ```
 */

'use client';

import React, { ReactNode } from 'react';
import { ChevronUp, ChevronDown, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  /** Unique key for this column */
  key: keyof T | string;

  /** Display label for column header */
  label: string;

  /** Optional custom render function */
  render?: (item: T, index: number) => ReactNode;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';

  /** CSS class for cell styling */
  cellClassName?: string;
}

export interface DataTableProps<T extends { id?: string | number }> {
  /** Column definitions */
  columns: Column<T>[];

  /** Table data */
  data: T[];

  /** Whether data is loading */
  isLoading?: boolean;

  /** Whether table is empty */
  isEmpty?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Current sort column key */
  sortBy?: string;

  /** Current sort direction */
  sortDirection?: SortDirection;

  /** Callback when column header is clicked for sorting */
  onSort?: (columnKey: string, direction: SortDirection) => void;

  /** Callback when edit button is clicked */
  onEdit?: (item: T) => void;

  /** Callback when delete button is clicked */
  onDelete?: (item: T) => Promise<void>;

  /** Whether edit/delete buttons are visible */
  showActions?: boolean;

  /** Edit button label */
  editLabel?: string;

  /** Delete button label */
  deleteLabel?: string;

  /** ID of row currently being deleted */
  deletingId?: string | number | null;

  /** CSS class for table container */
  className?: string;

  /** Striped row styling */
  striped?: boolean;

  /** Hover effects on rows */
  hoverable?: boolean;
}

/**
 * SortIcon Component
 */
function SortIcon({ direction }: { direction: SortDirection | undefined }) {
  if (direction === 'asc') return <ChevronUp className="w-4 h-4" />;
  if (direction === 'desc') return <ChevronDown className="w-4 h-4" />;
  return null;
}

/**
 * DataTable Component
 */
export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  isEmpty = data.length === 0,
  emptyMessage = 'No data available',
  sortBy,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  showActions = true,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  deletingId,
  className = '',
  striped = true,
  hoverable = true,
}: DataTableProps<T>) {
  const [deletingStates, setDeletingStates] = React.useState<Set<string | number>>(new Set());

  const handleDelete = async (item: T) => {
    if (!onDelete || !item.id) return;

    const id = item.id;
    setDeletingStates((prev) => new Set([...prev, id]));

    try {
      await onDelete(item);
      setDeletingStates((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      setDeletingStates((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      console.error('Delete failed:', error);
    }
  };

  const handleSort = (columnKey: string) => {
    if (!onSort) return;

    let newDirection: SortDirection = 'asc';
    if (sortBy === columnKey) {
      if (sortDirection === 'asc') newDirection = 'desc';
      if (sortDirection === 'desc') newDirection = null;
    }

    onSort(columnKey, newDirection);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={`flex items-center justify-center py-12 text-[var(--color-ink-secondary)] ${className}`}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-[var(--color-border)] ${className}`}>
      <table className="w-full text-sm">
        {/* Table Head */}
        <thead>
          <tr className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)]">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-4 py-3 font-semibold text-[var(--color-ink)] text-left ${
                  column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                }`}
                style={{ width: column.width }}
              >
                {column.sortable && onSort ? (
                  <button
                    onClick={() => handleSort(String(column.key))}
                    className="inline-flex items-center gap-1 hover:text-[var(--color-accent)] transition-colors"
                  >
                    {column.label}
                    {sortBy === String(column.key) && (
                      <SortIcon direction={sortDirection} />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}

            {/* Actions Column */}
            {showActions && (onEdit || onDelete) && (
              <th className="px-4 py-3 font-semibold text-[var(--color-ink)] text-center w-24">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {data.map((item, index) => {
            const isDeleting = item.id ? deletingStates.has(item.id) : false;

            return (
              <tr
                key={item.id || index}
                className={`border-b border-[var(--color-border)] transition-colors ${
                  striped && index % 2 === 1 ? 'bg-[var(--color-surface-sunken)]' : ''
                } ${hoverable ? 'hover:bg-[var(--color-surface-hover)]' : ''}`}
              >
                {/* Data Cells */}
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-4 py-3 text-[var(--color-ink)] ${
                      column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                    } ${column.cellClassName || ''}`}
                  >
                    {column.render
                      ? column.render(item, index)
                      : String((item as any)[column.key] ?? '')}
                  </td>
                ))}

                {/* Action Buttons */}
                {showActions && (onEdit || onDelete) && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                          title={editLabel}
                          disabled={isDeleting}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {onDelete && item.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item)}
                          title={deleteLabel}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
