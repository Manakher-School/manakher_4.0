"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { Plus, Trash2, Pencil, Loader2, X, ChevronDown, Search, Upload } from "lucide-react";
import { useCrudState, useFormState, useFilterState, useTabState } from "@/lib/hooks";
import { parseStudentCSV, readFileAsText } from "@/lib/csv-parser";

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

interface Student {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  sections: string[];
  expand?: {
    sections?: ClassSection[];
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

const EMPTY_TEACHER_FORM = { name_ar: "", name_en: "", email: "", password: "", sections: [] as string[], subjects: [] as string[] };
const EMPTY_STUDENT_FORM = { name_ar: "", name_en: "", email: "", password: "", sections: [] as string[] };

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

function SingleSelect({
  label,
  options,
  selected,
  getLabel,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string;
  getLabel: (id: string) => string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
     <div className="relative">
       <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{label}</label>
       <button
         type="button"
         onClick={() => setOpen(v => !v)}
         aria-label={`${label}, ${selected ? getLabel(selected) : "not selected"}`}
         aria-expanded={open}
         aria-haspopup="listbox"
         className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
       >
         <span className={selected ? "text-[var(--color-ink)]" : "text-[var(--color-ink-placeholder)]"}>
           {selected ? getLabel(selected) : "—"}
         </span>
         <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
       </button>
       {open && (
         <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]" role="listbox">
           {options.map(o => (
             <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm focus-within:bg-[var(--color-surface-hover)]">
               <input
                 type="radio"
                 name="section"
                 checked={selected === o.id}
                 onChange={() => { onChange(o.id); setOpen(false); }}
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

export default function UsersPage() {
  const { dict, locale } = useLocale();
  const { confirm, alert } = useDialog();
  const c = dict.common;

  // Tab state
  const { state: tabState, setActiveTab } = useTabState("teachers");
  const tab = tabState.activeTab as "teachers" | "students";

  // Teachers CRUD state
  const teachersCrud = useCrudState();
  const teachersForm = useFormState(EMPTY_TEACHER_FORM);
  const teachersFilter = useFilterState({ searchTerm: "", page: 1, perPage: 999 });

  // Teachers data state
  const [teachersData, setTeachersData] = useState<{ items: Teacher[]; sections: ClassSection[]; subjects: Subject[] }>({ items: [], sections: [], subjects: [] });

  // Students CRUD state
  const studentsCrud = useCrudState();
  const studentsForm = useFormState(EMPTY_STUDENT_FORM);
  const studentsFilter = useFilterState({ searchTerm: "", page: 1, perPage: 999 });

  // Students data state
  const [studentsData, setStudentsData] = useState<{ items: Student[]; sections: ClassSection[] }>({ items: [], sections: [] });

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const t_teachers = dict.dashboard.admin.teachers;
  const t_students = dict.dashboard.admin.students;

  async function loadTeachers() {
    teachersCrud.setIsLoading(true);
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
      setTeachersData({ items: teachersRes, sections: sectionsRes, subjects: subjectsRes });
    } catch (err) {
      teachersCrud.setError("Failed to load teachers");
    } finally {
      teachersCrud.setIsLoading(false);
    }
  }

  async function loadStudents() {
    studentsCrud.setIsLoading(true);
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        pb.collection("users").getFullList<Student>({
          filter: 'role = "student"',
          expand: "sections",
          sort: "name_ar",
        }),
        pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
      ]);
      setStudentsData({ items: studentsRes, sections: sectionsRes });
    } catch (err) {
      studentsCrud.setError("Failed to load students");
    } finally {
      studentsCrud.setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
    loadStudents();
  }, []);

  // Teachers functions
  function openCreateTeacher() {
    teachersCrud.setEditingId(null);
    teachersForm.reset();
    teachersCrud.setShowCreate(true);
  }

  function openEditTeacher(teacher: Teacher) {
    teachersCrud.setEditingId(teacher.id);
    teachersForm.setData({
      name_ar: teacher.name_ar,
      name_en: teacher.name_en,
      email: teacher.email,
      password: "",
      sections: teacher.sections ?? [],
      subjects: teacher.subjects ?? [],
    });
    teachersCrud.setShowCreate(true);
  }

  function closeTeacherForm() {
    teachersCrud.setShowCreate(false);
    teachersCrud.setEditingId(null);
    teachersForm.reset();
  }

  async function handleTeacherSubmit(e: React.FormEvent) {
    e.preventDefault();
    teachersCrud.setIsLoading(true);
    try {
      if (teachersCrud.state.editingId) {
        const data: Record<string, unknown> = {
          name_ar: teachersForm.state.data.name_ar,
          name_en: teachersForm.state.data.name_en,
          email: teachersForm.state.data.email,
          sections: teachersForm.state.data.sections,
          subjects: teachersForm.state.data.subjects,
        };
        if (teachersForm.state.data.password) {
          data.password = teachersForm.state.data.password;
          data.passwordConfirm = teachersForm.state.data.password;
        }
        await pb.collection("users").update(teachersCrud.state.editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: teachersForm.state.data.name_ar,
          name_en: teachersForm.state.data.name_en,
          email: teachersForm.state.data.email,
          password: teachersForm.state.data.password,
          passwordConfirm: teachersForm.state.data.password,
          role: "teacher",
          sections: teachersForm.state.data.sections,
          subjects: teachersForm.state.data.subjects,
          emailVisibility: true,
        });
      }
      closeTeacherForm();
      await loadTeachers();
    } catch (err) {
      teachersCrud.setError(`Failed to save teacher: ${err}`);
    } finally {
      teachersCrud.setIsLoading(false);
    }
  }

  async function handleTeacherDelete(id: string) {
    if (!(await confirm(t_teachers.confirmDelete))) return;
    teachersCrud.setEditingId(id);
    try {
      // Cascade delete: Remove all teacher-related records
      const [materials, homework, quizzes, exams, announcements] = await Promise.all([
        pb.collection("materials").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("homework").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("quizzes").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("exam_schedules").getFullList({ filter: `subject.teacher = "${id}"` }).catch(() => []),
        pb.collection("announcements").getFullList({ filter: `author = "${id}"` }).catch(() => []),
      ]);

      // Delete submissions
      const submissions = await pb.collection("submissions").getFullList({ filter: `homework.teacher = "${id}"` }).catch(() => []);
      for (const sub of submissions) {
        try { await pb.collection("submissions").delete(sub.id); } catch {}
      }

      // Delete quiz attempts and questions
      for (const quiz of quizzes) {
        const attempts = await pb.collection("quiz_attempts").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
        for (const att of attempts) {
          try { await pb.collection("quiz_attempts").delete(att.id); } catch {}
        }
        const questions = await pb.collection("quiz_questions").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
        for (const q of questions) {
          try { await pb.collection("quiz_questions").delete(q.id); } catch {}
        }
        try { await pb.collection("quizzes").delete(quiz.id); } catch {}
      }

      // Delete other records
      for (const m of materials) { try { await pb.collection("materials").delete(m.id); } catch {} }
      for (const h of homework) { try { await pb.collection("homework").delete(h.id); } catch {} }
      for (const e of exams) { try { await pb.collection("exam_schedules").delete(e.id); } catch {} }
      for (const a of announcements) { try { await pb.collection("announcements").delete(a.id); } catch {} }

      // Delete teacher record
      await pb.collection("users").delete(id);
      await loadTeachers();
    } catch (err) {
      teachersCrud.setError(`Failed to delete teacher: ${err}`);
    } finally {
      teachersCrud.setEditingId(null);
    }
  }

  // Students functions
  function openCreateStudent() {
    studentsCrud.setEditingId(null);
    studentsForm.reset();
    studentsCrud.setShowCreate(true);
  }

  function openEditStudent(student: Student) {
    studentsCrud.setEditingId(student.id);
    studentsForm.setData({
      name_ar: student.name_ar,
      name_en: student.name_en,
      email: student.email,
      password: "",
      sections: student.sections ?? [],
    });
    studentsCrud.setShowCreate(true);
  }

  function closeStudentForm() {
    studentsCrud.setShowCreate(false);
    studentsCrud.setEditingId(null);
    studentsForm.reset();
  }

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    studentsCrud.setIsLoading(true);
    try {
      if (studentsCrud.state.editingId) {
        const data: Record<string, unknown> = {
          name_ar: studentsForm.state.data.name_ar,
          name_en: studentsForm.state.data.name_en,
          email: studentsForm.state.data.email,
          sections: studentsForm.state.data.sections,
        };
        if (studentsForm.state.data.password) {
          data.password = studentsForm.state.data.password;
          data.passwordConfirm = studentsForm.state.data.password;
        }
        await pb.collection("users").update(studentsCrud.state.editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: studentsForm.state.data.name_ar,
          name_en: studentsForm.state.data.name_en,
          email: studentsForm.state.data.email,
          password: studentsForm.state.data.password,
          passwordConfirm: studentsForm.state.data.password,
          role: "student",
          sections: studentsForm.state.data.sections,
          emailVisibility: true,
        });
      }
      closeStudentForm();
      await loadStudents();
    } catch (err) {
      studentsCrud.setError(`Failed to save student: ${err}`);
    } finally {
      studentsCrud.setIsLoading(false);
    }
  }

  async function handleStudentDelete(id: string) {
    if (!(await confirm(t_students.confirmDelete))) return;
    studentsCrud.setEditingId(id);
    try {
      // Cascade delete for student
      const [submissions, attempts, comments, reactions] = await Promise.all([
        pb.collection("submissions").getFullList({ filter: `student = "${id}"` }).catch(() => []),
        pb.collection("quiz_attempts").getFullList({ filter: `student = "${id}"` }).catch(() => []),
        pb.collection("comments").getFullList({ filter: `author = "${id}"` }).catch(() => []),
        pb.collection("reactions").getFullList({ filter: `user = "${id}"` }).catch(() => []),
      ]);

      for (const s of submissions) { try { await pb.collection("submissions").delete(s.id); } catch {} }
      for (const a of attempts) { try { await pb.collection("quiz_attempts").delete(a.id); } catch {} }
      for (const c of comments) { try { await pb.collection("comments").delete(c.id); } catch {} }
      for (const r of reactions) { try { await pb.collection("reactions").delete(r.id); } catch {} }

      await pb.collection("users").delete(id);
       await loadStudents();
     } catch (err) {
       studentsCrud.setError(`Failed to delete student: ${err}`);
     } finally {
       studentsCrud.setEditingId(null);
     }
   }

    async function handleCsvImport() {
      if (!csvFile) return;
      setCsvImporting(true);
      setCsvError(null);
      try {
        const csvContent = await readFileAsText(csvFile);
        const rows = parseStudentCSV(csvContent);
        
        // Validate we have data
        if (!rows || rows.length === 0) {
          throw new Error(locale === "ar" ? "لا توجد بيانات صحيحة في الملف" : "No valid data found in file");
        }

        // Show preview and allow user to confirm
        const previewCount = Math.min(rows.length, 5);
        const previewList = rows.slice(0, previewCount)
          .map((r, i) => `${i + 1}. ${r.name_ar}`)
          .join('\n');
        
        const confirmMsg = locale === "ar" 
          ? `سيتم إنشاء ${rows.length} طالب/طالبة جديد/جديدة:\n\n${previewList}${rows.length > 5 ? `\n... و ${rows.length - 5} آخرين` : ''}\n\nهل تريد المتابعة؟`
          : `Will create ${rows.length} new students:\n\n${previewList}${rows.length > 5 ? `\n... and ${rows.length - 5} more` : ''}\n\nContinue?`;
        
        if (!(await confirm(confirmMsg))) {
          setCsvImporting(false);
          return;
        }

        // Create students - use auto-generated email and password
        let created = 0;
        let failed = 0;
        const failedNames: string[] = [];
        
        for (const row of rows) {
          try {
            // Generate email from name
            const sanitizedName = row.name_ar
              .replace(/\s+/g, '_')
              .replace(/[^\u0600-\u06FF\w_]/g, '')
              .toLowerCase();
            const email = `${sanitizedName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@school.local`;
            const password = Math.random().toString(36).slice(-8);
            
            await pb.collection("users").create({
              name_ar: row.name_ar,
              name_en: row.name_ar, // Use Arabic name as fallback for English
              email: email,
              password: password,
              passwordConfirm: password,
              role: "student",
              sections: studentsData.sections.length > 0 ? [studentsData.sections[0].id] : [],
              emailVisibility: false,
            });
            created++;
          } catch (err) {
            failed++;
            failedNames.push(row.name_ar);
            console.error(`Failed to create student ${row.name_ar}:`, err);
          }
        }
        
        const resultMsg = locale === "ar"
          ? `تم إنشاء ${created} من أصل ${rows.length} طالب/طالبة بنجاح${failed > 0 ? `\n\nفشل في إنشاء: ${failedNames.slice(0, 3).join(', ')}${failedNames.length > 3 ? ' وآخرين' : ''}` : ''}`
          : `Successfully created ${created} out of ${rows.length} students${failed > 0 ? `\n\nFailed: ${failedNames.slice(0, 3).join(', ')}${failedNames.length > 3 ? ' and others' : ''}` : ''}`;
        
        await alert(resultMsg);
        setCsvFile(null);
        setShowCsvImport(false);
        await loadStudents();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setCsvError(errorMsg);
      } finally {
        setCsvImporting(false);
      }
    }

  const filteredTeachers = teachersData.items.filter(t =>
    `${t.name_ar} ${t.name_en} ${t.email}`.toLowerCase().includes(teachersFilter.state.searchTerm.toLowerCase())
  );

  const filteredStudents = studentsData.items.filter(s =>
    `${s.name_ar} ${s.name_en} ${s.email}`.toLowerCase().includes(studentsFilter.state.searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 font-semibold transition-colors ${
            tab === "teachers"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)]"
          }`}
        >
          {t_teachers.title}
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 font-semibold transition-colors ${
            tab === "students"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)]"
          }`}
        >
          {t_students.title}
        </button>
      </div>

