"use client";

import { useCallback, useRef } from "react";
import { useDialog } from "@/context/dialog-context";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { getPocketBase } from "@/lib/pocketbase";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  minHeight?: number;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={[
        "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
        "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]",
        "hover:bg-[var(--color-surface-hover)]",
        active
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────

function Sep() {
  return (
    <span className="w-px h-5 bg-[var(--color-border)] mx-0.5 self-center" />
  );
}

// ─── RichEditor ───────────────────────────────────────────────────────────

export function RichEditor({
  value,
  onChange,
  placeholder = "",
  dir = "rtl",
  minHeight = 200,
}: RichEditorProps) {
  const { alert } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

   const editor = useEditor({
     extensions: [
       StarterKit.configure({
         heading: { levels: [1, 2, 3] },
         // Disable link and underline from StarterKit to avoid duplicates with our custom extensions
         link: false,
         underline: false,
       }),
       Underline,
       Image.configure({ inline: false, allowBase64: false }),
       Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
       TextAlign.configure({ types: ["heading", "paragraph"] }),
     ],
    content: value,
    editorProps: {
      attributes: {
        class: "outline-none",
        dir,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Keep editor in sync when value prop changes externally (e.g. loading edit)
  const lastValueRef = useRef(value);
  if (editor && value !== lastValueRef.current) {
    lastValueRef.current = value;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }

  // ── Link insertion ────────────────────────────────────────────────────────
  const insertLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("رابط / URL", prev);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const pb = getPocketBase();
        const formData = new FormData();
        formData.append("file", file);
        if (pb.authStore.record?.id) {
          formData.append("uploaded_by", pb.authStore.record.id);
        }
        const record = await pb.collection("media").create(formData);
        const url = pb.files.getURL(record, record.file as string);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        await alert("فشل رفع الصورة. حاول مجدداً.\nFailed to upload image.");
      }
    },
    [editor, alert]
  );

  if (!editor) return null;

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:border-[var(--color-accent)] transition-shadow"
      dir={dir}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] select-none">
        {/* Text style */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold / غامق"
        >
          <Bold size={15} strokeWidth={2.5} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic / مائل"
        >
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline / تسطير"
        >
          <UnderlineIcon size={15} />
        </ToolBtn>

        <Sep />

        {/* Headings */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1 / عنوان رئيسي"
        >
          <Heading1 size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2 / عنوان فرعي"
        >
          <Heading2 size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3 / عنوان صغير"
        >
          <Heading3 size={15} />
        </ToolBtn>

        <Sep />

        {/* Lists */}
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list / قائمة نقطية"
        >
          <List size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered list / قائمة مرقمة"
        >
          <ListOrdered size={15} />
        </ToolBtn>

        <Sep />

        {/* Alignment */}
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right / محاذاة يمين"
        >
          <AlignRight size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center / توسيط"
        >
          <AlignCenter size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left / محاذاة يسار"
        >
          <AlignLeft size={15} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify / ضبط"
        >
          <AlignJustify size={15} />
        </ToolBtn>

        <Sep />

        {/* Link */}
        <ToolBtn
          onClick={insertLink}
          active={editor.isActive("link")}
          title="Insert link / إدراج رابط"
        >
          <Link2 size={15} />
        </ToolBtn>

        {/* Image upload */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          title="Insert image / إدراج صورة"
        >
          <ImageIcon size={15} />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="px-4 py-3 text-[var(--color-ink)] text-[15px] leading-relaxed [&_.tiptap]:outline-none [&_.tiptap_p:empty]:before:content-[attr(data-placeholder)] [&_.tiptap_p:empty]:before:text-[var(--color-ink-placeholder)]"
        style={{ minHeight }}
      />

      {/* Placeholder hint rendered as data-attr (Tiptap doesn't ship placeholder ext here) */}
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: var(--color-ink-placeholder);
          pointer-events: none;
          height: 0;
        }
        .tiptap h1 { font-size: 1.6rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
        .tiptap h2 { font-size: 1.3rem; font-weight: 700; margin: 0.65rem 0 0.4rem; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 700; margin: 0.55rem 0 0.35rem; }
        .tiptap ul { list-style: disc; padding-inline-start: 1.5rem; margin: 0.5rem 0; }
        .tiptap ol { list-style: decimal; padding-inline-start: 1.5rem; margin: 0.5rem 0; }
        .tiptap li { margin: 0.2rem 0; }
        .tiptap a { color: var(--color-accent); text-decoration: underline; }
        .tiptap img { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
        .tiptap p { margin: 0.3rem 0; }
        .tiptap strong { font-weight: 700; }
      `}</style>
    </div>
  );
}
