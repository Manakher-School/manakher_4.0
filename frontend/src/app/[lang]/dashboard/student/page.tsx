"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useSettings } from "@/context/settings-context";
import { StatCard } from "@/components/ui/stat-card";
import { getDisplayName } from "@/lib/auth";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, FileText, Bell, ClipboardList, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RichContent } from "@/components/ui/rich-content";
import { Comments } from "@/components/ui/comments";
import { Reactions } from "@/components/ui/reactions";

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

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: "global" | "section";
  section: string;
  created: string;
  expand?: { author?: { name_ar: string; name_en: string } };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { settings } = useSettings();
  const t = dict.dashboard.student;
  const tExams = dict.dashboard.student.exams;
  const tAnn = dict.dashboard.student.announcements;
  const displayName = user ? getDisplayName(user, locale) : "";

  // Stats
  const [subjectCount, setSubjectCount] = useState<number | string>("—");
  const [hwFormat, setHwFormat] = useState<string>("—");
  const [quizSubmissions, setQuizSubmissions] = useState<string>("—");

  // Exams
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [expandedAnnId, setExpandedAnnId] = useState<string | null>(null);

  const base = `/${locale}/dashboard/student`;

  // Load stats
  useEffect(() => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    if (sections.length === 0) {
      setSubjectCount(0);
      setHwFormat("0 / 0");
      setQuizSubmissions("0 / 0");
      return;
    }

    const sectionFilter = sections.map((id) => `section = "${id}"`).join(" || ");

    // Count student's own submissions + total homework for format: done / total
    Promise.all([
      pb.collection("submissions").getList(1, 1, { filter: `student = "${user.id}"` }),
      pb.collection("homework").getList(1, 1, { filter: sectionFilter }),
    ])
      .then(([submitted, total]) => {
        setHwFormat(`${submitted.totalItems} / ${total.totalItems}`);
      })
      .catch(() => {
        setHwFormat("—");
      });

    // Count distinct subjects via materials in student's section
    pb.collection("materials")
      .getFullList({ filter: sectionFilter, fields: "subject" })
      .then((mats) => {
        const unique = new Set(mats.map((m: any) => m.subject));
        setSubjectCount(unique.size);
      })
      .catch(() => setSubjectCount("—"));

    // Count quiz submissions in X / Y format
    Promise.all([
      pb.collection("quizzes").getList(1, 1, { filter: sectionFilter }),
      pb.collection("quiz_attempts").getList(1, 1, { filter: `student = "${user.id}"` }),
    ])
      .then(([quizzes, attempts]) => {
        setQuizSubmissions(`${attempts.totalItems} / ${quizzes.totalItems}`);
      })
      .catch(() => setQuizSubmissions("—"));
  }, [user]);

  // Load exams
  const loadExams = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    if (sections.length === 0) {
      setExams([]);
      setExamsLoading(false);
      return;
    }

    try {
      const sectionFilter = sections.map((id) => `section = "${id}"`).join(" || ");
      const items = await pb.collection("exam_schedules").getFullList<ExamSchedule>({
        filter: `(${sectionFilter})`,
        sort: "exam_date,start_time",
        expand: "subject,section",
      });

      const validTypes = ["month1", "month2", "month3", "final"];
      const validExams = items.filter(exam => validTypes.includes(exam.exam_type));
      setExams(validExams);
    } catch (e) {
      console.error(e);
    } finally {
      setExamsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadExams(); }, [loadExams]);

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    try {
      let filter = `scope = "global"`;
      if (sections.length > 0) {
        const secFilter = sections.map((id) => `section = "${id}"`).join(" || ");
        filter = `scope = "global" || (${secFilter})`;
      }

      const items = await pb.collection("announcements").getFullList<Announcement>({
        filter,
        sort: "-created",
        expand: "author",
      });
      setAnnouncements(items);
    } catch (e) {
      console.error(e);
    } finally {
      setAnnLoading(false);
    }
  }, [user]);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  // Exam helpers
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
      case "month1": return tExams.typeMonth1 || "1st Month";
      case "month2": return tExams.typeMonth2 || "2nd Month";
      case "month3": return tExams.typeMonth3 || "3rd Month";
      case "final": return tExams.typeFinal || "Final";
      default: return type;
    }
  };

  const upcomingExams = exams.filter((exam) => isUpcoming(exam.exam_date));
  const pastExams = exams.filter((exam) => !isUpcoming(exam.exam_date));

  return (
    <div className="space-y-8">

      {/* ── Welcome banner ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-2xl)] p-7 shadow-[var(--shadow-md)]"
        style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 60%, #f59e0b 100%)" }}
      >
        <div className="absolute rounded-full opacity-10" style={{ width: 260, height: 260, background: "#fff", top: -80, insetInlineEnd: -60 }} />
        <div className="absolute rounded-full opacity-[0.07]" style={{ width: 140, height: 140, background: "#fff", bottom: -40, insetInlineStart: 40 }} />

        <div className="relative z-10">
          <p className="text-white text-base font-bold mb-1">
            {dict.dashboard.greeting} {displayName}
          </p>
          <h2 className="text-white text-2xl font-black" style={{ letterSpacing: "-0.5px" }}>
            {t.title}
          </h2>
          <p className="text-white text-xs mt-2 font-medium opacity-90">
            {locale === "ar" ? settings.schoolNameAr : settings.schoolNameEn}
          </p>
        </div>
      </div>

      {/* ── Stat cards (clickable for navigation) ────────────────────── */}
      <div>
        <h3 className="text-base font-black text-[var(--color-ink)] mb-6" style={{ letterSpacing: "-0.2px" }}>
          {t.nav.overview}
        </h3>
        <div className="stat-card-group grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={`${base}/materials`} className="block">
            <StatCard icon={<BookOpen />} label={t.stats.subjects} value={subjectCount} clickable colorSlot={1} />
          </Link>
          <Link href={`${base}/homework`} className="block">
            <StatCard icon={<FileText />} label={t.stats.myHomework} value={hwFormat} clickable colorSlot={2} />
          </Link>
          <Link href={`${base}/assessments`} className="block">
            <StatCard icon={<ClipboardList />} label={t.stats.quizzes} value={quizSubmissions} clickable colorSlot={4} />
          </Link>
        </div>
      </div>

      {/* ── Exams Schedule ────────────────────────────────────────────── */}
      <div id="exams">
        <h3 className="text-lg font-bold text-[var(--color-ink)] mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {tExams.title}
        </h3>

        {examsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <p className="text-[var(--color-ink-secondary)] text-sm">{tExams.empty}</p>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wide">
                  {tExams.upcoming}
                </h4>
                <div className="space-y-3">
                  {upcomingExams.map((exam) => {
                    const subject = exam.expand?.subject;
                    const subjectName = subject
                      ? locale === "ar" ? subject.name_ar : subject.name_en
                      : "";

                    return (
                      <Card key={exam.id} className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-[var(--color-ink)]">
                                {exam.title || subjectName}
                              </h5>
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
                                <span>{exam.start_time} - {exam.end_time}</span>
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
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wide">
                  {locale === "ar" ? "الامتحانات السابقة" : "Past Exams"}
                </h4>
                <div className="space-y-2 opacity-60">
                  {pastExams.map((exam) => {
                    const subject = exam.expand?.subject;
                    const subjectName = subject
                      ? locale === "ar" ? subject.name_ar : subject.name_en
                      : "";

                    return (
                      <Card key={exam.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--color-ink)]">{subjectName}</span>
                              <Badge variant="default" className="text-xs">{getExamTypeLabel(exam.exam_type)}</Badge>
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
          </div>
        )}
      </div>

      {/* ── Announcements ─────────────────────────────────────────────── */}
      <div id="announcements">
        <h3 className="text-lg font-bold text-[var(--color-ink)] mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {tAnn.title}
        </h3>

        {annLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-[var(--color-ink-secondary)] text-sm">{tAnn.empty}</p>
        ) : (
          <div className="space-y-5">
            {announcements.map((ann) => {
              const isExpanded = expandedAnnId === ann.id;
              const author = ann.expand?.author;
              const authorName = author
                ? (locale === "ar" ? author.name_ar : author.name_en)
                : null;

              return (
                <div
                  key={ann.id}
                  className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
                >
                  <button
                    onClick={() => setExpandedAnnId(isExpanded ? null : ann.id)}
                    className="w-full flex items-start justify-between gap-3 px-6 py-5 text-start focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)] rounded-t-[var(--radius-xl)]"
                    aria-label={`${ann.title}: ${isExpanded ? "collapse" : "expand"}`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                        style={{
                          background: "var(--color-role-student-bg)",
                          color: "var(--color-role-student-bold)",
                        }}
                      >
                        <Bell className="h-5 w-5" />
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-lg text-[var(--color-ink)] leading-snug">{ann.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={ann.scope === "global" ? "accent" : "default"}>
                            {ann.scope === "global" ? tAnn.scopeGlobal : tAnn.scopeSection}
                          </Badge>
                          {authorName && (
                            <span className="text-xs text-[var(--color-ink-secondary)] font-medium">{authorName}</span>
                          )}
                          <span className="text-xs text-[var(--color-ink-secondary)]">
                            {tAnn.postedOn}: {ann.created?.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[var(--color-ink-secondary)] mt-1 shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  {isExpanded && ann.body && (
                    <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-4 space-y-4">
                      <RichContent html={ann.body} />
                      <Reactions targetType="announcement" targetId={ann.id} />
                      <Comments targetType="announcement" targetId={ann.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}