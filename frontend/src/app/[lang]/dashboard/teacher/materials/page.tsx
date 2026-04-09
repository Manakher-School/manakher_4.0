"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, Plus, Pencil, Trash2, X, Link2, Paperclip, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichEditor } from "@/components/ui/rich-editor";
import { stripHtml, RichContent } from "@/components/ui/rich-content";
import FileUpload from "@/components/ui/file-upload";
import { Comments } from "@/components/ui/comments";

interface Section {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface Material {
  id: string;
  title: string;
  body: string;
  link_url: string;
  attachment?: string; // PocketBase file field - stores filename
  section: string;
  subject: string;
  teacher: string;
  created: string;
  collectionId: string;
  expand?: { section?: Section; subject?: Subject };
}

const EMPTY_FORM = { title: "", body: "", link_url: "", section: "", subject: "" };

export default function TeacherMaterialsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.teacher.materials;
  const common = dict.common;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sectionName = (s: Section) =>
    locale === "ar" ? `${s.grade_ar} — ${s.section_ar}` : `${s.grade_en} — ${s.section_en}`;
  const subjectName = (s: Subject) => (locale === "ar" ? s.name_ar : s.name_en);

  const load = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sectionIds: string[] = (user as any).sections ?? [];

    try {
      const [secs, subs] = await Promise.all([
        sectionIds.length > 0
          ? pb.collection("class_sections").getFullList<Section>({
              filter: sectionIds.map((id) => `id = "${id}"`).join(" || "),
              sort: "grade_order,section_ar",
            })
          : Promise.resolve([] as Section[]),
        pb.collection("subjects").getFullList<Subject>({ sort: locale === "ar" ? "name_ar" : "name_en" }),
      ]);
      setSections(secs);
      setSubjects(subs);

      let filter = `teacher = "${user.id}"`;
      if (filterSection) filter += ` && section = "${filterSection}"`;
      if (filterSubject) filter += ` && subject = "${filterSubject}"`;

      const mats = await pb.collection("materials").getFullList<Material>({
        filter,
        sort: "-created",
        expand: "section,subject",
      });
      setMaterials(mats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, locale, filterSection, filterSubject]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setSelectedFile(null);
    setEditingId(null);
    setShowForm(true);
  }

function openEdit(m: Material) {
  setForm({ 
    title: m.title, 
    body: m.body, 
    link_url: m.link_url || "",
    section: m.section, 
    subject: m.subject 
  });
  setSelectedFile(null);
  setEditingId(m.id);
  setShowForm(true);
}

async function handleSave() {
  if (!user || !form.title || !form.section || !form.subject) return;
  setSaving(true);
  const pb = getPocketBase();
  try {
    // Use FormData for file upload support
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("body", form.body);
    formData.append("link_url", form.link_url);
    formData.append("section", form.section);
    formData.append("subject", form.subject);
    formData.append("teacher", user.id);
    
    // Append file if selected
    if (selectedFile) {
      formData.append("attachment", selectedFile);
    }
    
    if (editingId) {
      await pb.collection("materials").update(editingId, formData);
    } else {
      await pb.collection("materials").create(formData);
    }
    setShowForm(false);
    setSelectedFile(null);
    await load();
  } catch (e) {
    console.error(e);
  } finally {
    setSaving(false);
  }
}

  async function handleDelete(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    const pb = getPocketBase();
    await pb.collection("materials").delete(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t.add}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">{t.filterSection}: {t.all}</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{sectionName(s)}</option>)}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">{t.filterSubject}: {t.all}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{subjectName(s)}</option>)}
        </select>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[var(--color-ink)]">{editingId ? t.editTitle : t.add}</h3>
            <button onClick={() => setShowForm(false)} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label={t.materialTitle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t.phTitle} />
            </div>

            {/* Section select */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSection}</label>
              <select
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option value="">—</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{sectionName(s)}</option>)}
              </select>
            </div>

            {/* Subject select */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSubject}</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option value="">—</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{subjectName(s)}</option>)}
              </select>
            </div>

            {/* Optional link URL */}
            <div className="sm:col-span-2">
              <Input label={t.linkUrl} value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder={t.phLink} />
            </div>
            
            {/* File upload */}
            <div className="sm:col-span-2">
              <FileUpload 
                label={t.fileUpload} 
                acceptedTypes={["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]}
                maxSizeMB={10}
                onFileChange={(file) => setSelectedFile(file)}
                fileName={selectedFile?.name}
              />
            </div>

            {/* Rich text body */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.body}</label>
              <RichEditor
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                placeholder={t.phBody}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>{common.cancel}</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? common.loading : common.save}
            </Button>
          </div>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => {
            const sec = m.expand?.section;
            const sub = m.expand?.subject;
            const isExpanded = expandedId === m.id;
            return (
              <div key={m.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-5 py-4 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-teacher-bold)]" style={{ background: "var(--color-role-teacher-bg)" }}>
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{m.title}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {sec && <span className="text-xs text-[var(--color-ink-secondary)] font-semibold">{locale === "ar" ? `${sec.grade_ar} — ${sec.section_ar}` : `${sec.grade_en} — ${sec.section_en}`}</span>}
                        {sub && <span className="text-xs text-[var(--color-ink-secondary)]">· {locale === "ar" ? sub.name_ar : sub.name_en}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {!isExpanded && m.body && <p className="mt-2 text-sm text-[var(--color-ink-secondary)] line-clamp-2">{stripHtml(m.body)}</p>}
                {!isExpanded && m.link_url && (
                  <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-accent-text)] hover:underline truncate">
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    {m.link_url}
                  </a>
                )}
                {!isExpanded && m.attachment && (
                  <a 
                    href={`${getPocketBase().baseURL}/api/files/${m.collectionId}/${m.id}/${m.attachment}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-accent-text)] hover:underline truncate"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    {m.attachment}
                  </a>
                )}
                
                {/* Expand/Collapse button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent-text)] hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isExpanded 
                    ? (locale === "ar" ? "إخفاء التفاصيل" : "Hide Details") 
                    : (locale === "ar" ? "عرض التفاصيل والتعليقات" : "View Details & Comments")}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {/* Expanded content with full body and comments */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    {m.body && (
                      <div className="mb-4">
                        <RichContent html={m.body} />
                      </div>
                    )}
                    {m.link_url && (
                      <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-1.5 text-sm text-[var(--color-accent-text)] hover:underline">
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        {m.link_url}
                      </a>
                    )}
                    {m.attachment && (
                      <a 
                        href={`${getPocketBase().baseURL}/api/files/${m.collectionId}/${m.id}/${m.attachment}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-accent-text)] hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        {m.attachment}
                      </a>
                    )}
                    <Comments targetType="material" targetId={m.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
