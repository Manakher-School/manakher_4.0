"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Calendar, Clock, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface Section {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
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
    subject?: Subject;
    section?: Section;
  };
}

interface FormData {
  title: string;
  subject: string;
  section: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_type: "month1" | "month2" | "month3" | "final";
  notes: string;
}

export default function AdminExamsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.admin.exams;
  const common = dict.common;

  const [list, setList] = useState<ExamSchedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subject: "",
    section: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    exam_type: "month1",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const pb = getPocketBase();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [exams, subjs, sects] = await Promise.all([
        pb.collection("exam_schedules").getFullList<ExamSchedule>({
          sort: "exam_date,start_time",
          expand: "subject,section",
        }),
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
        pb.collection("class_sections").getFullList<Section>({ sort: "grade_order,section_ar" }),
      ]);
      
      // Valid exam types
      const validTypes = ["month1", "month2", "month3", "final"];
      
      // Filter out exams with invalid types (old types like "quiz", "midterm", "practical")
      const validExams = exams.filter(exam => {
        if (!validTypes.includes(exam.exam_type)) {
          console.warn(`Filtering out exam "${exam.title}" with invalid type "${exam.exam_type}". Valid types are: ${validTypes.join(", ")}`);
          return false;
        }
        return true;
      });
      
      if (validExams.length < exams.length) {
        console.warn(`Filtered ${exams.length - validExams.length} exams with invalid types`);
      }
      
      setList(validExams);
      setSubjects(subjs);
      setSections(sects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setFormData({
      title: "",
      subject: "",
      section: "",
      exam_date: "",
      start_time: "",
      end_time: "",
      exam_type: "month1",
      notes: "",
    });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (exam: ExamSchedule) => {
    setFormData({
      title: exam.title || "",
      subject: exam.subject,
      section: exam.section,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      exam_type: exam.exam_type,
      notes: exam.notes || "",
    });
    setEditId(exam.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      const data = {
        ...formData,
        created_by: user.id,
      };

      if (editId) {
        await pb.collection("exam_schedules").update(editId, data);
      } else {
        await pb.collection("exam_schedules").create(data);
      }

      await load();
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm(t.confirmDelete))) return;
    try {
      await pb.collection("exam_schedules").delete(id);
      await load();
    } catch (err) {
      console.error(err);
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

  const getSubjectName = (s: Subject) => (locale === "ar" ? s.name_ar : s.name_en);
  const getSectionName = (s: Section) =>
    locale === "ar" ? `${s.grade_ar} - ${s.section_ar}` : `${s.grade_en} - ${s.section_en}`;

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "month1":
        return t.typeMonth1 || "1st Month";
      case "month2":
        return t.typeMonth2 || "2nd Month";
      case "month3":
        return t.typeMonth3 || "3rd Month";
      case "final":
        return t.typeFinal || "Final";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-3 flex-wrap">
         <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
           {t.title}
         </h2>
         <Button onClick={openAdd} aria-label={t.add}>
           <Plus className="w-4 h-4" />
           {t.add}
         </Button>
       </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[var(--color-ink)] mb-4">
            {editId ? t.editTitle : t.add}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title field */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                {t.examTitle || (locale === "ar" ? "عنوان الامتحان" : "Exam Title")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder={locale === "ar" ? "مثال: امتحان الرياضيات النهائي" : "e.g., Final Math Exam"}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                  {t.subject}
                </label>
               <select
                   value={formData.subject}
                   onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                   required
                   aria-label={t.subject}
                   className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 >
                  <option value="">{t.subject}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getSubjectName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                  {t.section}
                </label>
                 <select
                   value={formData.section}
                   onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                   required
                   aria-label={t.section}
                   className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 >
                  <option value="">{t.section}</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getSectionName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                  {t.examDate}
                </label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                  {t.examType}
                </label>
                <select
                  value={formData.exam_type}
                  onChange={(e) =>
                    setFormData({ ...formData, exam_type: e.target.value as any })
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
                  {t.startTime}
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                  {t.endTime}
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">
                {t.notes}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder={t.phNotes}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={closeForm} disabled={submitting}>
                {common.cancel}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : common.save}
              </Button>
            </div>
          </form>
        </Card>
      )}

       {/* List */}
       {loading ? (
         <div className="flex items-center justify-center py-20">
           <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
         </div>
       ) : list.length === 0 ? (
         <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
       ) : (
         <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border)]">
           <table className="w-full text-sm">
             <thead>
               <tr className="bg-[var(--color-role-admin-bg)] border-b border-[var(--color-border)]">
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.examTitle || (locale === "ar" ? "عنوان الامتحان" : "Exam Title")}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.subject}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.section}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.examDate}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.startTime}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.endTime}</th>
                 <th className="px-4 py-3 text-start font-bold text-[var(--color-role-admin-text)]">{t.examType}</th>
                 <th className="px-4 py-3 text-center font-bold text-[var(--color-role-admin-text)]">{common.actions || "Actions"}</th>
               </tr>
             </thead>
             <tbody>
               {list.map((exam, idx) => {
                 const subject = exam.expand?.subject;
                 const section = exam.expand?.section;
                 const subjectName = subject ? getSubjectName(subject) : "";
                 const sectionName = section ? getSectionName(section) : "";

                 return (
                   <tr key={exam.id} className={`border-b border-[var(--color-border)] ${idx % 2 === 0 ? "bg-[var(--color-surface-card)]" : "bg-[var(--color-surface)]"} hover:bg-[var(--color-surface-hover)]`}>
                     <td className="px-4 py-3 font-semibold text-[var(--color-ink)]">{exam.title || subjectName}</td>
                     <td className="px-4 py-3 text-[var(--color-ink-secondary)]">{subjectName}</td>
                     <td className="px-4 py-3 text-[var(--color-ink-secondary)]">{sectionName}</td>
                     <td className="px-4 py-3 text-[var(--color-ink-secondary)]">{formatDate(exam.exam_date)}</td>
                     <td className="px-4 py-3 text-[var(--color-ink-secondary)]">{exam.start_time}</td>
                     <td className="px-4 py-3 text-[var(--color-ink-secondary)]">{exam.end_time}</td>
                     <td className="px-4 py-3">
                       <Badge variant="accent">{getExamTypeLabel(exam.exam_type)}</Badge>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <div className="flex gap-2 justify-center">
                         <Button variant="ghost" size="sm" onClick={() => openEdit(exam)} aria-label={`${t.edit}: ${exam.title}`}>
                           <Edit2 className="w-4 h-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDelete(exam.id)}
                           className="text-[var(--color-status-danger-text)] hover:bg-[var(--color-status-danger-bg)] focus:outline-none focus:ring-2 focus:ring-red-300 rounded-md"
                           aria-label={`${common.delete}: ${exam.title}`}
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
         </div>
       )}
    </div>
  );
}
