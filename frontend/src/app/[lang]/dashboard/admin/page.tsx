"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { useSettings } from "@/context/settings-context";
import { StatCard } from "@/components/ui/stat-card";
import { getDisplayName } from "@/lib/auth";
import { Users, Layers, GraduationCap, BookOpen, Bell, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LazyRichEditor } from "@/components/ui/lazy-rich-editor";
import { stripHtml } from "@/components/ui/rich-content";
import pb from "@/lib/pocketbase";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const { settings } = useSettings();
  const t = dict.dashboard.admin;
  const displayName = user ? getDisplayName(user, locale) : "";

  const [stats, setStats] = useState({ users: "—", sections: "—", teachers: "—", students: "—" });
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<Array<{id: string; title: string; body: string; created: string}>>([]);
  const [announcementForm, setAnnouncementForm] = useState<{title: string; body: string}>({title: "", body: ""});
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, sectionsRes, teachersRes, studentsRes] = await Promise.all([
          pb.collection("users").getList(1, 1, {}),
          pb.collection("class_sections").getList(1, 1, {}),
          pb.collection("users").getList(1, 1, { filter: 'role = "teacher"' }),
          pb.collection("users").getList(1, 1, { filter: 'role = "student"' }),
        ]);
        setStats({
          users: String(usersRes.totalItems),
          sections: String(sectionsRes.totalItems),
          teachers: String(teachersRes.totalItems),
          students: String(studentsRes.totalItems),
        });
      } catch {
        // silently leave "—" on error
      }
    }
    
    // Load announcements (paginated - max 50 to avoid memory bloat)
    async function loadAnnouncements() {
      if (!user) return;
      try {
        // Admin can see all announcements - fetch only first 50 sorted by date
        const allAnns = await pb.collection("announcements").getList<{id: string; title: string; body: string; created: string}>(1, 50, {
          sort: "-created",
          expand: "author"
        });
        setAnnouncements(allAnns.items);
      } catch (e) {
        console.error(e);
        setAnnouncements([]);
      }
    }
    
    loadStats();
    loadAnnouncements();
  }, []);

  const handleSaveAnnouncement = async () => {
    if (!user || !announcementForm.title || !announcementForm.body) return;
    setSavingAnnouncement(true);
    try {
      const payload = {
        title: announcementForm.title,
        body: announcementForm.body,
        author: user.id,
        scope: "global",
        section: "",
      };
      
       if (editingAnnouncementId) {
         // Verify the record exists before updating
         try {
           await pb.collection("announcements").getOne(editingAnnouncementId);
           await pb.collection("announcements").update(editingAnnouncementId, payload);
         } catch (err: any) {
           if (err?.status === 404) {
             await alert(locale === "ar" ? "الإعلان غير موجود. سيتم إنشاء إعلان جديد." : "Announcement not found. Creating a new one.");
             await pb.collection("announcements").create(payload);
           } else {
             throw err;
           }
         }
         setEditingAnnouncementId(null);
       } else {
         await pb.collection("announcements").create(payload);
       }
       
       setAnnouncementForm({title: "", body: ""});
       setShowAnnouncementForm(false);
       
        // Reload announcements (paginated - max 50 to avoid memory bloat)
        const allAnns = await pb.collection("announcements").getList<{id: string; title: string; body: string; created: string}>(1, 50, {
          sort: "-created",
          expand: "author"
        });
        setAnnouncements(allAnns.items);
     } catch (e) {
       console.error(e);
       await alert(locale === "ar" ? "فشل الحفظ. يرجى المحاولة مرة أخرى." : "Save failed. Please try again.");
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
    if (!(await confirm(dict.dashboard.admin.announcements.confirmDelete))) return;
    await pb.collection("announcements").delete(id);
    
    // Reload announcements (paginated - max 50 to avoid memory bloat)
    const allAnns = await pb.collection("announcements").getList<{id: string; title: string; body: string; created: string}>(1, 50, {
      sort: "-created",
      expand: "author"
    });
    setAnnouncements(allAnns.items);
  };

  return (
    <div className="space-y-8">
      {/* ── Welcome banner ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-2xl)] p-7 shadow-[var(--shadow-md)]"
        style={{ background: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 60%, #7c3aed 100%)" }}
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
         <h3 className="text-base font-black text-[var(--color-ink)] mb-12" style={{ letterSpacing: "-0.2px" }}>
           {t.nav.overview}
         </h3>
         <div className="stat-card-group grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users />}        label={t.stats.users}    value={stats.users} />
          <StatCard icon={<Layers />}       label={t.stats.classes}  value={stats.sections} />
          <StatCard icon={<GraduationCap />} label={t.stats.teachers} value={stats.teachers} />
          <StatCard icon={<BookOpen />}     label={t.stats.students} value={stats.students} />
        </div>
      </div>
      
       {/* ── Announcements Section ───────────────────────────────────── */}
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <h3 className="text-xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.2px" }}>
             {dict.dashboard.admin.announcements.title}
           </h3>
            <button 
              onClick={() => {
                setAnnouncementForm({title: "", body: ""});
                setEditingAnnouncementId(null);
                setShowAnnouncementForm(true);
              }}
              className="flex items-center gap-2 px-3 py-2 border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded-md transition-colors"
              aria-label={dict.dashboard.admin.announcements.add}
            >
              <Plus className="h-4 w-4" />
              <span>{dict.dashboard.admin.announcements.add}</span>
            </button>
         </div>
         
         {/* Announcements Form */}
         {showAnnouncementForm && (
           <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-black text-[var(--color-ink)]">{editingAnnouncementId ? dict.dashboard.admin.announcements.editTitle : dict.dashboard.admin.announcements.add}</h3>
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
              label={dict.dashboard.admin.announcements.annTitle} 
              value={announcementForm.title} 
              onChange={(e) => setAnnouncementForm(f => ({...f, title: e.target.value}))} 
              placeholder={dict.dashboard.admin.announcements.phTitle}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{dict.dashboard.admin.announcements.body}</label>
              <LazyRichEditor
                value={announcementForm.body}
                onChange={(html) => setAnnouncementForm(f => ({...f, body: html}))}
                placeholder={dict.dashboard.admin.announcements.phBody}
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
            <p className="text-[var(--color-ink-secondary)] text-sm">{dict.dashboard.admin.announcements.empty}</p>
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
                         className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-admin-bold)]"
                         style={{ background: "var(--color-role-admin-bg)" }}
                       >
                         <Bell className="h-5 w-5" />
                       </span>
                       <div>
                         <p className="font-bold text-lg text-[var(--color-ink)] leading-snug">{ann.title}</p>
                        <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                          <span>· {dict.dashboard.admin.announcements.postedOn}: {ann.created?.slice(0, 10)}</span>
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