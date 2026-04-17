"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { GraduationCap, Plus, Trash2, Pencil, Loader2, X, ChevronDown, Search } from "lucide-react";
import { FormErrorAlert, useFormError } from "@/components/ui/form-alerts";

interface Teacher {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  sections: string[];
  subjects: string[];
  expand?: {
    sections?: ClassSection[];
    subjects?: Subject[];
  };
}

interface ClassSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
  grade_order: number;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

const EMPTY_FORM = { name_ar: "", name_en: "", email: "", password: "", sections: [] as string[], subjects: [] as string[] };

function MultiSelect({
  label,
  options,
  selected,
  getLabel,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  getLabel: (id: string) => string;
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

   return (
     <div className="relative">
       <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{label}</label>
       <button
         type="button"
         onClick={() => setOpen(v => !v)}
         aria-label={`${label}, ${selected.length} selected`}
         aria-expanded={open}
         aria-haspopup="listbox"
         className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
       >
         <span className={["truncate", selected.length === 0 ? "text-[var(--color-ink-placeholder)]" : "text-[var(--color-ink)]"].join(" ")}>
           {selected.length === 0 ? "—" : selected.map(getLabel).join("، ")}
         </span>
         <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
       </button>
       {open && (
         <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]" role="listbox">
           {options.map(o => (
             <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm focus-within:bg-[var(--color-surface-hover)]">
               <input
                 type="checkbox"
                 checked={selected.includes(o.id)}
                 onChange={() => toggle(o.id)}
                 aria-label={o.label}
                 className="accent-[var(--color-accent)] h-3.5 w-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
               />
               <span>{o.label}</span>
             </label>
           ))}
         </div>
       )}
     </div>
   );
}

