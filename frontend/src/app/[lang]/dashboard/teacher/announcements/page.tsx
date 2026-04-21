"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Bell, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LazyRichEditor } from "@/components/ui/lazy-rich-editor";
import { stripHtml, RichContent } from "@/components/ui/rich-content";
import { Comments } from "@/components/ui/comments";

interface Section {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: "global" | "section";
  section: string;
  created: string;
  expand?: { section?: Section };
}

const EMPTY_FORM = { title: "", body: "", scope: "global" as Announcement["scope"], section: "" };

export default function TeacherAnnouncementsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.teacher.announcements;
  const common = dict.common;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sectionName = (s: Section) =>
    locale === "ar" ? `${s.grade_ar} — ${s.section_ar}` : `${s.grade_en} — ${s.section_en}`;

  const load = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sectionIds: string[] = (user as any).sections ?? [];

    try {
      const secs =
        sectionIds.length > 0
          ? await pb.collection("class_sections").getFullList<Section>({
              filter: sectionIds.map((id) => `id = "${id}"`).join(" || "),
              sort: "grade_order,section_ar",
            })
          : [];
      setSections(secs);

      const anns = await pb.collection("announcements").getFullList<Announcement>({
        filter: `author = "${user.id}"`,
        sort: "-created",
        expand: "section",
      });
      setAnnouncements(anns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, locale]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setForm({ title: a.title, body: a.body, scope: a.scope, section: a.section ?? "" });
    setEditingId(a.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!user || !form.title || !form.body) return;
    setSaving(true);
    const pb = getPocketBase();
    try {
      const payload = {
        title: form.title,
        body: form.body,
        scope: form.scope,
        section: form.scope === "section" ? form.section : "",
        author: user.id,
      };
      if (editingId) {
        await pb.collection("announcements").update(editingId, payload);
      } else {
        await pb.collection("announcements").create(payload);
      }
      setShowForm(false);
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
    await pb.collection("announcements").delete(id);
    await load();
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-3 flex-wrap">
         <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
           {t.title}
         </h2>
         <Button variant="primary" onClick={openCreate} aria-label={t.add}>
           <Plus className="h-4 w-4" />
           {t.add}
         </Button>
       </div>

      {/* Form panel */}
      {showForm && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-black text-[var(--color-ink)]">{editingId ? t.editTitle : t.add}</h3>
             <button onClick={() => setShowForm(false)} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1" aria-label={common.cancel}>
               <X className="h-4 w-4" />
             </button>
           </div>

          <Input label={t.annTitle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t.phTitle} />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.scope}</label>
            <div className="flex gap-3">
              {(["global", "section"] as const).map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value={scope}
                    checked={form.scope === scope}
                    onChange={() => setForm((f) => ({ ...f, scope }))}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {scope === "global" ? t.scopeGlobal : t.scopeSection}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.scope === "section" && (
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSection}</label>
               <select
                 value={form.section}
                 onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                 aria-label={t.selectSection}
                 className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
               >
                <option value="">—</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{sectionName(s)}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.body}</label>
            <LazyRichEditor
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              placeholder={t.phBody}
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>{common.cancel}</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? common.loading : common.save}
            </Button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-5">
          {announcements.map((a) => {
            const sec = a.expand?.section;
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-6 py-5 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-teacher-bold)]" style={{ background: "var(--color-role-teacher-bg)" }}>
                      <Bell className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-lg text-[var(--color-ink)] leading-snug">{a.title}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        <span>{a.scope === "global" ? t.scopeGlobal : t.scopeSection}</span>
                        {sec && <span>· {locale === "ar" ? `${sec.grade_ar} — ${sec.section_ar}` : `${sec.grade_en} — ${sec.section_en}`}</span>}
                        <span>· {t.postedOn}: {a.created?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                   <div className="flex gap-1 shrink-0">
                     <button onClick={() => openEdit(a)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" aria-label={`${t.edit}: ${a.title}`}>
                       <Pencil className="h-3.5 w-3.5" />
                     </button>
                     <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label={`${common.delete}: ${a.title}`}>
                       <Trash2 className="h-3.5 w-3.5" />
                     </button>
                   </div>
                </div>
                {!isExpanded && <p className="mt-2 text-sm text-[var(--color-ink-secondary)] line-clamp-3">{stripHtml(a.body)}</p>}
                
                 {/* Expand/Collapse button */}
                 <button
                   onClick={() => setExpandedId(isExpanded ? null : a.id)}
                   className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent-text)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1"
                   aria-label={isExpanded ? (locale === "ar" ? "إخفاء التفاصيل" : "Hide Details") : (locale === "ar" ? "عرض التفاصيل والتعليقات" : "View Details & Comments")}
                   aria-expanded={isExpanded}
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
                    <div className="mb-4">
                      <RichContent html={a.body} />
                    </div>
                    <Comments targetType="announcement" targetId={a.id} />
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
