"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { useSettings } from "@/context/settings-context";
import { StatCard } from "@/components/ui/stat-card";
import { getDisplayName } from "@/lib/auth";
import { getPocketBase } from "@/lib/pocketbase";
import { BookOpen, Users, FileText, Clock, Bell, Plus, X, Pencil, Trash2 } from "lucide-react";
import { stripHtml } from "@/components/ui/rich-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LazyRichEditor } from "@/components/ui/lazy-rich-editor";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const { settings } = useSettings();
  const t = dict.dashboard.teacher;
  const displayName = user ? getDisplayName(user, locale) : "";

  const [subjectCount, setSubjectCount] = useState<number | string>("—");
  const [studentCount, setStudentCount] = useState<number | string>("—");
  const [hwCount, setHwCount] = useState<number | string>("—");
  const [reviewedCount, setReviewedCount] = useState<number | string>("—");
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState<number | string>("—");
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<Array<{id: string; title: string; body: string; created: string}>>([]);
  const [announcementForm, setAnnouncementForm] = useState<{title: string; body: string}>({title: "", body: ""});
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const pb = getPocketBase();

    // Count unique subjects assigned to this teacher
    const subjects: string[] = (user as any).subjects ?? [];
    setSubjectCount(subjects.length);

    // Count students in teacher's sections
    const sections: string[] = (user as any).sections ?? [];
    if (sections.length > 0) {
      const sectionFilter = sections.map((id) => `sections.id = "${id}"`).join(" || ");
      pb.collection("users")
        .getList(1, 1, { filter: `role = "student" && (${sectionFilter})` })
        .then((r) => setStudentCount(r.totalItems))
        .catch(() => setStudentCount("—"));
    } else {
      setStudentCount(0);
    }

    // Count homework posted by this teacher
    pb.collection("homework")
      .getList(1, 1, { filter: `teacher = "${user.id}"` })
      .then((r) => setHwCount(r.totalItems))
      .catch(() => setHwCount("—"));

    // Count total and reviewed submissions for this teacher's homework
    pb.collection("submissions")
      .getList(1, 1, {
        filter: `homework.teacher = "${user.id}"`,
      })
      .then((r) => setTotalSubmissionsCount(r.totalItems))
      .catch(() => setTotalSubmissionsCount("—"));

    pb.collection("submissions")
      .getList(1, 1, {
        filter: `status = "graded" && homework.teacher = "${user.id}"`,
      })
      .then((r) => setReviewedCount(r.totalItems))
      .catch(() => setReviewedCount("—"));
      
    // Load announcements (global + teacher's sections)
    if (user) {
      const sections: string[] = (user as any).sections ?? [];
      const secFilter = sections.map((id) => `section = "${id}"`).join(" || ");
      const filter = secFilter
        ? `scope = "global" || (${secFilter})`
        : `scope = "global"`;

      pb.collection("announcements")
        .getFullList<{id: string; title: string; body: string; created: string; scope: string; section: string; author: string}>({
          filter,
          sort: "-created",
          expand: "author",
        })
        .then((anns) => {
          setAnnouncements(anns);
        })
        .catch(() => {
          setAnnouncements([]);
        });
    }
  }, [user]);

  const handleSaveAnnouncement = async () => {
    if (!user || !announcementForm.title || !announcementForm.body) return;
    setSavingAnnouncement(true);
    const pb = getPocketBase();
    try {
      const payload = {
        title: announcementForm.title,
        body: announcementForm.body,
        author: user.id,
        scope: "global",
        section: "",
      };
      
      if (editingAnnouncementId) {
        await pb.collection("announcements").update(editingAnnouncementId, payload);
        setEditingAnnouncementId(null);
      } else {
        await pb.collection("announcements").create(payload);
      }
      
      setAnnouncementForm({title: "", body: ""});
      setShowAnnouncementForm(false);
      
      // Reload announcements
      pb.collection("announcements")
        .getFullList<{id: string; title: string; body: string; created: string}>({
          filter: `author = "${user.id}"`,
          sort: "-created"
        })
        .then((anns) => {
          setAnnouncements(anns);
        });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const openAnnouncementEdit = (ann: {id: string; title: string; body: string; created: string}) => {
    setAnnouncementForm({title: ann.title, body: ann.body});
    setEditingAnnouncementId(ann.id);
    setShowAnnouncementForm(true);
  };

   const handleDeleteAnnouncement = async (id: string) => {
     if (!(await confirm(dict.dashboard.teacher.announcements.confirmDelete))) return;
     if (!user) return;
     const pb = getPocketBase();
     await pb.collection("announcements").delete(id);
     
     // Reload announcements
     pb.collection("announcements")
       .getFullList<{id: string; title: string; body: string; created: string}>({
         filter: `author = "${user.id}"`,
         sort: "-created"
       })
       .then((anns) => {
         setAnnouncements(anns);
       })
       .catch(() => {
         setAnnouncements([]);
       });
   };

  return (
    <div className="space-y-8">

      {/* ── Welcome banner ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-2xl)] p-7 shadow-[var(--shadow-md)]"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #0891b2 100%)" }}
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

      {/* ── Stat cards ────────────────────────────────────────────── */}
       <div>
         <h3 className="text-base font-black text-[var(--color-ink)] mb-6" style={{ letterSpacing: "-0.2px" }}>
           {t.nav.overview}
         </h3>
         <div className="stat-card-group grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <StatCard icon={<BookOpen />} label={t.stats.subjects} value={subjectCount} />
          <StatCard icon={<Users />} label={t.stats.students} value={studentCount} />
          <StatCard icon={<FileText />} label={t.stats.assignments} value={hwCount} />
          <StatCard icon={<Clock />} label={t.stats.pending} value={typeof reviewedCount === "number" && typeof totalSubmissionsCount === "number" ? `${reviewedCount} / ${totalSubmissionsCount}` : "—"} />
        </div>
      </div>
      
       {/* ── Announcements Section ───────────────────────────────────── */}
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <h3 className="text-xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.2px" }}>
             {dict.dashboard.teacher.announcements.title}
           </h3>
           <button 
             onClick={() => {
               setAnnouncementForm({title: "", body: ""});
               setEditingAnnouncementId(null);
               setShowAnnouncementForm(true);
             }}
             className="flex items-center gap-2 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md p-1"
             aria-label={dict.dashboard.teacher.announcements.add}
           >
             <Plus className="h-4 w-4" />
             <span>{dict.dashboard.teacher.announcements.add}</span>
           </button>
         </div>
         
         {/* Announcements Form */}
         {showAnnouncementForm && (
           <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-black text-[var(--color-ink)]">{editingAnnouncementId ? dict.dashboard.teacher.announcements.editTitle : dict.dashboard.teacher.announcements.add}</h3>
               <button 
                 onClick={() => {
                   setShowAnnouncementForm(false);
                   setEditingAnnouncementId(null);
                 }}
                 className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 aria-label={dict.common.cancel}
               >
                 <X className="h-4 w-4" />
               </button>
             </div>
            
            <Input 
              label={dict.dashboard.teacher.announcements.annTitle} 
              value={announcementForm.title} 
              onChange={(e) => setAnnouncementForm(f => ({...f, title: e.target.value}))} 
              placeholder={dict.dashboard.teacher.announcements.phTitle}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{dict.dashboard.teacher.announcements.body}</label>
              <LazyRichEditor
                value={announcementForm.body}
                onChange={(html) => setAnnouncementForm(f => ({...f, body: html}))}
                placeholder={dict.dashboard.teacher.announcements.phBody}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => {
                setShowAnnouncementForm(false);
                setEditingAnnouncementId(null);
              }}>
                {dict.common.cancel}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveAnnouncement} 
                disabled={savingAnnouncement}
              >
                {savingAnnouncement ? dict.common.loading : dict.common.save}
              </Button>
            </div>
          </div>
        )}
        
        {/* Announcements List */}
        <div className="space-y-5">
          {announcements.length === 0 ? (
            <p className="text-[var(--color-ink-secondary)] text-sm">{dict.dashboard.teacher.announcements.empty}</p>
          ) : (
            <>
              {announcements.map((ann) => (
<div 
                   key={ann.id} 
                   className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-6 py-5 shadow-[var(--shadow-xs)]"
                 >
                   <div className="flex items-start justify-between gap-3">
                     <div className="flex items-center gap-3">
                       <span 
                         className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-teacher-bold)]"
                         style={{ background: "var(--color-role-teacher-bg)" }}
                       >
                         <Bell className="h-5 w-5" />
                       </span>
                       <div>
                         <p className="font-bold text-lg text-[var(--color-ink)] leading-snug">{ann.title}</p>
                        <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                          <span>· {dict.dashboard.teacher.announcements.postedOn}: {ann.created?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => openAnnouncementEdit(ann)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        aria-label={`${dict.common.edit}: ${ann.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        aria-label={`${dict.common.delete}: ${ann.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-ink-secondary)] line-clamp-3">{stripHtml(ann.body)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