export default function TeachersPage() {
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.admin.teachers;
  const c = dict.common;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allSections, setAllSections] = useState<ClassSection[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const { error: formError, setError: setFormError, clearError: clearFormError } = useFormError();

  async function load() {
    setLoading(true);
    try {
      const [teachersRes, sectionsRes, subjectsRes] = await Promise.all([
        pb.collection("users").getFullList<Teacher>({
          filter: 'role = "teacher"',
          expand: "sections,subjects",
          sort: "name_ar",
        }),
        pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
      ]);
      setTeachers(teachersRes);
      setAllSections(sectionsRes);
      setAllSubjects(subjectsRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearFormError();
    setShowForm(true);
  }

  function openEdit(teacher: Teacher) {
    setEditingId(teacher.id);
    setForm({
      name_ar: teacher.name_ar,
      name_en: teacher.name_en,
      email: teacher.email,
      password: "",
      sections: teacher.sections ?? [],
      subjects: teacher.subjects ?? [],
    });
    clearFormError();
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearFormError();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFormError();
    setSaving(true);
    try {
      if (editingId) {
        const data: Record<string, unknown> = {
          name_ar: form.name_ar,
          name_en: form.name_en,
          email: form.email,
          sections: form.sections,
          subjects: form.subjects,
        };
        if (form.password) {
          data.password = form.password;
          data.passwordConfirm = form.password;
        }
        await pb.collection("users").update(editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: form.name_ar,
          name_en: form.name_en,
          email: form.email,
          password: form.password,
          passwordConfirm: form.password,
          role: "teacher",
          sections: form.sections,
          subjects: form.subjects,
          emailVisibility: true,
        });
      }
      closeForm();
      await load();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save teacher. Please try again.";
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    setDeletingId(id);
    try {
      // Cascade delete: Remove all teacher-related records before deleting the user
      
      // 1. Get all materials, homework, quizzes, exams, announcements created by this teacher
      const [materials, homework, quizzes, exams, announcements] = await Promise.all([
        pb.collection("materials").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("homework").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("quizzes").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("exam_schedules").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("announcements").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
      ]);
      
      // 2. Delete submissions for this teacher's homework (leaf node)
      for (const hw of homework) {
        try {
          const submissions = await pb.collection("submissions").getFullList({ filter: `homework = "${hw.id}"` }).catch(() => []);
          for (const sub of submissions) {
            try { await pb.collection("submissions").delete(sub.id); } catch (e) { /* silently skip */ }
          }
        } catch (e) { /* silently skip */ }
      }
      
      // 3. Delete homework records
      for (const hw of homework) {
        try { await pb.collection("homework").delete(hw.id); } catch (e) { /* silently skip */ }
      }
      
      // 4. Delete quiz attempts and questions for this teacher's quizzes
      for (const quiz of quizzes) {
        try {
          const questions = await pb.collection("quiz_questions").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
          for (const q of questions) {
            try { await pb.collection("quiz_questions").delete(q.id); } catch (e) { /* silently skip */ }
          }
          const attempts = await pb.collection("quiz_attempts").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
          for (const att of attempts) {
            try { await pb.collection("quiz_attempts").delete(att.id); } catch (e) { /* silently skip */ }
          }
        } catch (e) { /* silently skip */ }
      }
      
      // 5. Delete quizzes
      for (const quiz of quizzes) {
        try { await pb.collection("quizzes").delete(quiz.id); } catch (e) { /* silently skip */ }
      }
      
      // 6. Delete materials
      for (const mat of materials) {
        try { await pb.collection("materials").delete(mat.id); } catch (e) { /* silently skip */ }
      }
      
      // 7. Delete exam schedules
      for (const exam of exams) {
        try { await pb.collection("exam_schedules").delete(exam.id); } catch (e) { /* silently skip */ }
      }
      
       // 8. Delete announcements
       for (const ann of announcements) {
         try { await pb.collection("announcements").delete(ann.id); } catch (e) { /* silently skip */ }
       }
       
       // 9. Delete comments and reactions on teacher's content
       const contentIds = [...materials.map(m => m.id), ...announcements.map(a => a.id)];
       try {
         const comments = await pb.collection("comments").getFullList({}).catch(() => []);
         for (const comment of comments) {
           if (contentIds.includes(comment.target_id)) {
             try { await pb.collection("comments").delete(comment.id); } catch (e) { /* silently skip */ }
           }
         }
       } catch (e) { /* collection might not exist */ }
       
       try {
         const reactions = await pb.collection("reactions").getFullList({}).catch(() => []);
         for (const reaction of reactions) {
           if (contentIds.includes(reaction.target_id)) {
             try { await pb.collection("reactions").delete(reaction.id); } catch (e) { /* silently skip */ }
           }
         }
       } catch (e) { /* collection might not exist */ }
       
       // 10. Finally delete the teacher user
       await pb.collection("users").delete(id);
      setTeachers(s => s.filter(x => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const sectionOptions = allSections.map(s => ({
    id: s.id,
    label: locale === "ar" ? `${s.grade_ar} — ${s.section_ar}` : `${s.grade_en} — ${s.section_en}`,
  }));
  const subjectOptions = allSubjects.map(s => ({
    id: s.id,
    label: locale === "ar" ? s.name_ar : s.name_en,
  }));
  const getSectionLabel = (id: string) => sectionOptions.find(o => o.id === id)?.label ?? id;
  const getSubjectLabel = (id: string) => subjectOptions.find(o => o.id === id)?.label ?? id;

  // Filter teachers by search query
  const filteredTeachers = teachers.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.name_ar.toLowerCase().includes(query) ||
      t.name_en.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query)
    );
  });

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

  return (
    <div className="space-y-6">

       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
             <GraduationCap className="h-5 w-5 text-[var(--color-role-admin-bold)]" />
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

        {/* Search bar */}
        {teachers.length > 0 && (
          <div className="relative">
            <Search className="absolute inset-y-0 inset-x-0 ms-3 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" />
            <input
              type="text"
              placeholder={locale === "ar" ? "ابحث عن مدرس..." : "Search teachers..."}
              aria-label={locale === "ar" ? "ابحث عن مدرس" : "Search teachers"}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] ps-10 pe-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
        )}

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
          {formError && (
            <div className="mb-4">
              <FormErrorAlert error={formError} onDismiss={clearFormError} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameAr}</label>
              <input required value={form.name_ar} placeholder={t.phNameAr} onChange={e => setForm(f => ({...f, name_ar: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameEn}</label>
              <input required value={form.name_en} placeholder={t.phNameEn} onChange={e => setForm(f => ({...f, name_en: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.email}</label>
              <input required type="email" value={form.email} placeholder={t.phEmail} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                {editingId ? t.newPassword : t.password}
              </label>
              <input
                type="password"
                required={!editingId}
                minLength={editingId ? 0 : 8}
                value={form.password}
                placeholder={editingId ? t.phPassword : t.phPassword}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                className={inputCls}
                dir="ltr"
              />
            </div>
            <div>
              <MultiSelect
                label={t.assignedSections}
                options={sectionOptions}
                selected={form.sections}
                getLabel={getSectionLabel}
                onChange={ids => setForm(f => ({...f, sections: ids}))}
              />
            </div>
            <div>
              <MultiSelect
                label={t.assignedSubjects}
                options={subjectOptions}
                selected={form.subjects}
                getLabel={getSubjectLabel}
                onChange={ids => setForm(f => ({...f, subjects: ids}))}
              />
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
      ) : teachers.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-ink-disabled)]">{t.empty}</p>
      ) : filteredTeachers.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-ink-secondary)]">{locale === "ar" ? "لم يتم العثور على نتائج" : "No results found"}</p>
      ) : (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)] divide-y divide-[var(--color-border-subtle)]">
          {filteredTeachers.map(teacher => {
            const expandedSections = teacher.expand?.sections ?? [];
            const expandedSubjects = teacher.expand?.subjects ?? [];
            return (
              <div key={teacher.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-ink)] truncate">
                      {locale === "ar" ? teacher.name_ar : teacher.name_en}
                    </p>
                    <p className="text-xs text-[var(--color-ink-secondary)] truncate">{teacher.email}</p>
                    {expandedSections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {expandedSections.map(s => (
                          <span key={s.id} className="rounded-[var(--radius-full)] bg-[var(--color-role-admin-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-role-admin-text)]">
                            {locale === "ar" ? `${s.grade_ar} ${s.section_ar}` : `${s.grade_en} ${s.section_en}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {expandedSubjects.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {expandedSubjects.map(s => (
                          <span key={s.id} className="rounded-[var(--radius-full)] bg-[var(--color-role-teacher-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-role-teacher-text)]">
                            {locale === "ar" ? s.name_ar : s.name_en}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                   <div className="flex items-center gap-1 shrink-0">
                     <button
                       onClick={() => openEdit(teacher)}
                       aria-label={`${c.edit} ${locale === "ar" ? teacher.name_ar : teacher.name_en}`}
                       className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                     >
                       <Pencil className="h-3 w-3" />
                       {c.edit}
                     </button>
                     <button
                       onClick={() => handleDelete(teacher.id)}
                       disabled={deletingId === teacher.id}
                       aria-label={`${c.delete} ${locale === "ar" ? teacher.name_ar : teacher.name_en}`}
                       className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                     >
                       {deletingId === teacher.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                       {c.delete}
                     </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
