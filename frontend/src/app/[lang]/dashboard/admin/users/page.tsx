"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { GraduationCap, Plus, Trash2, Pencil, Loader2, X, ChevronDown, Search } from "lucide-react";

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
        className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        <span className={["truncate", selected.length === 0 ? "text-[var(--color-ink-placeholder)]" : "text-[var(--color-ink)]"].join(" ")}>
          {selected.length === 0 ? "—" : selected.map(getLabel).join("، ")}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]">
          {options.map(o => (
            <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => toggle(o.id)}
                className="accent-[var(--color-accent)] h-3.5 w-3.5"
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
        className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        <span className={selected ? "text-[var(--color-ink)]" : "text-[var(--color-ink-placeholder)]"}>
          {selected ? getLabel(selected) : "—"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]">
          {options.map(o => (
            <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm">
              <input
                type="radio"
                name="section"
                checked={selected === o.id}
                onChange={() => { onChange(o.id); setOpen(false); }}
                className="accent-[var(--color-accent)] h-3.5 w-3.5"
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

  const [tab, setTab] = useState<"teachers" | "students">("teachers");

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSections, setTeacherSections] = useState<ClassSection[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [teacherShowForm, setTeacherShowForm] = useState(false);
  const [teacherEditingId, setTeacherEditingId] = useState<string | null>(null);
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherDeletingId, setTeacherDeletingId] = useState<string | null>(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherForm, setTeacherForm] = useState(EMPTY_TEACHER_FORM);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSections, setStudentSections] = useState<ClassSection[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentShowForm, setStudentShowForm] = useState(false);
  const [studentEditingId, setStudentEditingId] = useState<string | null>(null);
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentDeletingId, setStudentDeletingId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT_FORM);

  const t_teachers = dict.dashboard.admin.teachers;
  const t_students = dict.dashboard.admin.students;

  async function loadTeachers() {
    setTeacherLoading(true);
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
      setTeacherSections(sectionsRes);
      setTeacherSubjects(subjectsRes);
    } finally {
      setTeacherLoading(false);
    }
  }

  async function loadStudents() {
    setStudentLoading(true);
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        pb.collection("users").getFullList<Student>({
          filter: 'role = "student"',
          expand: "sections",
          sort: "name_ar",
        }),
        pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
      ]);
      setStudents(studentsRes);
      setStudentSections(sectionsRes);
    } finally {
      setStudentLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
    loadStudents();
  }, []);

  // Teachers functions
  function openCreateTeacher() {
    setTeacherEditingId(null);
    setTeacherForm(EMPTY_TEACHER_FORM);
    setTeacherShowForm(true);
  }

  function openEditTeacher(teacher: Teacher) {
    setTeacherEditingId(teacher.id);
    setTeacherForm({
      name_ar: teacher.name_ar,
      name_en: teacher.name_en,
      email: teacher.email,
      password: "",
      sections: teacher.sections ?? [],
      subjects: teacher.subjects ?? [],
    });
    setTeacherShowForm(true);
  }

  function closeTeacherForm() {
    setTeacherShowForm(false);
    setTeacherEditingId(null);
    setTeacherForm(EMPTY_TEACHER_FORM);
  }

  async function handleTeacherSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTeacherSaving(true);
    try {
      if (teacherEditingId) {
        const data: Record<string, unknown> = {
          name_ar: teacherForm.name_ar,
          name_en: teacherForm.name_en,
          email: teacherForm.email,
          sections: teacherForm.sections,
          subjects: teacherForm.subjects,
        };
        if (teacherForm.password) {
          data.password = teacherForm.password;
          data.passwordConfirm = teacherForm.password;
        }
        await pb.collection("users").update(teacherEditingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: teacherForm.name_ar,
          name_en: teacherForm.name_en,
          email: teacherForm.email,
          password: teacherForm.password,
          passwordConfirm: teacherForm.password,
          role: "teacher",
          sections: teacherForm.sections,
          subjects: teacherForm.subjects,
          emailVisibility: true,
        });
      }
      closeTeacherForm();
      await loadTeachers();
    } finally {
      setTeacherSaving(false);
    }
  }

  async function handleTeacherDelete(id: string) {
    if (!(await confirm(t_teachers.confirmDelete))) return;
    setTeacherDeletingId(id);
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
    } finally {
      setTeacherDeletingId(null);
    }
  }

  // Students functions
  function openCreateStudent() {
    setStudentEditingId(null);
    setStudentForm(EMPTY_STUDENT_FORM);
    setStudentShowForm(true);
  }

  function openEditStudent(student: Student) {
    setStudentEditingId(student.id);
    setStudentForm({
      name_ar: student.name_ar,
      name_en: student.name_en,
      email: student.email,
      password: "",
      sections: student.sections ?? [],
    });
    setStudentShowForm(true);
  }

  function closeStudentForm() {
    setStudentShowForm(false);
    setStudentEditingId(null);
    setStudentForm(EMPTY_STUDENT_FORM);
  }

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStudentSaving(true);
    try {
      if (studentEditingId) {
        const data: Record<string, unknown> = {
          name_ar: studentForm.name_ar,
          name_en: studentForm.name_en,
          email: studentForm.email,
          sections: studentForm.sections,
        };
        if (studentForm.password) {
          data.password = studentForm.password;
          data.passwordConfirm = studentForm.password;
        }
        await pb.collection("users").update(studentEditingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: studentForm.name_ar,
          name_en: studentForm.name_en,
          email: studentForm.email,
          password: studentForm.password,
          passwordConfirm: studentForm.password,
          role: "student",
          sections: studentForm.sections,
          emailVisibility: true,
        });
      }
      closeStudentForm();
      await loadStudents();
    } finally {
      setStudentSaving(false);
    }
  }

  async function handleStudentDelete(id: string) {
    if (!(await confirm(t_students.confirmDelete))) return;
    setStudentDeletingId(id);
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
    } finally {
      setStudentDeletingId(null);
    }
  }

  const filteredTeachers = teachers.filter(t =>
    `${t.name_ar} ${t.name_en} ${t.email}`.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    `${s.name_ar} ${s.name_en} ${s.email}`.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setTab("teachers")}
          className={`px-4 py-2 font-semibold transition-colors ${
            tab === "teachers"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)]"
          }`}
        >
          {t_teachers.title}
        </button>
        <button
          onClick={() => setTab("students")}
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-[var(--color-ink-placeholder)]" />
              <input
                type="text"
                placeholder={c.search}
                value={teacherSearchQuery}
                onChange={e => setTeacherSearchQuery(e.target.value)}
                className="w-full ps-10 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <button
              onClick={openCreateTeacher}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="h-4 w-4" />
              {t_teachers.add}
            </button>
          </div>

          {teacherLoading ? (
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
                            <span key={s.id} className="inline-block rounded bg-[var(--color-accent)] bg-opacity-20 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
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
                        disabled={teacherDeletingId === teacher.id}
                        className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        title={c.delete}
                      >
                        {teacherDeletingId === teacher.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Form Modal */}
          {teacherShowForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{teacherEditingId ? t_teachers.editTitle : t_teachers.add}</h2>
                  <button onClick={closeTeacherForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameAr}</label>
                    <input
                      type="text"
                      value={teacherForm.name_ar}
                      onChange={e => setTeacherForm({ ...teacherForm, name_ar: e.target.value })}
                      placeholder={t_teachers.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameEn}</label>
                    <input
                      type="text"
                      value={teacherForm.name_en}
                      onChange={e => setTeacherForm({ ...teacherForm, name_en: e.target.value })}
                      placeholder={t_teachers.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.email}</label>
                    <input
                      type="email"
                      value={teacherForm.email}
                      onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder={t_teachers.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {teacherEditingId ? t_teachers.newPassword : t_teachers.password}
                    </label>
                    <input
                      type="password"
                      value={teacherForm.password}
                      onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      placeholder={t_teachers.phPassword}
                      required={!teacherEditingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <MultiSelect
                    label={t_teachers.assignedSections}
                    options={teacherSections.map(s => ({ id: s.id, label: `${s.grade_en} ${s.section_en}` }))}
                    selected={teacherForm.sections}
                    getLabel={id => {
                      const s = teacherSections.find(x => x.id === id);
                      return s ? `${s.grade_en} ${s.section_en}` : id;
                    }}
                    onChange={sections => setTeacherForm({ ...teacherForm, sections })}
                  />
                  <MultiSelect
                    label={t_teachers.assignedSubjects}
                    options={teacherSubjects.map(s => ({ id: s.id, label: s.name_en }))}
                    selected={teacherForm.subjects}
                    getLabel={id => {
                      const s = teacherSubjects.find(x => x.id === id);
                      return s ? s.name_en : id;
                    }}
                    onChange={subjects => setTeacherForm({ ...teacherForm, subjects })}
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
                      disabled={teacherSaving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {teacherSaving && <Loader2 className="h-4 w-4 animate-spin" />}
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-[var(--color-ink-placeholder)]" />
              <input
                type="text"
                placeholder={c.search}
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full ps-10 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            <button
              onClick={openCreateStudent}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="h-4 w-4" />
              {t_students.add}
            </button>
          </div>

          {studentLoading ? (
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
                        disabled={studentDeletingId === student.id}
                        className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        title={c.delete}
                      >
                        {studentDeletingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student Form Modal */}
          {studentShowForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{studentEditingId ? t_students.editTitle : t_students.add}</h2>
                  <button onClick={closeStudentForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameAr}</label>
                    <input
                      type="text"
                      value={studentForm.name_ar}
                      onChange={e => setStudentForm({ ...studentForm, name_ar: e.target.value })}
                      placeholder={t_students.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameEn}</label>
                    <input
                      type="text"
                      value={studentForm.name_en}
                      onChange={e => setStudentForm({ ...studentForm, name_en: e.target.value })}
                      placeholder={t_students.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.email}</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder={t_students.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {studentEditingId ? t_students.newPassword : t_students.password}
                    </label>
                    <input
                      type="password"
                      value={studentForm.password}
                      onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                      placeholder={t_students.phPassword}
                      required={!studentEditingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <SingleSelect
                    label={t_students.assignedSection}
                    options={studentSections.map(s => ({ id: s.id, label: `${s.grade_en} ${s.section_en}` }))}
                    selected={studentForm.sections[0] || ""}
                    getLabel={id => {
                      const s = studentSections.find(x => x.id === id);
                      return s ? `${s.grade_en} ${s.section_en}` : id;
                    }}
                    onChange={section => setStudentForm({ ...studentForm, sections: [section] })}
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
                      disabled={studentSaving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {studentSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {c.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
