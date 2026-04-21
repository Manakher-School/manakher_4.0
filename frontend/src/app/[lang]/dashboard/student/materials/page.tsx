"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Paperclip, ArrowRight } from "lucide-react";
import Link from "next/link";
import { RichContent } from "@/components/ui/rich-content";
import { Comments } from "@/components/ui/comments";

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface Material {
  id: string;
  title: string;
  body: string;
  link_url: string;
  attachment?: string;
  section: string;
  subject: string;
  created: string;
  collectionId: string;
  expand?: {
    subject?: Subject;
    teacher?: { name_ar: string; name_en: string };
  };
}

export default function StudentMaterialsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const t = dict.dashboard.student.materials;

  const [list, setList] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      const filter = subjectFilter
        ? `(${sectionFilter}) && subject = "${subjectFilter}"`
        : `(${sectionFilter})`;

      const [mats, subs] = await Promise.all([
        pb.collection("materials").getFullList<Material>({
          filter,
          sort: "-created",
          expand: "subject,teacher",
        }),
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
      ]);
      setList(mats);
      setSubjects(subs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, subjectFilter]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/dashboard/student`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline mb-2">
        {locale === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
        {locale === "ar" ? "العودة للرئيسية" : "Back to Overview"}
      </Link>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>

        {/* Subject filter */}
        <div className="space-y-1">
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setLoading(true); }}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="">{t.all}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{subjectName(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-5">
          {list.map((mat) => {
            const isExpanded = expandedId === mat.id;
            const sub = mat.expand?.subject;
            const teacher = mat.expand?.teacher;
            const teacherName = teacher
              ? (locale === "ar" ? teacher.name_ar : teacher.name_en)
              : null;

            return (
              <div
                key={mat.id}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
              >
                 <button
                   onClick={() => toggle(mat.id)}
                   className="w-full flex items-start justify-between gap-3 px-5 py-4 text-start focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)] rounded-t-[var(--radius-xl)]"
                   aria-label={`${mat.title}: ${isExpanded ? "collapse" : "expand"}`}
                   aria-expanded={isExpanded}
                 >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                      style={{
                        background: "var(--color-role-student-bg)",
                        color: "var(--color-role-student-bold)",
                      }}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--color-ink)]">{mat.title}</p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        {sub && <span>{subjectName(sub)}</span>}
                        {teacherName && <span>· {teacherName}</span>}
                        <span>· {t.postedOn}: {mat.created?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--color-ink-secondary)] mt-1 shrink-0">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-4 space-y-4">
                    {mat.body && <RichContent html={mat.body} />}
                     {mat.link_url && (
                       <a
                         href={mat.link_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1"
                         aria-label={`${t.viewLink} for ${mat.title}`}
                       >
                         <ExternalLink className="h-3.5 w-3.5" />
                         {t.viewLink}
                       </a>
                     )}
                     {mat.attachment && (
                       <a
                         href={`${getPocketBase().baseURL}/api/files/${mat.collectionId}/${mat.id}/${mat.attachment}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1"
                         aria-label={`Download ${mat.attachment}`}
                       >
                         <Paperclip className="h-3.5 w-3.5" />
                         {mat.attachment}
                       </a>
                     )}
                    
                    <Comments targetType="material" targetId={mat.id} />
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
