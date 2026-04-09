"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { getDisplayName } from "@/lib/auth";
import {
  FileText, Megaphone, MessageCircle, Trash2, ChevronDown, ChevronUp,
  User, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  title: string;
  body: string;
  material_type: "text" | "link" | "video" | "file";
  teacher: string;
  section: string;
  subject: string;
  created: string;
  expand?: {
    teacher?: { id: string; name_ar: string; name_en: string; email: string };
    section?: { grade_ar: string; grade_en: string; section_ar: string; section_en: string };
    subject?: { name_ar: string; name_en: string };
  };
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: "global" | "section";
  section?: string;
  author: string;
  created: string;
  expand?: {
    author?: { id: string; name_ar: string; name_en: string; email: string; role: string };
    section?: { grade_ar: string; grade_en: string; section_ar: string; section_en: string };
  };
}

interface Comment {
  id: string;
  content: string;
  author: string;
  target_type: "announcement" | "material";
  target_id: string;
  created: string;
  expand?: {
    author?: { id: string; name_ar: string; name_en: string; email: string; role: string };
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ModerationPage() {
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.admin.moderation;
  const common = dict.common;

  const [activeTab, setActiveTab] = useState<"materials" | "announcements" | "comments">("materials");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Materials
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    loadMaterials();
    loadAnnouncements();
    loadComments();
  }, []);

  async function loadMaterials() {
    const pb = getPocketBase();
    try {
      const mats = await pb.collection("materials").getFullList<Material>({
        sort: "-created",
        expand: "teacher,section,subject",
      });
      setMaterials(mats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMaterials(false);
    }
  }

  async function loadAnnouncements() {
    const pb = getPocketBase();
    try {
      const anns = await pb.collection("announcements").getFullList<Announcement>({
        sort: "-created",
        expand: "author,section",
      });
      setAnnouncements(anns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  async function loadComments() {
    const pb = getPocketBase();
    try {
      const coms = await pb.collection("comments").getFullList<Comment>({
        sort: "-created",
        expand: "author",
      });
      setComments(coms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  }

  async function deleteMaterial(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    const pb = getPocketBase();
    try {
      await pb.collection("materials").delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    const pb = getPocketBase();
    try {
      await pb.collection("announcements").delete(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteComment(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    const pb = getPocketBase();
    try {
      await pb.collection("comments").delete(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>
        <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-0">
        <button
          onClick={() => setActiveTab("materials")}
          className={[
            "px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors relative",
            activeTab === "materials"
              ? "text-[var(--color-role-admin-bold)] bg-[var(--color-surface-card)] border border-b-0 border-[var(--color-border)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]",
          ].join(" ")}
          style={activeTab === "materials" ? { marginBottom: "-1px" } : {}}
        >
          <FileText className="inline-block h-4 w-4 me-2" />
          {t.tabMaterials}
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={[
            "px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors relative",
            activeTab === "announcements"
              ? "text-[var(--color-role-admin-bold)] bg-[var(--color-surface-card)] border border-b-0 border-[var(--color-border)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]",
          ].join(" ")}
          style={activeTab === "announcements" ? { marginBottom: "-1px" } : {}}
        >
          <Megaphone className="inline-block h-4 w-4 me-2" />
          {t.tabAnnouncements}
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={[
            "px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors relative",
            activeTab === "comments"
              ? "text-[var(--color-role-admin-bold)] bg-[var(--color-surface-card)] border border-b-0 border-[var(--color-border)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]",
          ].join(" ")}
          style={activeTab === "comments" ? { marginBottom: "-1px" } : {}}
        >
          <MessageCircle className="inline-block h-4 w-4 me-2" />
          {t.tabComments}
        </button>
      </div>

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <>
          {loadingMaterials ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
            </div>
          ) : materials.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm text-center py-10">{t.emptyMaterials}</p>
          ) : (
            <div className="space-y-3">
              {materials.map((mat) => {
                const teacher = mat.expand?.teacher;
                const section = mat.expand?.section;
                const subject = mat.expand?.subject;
                const isExpanded = expandedId === mat.id;

                return (
                  <div
                    key={mat.id}
                    className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-start justify-between gap-3 px-5 py-4">
                      <div className="flex-1">
                        <p className="font-bold text-[var(--color-ink)]">{mat.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-[var(--color-ink-secondary)]">
                          {teacher && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getDisplayName(teacher as any, locale)}
                            </span>
                          )}
                          {section && (
                            <span>
                              · {locale === "ar" ? `${section.grade_ar} — ${section.section_ar}` : `${section.grade_en} — ${section.section_en}`}
                            </span>
                          )}
                          {subject && <span>· {locale === "ar" ? subject.name_ar : subject.name_en}</span>}
                          <span className="flex items-center gap-1">
                            · <Calendar className="h-3 w-3" />
                            {mat.created?.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleExpand(mat.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                        >
                          {isExpanded ? t.hideDetails : t.viewDetails}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => deleteMaterial(mat.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-4">
                        <RichContent html={mat.body} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <>
          {loadingAnnouncements ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm text-center py-10">{t.emptyAnnouncements}</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const author = ann.expand?.author;
                const section = ann.expand?.section;
                const isExpanded = expandedId === ann.id;

                return (
                  <div
                    key={ann.id}
                    className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-start justify-between gap-3 px-5 py-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[var(--color-ink)]">{ann.title}</p>
                          <Badge variant={ann.scope === "global" ? "accent" : "default"}>
                            {ann.scope === "global"
                              ? locale === "ar" ? "عام" : "Global"
                              : locale === "ar" ? "فصل محدد" : "Section"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-[var(--color-ink-secondary)]">
                          {author && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getDisplayName(author as any, locale)}
                            </span>
                          )}
                          {section && ann.scope === "section" && (
                            <span>
                              · {locale === "ar" ? `${section.grade_ar} — ${section.section_ar}` : `${section.grade_en} — ${section.section_en}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            · <Calendar className="h-3 w-3" />
                            {ann.created?.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleExpand(ann.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                        >
                          {isExpanded ? t.hideDetails : t.viewDetails}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-4">
                        <RichContent html={ann.body} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Comments Tab */}
      {activeTab === "comments" && (
        <>
          {loadingComments ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-admin-bold)] border-t-transparent animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm text-center py-10">{t.emptyComments}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((com) => {
                const author = com.expand?.author;

                return (
                  <div
                    key={com.id}
                    className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {author && (
                            <span className="text-sm font-semibold text-[var(--color-ink)]">
                              {getDisplayName(author as any, locale)}
                            </span>
                          )}
                          <Badge variant={author?.role === "teacher" ? "teacher" : author?.role === "student" ? "student" : "default"}>
                            {author?.role === "teacher"
                              ? locale === "ar" ? "معلمة" : "Teacher"
                              : author?.role === "student"
                              ? locale === "ar" ? "طالبة" : "Student"
                              : locale === "ar" ? "مديرة" : "Admin"}
                          </Badge>
                          <span className="text-xs text-[var(--color-ink-secondary)]">·</span>
                          <span className="text-xs text-[var(--color-ink-secondary)]">{com.created?.slice(0, 10)}</span>
                        </div>
                        <p className="text-sm text-[var(--color-ink)]">{com.content}</p>
                        <p className="text-xs text-[var(--color-ink-placeholder)] mt-2">
                          {t.targetType}: {com.target_type === "material" ? t.targetMaterial : t.targetAnnouncement}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteComment(com.id)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