      {/* Teachers Tab */}
      {tab === "teachers" && (
        <div>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute inset-y-0 inset-x-0 ms-3 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" />
                <input
                  type="text"
                  placeholder={c.search}
                  value={teachersFilter.state.searchTerm}
                  onChange={e => teachersFilter.setSearchTerm(e.target.value)}
                  className="w-full ps-10 pe-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
             <button
               onClick={openCreateTeacher}
                aria-label={t_teachers.add}
               className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
             >
               <Plus className="h-4 w-4" />
               {t_teachers.add}
             </button>
           </div>

          {teachersCrud.state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <p className="text-center py-8 text-[var(--color-ink-secondary)]">{t_teachers.empty}</p>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{teacher.name_en}</h3>
                      <p className="text-sm text-[var(--color-ink-secondary)]">{teacher.name_ar}</p>
                      <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{teacher.email}</p>
                       {teacher.expand?.sections?.length ? (
                         <div className="mt-2 flex flex-wrap gap-1">
                           {teacher.expand.sections.map(s => (
                             <span key={s.id} className="inline-block rounded bg-[var(--color-accent)] bg-opacity-20 px-2 py-0.5 text-xs font-semibold text-white">
                               {s.section_en}
                             </span>
                           ))}
                         </div>
                       ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditTeacher(teacher)}
                        className="rounded bg-[var(--color-accent)] p-2 text-white transition-opacity hover:opacity-80"
                        title={c.edit}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTeacherDelete(teacher.id)}
                        disabled={teachersCrud.state.editingId === teacher.id}
                        className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        title={c.delete}
                      >
                        {teachersCrud.state.editingId === teacher.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Form Modal */}
          {teachersCrud.state.showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{teachersCrud.state.editingId ? t_teachers.editTitle : t_teachers.add}</h2>
                  <button onClick={closeTeacherForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameAr}</label>
                    <input
                      type="text"
                      value={teachersForm.state.data.name_ar}
                      onChange={e => teachersForm.setFieldValue("name_ar", e.target.value)}
                      placeholder={t_teachers.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameEn}</label>
                    <input
                      type="text"
                      value={teachersForm.state.data.name_en}
                      onChange={e => teachersForm.setFieldValue("name_en", e.target.value)}
                      placeholder={t_teachers.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.email}</label>
                    <input
                      type="email"
                      value={teachersForm.state.data.email}
                      onChange={e => teachersForm.setFieldValue("email", e.target.value)}
                      placeholder={t_teachers.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {teachersCrud.state.editingId ? t_teachers.newPassword : t_teachers.password}
                    </label>
                    <input
                      type="password"
                      value={teachersForm.state.data.password}
                      onChange={e => teachersForm.setFieldValue("password", e.target.value)}
                      placeholder={t_teachers.phPassword}
                      required={!teachersCrud.state.editingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <MultiSelect
                    label={t_teachers.assignedSections}
                    options={teachersData.sections.map(s => ({ id: s.id, label: `${s.grade_en} ${s.section_en}` }))}
                    selected={teachersForm.state.data.sections}
                    getLabel={id => {
                      const s = teachersData.sections.find(x => x.id === id);
                      return s ? `${s.grade_en} ${s.section_en}` : id;
                    }}
                    onChange={sections => teachersForm.setFieldValue("sections", sections)}
                  />
                  <MultiSelect
                    label={t_teachers.assignedSubjects}
                    options={teachersData.subjects.map(s => ({ id: s.id, label: s.name_en }))}
                    selected={teachersForm.state.data.subjects}
                    getLabel={id => {
                      const s = teachersData.subjects.find(x => x.id === id);
                      return s ? s.name_en : id;
                    }}
                    onChange={subjects => teachersForm.setFieldValue("subjects", subjects)}
                  />
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeTeacherForm}
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {c.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={teachersCrud.state.isLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {teachersCrud.state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {c.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

       {/* Students Tab */}
       {tab === "students" && (
          <div>
            <div className="mb-4 flex items-center justify-center gap-3 flex-wrap">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute inset-y-0 inset-x-0 ms-3 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" />
                <input
                  type="text"
                  placeholder={c.search}
                  value={studentsFilter.state.searchTerm}
                  onChange={e => studentsFilter.setSearchTerm(e.target.value)}
                  className="w-full ps-10 pe-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <button
                onClick={openCreateStudent}
                 aria-label={t_students.add}
                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <Plus className="h-4 w-4" />
                {t_students.add}
              </button>
              <button
                onClick={() => setShowCsvImport(true)}
                 aria-label="Import students from CSV"
                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-role-admin-bold)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
            </div>

          {studentsCrud.state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-8 text-[var(--color-ink-secondary)]">{t_students.empty}</p>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map(student => (
                <div key={student.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{student.name_en}</h3>
                      <p className="text-sm text-[var(--color-ink-secondary)]">{student.name_ar}</p>
                      <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{student.email}</p>
                      {student.expand?.sections?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {student.expand.sections.map(s => (
                            <span key={s.id} className="inline-block rounded bg-[var(--color-accent)] bg-opacity-20 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                              {s.section_en}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditStudent(student)}
                        className="rounded bg-[var(--color-accent)] p-2 text-white transition-opacity hover:opacity-80"
                        title={c.edit}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStudentDelete(student.id)}
                        disabled={studentsCrud.state.editingId === student.id}
                        className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        title={c.delete}
                      >
                        {studentsCrud.state.editingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student Form Modal */}
          {studentsCrud.state.showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{studentsCrud.state.editingId ? t_students.editTitle : t_students.add}</h2>
                  <button onClick={closeStudentForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameAr}</label>
                    <input
                      type="text"
                      value={studentsForm.state.data.name_ar}
                      onChange={e => studentsForm.setFieldValue("name_ar", e.target.value)}
                      placeholder={t_students.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameEn}</label>
                    <input
                      type="text"
                      value={studentsForm.state.data.name_en}
                      onChange={e => studentsForm.setFieldValue("name_en", e.target.value)}
                      placeholder={t_students.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.email}</label>
                    <input
                      type="email"
                      value={studentsForm.state.data.email}
                      onChange={e => studentsForm.setFieldValue("email", e.target.value)}
                      placeholder={t_students.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {studentsCrud.state.editingId ? t_students.newPassword : t_students.password}
                    </label>
                    <input
                      type="password"
                      value={studentsForm.state.data.password}
                      onChange={e => studentsForm.setFieldValue("password", e.target.value)}
                      placeholder={t_students.phPassword}
                      required={!studentsCrud.state.editingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <SingleSelect
                    label={t_students.assignedSection}
                    options={studentsData.sections.map(s => ({ id: s.id, label: `${s.grade_en} ${s.section_en}` }))}
                    selected={studentsForm.state.data.sections[0] || ""}
                    getLabel={id => {
                      const s = studentsData.sections.find(x => x.id === id);
                      return s ? `${s.grade_en} ${s.section_en}` : id;
                    }}
                    onChange={section => studentsForm.setFieldValue("sections", [section])}
                  />
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeStudentForm}
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {c.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={studentsCrud.state.isLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {studentsCrud.state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {c.save}
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           )}

           {/* CSV Import Modal */}
           {showCsvImport && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
               <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 w-full max-w-md shadow-lg">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-[var(--color-ink)]">Import Students from CSV</h3>
                   <button
                     onClick={() => {
                       setShowCsvImport(false);
                       setCsvFile(null);
                       setCsvError(null);
                     }}
                     className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                   >
                     <X className="h-5 w-5" />
                   </button>
                 </div>

                  <div className="space-y-4">
                    <div className="text-sm text-[var(--color-ink-secondary)]">
                      <p className="mb-2 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "تنسيقات مقبولة:" : "Accepted formats:"}</p>
                      <ul className="list-disc list-inside space-y-1 text-xs mb-3">
                        <li>CSV (.csv)</li>
                        <li>Excel (.xlsx, .xls)</li>
                        <li>Google Sheets (exported as CSV)</li>
                      </ul>
                      <p className="mb-2 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "العمود المطلوب:" : "Required column:"}</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><code>الاسم</code> {locale === "ar" ? "- الاسم بالعربية" : "- Arabic name"}</li>
                      </ul>
                      <p className="mt-3 text-xs text-[var(--color-ink-secondary)]">{locale === "ar" ? "سيتم استخراج الأسماء من العمود 'الاسم' فقط وتخطي أي أعمدة أخرى." : "Only the 'الاسم' column will be extracted. Other columns are ignored."}</p>
                    </div>

                    <div className="rounded-lg border-2 border-dashed border-[var(--color-border)] p-4 text-center cursor-pointer hover:border-[var(--color-accent)]"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            // Validate file type
                            const validTypes = ['.csv', '.xlsx', '.xls'];
                            const validMimes = [
                              'text/csv',
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                              'application/vnd.ms-excel'
                            ];
                            const fileName = file.name.toLowerCase();
                            const isValidType = validTypes.some(ext => fileName.endsWith(ext)) || 
                                               validMimes.includes(file.type);
                            
                            if (!isValidType) {
                              setCsvError(locale === "ar" ? "نوع الملف غير مدعوم. يرجى استخدام CSV أو Excel." : "Unsupported file type. Please use CSV or Excel.");
                              return;
                            }
                            setCsvFile(file);
                            setCsvError(null);
                          }
                        };
                        input.click();
                      }}
                    >
                      {csvFile ? (
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-accent)]">{csvFile.name}</p>
                          <p className="text-xs text-[var(--color-ink-secondary)]">{locale === "ar" ? "اضغط لتغيير" : "Click to change"}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">{locale === "ar" ? "اختر ملف CSV أو Excel" : "Select CSV or Excel file"}</p>
                          <p className="text-xs text-[var(--color-ink-secondary)]">{locale === "ar" ? "أو اسحب وأفلت" : "or drag & drop"}</p>
                        </div>
                      )}
                    </div>

                   {csvError && (
                     <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                       {csvError}
                     </div>
                   )}

                   <div className="flex gap-2">
                     <button
                       onClick={() => {
                         setShowCsvImport(false);
                         setCsvFile(null);
                         setCsvError(null);
                       }}
                       className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                     >
                       Cancel
                     </button>
                     <button
                       onClick={handleCsvImport}
                       disabled={!csvFile || csvImporting}
                       className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {csvImporting ? (
                         <>
                           <Loader2 className="h-4 w-4 animate-spin" />
                           Importing...
                         </>
                       ) : (
                         <>
                           <Upload className="h-4 w-4" />
                           Import
                         </>
                       )}
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>
       )}
     </main>
   );
 }
