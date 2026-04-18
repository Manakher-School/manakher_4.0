"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, Calendar, Clock, Plus, Trash2, Edit2, Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCrudState, useFormState, useTabState } from "@/lib/hooks";

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
    exam_type: "month1" | "month2" | "month3" | "final";
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
    exam_type: "month1" | "month2" | "month3" | "final";
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
   exam_type: "month1",
   notes: "",
 };

export default function SubjectsExamsPage() {
   const { user } = useAuth();
   const { dict, locale } = useLocale();
   const { alert, confirm } = useDialog();
   const c = dict.common;
   const t = dict.dashboard.admin;
   const initRef = useRef(false);

  // ============ ACTIVE TAB STATE ============
  const tabState = useTabState("subjects" as TabType);

  // ============ SUBJECTS STATE ============
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const subjectListCrudState = useCrudState();
  const subjectFormData = useFormState(EMPTY_SUBJECT_FORM);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // ============ EXAMS STATE ============
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [examSections, setExamSections] = useState<ExamSection[]>([]);
  const examListCrudState = useCrudState();
  const examFormData = useFormState<ExamFormData>(EMPTY_EXAM_FORM);

  const pb = getPocketBase();

  // ============ SUBJECTS FUNCTIONS ============
  const loadSubjects = useCallback(async () => {
    subjectListCrudState.setIsLoading(true);
    try {
      const res = await pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" });
      setSubjects(res);
    } catch (e) {
      console.error("Error loading subjects:", e);
    } finally {
      subjectListCrudState.setIsLoading(false);
    }
  }, [subjectListCrudState]);

  const openCreateSubject = () => {
    subjectListCrudState.setEditingId(null);
    subjectListCrudState.setShowCreate(true);
    subjectFormData.reset();
  };

  const openEditSubject = (s: Subject) => {
    subjectListCrudState.setEditingId(s.id);
    subjectListCrudState.setShowCreate(true);
    subjectFormData.setData({ name_ar: s.name_ar, name_en: s.name_en, code: s.code });
  };

  const closeSubjectForm = () => {
    subjectListCrudState.setShowCreate(false);
    subjectListCrudState.setEditingId(null);
    subjectFormData.reset();
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    subjectListCrudState.setIsLoading(true);
    try {
      if (subjectListCrudState.state.editingId) {
        await pb.collection("subjects").update(subjectListCrudState.state.editingId, subjectFormData.state.data);
      } else {
        await pb.collection("subjects").create(subjectFormData.state.data);
      }
      closeSubjectForm();
      await loadSubjects();
    } catch (e) {
      console.error("Error saving subject:", e);
      await alert(locale === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving subject");
    } finally {
      subjectListCrudState.setIsLoading(false);
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
      examListCrudState.setIsLoading(true);
      const [examsData, subjs, sects] = await Promise.all([
        pb.collection("exam_schedules").getFullList<ExamSchedule>({
          sort: "exam_date,start_time",
          expand: "subject,section",
        }),
        pb.collection("subjects").getFullList<ExamSubject>({ sort: "name_ar" }),
        pb.collection("class_sections").getFullList<ExamSection>({ sort: "grade_order,section_ar" }),
      ]);
      
      // Valid exam types
      const validTypes = ["month1", "month2", "month3", "final"];
      
      // Filter out exams with invalid types (old types like "quiz", "midterm", "practical")
      const validExams = examsData.filter(exam => {
        if (!validTypes.includes(exam.exam_type)) {
          console.warn(`Filtering out exam "${exam.title}" with invalid type "${exam.exam_type}". Valid types are: ${validTypes.join(", ")}`);
          return false;
        }
        return true;
      });
      
      if (validExams.length < examsData.length) {
        console.warn(`Filtered ${examsData.length - validExams.length} exams with invalid types`);
      }
      
      setExams(validExams);
      setExamSubjects(subjs);
      setExamSections(sects);
    } catch (e) {
      console.error("Error loading exams:", e);
    } finally {
      examListCrudState.setIsLoading(false);
    }
  }, [examListCrudState, user]);

  const openAddExam = () => {
    examFormData.reset();
    examListCrudState.setShowCreate(true);
    examListCrudState.setEditingId(null);
  };

  const openEditExam = (exam: ExamSchedule) => {
    examFormData.setData({
      title: exam.title || "",
      subject: exam.subject,
      section: exam.section,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      exam_type: exam.exam_type,
      notes: exam.notes || "",
    });
    examListCrudState.setEditingId(exam.id);
    examListCrudState.setShowCreate(true);
  };

  const closeExamForm = () => {
    examListCrudState.setShowCreate(false);
    examListCrudState.setEditingId(null);
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      examListCrudState.setIsLoading(true);
      
      // Validate required fields
      const formData = examFormData.state.data;
      if (!formData.title?.trim()) {
        throw new Error(locale === "ar" ? "العنوان مطلوب" : "Title is required");
      }
      if (!formData.subject) {
        throw new Error(locale === "ar" ? "المادة مطلوبة" : "Subject is required");
      }
      if (!formData.section) {
        throw new Error(locale === "ar" ? "الفصل مطلوب" : "Section is required");
      }
      if (!formData.exam_date) {
        throw new Error(locale === "ar" ? "تاريخ الامتحان مطلوب" : "Exam date is required");
      }
      if (!formData.start_time?.match(/^\d{2}:\d{2}$/)) {
        throw new Error(locale === "ar" ? "وقت البداية مطلوب بصيغة HH:MM" : "Start time required in HH:MM format");
      }
      if (!formData.end_time?.match(/^\d{2}:\d{2}$/)) {
        throw new Error(locale === "ar" ? "وقت النهاية مطلوب بصيغة HH:MM" : "End time required in HH:MM format");
      }
      if (!formData.exam_type) {
        throw new Error(locale === "ar" ? "نوع الامتحان مطلوب" : "Exam type is required");
      }

      const data = {
        title: formData.title,
        subject: formData.subject,
        section: formData.section,
        exam_date: formData.exam_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        exam_type: formData.exam_type,
        notes: formData.notes || "",
      };

      // Only add created_by for new records (create, not update)
      const createData = {
        ...data,
        created_by: user.id,
      };

      console.log("Submitting exam data:", {
        isEditing: !!examListCrudState.state.editingId,
        editingId: examListCrudState.state.editingId,
        data: examListCrudState.state.editingId ? data : createData,
      });

      if (examListCrudState.state.editingId) {
        console.log(`Updating exam ${examListCrudState.state.editingId}...`);
        await pb.collection("exam_schedules").update(examListCrudState.state.editingId, data);
      } else {
        console.log("Creating new exam...");
        await pb.collection("exam_schedules").create(createData);
      }

      await loadExams();
      closeExamForm();
    } catch (err) {
      console.error("Error saving exam:", err);
      
      // Extract detailed error information for better debugging
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        if (typeof err === 'object' && 'response' in err) {
          const pbErr = err as any;
          console.error("PocketBase response:", pbErr.response);
          console.error("PocketBase status:", pbErr.status);
          console.error("PocketBase data:", pbErr.data);
        }
      }
      
      const errMsg = err instanceof Error ? err.message : String(err);
      await alert(errMsg);
    } finally {
      examListCrudState.setIsLoading(false);
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
      case "month1":
        return t.exams?.typeMonth1 || "1st Month";
      case "month2":
        return t.exams?.typeMonth2 || "2nd Month";
      case "month3":
        return t.exams?.typeMonth3 || "3rd Month";
      case "final":
        return t.exams?.typeFinal || "Final";
      default:
        return type;
    }
  };

   // ============ INITIAL LOAD ============
   useEffect(() => {
     if (initRef.current) return; // Only run once
     initRef.current = true;
     
     loadSubjects();
     loadExams();
   }, [loadSubjects, loadExams]);

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
            {tabState.state.activeTab === "subjects" ? t.subjects?.title : t.exams?.title}
          </h2>
        </div>

        {/* Tab buttons */}
         <div className="flex gap-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-1 bg-[var(--color-surface-card)]">
           <button
             onClick={() => tabState.setActiveTab("subjects")}
             aria-label={`${t.subjects?.title || "Subjects"} tab`}
             aria-current={tabState.state.activeTab === "subjects" ? "page" : undefined}
             className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
               tabState.state.activeTab === "subjects"
                 ? "bg-[var(--color-role-admin-bold)] text-white"
                 : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
             }`}
           >
             {t.subjects?.title || "Subjects"}
           </button>
           <button
             onClick={() => tabState.setActiveTab("exams")}
             aria-label={`${t.exams?.title || "Exams"} tab`}
             aria-current={tabState.state.activeTab === "exams" ? "page" : undefined}
             className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
               tabState.state.activeTab === "exams"
                 ? "bg-[var(--color-role-admin-bold)] text-white"
                 : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
             }`}
           >
             {t.exams?.title || "Exams"}
           </button>
         </div>
      </div>

      {/* ============ SUBJECTS TAB ============ */}
      {tabState.state.activeTab === "subjects" && (
        <div className="space-y-6">
           {/* Add Subject Button */}
           <button
             onClick={openCreateSubject}
             aria-label={t.subjects?.add || "Add Subject"}
             className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
           >
             <Plus className="h-4 w-4" />
             {t.subjects?.add || "Add Subject"}
           </button>

          {/* Subject Form */}
          {subjectListCrudState.state.showCreate && (
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)]">
               <div className="mb-4 flex items-center justify-between">
                 <h3 className="font-bold text-[var(--color-ink)]">{subjectListCrudState.state.editingId ? t.subjects?.editTitle : t.subjects?.add}</h3>
                 <button
                   onClick={closeSubjectForm}
                   aria-label={c.cancel}
                   className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 >
                   <X className="h-4 w-4" />
                 </button>
               </div>
              <form onSubmit={handleSubmitSubject} className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.nameAr}</label>
                  <input required value={subjectFormData.state.data.name_ar} placeholder={t.subjects?.phNameAr} onChange={e => subjectFormData.setFieldValue("name_ar", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.nameEn}</label>
                  <input required value={subjectFormData.state.data.name_en} placeholder={t.subjects?.phNameEn} onChange={e => subjectFormData.setFieldValue("name_en", e.target.value)} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.subjects?.code}</label>
                  <input required value={subjectFormData.state.data.code} placeholder={t.subjects?.phCode} onChange={e => subjectFormData.setFieldValue("code", e.target.value)} className={inputCls} dir="ltr" />
                </div>
                <div className="sm:col-span-3 flex gap-2 justify-end pt-1">
                  <button type="button" onClick={closeSubjectForm} className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">{c.cancel}</button>
                  <button type="submit" disabled={subjectListCrudState.state.isLoading} className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60">
                    {subjectListCrudState.state.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {c.save}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects List */}
          {subjectListCrudState.state.isLoading ? (
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
                       aria-label={`${c.edit} ${locale === "ar" ? s.name_ar : s.name_en}`}
                       className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                     >
                       <Pencil className="h-3 w-3" />
                       {c.edit}
                     </button>
                     <button
                       onClick={() => handleDeleteSubject(s.id)}
                       disabled={deletingSubjectId === s.id}
                       aria-label={`${c.delete} ${locale === "ar" ? s.name_ar : s.name_en}`}
                       className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
      {tabState.state.activeTab === "exams" && (
        <div className="space-y-6">
          {/* Add Exam Button */}
          <Button onClick={openAddExam}>
            <Plus className="w-4 h-4" />
            {t.exams?.add || "Add Exam"}
          </Button>

          {/* Exam Form */}
          {examListCrudState.state.showCreate && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-4">
                {examListCrudState.state.editingId ? t.exams?.editTitle : t.exams?.add}
              </h3>
              <form onSubmit={handleSubmitExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                    {t.exams?.examTitle || (locale === "ar" ? "عنوان الامتحان" : "Exam Title")}
                  </label>
                  <input
                    type="text"
                    value={examFormData.state.data.title}
                    onChange={(e) => examFormData.setFieldValue("title", e.target.value)}
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
                      value={examFormData.state.data.subject}
                      onChange={(e) => examFormData.setFieldValue("subject", e.target.value)}
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
                      value={examFormData.state.data.section}
                      onChange={(e) => examFormData.setFieldValue("section", e.target.value)}
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
                      value={examFormData.state.data.exam_date}
                      onChange={(e) => examFormData.setFieldValue("exam_date", e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.examType}
                    </label>
                    <select
                      value={examFormData.state.data.exam_type}
                      onChange={(e) =>
                        examFormData.setFieldValue("exam_type", e.target.value as any)
                      }
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="month1">{getExamTypeLabel("month1")}</option>
                      <option value="month2">{getExamTypeLabel("month2")}</option>
                      <option value="month3">{getExamTypeLabel("month3")}</option>
                      <option value="final">{getExamTypeLabel("final")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t.exams?.startTime}
                    </label>
                    <input
                      type="time"
                      value={examFormData.state.data.start_time}
                      onChange={(e) => examFormData.setFieldValue("start_time", e.target.value)}
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
                      value={examFormData.state.data.end_time}
                      onChange={(e) => examFormData.setFieldValue("end_time", e.target.value)}
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
                    value={examFormData.state.data.notes}
                    onChange={(e) => examFormData.setFieldValue("notes", e.target.value)}
                    rows={3}
                    placeholder={t.exams?.phNotes}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="ghost" onClick={closeExamForm} disabled={examListCrudState.state.isLoading}>
                    {c.cancel}
                  </Button>
                  <Button type="submit" disabled={examListCrudState.state.isLoading}>
                    {examListCrudState.state.isLoading ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : c.save}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Exams Table */}
          {examListCrudState.state.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm">{t.exams?.empty || "No exams"}</p>
          ) : (
            <Card className="p-0 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)]">
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{t.exams?.examTitle || "Title"}</th>
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{t.exams?.subject || "Subject"}</th>
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{t.exams?.section || "Section"}</th>
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "التاريخ" : "Date"}</th>
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "الوقت" : "Time"}</th>
                    <th className="text-start ps-4 py-3 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "النوع" : "Type"}</th>
                    <th className="text-center pe-4 py-3 font-semibold text-[var(--color-ink)]">{c.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam, idx) => {
                    const subject = exam.expand?.subject;
                    const section = exam.expand?.section;
                    const subjectName = subject ? getSubjectName(subject) : "—";
                    const sectionName = section ? getSectionName(section) : "—";

                    return (
                      <tr
                        key={exam.id}
                        className={`border-b border-[var(--color-border)] ${
                          idx % 2 === 0 ? "bg-white" : "bg-[var(--color-surface)]"
                        } hover:bg-[var(--color-surface-hover)]`}
                      >
                        <td className="ps-4 py-3 text-sm text-[var(--color-ink)]">{exam.title || subjectName}</td>
                        <td className="ps-4 py-3 text-sm text-[var(--color-ink-secondary)]">{subjectName}</td>
                        <td className="ps-4 py-3 text-sm text-[var(--color-ink-secondary)]">{sectionName}</td>
                        <td className="ps-4 py-3 text-sm text-[var(--color-ink-secondary)]">{formatDate(exam.exam_date)}</td>
                        <td className="ps-4 py-3 text-sm text-[var(--color-ink-secondary)]">{exam.start_time} - {exam.end_time}</td>
                        <td className="ps-4 py-3 text-sm">
                          <Badge variant="accent">{getExamTypeLabel(exam.exam_type)}</Badge>
                        </td>
                        <td className="pe-4 py-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditExam(exam)}
                              aria-label={`${c.edit} ${exam.title || ""}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExam(exam.id)}
                              aria-label={`${c.delete} ${exam.title || ""}`}
                              className="text-[var(--color-status-danger-text)] hover:bg-[var(--color-status-danger-bg)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
