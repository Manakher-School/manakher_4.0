"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, Calendar, Clock, Plus, Trash2, Edit2, Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============ SUBJECTS INTERFACES ============
interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

// ============ EXAMS INTERFACES ============
interface ExamSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
}

interface ExamSubject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface ExamSchedule {
  id: string;
  title: string;
  subject: string;
  section: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_type: "midterm" | "final" | "quiz" | "practical";
  notes?: string;
  created_by: string;
  expand?: {
    subject?: ExamSubject;
    section?: ExamSection;
  };
}

interface ExamFormData {
  title: string;
  subject: string;
  section: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_type: "midterm" | "final" | "quiz" | "practical";
  notes: string;
}

type TabType = "subjects" | "exams";

const EMPTY_SUBJECT_FORM = { name_ar: "", name_en: "", code: "" };
const EMPTY_EXAM_FORM: ExamFormData = {
  title: "",
  subject: "",
  section: "",
  exam_date: "",
  start_time: "",
  end_time: "",
  exam_type: "midterm",
  notes: "",
};

export default function SubjectsExamsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const c = dict.common;
  const t = dict.dashboard.admin;

  // ============ ACTIVE TAB STATE ============
  const [activeTab, setActiveTab] = useState<TabType>("subjects");

  // ============ SUBJECTS STATE ============
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT_FORM);

  // ============ EXAMS STATE ============
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [examSections, setExamSections] = useState<ExamSection[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examFormData, setExamFormData] = useState<ExamFormData>(EMPTY_EXAM_FORM);
  const [savingExam, setSavingExam] = useState(false);

  const pb = getPocketBase();

  // ============ SUBJECTS FUNCTIONS ============
  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" });
      setSubjects(res);
    } catch (e) {
      console.error("Error loading subjects:", e);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const openCreateSubject = () => {
    setEditingSubjectId(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
    setShowSubjectForm(true);
  };

  const openEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setSubjectForm({ name_ar: s.name_ar, name_en: s.name_en, code: s.code });
    setShowSubjectForm(true);
  };

  const closeSubjectForm = () => {
    setShowSubjectForm(false);
    setEditingSubjectId(null);
    setSubjectForm(EMPTY_SUBJECT_FORM);
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSubject(true);
    try {
      if (editingSubjectId) {
        await pb.collection("subjects").update(editingSubjectId, subjectForm);
      } else {
        await pb.collection("subjects").create(subjectForm);
      }
      closeSubjectForm();
      await loadSubjects();
    } catch (e) {
      console.error("Error saving subject:", e);
      await alert(locale === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving subject");
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const subject = subjects.find(s => s.id === id);
    const subjectName = subject ? (locale === "ar" ? subject.name_ar : subject.name_en) : "";
    
    const warningMsg = locale === "ar" 
      ? `تحذير: حذف المقرر "${subjectName}" سيؤدي إلى حذف جميع السجلات المرتبطة به:\n\n• المواد التعليمية\n• الواجبات\n• التسليمات\n• الاختبارات\n• جداول الامتحانات\n\nهل أنت متأكد من الحذف؟`
      : `Warning: Deleting subject "${subjectName}" will also delete all related records:\n\n• Learning materials\n• Homework\n• Submissions\n• Quizzes\n• Exam schedules\n\nAre you sure you want to delete?`;
    
    if (!(await confirm(warningMsg))) return;
    
    setDeletingSubjectId(id);
    try {
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
      const examsToDelete = await pb.collection("exam_schedules").getFullList({ filter: `subject = "${id}"` });
      for (const exam of examsToDelete) {
        await pb.collection("exam_schedules").delete(exam.id);
      }
      
      // 5. Remove subject from users (teachers)
      const usersWithSubject = await pb.collection("users").getFullList({ filter: `subjects ~ "${id}"` });
      for (const u of usersWithSubject) {
        const updatedSubjects = (u.subjects as string[]).filter(s => s !== id);
        await pb.collection("users").update(u.id, { subjects: updatedSubjects });
      }
      
      // Finally, delete the subject itself
      await pb.collection("subjects").delete(id);
      setSubjects(s => s.filter(x => x.id !== id));
      
      await alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      await alert(locale === "ar" ? "فشل الحذف. يرجى المحاولة مرة أخرى." : "Delete failed. Please try again.");
    } finally {
      setDeletingSubjectId(null);
    }
  };

  // ============ EXAMS FUNCTIONS ============
  const loadExams = useCallback(async () => {
    try {
      setExamsLoading(true);
      const [examsData, subjs, sects] = await Promise.all([
        pb.collection("exam_schedules").getFullList<ExamSchedule>({
          sort: "exam_date,start_time",
          expand: "subject,section",
        }),
        pb.collection("subjects").getFullList<ExamSubject>({ sort: "name_ar" }),
        pb.collection("class_sections").getFullList<ExamSection>({ sort: "grade_order,section_ar" }),
      ]);
      setExams(examsData);
      setExamSubjects(subjs);
      setExamSections(sects);
    } catch (e) {
      console.error("Error loading exams:", e);
    } finally {
      setExamsLoading(false);
    }
  }, []);

  const openAddExam = () => {
    setExamFormData(EMPTY_EXAM_FORM);
    setEditingExamId(null);
    setShowExamForm(true);
  };

  const openEditExam = (exam: ExamSchedule) => {
    setExamFormData({
      title: exam.title || "",
      subject: exam.subject,
      section: exam.section,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      exam_type: exam.exam_type,
      notes: exam.notes || "",
    });
    setEditingExamId(exam.id);
    setShowExamForm(true);
  };

  const closeExamForm = () => {
    setShowExamForm(false);
    setEditingExamId(null);
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSavingExam(true);
      const data = {
        ...examFormData,
        created_by: user.id,
      };

      if (editingExamId) {
        await pb.collection("exam_schedules").update(editingExamId, data);
      } else {
        await pb.collection("exam_schedules").create(data);
      }

      await loadExams();
      closeExamForm();
    } catch (err) {
      console.error("Error saving exam:", err);
      await alert(locale === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving exam");
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!(await confirm(t.exams?.confirmDelete || "Are you sure?"))) return;
    try {
      await pb.collection("exam_schedules").delete(id);
      await loadExams();
    } catch (err) {
      console.error("Error deleting exam:", err);
      await alert(locale === "ar" ? "فشل الحذف" : "Delete failed");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSubjectName = (s: ExamSubject) => (locale === "ar" ? s.name_ar : s.name_en);
  const getSectionName = (s: ExamSection) =>
    locale === "ar" ? `${s.grade_ar} - ${s.section_ar}` : `${s.grade_en} - ${s.section_en}`;

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "midterm":
        return t.exams?.typeMidterm || "Midterm";
      case "final":
        return t.exams?.typeFinal || "Final";
      case "quiz":
        return t.exams?.typeQuiz || "Quiz";
      case "practical":
        return t.exams?.typePractical || "Practical";
      default:
        return type;
    }
  };

  // ============ INITIAL LOAD ============
  useEffect(() => {
    loadSubjects();
    loadExams();
  }, []);

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
            <BookOpen className="h-5 w-5 text-[var(--color-role-admin-bold)]" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">
            {activeTab === "subjects" ? t.subjects?.title : t.exams?.title}
          </h2>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-1 bg-[var(--color-surface-card)]">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors ${
              activeTab === "subjects"
                ? "bg-[var(--color-role-admin-bold)] text-white"
                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t.subjects?.title || "Subjects"}
          </button>
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors ${
              activeTab === "exams"
                ? "bg-[var(--color-role-admin-bold)] text-white"
                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t.exams?.title || "Exams"}
          </button>
        </div>
      </div>

      {/* ============ SUBJECTS TAB ============ */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {/* Add Subject Button */}
          <button
            onClick={openCreateSubject}
            className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t.subjects?.add || "Add Subject"}
          </button>

          {/* Subject Form */}
          {showSubjectForm && (
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[var(--color-ink)]">{editingSubjectId ? t.subjects?.editTitle : t.subjects?.add}</h3>
                <button onClick={closeSubjectForm} className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)]"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleSubmitSubject} className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.nameAr}</label>
                  <input required value={subjectForm.name_ar} placeholder={t.subjects?.phNameAr} onChange={e => setSubjectForm(f => ({...f, name_ar: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.nameEn}</label>
                  <input required value={subjectForm.name_en} placeholder={t.subjects?.phNameEn} onChange={e => setSubjectForm(f => ({...f, name_en: e.target.value}))} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.code}</label>
                  <input required value={subjectForm.code} placeholder={t.subjects?.phCode} onChange={e => setSubjectForm(f => ({...f, code: e.target.value}))} className={inputCls} dir="ltr" />
                </div>
                <div className="sm:col-span-3 flex gap-2 justify-end pt-1">
                  <button type="button" onClick={closeSubjectForm} className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">{c.cancel}</button>
                  <button type="submit" disabled={savingSubject} className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60">
                    {savingSubject && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {c.save}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects List */}
          {subjectsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" /></div>
          ) : subjects.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--color-ink-disabled)]">{t.subjects?.empty || "No subjects"}</p>
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
                      onClick={() => openEditSubject(s)}
                      className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      {c.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      disabled={deletingSubjectId === s.id}
                      className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50"
                    >
                      {deletingSubjectId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      {c.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ EXAMS TAB ============ */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          {/* Add Exam Button */}
          <Button onClick={openAddExam}>
            <Plus className="w-4 h-4" />
            {t.exams?.add || "Add Exam"}
          </Button>

          {/* Exam Form */}
          {showExamForm && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-4">
                {editingExamId ? t.exams?.editTitle : t.exams?.add}
              </h3>
              <form onSubmit={handleSubmitExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                    {t.exams?.examTitle || (locale === "ar" ? "عنوان الامتحان" : "Exam Title")}
                  </label>
                  <input
                    type="text"
                    value={examFormData.title}
                    onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                    required
                    placeholder={locale === "ar" ? "مثال: امتحان الرياضيات النهائي" : "e.g., Final Math Exam"}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.subject}
                    </label>
                    <select
                      value={examFormData.subject}
                      onChange={(e) => setExamFormData({ ...examFormData, subject: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="">{t.exams?.subject}</option>
                      {examSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {getSubjectName(s)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.section}
                    </label>
                    <select
                      value={examFormData.section}
                      onChange={(e) => setExamFormData({ ...examFormData, section: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="">{t.exams?.section}</option>
                      {examSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {getSectionName(s)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.examDate}
                    </label>
                    <input
                      type="date"
                      value={examFormData.exam_date}
                      onChange={(e) => setExamFormData({ ...examFormData, exam_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.examType}
                    </label>
                    <select
                      value={examFormData.exam_type}
                      onChange={(e) =>
                        setExamFormData({ ...examFormData, exam_type: e.target.value as any })
                      }
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="midterm">{getExamTypeLabel("midterm")}</option>
                      <option value="final">{getExamTypeLabel("final")}</option>
                      <option value="quiz">{getExamTypeLabel("quiz")}</option>
                      <option value="practical">{getExamTypeLabel("practical")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.startTime}
                    </label>
                    <input
                      type="time"
                      value={examFormData.start_time}
                      onChange={(e) => setExamFormData({ ...examFormData, start_time: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.endTime}
                    </label>
                    <input
                      type="time"
                      value={examFormData.end_time}
                      onChange={(e) => setExamFormData({ ...examFormData, end_time: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                    {t.exams?.notes}
                  </label>
                  <textarea
                    value={examFormData.notes}
                    onChange={(e) => setExamFormData({ ...examFormData, notes: e.target.value })}
                    rows={3}
                    placeholder={t.exams?.phNotes}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="ghost" onClick={closeExamForm} disabled={savingExam}>
                    {c.cancel}
                  </Button>
                  <Button type="submit" disabled={savingExam}>
                    {savingExam ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : c.save}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Exams List */}
          {examsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm">{t.exams?.empty || "No exams"}</p>
          ) : (
            <div className="grid gap-3">
              {exams.map((exam) => {
                const subject = exam.expand?.subject;
                const section = exam.expand?.section;
                const subjectName = subject ? getSubjectName(subject) : "";
                const sectionName = section ? getSectionName(section) : "";

                return (
                  <Card key={exam.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[var(--color-ink)]">{exam.title || subjectName}</h4>
                          <Badge variant="accent">{getExamTypeLabel(exam.exam_type)}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap text-sm text-[var(--color-ink-secondary)]">
                          <span>{subjectName}</span>
                          <span>·</span>
                          <span>{sectionName}</span>
                        </div>

                        <div className="space-y-1 text-sm text-[var(--color-ink-secondary)]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(exam.exam_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {exam.start_time} - {exam.end_time}
                            </span>
                          </div>
                        </div>

                        {exam.notes && (
                          <p className="text-sm text-[var(--color-ink)] p-3 rounded-lg bg-[var(--color-surface-sunken)]">
                            {exam.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditExam(exam)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-[var(--color-status-danger-text)] hover:bg-[var(--color-status-danger-bg)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
