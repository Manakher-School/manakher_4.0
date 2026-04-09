"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { useSettings } from "@/context/settings-context";
import { getPocketBase } from "@/lib/pocketbase";
import { getDisplayName as getDisplayNameFromAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";
import {
  Settings as SettingsIcon, Check, Loader2, ChevronDown, ChevronUp,
  Shield, Activity, FileText, Megaphone, MessageCircle, Trash2,
  Users, GraduationCap, Layers, BookOpen, ClipboardList,
  Heart, TrendingUp, User, Calendar
} from "lucide-react";

// ─── Helper to get display name from expanded user object ────────────

function getDisplayNameFromExpand(user: any, locale: string): string {
  if (!user) return "Unknown";
  return locale === "ar" ? user.name_ar : user.name_en;
}

// ─── Types for Moderation ────────────────────────────────────────────

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

interface SystemMetrics {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalSections: number;
  totalSubjects: number;
  totalMaterials: number;
  totalAnnouncements: number;
  totalHomework: number;
  totalQuizzes: number;
  totalSubmissions: number;
  totalComments: number;
  totalReactions: number;
  avgQuizScore: number;
}

export default function SettingsPage() {
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  const t = dict.dashboard.admin.settings;
  const tMod = dict.dashboard.admin.moderation;
  const tMon = dict.dashboard.admin.monitoring;
  const common = dict.common;

  // ─── Platform Settings State ────────────────────────────────────────
  const [schoolNameAr, setSchoolNameAr] = useState("");
  const [schoolNameEn, setSchoolNameEn] = useState("");
  const [enableComments, setEnableComments] = useState(true);
  const [enableReactions, setEnableReactions] = useState(true);
  const [enableQuizzes, setEnableQuizzes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ─── Moderation State ───────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [moderationTab, setModerationTab] = useState<"materials" | "announcements" | "comments">("materials");
  const [moderationLoading, setModerationLoading] = useState(true);
  const [moderationDeleting, setModerationDeleting] = useState<string | null>(null);

  // ─── Monitoring State ───────────────────────────────────────────────
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);

  // ─── Accordion State ────────────────────────────────────────────────
  const [accordions, setAccordions] = useState({
    moderation: false,
    monitoring: false,
    settings: true, // Settings open by default
  });

  // ─── Initialize Settings ────────────────────────────────────────────
  useEffect(() => {
    setSchoolNameAr(settings.schoolNameAr);
    setSchoolNameEn(settings.schoolNameEn);
    setEnableComments(settings.enableComments);
    setEnableReactions(settings.enableReactions);
    setEnableQuizzes(settings.enableQuizzes);
  }, [settings]);

  // ─── Load Moderation Data ───────────────────────────────────────────
  useEffect(() => {
    if (accordions.moderation) {
      loadModerationData();
    }
  }, [accordions.moderation]);

  async function loadModerationData() {
    const pb = getPocketBase();
    try {
      setModerationLoading(true);
      const [matList, annList, comList] = await Promise.all([
        pb.collection("materials").getFullList<Material>(),
        pb.collection("announcements").getFullList<Announcement>(),
        pb.collection("comments").getFullList<Comment>({ expand: "author" }),
      ]);
      setMaterials(matList);
      setAnnouncements(annList);
      setComments(comList);
    } catch (e) {
      console.error("Failed to load moderation data:", e);
      await alert("Failed to load content");
    } finally {
      setModerationLoading(false);
    }
  }

  async function deleteMaterial(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteMaterial))) return;
    setModerationDeleting(id);
    try {
      await pb.collection("materials").delete(id);
      setMaterials(materials.filter(m => m.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      setModerationDeleting(null);
    }
  }

  async function deleteAnnouncement(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteAnnouncement))) return;
    setModerationDeleting(id);
    try {
      await pb.collection("announcements").delete(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      setModerationDeleting(null);
    }
  }

  async function deleteComment(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteComment))) return;
    setModerationDeleting(id);
    try {
      await pb.collection("comments").delete(id);
      setComments(comments.filter(c => c.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      setModerationDeleting(null);
    }
  }

  // ─── Load Monitoring Data ───────────────────────────────────────────
  useEffect(() => {
    if (accordions.monitoring) {
      loadMetrics();
    }
  }, [accordions.monitoring]);

  async function loadMetrics() {
    const pb = getPocketBase();
    try {
      setMonitoringLoading(true);
      const [
        users, teachers, students, sections, subjects, materials, announcements,
        homework, quizzes, submissions, comments, reactions,
      ] = await Promise.all([
        pb.collection("users").getList(1, 1),
        pb.collection("users").getList(1, 1, { filter: 'role = "teacher"' }),
        pb.collection("users").getList(1, 1, { filter: 'role = "student"' }),
        pb.collection("class_sections").getList(1, 1),
        pb.collection("subjects").getList(1, 1),
        pb.collection("materials").getList(1, 1),
        pb.collection("announcements").getList(1, 1),
        pb.collection("homework").getList(1, 1),
        pb.collection("quizzes").getList(1, 1),
        pb.collection("submissions").getList(1, 1),
        pb.collection("comments").getList(1, 1),
        pb.collection("reactions").getList(1, 1),
      ]);

      const quizAttempts = await pb.collection("quiz_attempts").getList(1, 1);
      const avgScore = quizAttempts.totalItems > 0
        ? (await pb.collection("quiz_attempts").getFullList()).reduce((sum: number, a: any) => sum + (a.score || 0), 0) / quizAttempts.totalItems
        : 0;

      setMetrics({
        totalUsers: users.totalItems,
        totalTeachers: teachers.totalItems,
        totalStudents: students.totalItems,
        totalSections: sections.totalItems,
        totalSubjects: subjects.totalItems,
        totalMaterials: materials.totalItems,
        totalAnnouncements: announcements.totalItems,
        totalHomework: homework.totalItems,
        totalQuizzes: quizzes.totalItems,
        totalSubmissions: submissions.totalItems,
        totalComments: comments.totalItems,
        totalReactions: reactions.totalItems,
        avgQuizScore: Math.round(avgScore * 100) / 100,
      });
    } catch (e) {
      console.error("Failed to load metrics:", e);
    } finally {
      setMonitoringLoading(false);
    }
  }

  // ─── Save Platform Settings ────────────────────────────────────────
  async function saveSettings() {
    setSaving(true);
    try {
      await updateSettings({
        schoolNameAr,
        schoolNameEn,
        enableComments,
        enableReactions,
        enableQuizzes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      await alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Toggle Accordion ──────────────────────────────────────────────
  function toggleAccordion(key: keyof typeof accordions) {
    setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Accordion Button Component ────────────────────────────────────
  function AccordionButton({ label, isOpen, icon: Icon }: { label: string; isOpen: boolean; icon: React.ReactNode }) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--color-role-admin-bg)", color: "var(--color-role-admin-bold)" }}
        >
          {Icon}
        </div>
        <h3 className="text-lg font-bold text-[var(--color-ink)] flex-1">{label}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-[var(--color-ink-secondary)]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[var(--color-ink-secondary)]" />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>
        <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{t.subtitle}</p>
      </div>

      {/* ─── Content Moderation Accordion ─────────────────────────────── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden">
        <button
          onClick={() => toggleAccordion("moderation")}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label="Content Moderation" isOpen={accordions.moderation} icon={<Shield className="h-4 w-4" />} />
        </button>

        {accordions.moderation && (
          <div className="border-t border-[var(--color-border)] p-6 space-y-4">
            {moderationLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-2 border-b border-[var(--color-border)] -mb-4">
                  {(["materials", "announcements", "comments"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setModerationTab(tab)}
                      className={`pb-3 px-1 font-semibold text-sm transition-colors ${
                        moderationTab === tab
                          ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                          : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {tab === "materials" && "Materials"}
                      {tab === "announcements" && "Announcements"}
                      {tab === "comments" && "Comments"}
                    </button>
                  ))}
                </div>

                {/* Materials Tab */}
                {moderationTab === "materials" && (
                  <div className="space-y-3 pt-4">
                    {materials.length === 0 ? (
                      <p className="text-sm text-[var(--color-ink-secondary)]">{tMod.noMaterials}</p>
                    ) : (
                      materials.map(material => (
                        <div key={material.id} className="rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[var(--color-ink)] truncate">{material.title}</h4>
                              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                                By: {material.expand?.teacher ? getDisplayNameFromExpand(material.expand.teacher, locale) : "Unknown"}
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteMaterial(material.id)}
                              disabled={moderationDeleting === material.id}
                            >
                              {moderationDeleting === material.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <RichContent html={material.body} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Announcements Tab */}
                {moderationTab === "announcements" && (
                  <div className="space-y-3 pt-4">
                    {announcements.length === 0 ? (
                      <p className="text-sm text-[var(--color-ink-secondary)]">{tMod.noAnnouncements}</p>
                    ) : (
                      announcements.map(ann => (
                        <div key={ann.id} className="rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-[var(--color-ink)] truncate">{ann.title}</h4>
                                <Badge variant={ann.scope === "global" ? "default" : "accent"}>
                                  {ann.scope === "global" ? "Global" : "Section"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[var(--color-ink-secondary)] mt-1">
                                By: {ann.expand?.author ? getDisplayNameFromExpand(ann.expand.author, locale) : "Unknown"}
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteAnnouncement(ann.id)}
                              disabled={moderationDeleting === ann.id}
                            >
                              {moderationDeleting === ann.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <RichContent html={ann.body} />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Comments Tab */}
                {moderationTab === "comments" && (
                  <div className="space-y-3 pt-4">
                    {comments.length === 0 ? (
                      <p className="text-sm text-[var(--color-ink-secondary)]">{tMod.noComments}</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[var(--color-ink-secondary)]">
                                By: {comment.expand?.author ? getDisplayNameFromExpand(comment.expand.author, locale) : "Unknown"}
                              </p>
                              <p className="text-sm text-[var(--color-ink)] mt-1">{comment.content}</p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteComment(comment.id)}
                              disabled={moderationDeleting === comment.id}
                            >
                              {moderationDeleting === comment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── System Monitoring Accordion ──────────────────────────────── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden">
        <button
          onClick={() => toggleAccordion("monitoring")}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label="System Monitoring" isOpen={accordions.monitoring} icon={<Activity className="h-4 w-4" />} />
        </button>

        {accordions.monitoring && (
          <div className="border-t border-[var(--color-border)] p-6">
            {monitoringLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* User Stats */}
                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Total Users</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalUsers}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Teachers</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalTeachers}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Students</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalStudents}</p>
                </div>

                {/* Structure Stats */}
                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Sections</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalSections}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Subjects</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalSubjects}</p>
                </div>

                {/* Content Stats */}
                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Materials</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalMaterials}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Announcements</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalAnnouncements}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Homework</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalHomework}</p>
                </div>

                {/* Assessment Stats */}
                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Quizzes</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalQuizzes}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Submissions</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalSubmissions}</p>
                </div>

                {/* Engagement Stats */}
                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Comments</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalComments}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Reactions</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.totalReactions}</p>
                </div>

                <div className="rounded-lg bg-[var(--color-surface-sunken)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">Avg Quiz Score</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-ink)]">{metrics.avgQuizScore}%</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ─── Platform Settings Accordion ──────────────────────────────── */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden">
        <button
          onClick={() => toggleAccordion("settings")}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label="Platform Settings" isOpen={accordions.settings} icon={<SettingsIcon className="h-4 w-4" />} />
        </button>

        {accordions.settings && (
          <div className="border-t border-[var(--color-border)] p-6 space-y-6">
            {settingsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
              </div>
            ) : (
              <>
                {/* General Settings */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-ink)]">{t.general}</h4>
                  <Input
                    label={t.schoolNameAr}
                    value={schoolNameAr}
                    onChange={(e) => setSchoolNameAr(e.target.value)}
                    placeholder={t.schoolNameAr}
                  />
                  <Input
                    label={t.schoolNameEn}
                    value={schoolNameEn}
                    onChange={(e) => setSchoolNameEn(e.target.value)}
                    placeholder={t.schoolNameEn}
                  />
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-ink)]">{t.features}</h4>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableComments}
                      onChange={(e) => setEnableComments(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableComments}</p>
                      <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.commentsDesc}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableReactions}
                      onChange={(e) => setEnableReactions(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableReactions}</p>
                      <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.reactionsDesc}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableQuizzes}
                      onChange={(e) => setEnableQuizzes(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableQuizzes}</p>
                      <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.quizzesDesc}</p>
                    </div>
                  </label>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="primary" onClick={saveSettings} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {saving ? common.loading : t.saveChanges}
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      <Check className="h-4 w-4" />
                      {t.saved}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
