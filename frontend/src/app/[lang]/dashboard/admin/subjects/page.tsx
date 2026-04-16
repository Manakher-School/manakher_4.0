"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { BookOpen, Plus, Trash2, Pencil, Loader2, X } from "lucide-react";

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

const EMPTY_FORM = { name_ar: "", name_en: "", code: "" };

export default function SubjectsPage() {
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const t = dict.dashboard.admin.subjects;
  const c = dict.common;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const res = await pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" });
      setSubjects(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Subject) {
    setEditingId(s.id);
    setForm({ name_ar: s.name_ar, name_en: s.name_en, code: s.code });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await pb.collection("subjects").update(editingId, form);
      } else {
        await pb.collection("subjects").create(form);
      }
      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    // Enhanced confirmation for cascade delete
    const subject = subjects.find(s => s.id === id);
    const subjectName = subject ? (locale === "ar" ? subject.name_ar : subject.name_en) : "";
    
    const warningMsg = locale === "ar" 
      ? `تحذير: حذف المقرر "${subjectName}" سيؤدي إلى حذف جميع السجلات المرتبطة به:\n\n• المواد التعليمية\n• الواجبات\n• التسليمات\n• الاختبارات\n• جداول الامتحانات\n\nهل أنت متأكد من الحذف؟`
      : `Warning: Deleting subject "${subjectName}" will also delete all related records:\n\n• Learning materials\n• Homework\n• Submissions\n• Quizzes\n• Exam schedules\n\nAre you sure you want to delete?`;
    
    if (!(await confirm(warningMsg))) return;
    
    setDeletingId(id);
    try {
      // First, delete all related records
      // 1. Delete materials
      const materials = await pb.collection("materials").getFullList({ filter: `subject = "${id}"` });
      for (const m of materials) {
        await pb.collection("materials").delete(m.id);
      }
      
      // 2. Delete homework and their submissions
      const homework = await pb.collection("homework").getFullList({ filter: `subject = "${id}"` });
      for (const hw of homework) {
        const submissions = await pb.collection("submissions").getFullList({ filter: `homework = "${hw.id}"` });
        for (const sub of submissions) {
          await pb.collection("submissions").delete(sub.id);
        }
        await pb.collection("homework").delete(hw.id);
      }
      
      // 3. Delete quizzes and related data
      const quizzes = await pb.collection("quizzes").getFullList({ filter: `subject = "${id}"` });
      for (const quiz of quizzes) {
        const attempts = await pb.collection("quiz_attempts").getFullList({ filter: `quiz = "${quiz.id}"` });
        for (const att of attempts) {
          await pb.collection("quiz_attempts").delete(att.id);
        }
        const questions = await pb.collection("quiz_questions").getFullList({ filter: `quiz = "${quiz.id}"` });
        for (const q of questions) {
          await pb.collection("quiz_questions").delete(q.id);
        }
        await pb.collection("quizzes").delete(quiz.id);
      }
      
      // 4. Delete exam schedules
      const exams = await pb.collection("exam_schedules").getFullList({ filter: `subject = "${id}"` });
      for (const exam of exams) {
         await pb.collection("exam_schedules").delete(exam.id);
       }
       
       // 5. Delete comments and reactions on materials
       const materialIds = materials.map(m => m.id);
       try {
         const comments = await pb.collection("comments").getFullList({ 
           filter: `target_type = "material"` 
         });
         for (const comment of comments) {
           if (materialIds.includes(comment.target_id)) {
             try {
               await pb.collection("comments").delete(comment.id);
             } catch (e) {
               // Silently ignore if comment already deleted
             }
           }
         }
       } catch (e) {
         // Collection might not exist, continue
       }
       
       // Delete reactions
       try {
         const reactions = await pb.collection("reactions").getFullList({});
         for (const reaction of reactions) {
           if (materialIds.includes(reaction.target_id)) {
             try {
               await pb.collection("reactions").delete(reaction.id);
             } catch (e) {
               // Silently ignore if reaction already deleted
             }
           }
         }
       } catch (e) {
         // Collection might not exist, continue
       }
       
       // 6. Remove subject from users (teachers)
       const usersWithSubject = await pb.collection("users").getFullList({ filter: `subjects ~ "${id}"` });
       for (const user of usersWithSubject) {
         const updatedSubjects = (user.subjects as string[]).filter(s => s !== id);
         await pb.collection("users").update(user.id, { subjects: updatedSubjects });
       }
       
        // Finally, delete the subject itself
        await pb.collection("subjects").delete(id);
       setSubjects(s => s.filter(x => x.id !== id));
       
       await alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
     } catch (error) {
       console.error("Delete error:", error);
       await alert(locale === "ar" ? "فشل الحذف. يرجى المحاولة مرة أخرى." : "Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
            <BookOpen className="h-5 w-5 text-[var(--color-role-admin-bold)]" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">{t.title}</h2>
        </div>
         <button
           onClick={openCreate}
           className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
           aria-label={t.add}
         >
          <Plus className="h-4 w-4" />
          {t.add}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)]">
           <div className="mb-4 flex items-center justify-between">
             <h3 className="font-bold text-[var(--color-ink)]">{editingId ? t.editTitle : t.add}</h3>
             <button onClick={closeForm} className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1" aria-label={c.cancel}><X className="h-4 w-4" /></button>
           </div>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameAr}</label>
              <input required value={form.name_ar} placeholder={t.phNameAr} onChange={e => setForm(f => ({...f, name_ar: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameEn}</label>
              <input required value={form.name_en} placeholder={t.phNameEn} onChange={e => setForm(f => ({...f, name_en: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.code}</label>
              <input required value={form.code} placeholder={t.phCode} onChange={e => setForm(f => ({...f, code: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div className="sm:col-span-3 flex gap-2 justify-end pt-1">
              <button type="button" onClick={closeForm} className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">{c.cancel}</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {c.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" /></div>
      ) : subjects.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-ink-disabled)]">{t.empty}</p>
      ) : (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)] divide-y divide-[var(--color-border-subtle)]">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">{locale === "ar" ? s.name_ar : s.name_en}</p>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  {locale === "ar" ? s.name_en : s.name_ar}
                  {" · "}
                  <span className="font-mono">{s.code}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                 <button
                   onClick={() => openEdit(s)}
                   className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                   aria-label={`${c.edit}: ${locale === "ar" ? s.name_ar : s.name_en}`}
                 >
                  <Pencil className="h-3 w-3" />
                  {c.edit}
                </button>
                 <button
                   onClick={() => handleDelete(s.id)}
                   disabled={deletingId === s.id}
                   className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                   aria-label={`${c.delete}: ${locale === "ar" ? s.name_ar : s.name_en}`}
                 >
                  {deletingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  {c.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
