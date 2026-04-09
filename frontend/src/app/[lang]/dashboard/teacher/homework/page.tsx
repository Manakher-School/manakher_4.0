"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { getDisplayName } from "@/lib/auth";
import { FileText, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/ui/rich-editor";
import { RichContent, stripHtml } from "@/components/ui/rich-content";

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

interface Homework {
  id: string;
  title: string;
  description: string;
  due_date: string;
  submission_type: "online" | "onsite";
  section: string;
  subject: string;
  created: string;
  expand?: { section?: Section; subject?: Subject };
}

interface Submission {
  id: string;
  content: string;
  status: "submitted" | "graded" | "late";
  grade: number | null;
  feedback: string;
  created: string;
  student: string;
  expand?: { student?: { id: string; name_ar: string; name_en: string; email: string } };
}

const EMPTY_FORM = {
  title: "",
  description: "",
  due_date: "",
  submission_type: "online" as Homework["submission_type"],
  section: "",
  subject: "",
};

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.teacher.homework;
  const common = dict.common;

  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedHw, setExpandedHw] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradeForms, setGradeForms] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [savingGrade, setSavingGrade] = useState<string | null>(null);

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
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
      ]);
      setSections(secs);
      setSubjects(subs);

      const hw = await pb.collection("homework").getFullList<Homework>({
        filter: `teacher = "${user.id}"`,
        sort: "-created",
        expand: "section,subject",
      });
      setHomeworkList(hw);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, locale]);

  useEffect(() => { load(); }, [load]);

  async function loadSubmissions(hwId: string) {
    if (expandedHw === hwId) {
      setExpandedHw(null);
      return;
    }
    setExpandedHw(hwId);
    setLoadingSubmissions(true);
    const pb = getPocketBase();
    try {
      const subs = await pb.collection("submissions").getFullList<Submission>({
        filter: `homework = "${hwId}"`,
        sort: "-created",
        expand: "student",
      });
      setSubmissions(subs);
      const gf: Record<string, { grade: string; feedback: string }> = {};
      subs.forEach((s) => {
        gf[s.id] = { grade: s.grade !== null ? String(s.grade) : "", feedback: s.feedback ?? "" };
      });
      setGradeForms(gf);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function saveGrade(subId: string) {
    setSavingGrade(subId);
    const pb = getPocketBase();
    const gf = gradeForms[subId];
    try {
      await pb.collection("submissions").update(subId, {
        grade: gf.grade ? Number(gf.grade) : null,
        feedback: gf.feedback,
        status: "graded",
      });
      // Refresh submissions
      if (expandedHw) await loadSubmissionsRefresh(expandedHw);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGrade(null);
    }
  }

  async function loadSubmissionsRefresh(hwId: string) {
    const pb = getPocketBase();
    const subs = await pb.collection("submissions").getFullList<Submission>({
      filter: `homework = "${hwId}"`,
      sort: "-created",
      expand: "student",
    });
    setSubmissions(subs);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(hw: Homework) {
    setForm({
      title: hw.title,
      description: hw.description ?? "",
      due_date: hw.due_date ? hw.due_date.slice(0, 10) : "",
      submission_type: hw.submission_type,
      section: hw.section,
      subject: hw.subject,
    });
    setEditingId(hw.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!user || !form.title || !form.section || !form.subject || !form.due_date) return;
    setSaving(true);
    const pb = getPocketBase();
    try {
      const payload = { ...form, teacher: user.id };
      if (editingId) {
        await pb.collection("homework").update(editingId, payload);
      } else {
        await pb.collection("homework").create(payload);
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
    await pb.collection("homework").delete(id);
    await load();
  }

  const statusVariant: Record<string, "default" | "accent"> = {
    submitted: "accent",
    graded: "default",
    late: "default",
  };

  const statusLabel: Record<string, string> = {
    submitted: t.statusSubmitted,
    graded: t.statusGraded,
    late: t.statusLate,
  };

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
              <Input label={t.hwTitle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t.phTitle} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSection}</label>
              <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                <option value="">—</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{sectionName(s)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSubject}</label>
              <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                <option value="">—</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{subjectName(s)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.dueDate}</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.submissionType}</label>
              <select value={form.submission_type} onChange={(e) => setForm((f) => ({ ...f, submission_type: e.target.value as Homework["submission_type"] }))} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
                <option value="online">{t.typeOnline}</option>
                <option value="onsite">{t.typeOnsite}</option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.description}</label>
              <RichEditor
                value={form.description}
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                placeholder={t.phDescription}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>{common.cancel}</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? common.loading : common.save}</Button>
          </div>
        </div>
      )}

      {/* Homework list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
        </div>
      ) : homeworkList.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {homeworkList.map((hw) => {
            const sec = hw.expand?.section;
            const sub = hw.expand?.subject;
            const isExpanded = expandedHw === hw.id;

            return (
              <div key={hw.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-teacher-bold)]" style={{ background: "var(--color-role-teacher-bg)" }}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{hw.title}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        {sec && <span>{locale === "ar" ? `${sec.grade_ar} — ${sec.section_ar}` : `${sec.grade_en} — ${sec.section_en}`}</span>}
                        {sub && <span>· {locale === "ar" ? sub.name_ar : sub.name_en}</span>}
                        <span>· {t.dueDate}: {hw.due_date?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <button onClick={() => loadSubmissions(hw.id)} className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]">
                      {t.submissions}
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <button onClick={() => openEdit(hw)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(hw.id)} className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Submissions panel */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] p-4 space-y-3">
                    {loadingSubmissions ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <p className="text-sm text-[var(--color-ink-secondary)]">{t.noSubmissions}</p>
                    ) : (
                      submissions.map((sub) => {
                        const student = sub.expand?.student;
                        const gf = gradeForms[sub.id] ?? { grade: "", feedback: "" };
                        return (
                          <div key={sub.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-[var(--color-ink)]">
                                  {student ? getDisplayName(student as any, locale) : sub.student}
                                </p>
                                <p className="text-xs text-[var(--color-ink-secondary)]">{t.submittedOn}: {sub.created?.slice(0, 10)}</p>
                              </div>
                              <Badge variant={statusVariant[sub.status] ?? "default"}>{statusLabel[sub.status] ?? sub.status}</Badge>
                            </div>
                            {sub.content && (
                              <p className="text-sm text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] px-3 py-2">
                                {stripHtml(sub.content)}
                              </p>
                            )}
                            <div className="flex gap-2 items-end flex-wrap">
                              <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.grade}</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={gf.grade}
                                  onChange={(e) => setGradeForms((gfs) => ({ ...gfs, [sub.id]: { ...gf, grade: e.target.value } }))}
                                  className="w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.feedback}</label>
                                <input
                                  type="text"
                                  value={gf.feedback}
                                  onChange={(e) => setGradeForms((gfs) => ({ ...gfs, [sub.id]: { ...gf, feedback: e.target.value } }))}
                                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                              </div>
                              <Button variant="primary" onClick={() => saveGrade(sub.id)} disabled={savingGrade === sub.id}>
                                {savingGrade === sub.id ? "..." : t.saveGrade}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
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
