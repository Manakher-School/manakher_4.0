"use client";

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load the heavy RichEditor component
const RichEditorComponent = lazy(() =>
  import("./rich-editor").then((m) => ({ default: m.RichEditor }))
);

interface LazyRichEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}

/**
 * Lazy-loaded RichEditor component
 * Defers loading of Tiptap and related dependencies until component is mounted
 * Reduces initial bundle size significantly
 */
export function LazyRichEditor({
  value = "",
  onChange = () => {},
  placeholder,
  dir,
}: LazyRichEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
        </div>
      }
    >
      <RichEditorComponent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        dir={dir}
      />
    </Suspense>
  );
}
