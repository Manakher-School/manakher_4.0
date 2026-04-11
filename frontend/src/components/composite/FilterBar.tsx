/**
 * FilterBar Component
 * A reusable search + filter input component with consistent styling.
 * Combines search functionality with optional filter dropdowns.
 *
 * Usage:
 * ```tsx
 * <FilterBar
 *   searchPlaceholder="Search users..."
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filters={[
 *     {
 *       label: 'Role',
 *       options: [
 *         { id: 'admin', label: 'Admin' },
 *         { id: 'teacher', label: 'Teacher' },
 *       ],
 *       value: roleFilter,
 *       onChange: setRoleFilter,
 *     }
 *   ]}
 * />
 * ```
 */

'use client';

import React, { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterConfig {
  /** Display label for filter */
  label: string;

  /** Available options */
  options: FilterOption[];

  /** Current selected value */
  value: string | string[];

  /** Callback when value changes */
  onChange: (value: string | string[]) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Single or multi-select */
  multi?: boolean;
}

export interface FilterBarProps {
  /** Placeholder for search input */
  searchPlaceholder?: string;

  /** Current search value */
  searchValue?: string;

  /** Callback when search value changes */
  onSearchChange?: (value: string) => void;

  /** Filter configurations */
  filters?: FilterConfig[];

  /** Whether search/filters are disabled */
  disabled?: boolean;

  /** Callback to clear all filters */
  onClear?: () => void;

  /** Show clear button */
  showClear?: boolean;

  /** CSS class for container */
  className?: string;

  /** Additional actions to display */
  actions?: ReactNode;
}

/**
 * FilterBar Component
 * Search + multi-filter input with consistent styling
 */
export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  disabled = false,
  onClear,
  showClear = true,
  className = '',
  actions,
}: FilterBarProps) {
  const hasActiveFilters =
    (searchValue && searchValue.trim() !== '') ||
    filters.some((f) => {
      const val = Array.isArray(f.value) ? f.value.join() : f.value;
      return val && val.trim() !== '';
    });

  const handleClearSearch = () => {
    onSearchChange?.('');
  };

  const handleClearAll = () => {
    handleClearSearch();
    onClear?.();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search Input */}
        {onSearchChange && (
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-placeholder)]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={disabled}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] pl-10 pr-8 py-2.5 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-placeholder)] outline-none transition-all duration-150 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {searchValue && searchValue.trim() !== '' && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-surface-hover)] rounded"
              >
                <X className="w-4 h-4 text-[var(--color-ink-secondary)]" />
              </button>
            )}
          </div>
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter, index) => (
          <div key={index} className="min-w-[150px]">
            <Dropdown
              label={filter.label}
              options={filter.options}
              selected={filter.value}
              onSelect={(value) => filter.onChange(value)}
              multi={filter.multi}
              placeholder={filter.placeholder || filter.label}
            />
          </div>
        ))}

        {/* Actions Slot */}
        {actions && <div className="flex gap-2">{actions}</div>}

        {/* Clear Button */}
        {showClear && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display (Optional) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-ink-secondary)]">
          <span>Active filters:</span>
          {searchValue && searchValue.trim() !== '' && (
            <span className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-2 py-1 rounded">
              Search: "{searchValue}"
            </span>
          )}
          {filters.map((filter) => {
            const val = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;
            return (
              val &&
              val.trim() !== '' && (
                <span
                  key={String(filter.label)}
                  className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-2 py-1 rounded"
                >
                  {filter.label}: "{val}"
                </span>
              )
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
