"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ExamSchedule {
  id: string;
  title: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  exam_type: "month1" | "month2" | "month3" | "final";
  notes?: string;
  expand?: {
    subject?: { name_ar: string; name_en: string; code: string };
    section?: { grade_ar: string; grade_en: string; section_ar: string; section_en: string };
  };
}

export default function StudentExamsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const t = dict.dashboard.student.exams;

  const [list, setList] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

   const load = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    if (sections.length === 0) {
      setList([]);
      setLoading(false);
      return;
    }

    try {
      const sectionFilter = sections.map((id) => `section = "${id}"`).join(" || ");
      
      const items = await pb.collection("exam_schedules").getFullList<ExamSchedule>({
        filter: `(${sectionFilter})`,
        sort: "exam_date,start_time",
        expand: "subject,section",
      });
      
      // Valid exam types
      const validTypes = ["month1", "month2", "month3", "final"];
      
      // Filter out exams with invalid types (old types like "quiz", "midterm", "practical")
      const validExams = items.filter(exam => {
        if (!validTypes.includes(exam.exam_type)) {
          console.warn(`Filtering out exam "${exam.title}" with invalid type "${exam.exam_type}". Valid types are: ${validTypes.join(", ")}`);
          return false;
        }
        return true;
      });
      
      if (validExams.length < items.length) {
        console.warn(`Filtered ${items.length - validExams.length} exams with invalid types`);
      }
      
      setList(validExams);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isUpcoming = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return examDate >= today;
  };

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

  const upcomingExams = list.filter((exam) => isUpcoming(exam.exam_date));
  const pastExams = list.filter((exam) => !isUpcoming(exam.exam_date));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
        {t.title}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <>
          {/* Upcoming Exams */}
          {upcomingExams.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t.upcoming}
              </h3>
              <div className="grid gap-3">
                {upcomingExams.map((exam) => {
                  const subject = exam.expand?.subject;
                  const subjectName = subject
                    ? locale === "ar"
                      ? subject.name_ar
                      : subject.name_en
                    : "";

                  return (
                    <Card key={exam.id} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[var(--color-ink)]">
                              {exam.title || subjectName}
                            </h4>
                            <Badge variant="accent">{getExamTypeLabel(exam.exam_type)}</Badge>
                          </div>
                          
                          {subjectName && (
                            <p className="text-sm font-medium text-[var(--color-ink-secondary)]">
                              {subjectName}
                            </p>
                          )}
                          
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
                            <p className="text-sm text-[var(--color-ink)] mt-2 p-3 rounded-lg bg-[var(--color-surface-sunken)]">
                              {exam.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Exams */}
          {pastExams.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-[var(--color-ink-secondary)]">
                {locale === "ar" ? "الامتحانات السابقة" : "Past Exams"}
              </h3>
              <div className="grid gap-3 opacity-60">
                {pastExams.map((exam) => {
                  const subject = exam.expand?.subject;
                  const subjectName = subject
                    ? locale === "ar"
                      ? subject.name_ar
                      : subject.name_en
                    : "";

                  return (
                    <Card key={exam.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-ink)]">
                              {subjectName}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {getExamTypeLabel(exam.exam_type)}
                            </Badge>
                          </div>
                          <div className="text-sm text-[var(--color-ink-secondary)]">
                            {formatDate(exam.exam_date)} · {exam.start_time}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
