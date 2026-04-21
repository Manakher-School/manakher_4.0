"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";
import { Comments } from "@/components/ui/comments";
import { Reactions } from "@/components/ui/reactions";

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: "global" | "section";
  section: string;
  created: string;
  expand?: { author?: { name_ar: string; name_en: string } };
}

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const t = dict.dashboard.student.announcements;

  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
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
      setList(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

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
        <div className="space-y-5">
          {list.map((ann) => {
            const isExpanded = expandedId === ann.id;
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
                    onClick={() => toggle(ann.id)}
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
                          {ann.scope === "global" ? t.scopeGlobal : t.scopeSection}
                        </Badge>
                        {authorName && (
                          <span className="text-xs text-[var(--color-ink-secondary)] font-medium">{authorName}</span>
                        )}
                        <span className="text-xs text-[var(--color-ink-secondary)]">
                          {t.postedOn}: {ann.created?.slice(0, 10)}
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
  );
}
