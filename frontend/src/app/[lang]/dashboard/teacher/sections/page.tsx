"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getDisplayName } from "@/lib/auth";
import { getPocketBase } from "@/lib/pocketbase";
import { Users, Search, ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  id: string;
  grade_ar: string;
  grade_en: string;
  grade_order: number;
  section_ar: string;
  section_en: string;
}

interface Student {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
}

interface SectionWithStudents {
  section: Section;
  students: Student[];
}

function normalize(s: string | undefined | null) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, "") // strip Arabic diacritics
    .trim();
}

function matches(student: Student, query: string): boolean {
  if (!query) return true;
  const q = normalize(query);
  return (
    normalize(student.name_ar).includes(q) ||
    normalize(student.name_en).includes(q) ||
    normalize(student.email).includes(q)
  );
}

export default function TeacherSectionsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const t = dict.dashboard.teacher.sections;
  const common = dict.common;

  const [data, setData] = useState<SectionWithStudents[]>([]);
  const [loading, setLoading] = useState(true);

  // Global search query
  const [globalQuery, setGlobalQuery] = useState("");

  // Per-section expanded state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Per-section local search query
  const [sectionQueries, setSectionQueries] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const sectionIds: string[] = (user as any).sections ?? [];

    if (sectionIds.length === 0) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const pb = getPocketBase();
        const sectionFilter = sectionIds.map((id) => `id = "${id}"`).join(" || ");
        const sections = await pb
          .collection("class_sections")
          .getFullList<Section>({ filter: sectionFilter, sort: "grade_order,section_ar" });

        const results: SectionWithStudents[] = await Promise.all(
          sections.map(async (sec) => {
            const students = await pb
              .collection("users")
              .getFullList<Student>({
                filter: `role = "student" && sections.id = "${sec.id}"`,
                sort: locale === "ar" ? "name_ar" : "name_en",
              });
            return { section: sec, students };
          })
        );

        setData(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, locale]);

  // When global search is active, auto-expand sections that have matches
  const globalActive = globalQuery.trim().length > 0;

  const filteredData = useMemo(() => {
    return data.map(({ section, students }) => ({
      section,
      students,
      // students matching global query
      globalMatches: students.filter((s) => matches(s, globalQuery)),
    }));
  }, [data, globalQuery]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setSectionQuery(sectionId: string, q: string) {
    setSectionQueries((prev) => ({ ...prev, [sectionId]: q }));
  }

  function sectionName(sec: Section) {
    return locale === "ar"
      ? `${sec.grade_ar} — ${sec.section_ar}`
      : `${sec.grade_en} — ${sec.section_en}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
        {t.title}
      </h2>

      {data.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <>
          {/* ── Global search ── */}
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" style={{ insetInlineStart: "0.75rem" }} />
            <input
              type="search"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder={t.searchAll}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-[var(--shadow-xs)]"
              style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
            />
          </div>

          {/* ── Sections ── */}
          <div className="space-y-3">
            {filteredData.map(({ section, students, globalMatches }) => {
              // In global search mode, skip sections with no matches
              if (globalActive && globalMatches.length === 0) return null;

              const isOpen = globalActive || expanded.has(section.id);
              const localQuery = sectionQueries[section.id] ?? "";

              // Which students to display inside this section
              const displayStudents = globalActive
                ? globalMatches
                : students.filter((s) => matches(s, localQuery));

              const countLabel = globalActive
                ? `${globalMatches.length} / ${students.length}`
                : String(students.length);

              return (
                <div
                  key={section.id}
                  className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
                >
                  {/* Section header — not clickable when global search is active */}
                  <button
                    onClick={() => !globalActive && toggle(section.id)}
                    className={[
                      "w-full flex items-center justify-between px-5 py-4 text-start transition-colors",
                      globalActive ? "cursor-default" : "hover:bg-[var(--color-surface-hover)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-teacher-bold)]"
                        style={{ background: "var(--color-role-teacher-bg)" }}
                      >
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="font-bold text-[var(--color-ink)]">{sectionName(section)}</span>
                      <span className="text-sm font-bold text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] rounded-full px-2.5 py-0.5 min-w-[2rem] text-center">
                        {countLabel} {t.students}
                      </span>
                    </div>
                    {!globalActive && (
                      <span className="text-[var(--color-ink-secondary)] shrink-0">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    )}
                  </button>

                  {/* Section body */}
                  {isOpen && (
                    <div className="border-t border-[var(--color-border-subtle)]">

                      {/* Per-section search — only shown when NOT in global mode */}
                      {!globalActive && students.length > 0 && (
                        <div className="px-4 pt-3 pb-2 relative">
                          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" style={{ insetInlineStart: "1.25rem" }} />
                          <input
                            type="search"
                            value={localQuery}
                            onChange={(e) => setSectionQuery(section.id, e.target.value)}
                            placeholder={t.searchSection}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                            style={{ paddingInlineStart: "2.25rem", paddingInlineEnd: "0.75rem" }}
                          />
                        </div>
                      )}

                      {/* Student list */}
                      {students.length === 0 ? (
                        <p className="px-5 py-3 text-sm text-[var(--color-ink-disabled)]">
                          {t.noStudents}
                        </p>
                      ) : displayStudents.length === 0 ? (
                        <p className="px-5 py-3 text-sm text-[var(--color-ink-disabled)]">
                          {t.noMatch}
                        </p>
                      ) : (
                        <ul className="divide-y divide-[var(--color-border-subtle)]">
                          {displayStudents.map((s) => {
                            const name = getDisplayName(s as any, locale);
                            const initial = name.charAt(0);
                            return (
                              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-xs font-bold text-[var(--color-ink-secondary)]">
                                  {initial}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                                    {name}
                                  </p>
                                  <p className="text-xs text-[var(--color-ink-secondary)] truncate">{s.email}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Global search returned nothing at all */}
            {globalActive && filteredData.every((d) => d.globalMatches.length === 0) && (
              <p className="text-sm text-[var(--color-ink-secondary)]">{common.noResults}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
