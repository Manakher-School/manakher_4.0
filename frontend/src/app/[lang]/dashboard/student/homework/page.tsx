"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getPocketBase } from "@/lib/pocketbase";
import { FileText, ChevronDown, ChevronUp, Send, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/ui/rich-content";
import { LazyRichEditor } from "@/components/ui/lazy-rich-editor";

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
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
  expand?: {
    subject?: Subject;
    teacher?: { name_ar: string; name_en: string };
  };
}

interface Submission {
  id: string;
  content: string;
  status: "submitted" | "graded" | "late";
  grade: number | null;
  feedback: string;
  created: string;
}

// Map: hwId -> submission state
interface SubmissionState {
  loading: boolean;
  data: Submission | null;
}
type SubmissionMap = Record<string, SubmissionState>;

export default function StudentHomeworkPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const t = dict.dashboard.student.homework;
  const common = dict.common;

  const [list, setList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionMap>({});
  const [submitContents, setSubmitContents] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const subjectName = (s: Subject) => (locale === "ar" ? s.name_ar : s.name_en);

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
      const hw = await pb.collection("homework").getFullList<Homework>({
        filter: sectionFilter,
        sort: "due_date",
        expand: "subject,teacher",
      });
      setList(hw);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function toggleExpand(hwId: string) {
    if (expandedId === hwId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(hwId);

    // Load submission for this homework if not already loaded
    if (submissions[hwId] !== undefined) return;

    setSubmissions((prev) => ({ ...prev, [hwId]: { loading: true, data: null } }));
    const pb = getPocketBase();
    try {
      const result = await pb.collection("submissions").getList<Submission>(1, 1, {
        filter: `homework = "${hwId}" && student = "${user!.id}"`,
      });
      setSubmissions((prev) => ({
        ...prev,
        [hwId]: { loading: false, data: result.items[0] ?? null },
      }));
    } catch {
      setSubmissions((prev) => ({ ...prev, [hwId]: { loading: false, data: null } }));
    }
  }

  async function handleSubmit(hwId: string) {
    const content = submitContents[hwId] ?? "";
    if (!content.trim() || !user) return;
    setSubmitting(hwId);
    const pb = getPocketBase();
    try {
      const newSub = await pb.collection("submissions").create<Submission>({
        homework: hwId,
        student: user.id,
        content,
        status: "submitted",
        grade: null,
        feedback: "",
      });
      setSubmissions((prev) => ({ ...prev, [hwId]: { loading: false, data: newSub } }));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(null);
    }
  }

  const isPastDue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const statusLabel: Record<string, string> = {
    submitted: t.statusSubmitted,
    graded: t.statusGraded,
    late: t.statusLate,
  };

  const statusVariant: Record<string, "default" | "accent"> = {
    submitted: "accent",
    graded: "default",
    late: "default",
  };

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/dashboard/student`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline mb-2">
        {locale === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
        {locale === "ar" ? "العودة للرئيسية" : "Back to Overview"}
      </Link>
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
        <div className="space-y-5">
          {list.map((hw) => {
            const isExpanded = expandedId === hw.id;
            const sub = hw.expand?.subject;
            const teacher = hw.expand?.teacher;
            const teacherName = teacher
              ? (locale === "ar" ? teacher.name_ar : teacher.name_en)
              : null;
            const overdue = isPastDue(hw.due_date);
            const submission = submissions[hw.id];
            const content = submitContents[hw.id] ?? "";

            return (
              <div
                key={hw.id}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
              >
                 {/* Header row */}
                 <button
                   onClick={() => toggleExpand(hw.id)}
                   className="w-full flex items-start justify-between gap-3 px-5 py-4 text-start focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)] rounded-t-[var(--radius-xl)]"
                   aria-label={`${hw.title}: ${isExpanded ? "collapse" : "expand"}`}
                   aria-expanded={isExpanded}
                 >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                      style={{
                        background: overdue ? "#fee2e2" : "var(--color-role-student-bg)",
                        color: overdue ? "#dc2626" : "var(--color-role-student-bold)",
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--color-ink)]">{hw.title}</p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        {sub && <span>{subjectName(sub)}</span>}
                        {teacherName && <span>· {teacherName}</span>}
                        <span
                          className={overdue ? "text-red-500" : ""}
                        >
                          · {t.dueDate}: {hw.due_date?.slice(0, 10)}
                        </span>
                        <span>
                          · {hw.submission_type === "online" ? t.typeOnline : t.typeOnsite}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--color-ink-secondary)] mt-1 shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-4 space-y-5">

                    {/* Homework description */}
                    {hw.description && (
                      <div>
                        <RichContent html={hw.description} />
                      </div>
                    )}

                    {/* Submission area — only for online homework */}
                    {hw.submission_type === "online" && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-black text-[var(--color-ink)]">
                          {t.mySubmission}
                        </h4>

                        {submission?.loading ? (
                          <div className="flex justify-center py-4">
                            <div className="h-5 w-5 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
                          </div>
                        ) : submission?.data ? (
                          /* Already submitted — show result */
                          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Badge variant={statusVariant[submission.data.status] ?? "default"}>
                                {statusLabel[submission.data.status] ?? submission.data.status}
                              </Badge>
                              <span className="text-xs text-[var(--color-ink-secondary)]">
                                {submission.data.created?.slice(0, 10)}
                              </span>
                            </div>
                            <RichContent html={submission.data.content} />
                            {submission.data.status === "graded" && (
                              <div className="space-y-1 pt-1 border-t border-[var(--color-border-subtle)]">
                                {submission.data.grade !== null && (
                                  <p className="text-sm font-bold text-[var(--color-ink)]">
                                    {t.grade}: <span className="text-[var(--color-role-student-bold)]">{submission.data.grade}</span> / 100
                                  </p>
                                )}
                                {submission.data.feedback && (
                                  <p className="text-sm text-[var(--color-ink-secondary)]">
                                    {t.feedback}: {submission.data.feedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Not submitted yet — show form */
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-sm font-semibold text-[var(--color-ink)]">
                                {t.submitContent}
                              </label>
                              <LazyRichEditor
                                value={content}
                                onChange={(html) =>
                                  setSubmitContents((prev) => ({ ...prev, [hw.id]: html }))
                                }
                                placeholder={t.phContent}
                                dir={locale === "ar" ? "rtl" : "ltr"}
                              />
                            </div>
                            <div className="flex justify-end">
                               <Button
                                 variant="primary"
                                 onClick={() => handleSubmit(hw.id)}
                                 disabled={submitting === hw.id || !content.trim()}
                                 aria-label={t.submitBtn}
                               >
                                 <Send className="h-4 w-4" />
                                 {submitting === hw.id ? t.submitting : t.submitBtn}
                               </Button>
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* On-site homework — no submission needed */}
                    {hw.submission_type === "onsite" && (
                      <p className="text-sm text-[var(--color-ink-secondary)] italic">
                        {t.typeOnsite}
                      </p>
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
