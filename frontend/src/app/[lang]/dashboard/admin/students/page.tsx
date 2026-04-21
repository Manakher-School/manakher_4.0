"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { useCrudState, useFormState } from "@/lib/hooks";
import pb from "@/lib/pocketbase";
import { Users, Plus, Trash2, Pencil, Loader2, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { FormErrorAlert, useFormError } from "@/components/ui/form-alerts";

interface Student {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  sections: string[];
  expand?: { sections?: ClassSection[] };
}

interface ClassSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
  grade_order: number;
}

const EMPTY_FORM = { name_ar: "", name_en: "", email: "", password: "", section: "" };

// ── Normalizer (Arabic diacritic-safe) ─────────────────────────────────────
function normalize(s: string | undefined | null) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, "")
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

// ── Section picker (radio dropdown) ────────────────────────────────────────
function SectionPicker({
  label, placeholder, value, options, getLabel, onChange,
}: {
  label: string; placeholder: string; value: string;
  options: ClassSection[]; getLabel: (s: ClassSection) => string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        <span className={selected ? "text-[var(--color-ink)]" : "text-[var(--color-ink-placeholder)]"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]">
          <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm">
            <input type="radio" name="section-pick" value="" checked={value === ""} onChange={() => { onChange(""); setOpen(false); }} className="accent-[var(--color-accent)]" />
            <span className="text-[var(--color-ink-placeholder)]">—</span>
          </label>
          {options.map(s => (
            <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm">
              <input type="radio" name="section-pick" value={s.id} checked={value === s.id} onChange={() => { onChange(s.id); setOpen(false); }} className="accent-[var(--color-accent)]" />
              <span>{getLabel(s)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.admin.students;
  const ts = dict.dashboard.teacher.sections; // reuse search copy
  const c = dict.common;

  const [students, setStudents] = useState<Student[]>([]);
  const [allSections, setAllSections] = useState<ClassSection[]>([]);

  // UI state consolidation
  const crudState = useCrudState();
  const formState = useFormState(EMPTY_FORM);
  
  // Search and expand state (kept separate - page-specific)
  const [globalQuery, setGlobalQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sectionQueries, setSectionQueries] = useState<Record<string, string>>({});
  
  const { error: formError, setError: setFormError, clearError: clearFormError } = useFormError();

  async function load() {
    crudState.setIsLoading(true);
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        pb.collection("users").getFullList<Student>({
          filter: 'role = "student"',
          expand: "sections",
          sort: "name_ar",
        }),
        pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
      ]);
      setStudents(studentsRes);
      setAllSections(sectionsRes);
    } finally {
      crudState.setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Group students by section ───────────────────────────────────────────
  const grouped = useMemo(() => {
    // Build a map: sectionId -> students[]
    const map: Record<string, Student[]> = {};
    for (const sec of allSections) map[sec.id] = [];

    let unassigned: Student[] = [];
    for (const student of students) {
      const sid = student.sections?.[0];
      if (sid && map[sid] !== undefined) {
        map[sid].push(student);
      } else {
        unassigned.push(student);
      }
    }
    return { map, unassigned };
  }, [students, allSections]);

  // ── Filtered view ───────────────────────────────────────────────────────
  const globalActive = globalQuery.trim().length > 0;

  const filteredSections = useMemo(() => {
    return allSections.map(sec => ({
      sec,
      students: grouped.map[sec.id] ?? [],
      globalMatches: (grouped.map[sec.id] ?? []).filter(s => matches(s, globalQuery)),
    }));
  }, [allSections, grouped, globalQuery]);

  const filteredUnassigned = useMemo(() =>
    grouped.unassigned.filter(s => matches(s, globalQuery)),
  [grouped.unassigned, globalQuery]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getSectionName = (s: ClassSection) =>
    locale === "ar" ? `${s.grade_ar} — ${s.section_ar}` : `${s.grade_en} — ${s.section_en}`;

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setSectionQuery(id: string, q: string) {
    setSectionQueries(prev => ({ ...prev, [id]: q }));
  }

  // ── Form helpers ────────────────────────────────────────────────────────
  function openCreate() { 
    crudState.setEditingId(null); 
    formState.reset(); 
    clearFormError(); 
    crudState.setShowCreate(true); 
  }
  
  function openEdit(student: Student) {
    crudState.setEditingId(student.id);
    formState.setData({ 
      name_ar: student.name_ar, 
      name_en: student.name_en, 
      email: student.email, 
      password: "", 
      section: student.sections?.[0] ?? "" 
    });
    clearFormError();
    crudState.setShowCreate(true);
  }
  
  function closeForm() { 
    crudState.setShowCreate(false); 
    crudState.setEditingId(null); 
    formState.reset(); 
    clearFormError(); 
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFormError();
    crudState.setIsLoading(true);
    try {
      if (crudState.state.editingId) {
        const data: Record<string, unknown> = {
          name_ar: formState.state.data.name_ar, 
          name_en: formState.state.data.name_en, 
          email: formState.state.data.email,
          sections: formState.state.data.section ? [formState.state.data.section] : [],
        };
        if (formState.state.data.password) { 
          data.password = formState.state.data.password; 
          data.passwordConfirm = formState.state.data.password; 
        }
        await pb.collection("users").update(crudState.state.editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: formState.state.data.name_ar, 
          name_en: formState.state.data.name_en, 
          email: formState.state.data.email,
          password: formState.state.data.password, 
          passwordConfirm: formState.state.data.password,
          role: "student", 
          sections: formState.state.data.section ? [formState.state.data.section] : [], 
          emailVisibility: true,
        });
      }
      closeForm();
      await load();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save student. Please try again.";
      setFormError(errorMessage);
    } finally {
      crudState.setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    crudState.setIsLoading(true);
    try {
      // Cascade delete: Remove all student-related records before deleting the user
      
      // 1. Delete submissions (where student = id)
      try {
        const submissions = await pb.collection("submissions").getFullList({ filter: `student = "${id}"` });
        for (const sub of submissions) {
          try { await pb.collection("submissions").delete(sub.id); } catch (e) { /* silently skip if already deleted */ }
        }
      } catch (e) { /* silently skip if collection query fails */ }
      
      // 2. Delete quiz attempts (where student = id)
      try {
        const attempts = await pb.collection("quiz_attempts").getFullList({ filter: `student = "${id}"` });
        for (const att of attempts) {
          try { await pb.collection("quiz_attempts").delete(att.id); } catch (e) { /* silently skip if already deleted */ }
        }
      } catch (e) { /* silently skip if collection query fails */ }
      
      // 3. Delete comments (where author = id)
      try {
        const comments = await pb.collection("comments").getFullList({ filter: `author = "${id}"` });
        for (const comm of comments) {
          try { await pb.collection("comments").delete(comm.id); } catch (e) { /* silently skip if already deleted */ }
        }
      } catch (e) { /* silently skip if collection query fails */ }
      
      // 4. Delete reactions (where user = id)
      try {
        const reactions = await pb.collection("reactions").getFullList({ filter: `user = "${id}"` });
        for (const rxn of reactions) {
          try { await pb.collection("reactions").delete(rxn.id); } catch (e) { /* silently skip if already deleted */ }
        }
      } catch (e) { /* silently skip if collection query fails */ }
      
      // 5. Finally delete the user
      await pb.collection("users").delete(id);
      setStudents(s => s.filter(x => x.id !== id));
    } finally {
      crudState.setIsLoading(false);
    }
  }

  const inputCls = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]";

  // ── Student row (shared between section lists and unassigned) ───────────
  function StudentRow({ student }: { student: Student }) {
    const name = locale === "ar" ? student.name_ar : student.name_en;
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-sunken)] text-xs font-bold text-[var(--color-ink-secondary)]">
            {normalize(name).charAt(0).toUpperCase() || "؟"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{name}</p>
            <p className="text-xs text-[var(--color-ink-secondary)] truncate">{student.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => openEdit(student)}
            className="flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label={`${c.edit}: ${name}`}
          >
            <Pencil className="h-3 w-3" />{c.edit}
          </button>
          <button
            onClick={() => handleDelete(student.id)}
            disabled={crudState.state.isLoading}
            className="flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink-placeholder)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label={`${c.delete}: ${name}`}
          >
            {crudState.state.isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {c.delete}
          </button>
        </div>
      </div>
    );
  }

  // ── Section accordion block ─────────────────────────────────────────────
  function SectionBlock({ sec, allStudents, displayStudents, showLocalSearch }: {
    sec: ClassSection;
    allStudents: Student[];
    displayStudents: Student[];
    showLocalSearch: boolean;
  }) {
    const isOpen = globalActive || expanded.has(sec.id);
    const localQuery = sectionQueries[sec.id] ?? "";
    const countLabel = globalActive
      ? `${displayStudents.length} / ${allStudents.length}`
      : String(allStudents.length);

    const localFiltered = showLocalSearch
      ? allStudents.filter(s => matches(s, localQuery))
      : displayStudents;

    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]">
        <button
          onClick={() => !globalActive && toggle(sec.id)}
          className={[
            "w-full flex items-center justify-between px-5 py-4 text-start transition-colors",
            globalActive ? "cursor-default" : "hover:bg-[var(--color-surface-hover)]",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-role-admin-bold)]"
              style={{ background: "var(--color-role-admin-bg)" }}>
              <Users className="h-4 w-4" />
            </span>
            <span className="font-bold text-[var(--color-ink)]">{getSectionName(sec)}</span>
            <span className="text-sm font-bold text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] rounded-full px-2.5 py-0.5 min-w-[2rem] text-center">
              {countLabel} {locale === "ar" ? "طالبة" : "students"}
            </span>
          </div>
          {!globalActive && (
            <span className="text-[var(--color-ink-secondary)] shrink-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="border-t border-[var(--color-border-subtle)]">
            {/* Per-section search — only when not in global mode */}
            {showLocalSearch && allStudents.length > 0 && (
              <div className="px-4 pt-3 pb-2 relative">
                <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" style={{ insetInlineStart: "1.25rem" }} />
                <input
                  type="search"
                  value={localQuery}
                  onChange={e => setSectionQuery(sec.id, e.target.value)}
                  placeholder={ts.searchSection}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] py-2 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{ paddingInlineStart: "2.25rem", paddingInlineEnd: "0.75rem" }}
                />
              </div>
            )}

            {allStudents.length === 0 ? (
              <p className="px-5 py-3 text-sm text-[var(--color-ink-disabled)]">{t.empty}</p>
            ) : localFiltered.length === 0 ? (
              <p className="px-5 py-3 text-sm text-[var(--color-ink-disabled)]">{ts.noMatch}</p>
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {localFiltered.map(s => <StudentRow key={s.id} student={s} />)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
            <Users className="h-5 w-5 text-[var(--color-role-admin-bold)]" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">{t.title}</h2>
        </div>
         <button
           onClick={openCreate}
           className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
           aria-label={t.add}
         >
           <Plus className="h-4 w-4" />{t.add}
         </button>
      </div>

       {/* Create / Edit form */}
       {crudState.state.showCreate && (
         <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)]">
           <div className="mb-4 flex items-center justify-between">
             <h3 className="font-bold text-[var(--color-ink)]">{crudState.state.editingId ? t.editTitle : t.add}</h3>
             <button onClick={closeForm} className="text-[var(--color-ink-placeholder)] hover:text-[var(--color-ink)] rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" aria-label={c.cancel}><X className="h-4 w-4" /></button>
           </div>
          {formError && (
            <div className="mb-4">
              <FormErrorAlert error={formError} onDismiss={clearFormError} />
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameAr}</label>
              <input required value={formState.state.data.name_ar} placeholder={t.phNameAr} onChange={e => formState.setFieldValue("name_ar", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.nameEn}</label>
              <input required value={formState.state.data.name_en} placeholder={t.phNameEn} onChange={e => formState.setFieldValue("name_en", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t.email}</label>
              <input required type="email" value={formState.state.data.email} placeholder={t.phEmail} onChange={e => formState.setFieldValue("email", e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                {crudState.state.editingId ? t.newPassword : t.password}
              </label>
              <input
                type="password" required={!crudState.state.editingId} minLength={crudState.state.editingId ? 0 : 8}
                value={formState.state.data.password} placeholder={t.phPassword}
                onChange={e => formState.setFieldValue("password", e.target.value)}
                className={inputCls} dir="ltr"
              />
            </div>
            <div className="sm:col-span-2">
              <SectionPicker
                label={t.assignedSection} placeholder="—" value={formState.state.data.section}
                options={allSections} getLabel={getSectionName}
                onChange={id => formState.setFieldValue("section", id)}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <button type="button" onClick={closeForm} className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors">{c.cancel}</button>
              <button type="submit" disabled={crudState.state.isLoading} className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-60">
                {crudState.state.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{c.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {crudState.state.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" /></div>
      ) : students.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-ink-disabled)]">{t.empty}</p>
      ) : (
        <>
          {/* Global search */}
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" style={{ insetInlineStart: "0.75rem" }} />
            <input
              type="search"
              value={globalQuery}
              onChange={e => setGlobalQuery(e.target.value)}
              placeholder={ts.searchAll}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-[var(--shadow-xs)]"
              style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
            />
          </div>

          {/* Section accordions */}
          <div className="space-y-3">
            {filteredSections.map(({ sec, students: secStudents, globalMatches }) => {
              if (globalActive && globalMatches.length === 0) return null;
              return (
                <SectionBlock
                  key={sec.id}
                  sec={sec}
                  allStudents={secStudents}
                  displayStudents={globalMatches}
                  showLocalSearch={!globalActive}
                />
              );
            })}

            {/* Unassigned students */}
            {(globalActive ? filteredUnassigned : grouped.unassigned).length > 0 && (
              <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]">
                <button
                  onClick={() => !globalActive && toggle("__unassigned__")}
                  className={[
                    "w-full flex items-center justify-between px-5 py-4 text-start transition-colors",
                    globalActive ? "cursor-default" : "hover:bg-[var(--color-surface-hover)]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-ink-secondary)]"
                      style={{ background: "var(--color-surface-sunken)" }}>
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="font-bold text-[var(--color-ink-secondary)]">
                      {locale === "ar" ? "بدون فصل" : "Unassigned"}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] rounded-full px-2 py-0.5">
                      {globalActive
                        ? `${filteredUnassigned.length} / ${grouped.unassigned.length}`
                        : grouped.unassigned.length}
                    </span>
                  </div>
                  {!globalActive && (
                    <span className="text-[var(--color-ink-secondary)] shrink-0">
                      {expanded.has("__unassigned__") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  )}
                </button>

                {(globalActive || expanded.has("__unassigned__")) && (
                  <div className="border-t border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
                    {(globalActive ? filteredUnassigned : grouped.unassigned).map(s => (
                      <StudentRow key={s.id} student={s} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Global search empty state */}
            {globalActive &&
              filteredSections.every(d => d.globalMatches.length === 0) &&
              filteredUnassigned.length === 0 && (
                <p className="text-sm text-[var(--color-ink-secondary)] py-4 text-center">{c.noResults}</p>
              )}
          </div>
        </>
      )}
    </div>
  );
}
