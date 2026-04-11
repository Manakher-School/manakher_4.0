'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selected: string | string[];
  onSelect: (id: string | string[]) => void;
  multi?: boolean;
  placeholder?: string;
}

/**
 * Accessible dropdown component with full keyboard navigation
 * Supports:
 * - Arrow keys (Up/Down) to navigate options
 * - Enter/Space to select
 * - Escape to close
 * - Tab to close and move to next element
 * - Single or multi-select modes
 */
export function Dropdown({
  label,
  options,
  selected,
  onSelect,
  multi = false,
  placeholder = '—',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLLabelElement[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Reset focus when dropdown opens/closes
  useEffect(() => {
    if (open) {
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const option = options[focusedIndex];
            if (multi && Array.isArray(selected)) {
              const newSelected = selected.includes(option.id)
                ? selected.filter((id) => id !== option.id)
                : [...selected, option.id];
              onSelect(newSelected);
            } else {
              onSelect(option.id);
              setOpen(false);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          buttonRef.current?.focus();
          break;
        case 'Tab':
          setOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, focusedIndex, options, selected, multi, onSelect]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  const getLabel = (id: string) => {
    const option = options.find((o) => o.id === id);
    return option?.label || '';
  };

  const displayLabel = () => {
    if (multi && Array.isArray(selected)) {
      return selected.length === 0
        ? placeholder
        : selected.map(getLabel).join('، ');
    }
    return selected ? getLabel(selected as string) : placeholder;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
        {label}
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${displayLabel()}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1"
      >
        <span
          className={
            displayLabel() === placeholder
              ? 'text-[var(--color-ink-placeholder)]'
              : 'text-[var(--color-ink)]'
          }
        >
          {displayLabel()}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)] transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]"
        >
          {options.map((option, index) => (
            <label
              key={option.id}
              ref={(el) => {
                if (el) optionsRef.current[index] = el;
              }}
              role="option"
              aria-selected={
                multi && Array.isArray(selected)
                  ? selected.includes(option.id)
                  : selected === option.id
              }
              className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${
                focusedIndex === index
                  ? 'bg-[var(--color-accent-subtle)]'
                  : 'hover:bg-[var(--color-surface-hover)]'
              }`}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={multi ? undefined : 'selected-option'}
                checked={
                  multi && Array.isArray(selected)
                    ? selected.includes(option.id)
                    : selected === option.id
                }
                onChange={() => {
                  if (multi && Array.isArray(selected)) {
                    const newSelected = selected.includes(option.id)
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id];
                    onSelect(newSelected);
                  } else {
                    onSelect(option.id);
                    setOpen(false);
                  }
                }}
                className="accent-[var(--color-accent)] h-3.5 w-3.5"
                aria-label={option.label}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
