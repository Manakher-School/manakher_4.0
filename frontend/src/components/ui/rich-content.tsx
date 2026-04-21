"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface RichContentProps {
  html: string;
  className?: string;
}

/**
 * Safely renders HTML produced by RichEditor.
 * Sanitizes with DOMPurify before inserting into the DOM.
 * Apply typography via the .rich-content CSS class in globals.css.
 */
export function RichContent({ html, className = "" }: RichContentProps) {
  const clean = useMemo(() => {
    if (typeof window === "undefined") return html; // SSR — DOMPurify needs DOM
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s",
        "h1", "h2", "h3", "h4",
        "ul", "ol", "li",
        "a", "img",
        "blockquote", "pre", "code",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "style", "class", "dir"],
    });
  }, [html]);

  if (!html || html === "<p></p>") return null;

  return (
    <div
      className={`rich-content ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/**
 * Strips HTML tags to produce a plain-text preview (for card truncation).
 * Replaces block-level tags (p, div, br, h1-h6, li) with spaces/newlines
 * so the preview reads naturally without visible paragraph artifacts.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li|blockquote|pre)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
