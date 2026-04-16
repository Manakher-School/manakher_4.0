"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useSettings } from "@/context/settings-context";
import { StatCard } from "@/components/ui/stat-card";
import { getDisplayName } from "@/lib/auth";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, FileText, Send, Bell, ClipboardList } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { settings } = useSettings();
  const t = dict.dashboard.student;
  const displayName = user ? getDisplayName(user, locale) : "";

  const [subjectCount, setSubjectCount] = useState<number | string>("—");
  const [hwCount, setHwCount] = useState<number | string>("—");
  const [submittedCount, setSubmittedCount] = useState<number | string>("—");
  const [announcementCount, setAnnouncementCount] = useState<number | string>("—");
  const [quizSubmissions, setQuizSubmissions] = useState<string>("—");

  useEffect(() => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    if (sections.length === 0) {
      setSubjectCount(0);
      setHwCount(0);
      setAnnouncementCount(0);
      setSubmittedCount(0);
      setQuizSubmissions("0/0");
      return;
    }

    const sectionId = sections[0];
    const sectionFilter = sections.map((id) => `section = "${id}"`).join(" || ");
    const annFilter = sections.map((id) => `section = "${id}"`).join(" || ");

    // Count homework for student's section
    pb.collection("homework")
      .getList(1, 1, { filter: sectionFilter })
      .then((r) => setHwCount(r.totalItems))
      .catch(() => setHwCount("—"));

    // Count student's own submissions
    pb.collection("submissions")
      .getList(1, 1, { filter: `student = "${user.id}"` })
      .then((r) => setSubmittedCount(r.totalItems))
      .catch(() => setSubmittedCount("—"));

    // Count announcements for student's section + global ones
    pb.collection("announcements")
      .getList(1, 1, {
        filter: `scope = "global" || (${annFilter})`,
      })
      .then((r) => setAnnouncementCount(r.totalItems))
      .catch(() => setAnnouncementCount("—"));

    // Count distinct subjects via materials in student's section
    pb.collection("materials")
      .getFullList({ filter: sectionFilter, fields: "subject" })
      .then((mats) => {
        const unique = new Set(mats.map((m: any) => m.subject));
        setSubjectCount(unique.size);
      })
      .catch(() => setSubjectCount("—"));

    // Count quiz submissions in X/Y format
    Promise.all([
      pb.collection("quizzes").getList(1, 1, { filter: sectionFilter }),
      pb.collection("quiz_attempts").getList(1, 1, { filter: `student = "${user.id}"` })
    ])
      .then(([quizzes, attempts]) => {
        setQuizSubmissions(`${attempts.totalItems}/${quizzes.totalItems}`);
      })
      .catch(() => setQuizSubmissions("—"));
  }, [user]);

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
          <p className="text-white text-sm font-semibold mb-1">
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

      {/* ── Stat cards ────────────────────────────────────────────────── */}
       <div>
         <h3 className="text-base font-black text-[var(--color-ink)] mb-6" style={{ letterSpacing: "-0.2px" }}>
           {t.nav.overview}
         </h3>
         <div className="stat-card-group grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <StatCard icon={<BookOpen />} label={t.stats.subjects} value={subjectCount} />
          <StatCard icon={<FileText />} label={t.stats.homework} value={hwCount} />
          <StatCard icon={<Send />} label={t.stats.submitted} value={submittedCount} />
          <StatCard icon={<ClipboardList />} label={t.stats.quizzes} value={quizSubmissions} />
          <StatCard icon={<Bell />} label={t.stats.announcements} value={announcementCount} />
        </div>
      </div>

    </div>
  );
}
