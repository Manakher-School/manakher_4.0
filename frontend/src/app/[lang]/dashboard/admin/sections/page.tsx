"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { Layers, Plus, Trash2, Pencil, Loader2, X } from "lucide-react";

interface ClassSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  grade_order: number;
  section_ar: string;
  section_en: string;
}

const EMPTY_FORM = { grade_ar: "", grade_en: "", grade_order: "", section_ar: "", section_en: "" };

export default function SectionsPage() {
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const t = dict.dashboard.admin.sections;
  const c = dict.common;

  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const res = await pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" });
      setSections(res);
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

  function openEdit(s: ClassSection) {
    setEditingId(s.id);
    setForm({
      grade_ar: s.grade_ar,
      grade_en: s.grade_en,
      grade_order: String(s.grade_order),
      section_ar: s.section_ar,
      section_en: s.section_en,
    });
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
        // Validate required fields (grade_order of 0 is valid for kindergarten)
        if (!form.grade_ar.trim() || !form.grade_en.trim() || form.grade_order === "" || !form.section_ar.trim() || !form.section_en.trim()) {
          await alert(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
          setSaving(false);
          return;
        }

         // Validate grade_order is a valid positive number
         const gradeOrder = Number(form.grade_order);
         if (isNaN(gradeOrder) || gradeOrder < 0) {
           await alert(locale === "ar" ? "رقم الصف يجب أن يكون رقماً موجباً" : "Grade order must be a positive number");
           setSaving(false);
           return;
         }

        // Check for duplicate section (same grade and section name in same language)
        const isDuplicate = sections.some(s => 
          s.id !== editingId && 
          s.grade_ar === form.grade_ar.trim() && 
          s.section_ar === form.section_ar.trim()
        );
        
        if (isDuplicate && !editingId) {
          await alert(locale === "ar" ? "هذا الفصل موجود بالفعل" : "This section already exists");
          setSaving(false);
          return;
        }

        const data = {
          grade_ar: form.grade_ar.trim(),
          grade_en: form.grade_en.trim(),
          grade_order: gradeOrder,
          section_ar: form.section_ar.trim(),
          section_en: form.section_en.trim(),
        };
        
        console.log("Submitting class data:", data);
        
        if (editingId) {
          await pb.collection("class_sections").update(editingId, data);
          await alert(locale === "ar" ? "تم تحديث الفصل بنجاح" : "Class updated successfully");
        } else {
          await pb.collection("class_sections").create(data);
          await alert(locale === "ar" ? "تم إضافة الفصل بنجاح" : "Class added successfully");
        }
        closeForm();
        await load();
     } catch (error) {
       // Extract detailed error message from PocketBase error
       let errorMsg = locale === "ar" ? "حدث خطأ ما" : "Something went wrong";
       if (error instanceof Error) {
         errorMsg = error.message;
         // Log to console for debugging
         console.error("Class creation error:", error);
         console.error("Error details:", {
           message: error.message,
           name: error.name,
           stack: error.stack,
         });
       } else if (typeof error === 'object' && error !== null) {
         const err = error as any;
         // Try to extract PocketBase validation errors
         if (err.data?.data) {
           // PocketBase field validation errors
           const fieldErrors = Object.entries(err.data.data)
             .map(([field, detail]: [string, any]) => `${field}: ${detail?.message || detail}`)
             .join(", ");
           errorMsg = fieldErrors;
         } else if (err.data?.message) {
           errorMsg = err.data.message;
         } else if (err.response?.message) {
           errorMsg = err.response.message;
         } else if (err.message) {
           errorMsg = err.message;
         }
         console.error("Class creation error object:", err);
         console.error("Full error response:", {
           message: err.message,
           status: err.status,
           data: err.data,
           response: err.response,
         });
       }
       await alert(locale === "ar" ? `خطأ: ${errorMsg}` : `Error: ${errorMsg}`);
     } finally {
       setSaving(false);
     }
   }

  async function handleDelete(id: string) {
    // Enhanced confirmation for cascade delete
    const section = sections.find(s => s.id === id);
    const sectionName = section ? (locale === "ar" ? `${section.grade_ar} — ${section.section_ar}` : `${section.grade_en} — ${section.section_en}`) : "";
    
    const warningMsg = locale === "ar" 
      ? `تحذير: حذف ${sectionName} سيؤدي إلى حذف جميع السجلات المرتبطة به:\n\n• المواد التعليمية\n• الواجبات\n• التسليمات\n• الإعلانات\n• التعيينات\n\nهل أنت متأكد من الحذف؟`
      : `Warning: Deleting ${sectionName} will also delete all related records:\n\n• Learning materials\n• Homework\n• Submissions\n• Announcements\n• Assignments\n\nAre you sure you want to delete?`;
    
    if (!(await confirm(warningMsg))) return;
    
    setDeletingId(id);
    try {
      // First, delete all related records
      // 1. Delete materials
      const materials = await pb.collection("materials").getFullList({ filter: `section = "${id}"` });
      for (const m of materials) {
        await pb.collection("materials").delete(m.id);
      }
      
      // 2. Delete homework and their submissions
      const homework = await pb.collection("homework").getFullList({ filter: `section = "${id}"` });
      for (const hw of homework) {
        const submissions = await pb.collection("submissions").getFullList({ filter: `homework = "${hw.id}"` });
        for (const sub of submissions) {
          await pb.collection("submissions").delete(sub.id);
        }
        await pb.collection("homework").delete(hw.id);
      }
      
      // 3. Delete announcements
      const announcements = await pb.collection("announcements").getFullList({ filter: `section = "${id}"` });
      for (const ann of announcements) {
        await pb.collection("announcements").delete(ann.id);
      }
      
      // 4. Delete quizzes and related data
      const quizzes = await pb.collection("quizzes").getFullList({ filter: `section = "${id}"` });
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
      
      // 5. Delete exam schedules
      const exams = await pb.collection("exam_schedules").getFullList({ filter: `section = "${id}"` });
      for (const exam of exams) {
        await pb.collection("exam_schedules").delete(exam.id);
      }
      
       // 6. Delete comments and reactions on materials/announcements
       const comments = await pb.collection("comments").getFullList({ 
         filter: `target_type = "material" || target_type = "announcement"` 
       });
       // Get IDs of all materials and announcements we just deleted
       const deletedMaterialIds = materials.map(m => m.id);
       const deletedAnnIds = announcements.map(a => a.id);
       for (const comment of comments) {
         if (deletedMaterialIds.includes(comment.target_id) || deletedAnnIds.includes(comment.target_id)) {
           try {
             await pb.collection("comments").delete(comment.id);
           } catch (e) {
             // Silently ignore if comment already deleted
           }
         }
       }
       
       // Delete reactions
       const reactions = await pb.collection("reactions").getFullList({});
       for (const reaction of reactions) {
         if (deletedMaterialIds.includes(reaction.target_id) || deletedAnnIds.includes(reaction.target_id)) {
           try {
             await pb.collection("reactions").delete(reaction.id);
           } catch (e) {
             // Silently ignore if reaction already deleted
           }
         }
       }
       
       // 7. Remove section from users (teachers and students)
       const usersWithSection = await pb.collection("users").getFullList({ filter: `sections ~ "${id}"` });
       for (const user of usersWithSection) {
         const updatedSections = (user.sections as string[]).filter(s => s !== id);
         await pb.collection("users").update(user.id, { sections: updatedSections });
       }
       
       // Finally, delete the section itself
       await pb.collection("class_sections").delete(id);
      setSections(s => s.filter(x => x.id !== id));
      
      await alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      await alert(locale === "ar" ? "فشل الحذف. يرجى المحاولة مرة أخرى." : "Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const byGrade = sections.reduce<Record<number, ClassSection[]>>((acc, s) => {
    if (!acc[s.grade_order]) acc[s.grade_order] = [];
    acc[s.grade_order].push(s);
    return acc;
  }, {});
  const gradeKeys = Object.keys(byGrade).map(Number).sort((a, b) => a - b);

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

  return (
    <div className="space-y-6">

       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
             <Layers className="h-5 w-5 text-[var(--color-role-admin-bold)]" />
           </div>
           <h2 className="text-xl font-black text-[var(--color-ink)]">{t.title}</h2>
         </div>
         <button
           onClick={openCreate}
           aria-label={t.add}
           className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
             <button
               onClick={closeForm}
               aria-label={c.cancel}
               className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
             >
               <X className="h-4 w-4" />
             </button>
           </div>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.gradeAr}</label>
              <input required value={form.grade_ar} placeholder={t.phGradeAr} onChange={e => setForm(f => ({...f, grade_ar: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.gradeEn}</label>
              <input required value={form.grade_en} placeholder={t.phGradeEn} onChange={e => setForm(f => ({...f, grade_en: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
             <div>
               <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.gradeOrder}</label>
               <input required type="number" min={0} value={form.grade_order} placeholder={t.phGradeOrder} onChange={e => setForm(f => ({...f, grade_order: e.target.value}))} className={inputCls} dir="ltr" />
             </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.sectionAr}</label>
              <input required value={form.section_ar} placeholder={t.phSectionAr} onChange={e => setForm(f => ({...f, section_ar: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.sectionEn}</label>
              <input required value={form.section_en} placeholder={t.phSectionEn} onChange={e => setForm(f => ({...f, section_en: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
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
      ) : sections.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-ink-disabled)]">{t.empty}</p>
      ) : (
        <div className="space-y-4">
          {gradeKeys.map(gk => {
            const gradeItems = byGrade[gk];
            const g = gradeItems[0];
            const gradeName = locale === "ar" ? g.grade_ar : g.grade_en;
            return (
              <div key={gk} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]">
                <div className="px-4 py-3 bg-[var(--color-role-admin-card)] border-b border-[var(--color-border)]">
                  <span className="text-sm font-black text-[var(--color-role-admin-text)]">{gradeName}</span>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {gradeItems.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">
                        {locale === "ar" ? s.section_ar : s.section_en}
                      </span>
                       <div className="flex items-center gap-1">
                         <button
                           onClick={() => openEdit(s)}
                           aria-label={`${c.edit} ${locale === "ar" ? s.section_ar : s.section_en}`}
                           className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                         >
                           <Pencil className="h-3 w-3" />
                           {c.edit}
                         </button>
                         <button
                           onClick={() => handleDelete(s.id)}
                           disabled={deletingId === s.id}
                           aria-label={`${c.delete} ${locale === "ar" ? s.section_ar : s.section_en}`}
                           className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                         >
                           {deletingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                           {c.delete}
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
