"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useAuth } from "@/context/auth-context";
import { useDialog } from "@/context/dialog-context";
import { useSettings } from "@/context/settings-context";
import { getPocketBase } from "@/lib/pocketbase";
import { getDisplayName as getDisplayNameFromAuth } from "@/lib/auth";
import { useFormState, useCrudState, useTabState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/ui/rich-content";
import {
  Settings as SettingsIcon, Check, Loader2, ChevronDown, ChevronUp,
  Shield, Activity, FileText, Megaphone, MessageCircle, Trash2,
  Users, GraduationCap, Layers, BookOpen, ClipboardList,
  Heart, TrendingUp, User, Calendar, Lock, Mail, AtSign
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
  const tProf = dict.dashboard.admin.profile;
  const common = dict.common;

  // ─── Form State (Settings form: 5 fields) ───────────────────────
  const formState = useFormState({
    schoolNameAr: "",
    schoolNameEn: "",
    enableComments: true,
    enableReactions: true,
    enableQuizzes: true,
  });

  // ─── CRUD State (Settings save & moderation loading) ──────────────
  const settingsCrudState = useCrudState();
  const moderationCrudState = useCrudState();
  const monitoringCrudState = useCrudState();

  // ─── Tab State (Moderation tab) ──────────────────────────────────
  const moderationTabState = useTabState("materials", {});

  // ─── Accordion State (Simple boolean states for open/close) ───────
  const [accordions, setAccordions] = useState({
    moderation: false,
    monitoring: false,
    settings: true, // Settings open by default
    profile: false,
  });

  // ─── Profile State ──────────────────────────────────────────────
  const { user } = useAuth();
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileNewEmail, setProfileNewEmail] = useState("");
  const [profileEmailPassword, setProfileEmailPassword] = useState("");
  const [profileUsername, setProfileUsername] = useState(user?.username || "");
  const [profileSaving, setProfileSaving] = useState<string>("");

  // ─── Data Collections (Keep as useState) ──────────────────────
  const [materials, setMaterials] = useState<Material[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  // ─── Initialize Settings (once on mount) ────────────────────────────────────────
  useEffect(() => {
    // Only sync from settings context on first load if form is empty
    // This prevents infinite loops from continuous syncing
    if (!formState.state.data.schoolNameAr && settings.schoolNameAr) {
      formState.setData({
        schoolNameAr: settings.schoolNameAr,
        schoolNameEn: settings.schoolNameEn,
        enableComments: settings.enableComments,
        enableReactions: settings.enableReactions,
        enableQuizzes: settings.enableQuizzes,
      });
    }
  }, []); // Empty dependency array - only runs once on component mount

  // ─── Load Moderation Data ───────────────────────────────────────────
  useEffect(() => {
    if (accordions.moderation) {
      loadModerationData();
    }
  }, [accordions.moderation]);

  async function loadModerationData() {
    const pb = getPocketBase();
    try {
      moderationCrudState.setIsLoading(true);
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
      moderationCrudState.setIsLoading(false);
    }
  }

  async function deleteMaterial(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteMaterial))) return;
    moderationCrudState.setEditingId(id);
    try {
      await pb.collection("materials").delete(id);
      setMaterials(materials.filter(m => m.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      moderationCrudState.setEditingId(null);
    }
  }

  async function deleteAnnouncement(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteAnnouncement))) return;
    moderationCrudState.setEditingId(id);
    try {
      await pb.collection("announcements").delete(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      moderationCrudState.setEditingId(null);
    }
  }

  async function deleteComment(id: string) {
    const pb = getPocketBase();
    if (!(await confirm(tMod.confirmDeleteComment))) return;
    moderationCrudState.setEditingId(id);
    try {
      await pb.collection("comments").delete(id);
      setComments(comments.filter(c => c.id !== id));
      await alert(tMod.deletedSuccess);
    } catch (e) {
      console.error("Failed to delete:", e);
      await alert(tMod.deleteError);
    } finally {
      moderationCrudState.setEditingId(null);
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
      monitoringCrudState.setIsLoading(true);
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
        ? (await pb.collection("quiz_attempts").getList(1, 500, { sort: "-created" }))
            .items.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / quizAttempts.totalItems
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
      monitoringCrudState.setIsLoading(false);
    }
  }

  // ─── Save Platform Settings ────────────────────────────────────────
  async function saveSettings() {
    settingsCrudState.setIsLoading(true);
    try {
      await updateSettings({
        schoolNameAr: formState.state.data.schoolNameAr,
        schoolNameEn: formState.state.data.schoolNameEn,
        enableComments: formState.state.data.enableComments,
        enableReactions: formState.state.data.enableReactions,
        enableQuizzes: formState.state.data.enableQuizzes,
      });
      settingsCrudState.setShowCreate(true); // Use showCreate as success indicator
      setTimeout(() => settingsCrudState.setShowCreate(false), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      await alert("Failed to save settings. Please try again.");
    } finally {
      settingsCrudState.setIsLoading(false);
    }
  }

  // ─── Accordion Button Component ────────────────────────────────
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
          onClick={() => setAccordions(prev => ({ ...prev, moderation: !prev.moderation }))}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label={tMod.title} isOpen={accordions.moderation} icon={<Shield className="h-4 w-4" />} />
        </button>

        {accordions.moderation && (
          <div className="border-t border-[var(--color-border)] p-6 space-y-4">
            {moderationCrudState.state.isLoading ? (
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
                      onClick={() => moderationTabState.setActiveTab(tab)}
                      className={`pb-3 px-1 font-semibold text-sm transition-colors ${
                        moderationTabState.state.activeTab === tab
                          ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
                          : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {tab === "materials" && tMod.tabMaterials}
                      {tab === "announcements" && tMod.tabAnnouncements}
                      {tab === "comments" && tMod.tabComments}
                    </button>
                  ))}
                </div>

                {/* Materials Tab */}
                {moderationTabState.state.activeTab === "materials" && (
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
                               disabled={moderationCrudState.state.editingId === material.id}
                               aria-label={`${common.delete}: ${material.title}`}
                             >
                              {moderationCrudState.state.editingId === material.id ? (
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
                {moderationTabState.state.activeTab === "announcements" && (
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
                                  {ann.scope === "global" ? dict.dashboard.admin.announcements?.scopeGlobal || "Global" : dict.dashboard.admin.announcements?.scopeSection || "Section"}
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
                               disabled={moderationCrudState.state.editingId === ann.id}
                               aria-label={`${common.delete}: ${ann.title}`}
                             >
                              {moderationCrudState.state.editingId === ann.id ? (
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
                {moderationTabState.state.activeTab === "comments" && (
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
                               disabled={moderationCrudState.state.editingId === comment.id}
                               aria-label={`${common.delete}: ${t('Comment by', {locale})} ${getDisplayNameFromExpand(comment.expand?.author, locale)}`}
                             >
                              {moderationCrudState.state.editingId === comment.id ? (
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
          onClick={() => setAccordions(prev => ({ ...prev, monitoring: !prev.monitoring }))}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label={tMon.title} isOpen={accordions.monitoring} icon={<Activity className="h-4 w-4" />} />
        </button>

        {accordions.monitoring && (
          <div className="border-t border-[var(--color-border)] p-6">
            {monitoringCrudState.state.isLoading ? (
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
          onClick={() => setAccordions(prev => ({ ...prev, settings: !prev.settings }))}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <AccordionButton label={t.title} isOpen={accordions.settings} icon={<SettingsIcon className="h-4 w-4" />} />
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
                    value={formState.state.data.schoolNameAr}
                    onChange={(e) => formState.setFieldValue("schoolNameAr", e.target.value)}
                    placeholder={t.schoolNameAr}
                  />
                  <Input
                    label={t.schoolNameEn}
                    value={formState.state.data.schoolNameEn}
                    onChange={(e) => formState.setFieldValue("schoolNameEn", e.target.value)}
                    placeholder={t.schoolNameEn}
                  />
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-[var(--color-ink)]">{t.features}</h4>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.state.data.enableComments}
                      onChange={(e) => formState.setFieldValue("enableComments", e.target.checked)}
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
                      checked={formState.state.data.enableReactions}
                      onChange={(e) => formState.setFieldValue("enableReactions", e.target.checked)}
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
                      checked={formState.state.data.enableQuizzes}
                      onChange={(e) => formState.setFieldValue("enableQuizzes", e.target.checked)}
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
                  <Button variant="primary" onClick={saveSettings} disabled={settingsCrudState.state.isLoading}>
                    {settingsCrudState.state.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {settingsCrudState.state.isLoading ? common.loading : t.saveChanges}
                  </Button>
                  {settingsCrudState.state.showCreate && (
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

        {/* ─── Profile Accordion ─────────────────────────────────── */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden">
          <button
            onClick={() => setAccordions(prev => ({ ...prev, profile: !prev.profile }))}
            className="flex w-full items-center justify-between p-4 text-start hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="font-semibold text-[var(--color-ink)]">{tProf.title}</span>
            </div>
            {accordions.profile ? <ChevronUp className="h-4 w-4 text-[var(--color-ink-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-ink-secondary)]" />}
          </button>
          {accordions.profile && (
            <div className="border-t border-[var(--color-border)] p-6 space-y-6">
              {/* Current Account Info */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--color-role-admin-bg)] flex items-center justify-center">
                  <User className="h-6 w-6 text-[var(--color-role-admin-bold)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-ink)]">
                    {locale === "ar" ? user?.name_ar : user?.name_en}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-secondary)]">{user?.email}</p>
                  {user?.username && (
                    <p className="text-xs text-[var(--color-ink-placeholder)]">@{user.username}</p>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--color-accent)]" />
                  <h4 className="font-semibold text-[var(--color-ink)]">{tProf.changePassword}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.currentPassword}</label>
                    <input type="password" value={profileCurrentPassword} onChange={e => setProfileCurrentPassword(e.target.value)} placeholder={tProf.currentPasswordLabel} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.newPassword}</label>
                    <input type="password" value={profileNewPassword} onChange={e => setProfileNewPassword(e.target.value)} placeholder={tProf.newPasswordLabel} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.confirmPassword}</label>
                    <input type="password" value={profileConfirmPassword} onChange={e => setProfileConfirmPassword(e.target.value)} placeholder={tProf.confirmPasswordLabel} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                </div>
                <Button variant="primary" onClick={async () => {
                  if (!profileCurrentPassword || !profileNewPassword || !profileConfirmPassword) { await alert(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields"); return; }
                  if (profileNewPassword.length < 8) { await alert(tProf.passwordTooShort); return; }
                  if (profileNewPassword !== profileConfirmPassword) { await alert(tProf.passwordMismatch); return; }
                  const confirmed = await confirm(locale === "ar" ? "تأكيد تغيير كلمة المرور؟" : "Confirm password change?"); if (!confirmed) return;
                  setProfileSaving("password");
                  try {
                    const pb = getPocketBase();
                    await pb.collection("users").authWithPassword(user!.email, profileCurrentPassword);
                    await pb.collection("users").update(user!.id, { password: profileNewPassword, passwordConfirm: profileNewPassword });
                    setProfileCurrentPassword(""); setProfileNewPassword(""); setProfileConfirmPassword("");
                    await alert(tProf.passwordChanged);
                  } catch (err: any) { await alert(err?.status === 401 ? tProf.incorrectPassword : locale === "ar" ? "حدث خطأ" : "Error changing password"); }
                  finally { setProfileSaving(""); }
                }} disabled={profileSaving === "password"}>
                  {profileSaving === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {tProf.changePassword}
                </Button>
              </div>

              {/* Change Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--color-accent)]" />
                  <h4 className="font-semibold text-[var(--color-ink)]">{tProf.changeEmail}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.newEmail}</label>
                    <input type="email" value={profileNewEmail} onChange={e => setProfileNewEmail(e.target.value)} placeholder={tProf.newEmailLabel} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.currentPassword}</label>
                    <input type="password" value={profileEmailPassword} onChange={e => setProfileEmailPassword(e.target.value)} placeholder={tProf.currentPasswordLabel} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                </div>
                <Button variant="primary" onClick={async () => {
                  if (!profileNewEmail || !profileEmailPassword) { await alert(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields"); return; }
                  const confirmed = await confirm(locale === "ar" ? "تأكيد تغيير البريد الإلكتروني؟" : "Confirm email change?"); if (!confirmed) return;
                  setProfileSaving("email");
                  try {
                    const pb = getPocketBase();
                    await pb.collection("users").authWithPassword(user!.email, profileEmailPassword);
                    await pb.collection("users").update(user!.id, { email: profileNewEmail });
                    setProfileNewEmail(""); setProfileEmailPassword("");
                    await alert(tProf.emailChanged);
                    await pb.collection("users").authRefresh();
                  } catch (err: any) { await alert(err?.status === 401 ? tProf.incorrectPassword : locale === "ar" ? "حدث خطأ" : "Error changing email"); }
                  finally { setProfileSaving(""); }
                }} disabled={profileSaving === "email"}>
                  {profileSaving === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {tProf.changeEmail}
                </Button>
              </div>

              {/* Set Username */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-[var(--color-accent)]" />
                  <h4 className="font-semibold text-[var(--color-ink)]">{tProf.setUsername}</h4>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">{tProf.username}</label>
                    <input type="text" value={profileUsername} onChange={e => setProfileUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder={tProf.usernameLabel} maxLength={30} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                    <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{tProf.usernameHint}</p>
                  </div>
                  <Button variant="primary" onClick={async () => {
                    if (!profileUsername.trim() || profileUsername.length < 3) { await alert(tProf.usernameHint); return; }
                    setProfileSaving("username");
                    try {
                      const pb = getPocketBase();
                      await pb.collection("users").update(user!.id, { username: profileUsername.trim() });
                      await alert(tProf.usernameSet);
                      await pb.collection("users").authRefresh();
                    } catch (err: any) { const msg = err?.response?.data?.username?.message || err?.message || String(err); await alert(locale === "ar" ? `خطأ: ${msg}` : `Error: ${msg}`); }
                    finally { setProfileSaving(""); }
                  }} disabled={profileSaving === "username"}>
                    {profileSaving === "username" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {tProf.save}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
