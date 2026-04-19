"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { Plus, Trash2, Pencil, Loader2, X, ChevronDown, Search, Upload, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useCrudState, useFormState, useFilterState, useTabState } from "@/lib/hooks";
import { parseStudentFile } from "@/lib/csv-parser";
import { generateEmail, generatePassword, generateEnglishName, isValidEmail, isValidPassword, transliterateArabic, generateUniqueEmail } from "@/lib/transliteration";

interface Teacher {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  sections: string[];
  subjects: string[];
  expand?: {
    sections?: ClassSection[];
    subjects?: Subject[];
  };
}

interface Student {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  sections: string[];
  expand?: {
    sections?: ClassSection[];
  };
}

interface ClassSection {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
  grade_order: number;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

// Helper function to format section display based on locale
const formatSection = (section: ClassSection, locale: string): string => {
  const grade = locale === "ar" ? section.grade_ar : section.grade_en;
  const sectionName = locale === "ar" ? section.section_ar : section.section_en;
  return `${grade} - ${sectionName}`;
};

const EMPTY_TEACHER_FORM = { name_ar: "", name_en: "", email: "", password: "", sections: [] as string[], subjects: [] as string[] };
const EMPTY_STUDENT_FORM = { name_ar: "", name_en: "", email: "", password: "", sections: [] as string[] };

function MultiSelect({
  label,
  options,
  selected,
  getLabel,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  getLabel: (id: string) => string;
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

   return (
     <div className="relative">
       <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{label}</label>
       <button
         type="button"
         onClick={() => setOpen(v => !v)}
         aria-label={`${label}, ${selected.length} selected`}
         aria-expanded={open}
         aria-haspopup="listbox"
         className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
       >
         <span className={["truncate", selected.length === 0 ? "text-[var(--color-ink-placeholder)]" : "text-[var(--color-ink)]"].join(" ")}>
           {selected.length === 0 ? "—" : selected.map(getLabel).join("، ")}
         </span>
         <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
       </button>
       {open && (
         <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]" role="listbox">
           {options.map(o => (
             <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm focus-within:bg-[var(--color-surface-hover)]">
               <input
                 type="checkbox"
                 checked={selected.includes(o.id)}
                 onChange={() => toggle(o.id)}
                 aria-label={o.label}
                 className="accent-[var(--color-accent)] h-3.5 w-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
               />
               <span>{o.label}</span>
             </label>
           ))}
         </div>
       )}
     </div>
   );
}

function SingleSelect({
  label,
  options,
  selected,
  getLabel,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string;
  getLabel: (id: string) => string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
     <div className="relative">
       <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{label}</label>
       <button
         type="button"
         onClick={() => setOpen(v => !v)}
         aria-label={`${label}, ${selected ? getLabel(selected) : "not selected"}`}
         aria-expanded={open}
         aria-haspopup="listbox"
         className="w-full flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-start focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
       >
         <span className={selected ? "text-[var(--color-ink)]" : "text-[var(--color-ink-placeholder)]"}>
           {selected ? getLabel(selected) : "—"}
         </span>
         <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-placeholder)]" />
       </button>
       {open && (
         <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[var(--shadow-md)]" role="listbox">
           {options.map(o => (
             <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-hover)] text-sm focus-within:bg-[var(--color-surface-hover)]">
               <input
                 type="radio"
                 name="section"
                 checked={selected === o.id}
                 onChange={() => { onChange(o.id); setOpen(false); }}
                 aria-label={o.label}
                 className="accent-[var(--color-accent)] h-3.5 w-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
               />
               <span>{o.label}</span>
             </label>
           ))}
         </div>
       )}
     </div>
   );
}

export default function UsersPage() {
  const { dict, locale } = useLocale();
  const { confirm, alert } = useDialog();
  const c = dict.common;

  // Tab state
  const { state: tabState, setActiveTab } = useTabState("teachers");
  const tab = tabState.activeTab as "teachers" | "students";

  // Teachers CRUD state
  const teachersCrud = useCrudState();
  const teachersForm = useFormState(EMPTY_TEACHER_FORM);
  const teachersFilter = useFilterState({ searchTerm: "", page: 1, perPage: 999 });

  // Teachers filter state
  const [teachersSectionFilter, setTeachersSectionFilter] = useState<string>("");
  const [teachersSubjectFilter, setTeachersSubjectFilter] = useState<string>("");
  const [teachersSortBy, setTeachersSortBy] = useState<"name-az" | "name-za" | "email-az">("name-az");

  // Teachers data state
  const [teachersData, setTeachersData] = useState<{ items: Teacher[]; sections: ClassSection[]; subjects: Subject[] }>({ items: [], sections: [], subjects: [] });

  // Students CRUD state
  const studentsCrud = useCrudState();
  const studentsForm = useFormState(EMPTY_STUDENT_FORM);
  const studentsFilter = useFilterState({ searchTerm: "", page: 1, perPage: 999 });

  // Students filter state
  const [studentsSectionFilter, setStudentsSectionFilter] = useState<string>("");
  const [studentsSortBy, setStudentsSortBy] = useState<"name-az" | "name-za" | "email-az">("name-az");

  // Students data state
  const [studentsData, setStudentsData] = useState<{ items: Student[]; sections: ClassSection[] }>({ items: [], sections: [] });

  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  
  // Import Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  interface StudentImportData {
    name_ar: string;
    name_en: string;
    email: string;
    password: string;
    section_id: string;
  }
  const [importStudents, setImportStudents] = useState<StudentImportData[]>([]);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const t_teachers = dict.dashboard.admin.teachers;
  const t_students = dict.dashboard.admin.students;

  async function loadTeachers() {
    teachersCrud.setIsLoading(true);
    try {
      const [teachersRes, sectionsRes, subjectsRes] = await Promise.all([
        pb.collection("users").getFullList<Teacher>({
          filter: 'role = "teacher"',
          expand: "sections,subjects",
          sort: "name_ar",
        }),
        pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
      ]);
      setTeachersData({ items: teachersRes, sections: sectionsRes, subjects: subjectsRes });
    } catch (err) {
      teachersCrud.setError("Failed to load teachers");
    } finally {
      teachersCrud.setIsLoading(false);
    }
  }

    async function loadStudents() {
      console.log(`[LOAD_STUDENTS] Starting load...`);
      studentsCrud.setIsLoading(true);
      try {
        const [studentsRes, sectionsRes] = await Promise.all([
          pb.collection("users").getFullList<Student>({
            filter: `role = "student"`,
            expand: "sections",
            sort: "name_ar",
          }),
          pb.collection("class_sections").getFullList<ClassSection>({ sort: "grade_order,section_ar" }),
        ]);
        console.log(`[LOAD_STUDENTS] Fetched ${studentsRes.length} students`);
        // Filter out the test student in memory (don't rely on PocketBase filter)
        const filteredStudents = studentsRes.filter(s => s.email !== "student@school.edu");
        setStudentsData({ items: filteredStudents, sections: sectionsRes });
        console.log(`[LOAD_STUDENTS] Updated state with ${filteredStudents.length} students after filtering test student`);
      } catch (err) {
        console.error(`[LOAD_STUDENTS] Error:`, err);
        studentsCrud.setError("Failed to load students");
      } finally {
        studentsCrud.setIsLoading(false);
        console.log(`[LOAD_STUDENTS] Completed`);
      }
    }

  useEffect(() => {
    loadTeachers();
    loadStudents();
  }, []);

  // Teachers functions
  function openCreateTeacher() {
    teachersCrud.setEditingId(null);
    teachersForm.reset();
    teachersCrud.setShowCreate(true);
  }

  function openEditTeacher(teacher: Teacher) {
    teachersCrud.setEditingId(teacher.id);
    teachersForm.setData({
      name_ar: teacher.name_ar,
      name_en: teacher.name_en,
      email: teacher.email,
      password: "",
      sections: teacher.sections ?? [],
      subjects: teacher.subjects ?? [],
    });
    teachersCrud.setShowCreate(true);
  }

  function closeTeacherForm() {
    teachersCrud.setShowCreate(false);
    teachersCrud.setEditingId(null);
    teachersForm.reset();
  }

  async function handleTeacherSubmit(e: React.FormEvent) {
    e.preventDefault();
    teachersCrud.setIsLoading(true);
    try {
      if (teachersCrud.state.editingId) {
        const data: Record<string, unknown> = {
          name_ar: teachersForm.state.data.name_ar,
          name_en: teachersForm.state.data.name_en,
          email: teachersForm.state.data.email,
          sections: teachersForm.state.data.sections,
          subjects: teachersForm.state.data.subjects,
        };
        if (teachersForm.state.data.password) {
          data.password = teachersForm.state.data.password;
          data.passwordConfirm = teachersForm.state.data.password;
        }
        await pb.collection("users").update(teachersCrud.state.editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: teachersForm.state.data.name_ar,
          name_en: teachersForm.state.data.name_en,
          email: teachersForm.state.data.email,
          password: teachersForm.state.data.password,
          passwordConfirm: teachersForm.state.data.password,
          role: "teacher",
          sections: teachersForm.state.data.sections,
          subjects: teachersForm.state.data.subjects,
          emailVisibility: true,
        });
      }
      closeTeacherForm();
      await loadTeachers();
    } catch (err) {
      teachersCrud.setError(`Failed to save teacher: ${err}`);
    } finally {
      teachersCrud.setIsLoading(false);
    }
  }

  async function handleTeacherDelete(id: string) {
    if (!(await confirm(t_teachers.confirmDelete))) return;
    teachersCrud.setEditingId(id);
    try {
      // Cascade delete: Remove all teacher-related records
      const [materials, homework, quizzes, exams, announcements] = await Promise.all([
        pb.collection("materials").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("homework").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("quizzes").getFullList({ filter: `teacher = "${id}"` }).catch(() => []),
        pb.collection("exam_schedules").getFullList({ filter: `subject.teacher = "${id}"` }).catch(() => []),
        pb.collection("announcements").getFullList({ filter: `author = "${id}"` }).catch(() => []),
      ]);

      // Delete submissions
      const submissions = await pb.collection("submissions").getFullList({ filter: `homework.teacher = "${id}"` }).catch(() => []);
      for (const sub of submissions) {
        try { await pb.collection("submissions").delete(sub.id); } catch {}
      }

      // Delete quiz attempts and questions
      for (const quiz of quizzes) {
        const attempts = await pb.collection("quiz_attempts").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
        for (const att of attempts) {
          try { await pb.collection("quiz_attempts").delete(att.id); } catch {}
        }
        const questions = await pb.collection("quiz_questions").getFullList({ filter: `quiz = "${quiz.id}"` }).catch(() => []);
        for (const q of questions) {
          try { await pb.collection("quiz_questions").delete(q.id); } catch {}
        }
        try { await pb.collection("quizzes").delete(quiz.id); } catch {}
      }

      // Delete other records
      for (const m of materials) { try { await pb.collection("materials").delete(m.id); } catch {} }
      for (const h of homework) { try { await pb.collection("homework").delete(h.id); } catch {} }
      for (const e of exams) { try { await pb.collection("exam_schedules").delete(e.id); } catch {} }
      for (const a of announcements) { try { await pb.collection("announcements").delete(a.id); } catch {} }

      // Delete teacher record
      await pb.collection("users").delete(id);
      await loadTeachers();
    } catch (err) {
      teachersCrud.setError(`Failed to delete teacher: ${err}`);
    } finally {
      teachersCrud.setEditingId(null);
    }
  }

  // Students functions
  function openCreateStudent() {
    studentsCrud.setEditingId(null);
    studentsForm.reset();
    studentsCrud.setShowCreate(true);
  }

  function openEditStudent(student: Student) {
    studentsCrud.setEditingId(student.id);
    studentsForm.setData({
      name_ar: student.name_ar,
      name_en: student.name_en,
      email: student.email,
      password: "",
      sections: student.sections ?? [],
    });
    studentsCrud.setShowCreate(true);
  }

  function closeStudentForm() {
    studentsCrud.setShowCreate(false);
    studentsCrud.setEditingId(null);
    studentsForm.reset();
  }

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    studentsCrud.setIsLoading(true);
    try {
      if (studentsCrud.state.editingId) {
        const data: Record<string, unknown> = {
          name_ar: studentsForm.state.data.name_ar,
          name_en: studentsForm.state.data.name_en,
          email: studentsForm.state.data.email,
          sections: studentsForm.state.data.sections,
        };
        if (studentsForm.state.data.password) {
          data.password = studentsForm.state.data.password;
          data.passwordConfirm = studentsForm.state.data.password;
        }
        await pb.collection("users").update(studentsCrud.state.editingId, data);
      } else {
        await pb.collection("users").create({
          name_ar: studentsForm.state.data.name_ar,
          name_en: studentsForm.state.data.name_en,
          email: studentsForm.state.data.email,
          password: studentsForm.state.data.password,
          passwordConfirm: studentsForm.state.data.password,
          role: "student",
          sections: studentsForm.state.data.sections,
          emailVisibility: true,
        });
      }
      closeStudentForm();
      await loadStudents();
    } catch (err) {
      studentsCrud.setError(`Failed to save student: ${err}`);
    } finally {
      studentsCrud.setIsLoading(false);
    }
  }

   async function handleStudentDelete(id: string) {
     if (!(await confirm(t_students.confirmDelete))) return;
     studentsCrud.setEditingId(id);
     try {
       // Cascade delete for student
       const [submissions, attempts, comments, reactions] = await Promise.all([
         pb.collection("submissions").getFullList({ filter: `student = "${id}"` }).catch(() => []),
         pb.collection("quiz_attempts").getFullList({ filter: `student = "${id}"` }).catch(() => []),
         pb.collection("comments").getFullList({ filter: `author = "${id}"` }).catch(() => []),
         pb.collection("reactions").getFullList({ filter: `user = "${id}"` }).catch(() => []),
       ]);

       for (const s of submissions) { try { await pb.collection("submissions").delete(s.id); } catch {} }
       for (const a of attempts) { try { await pb.collection("quiz_attempts").delete(a.id); } catch {} }
       for (const c of comments) { try { await pb.collection("comments").delete(c.id); } catch {} }
       for (const r of reactions) { try { await pb.collection("reactions").delete(r.id); } catch {} }

       await pb.collection("users").delete(id);
        await loadStudents();
      } catch (err) {
        studentsCrud.setError(`Failed to delete student: ${err}`);
      } finally {
        studentsCrud.setEditingId(null);
      }
    }

    async function handleBulkDeleteStudents() {
      if (selectedStudentIds.size === 0) return;
      const msg = locale === "ar" 
        ? `هل تريد حذف ${selectedStudentIds.size} طالب/طالبة؟ سيتم أيضًا حذف جميع بيانات المرتبطة بهم.`
        : `Delete ${selectedStudentIds.size} student(s)? All related data will also be deleted.`;
      
      if (!(await confirm(msg))) return;
      
      setIsDeleting(true);
      try {
        let deleted = 0;
        let failed = 0;
        
         for (const id of selectedStudentIds) {
           try {
             // Cascade delete for each student
             const [submissions, attempts, comments, reactions] = await Promise.all([
               pb.collection("submissions").getFullList({ filter: `student = "${id}"` }).catch(() => []),
               pb.collection("quiz_attempts").getFullList({ filter: `student = "${id}"` }).catch(() => []),
               pb.collection("comments").getFullList({ filter: `author = "${id}"` }).catch(() => []),
               pb.collection("reactions").getFullList({ filter: `user = "${id}"` }).catch(() => []),
             ]);

             // Delete submissions
             for (const s of submissions) { 
               try { 
                 await pb.collection("submissions").delete(s.id); 
               } catch (e) { 
                 console.error(`Failed to delete submission ${s.id}:`, e);
               } 
             }
             
             // Delete quiz attempts
             for (const a of attempts) { 
               try { 
                 await pb.collection("quiz_attempts").delete(a.id); 
               } catch (e) { 
                 console.error(`Failed to delete quiz_attempt ${a.id}:`, e);
               } 
             }
             
             // Delete comments
             for (const c of comments) { 
               try { 
                 await pb.collection("comments").delete(c.id); 
               } catch (e) { 
                 console.error(`Failed to delete comment ${c.id}:`, e);
               } 
             }
             
             // Delete reactions (critical - must delete before user)
             for (const r of reactions) { 
               try { 
                 await pb.collection("reactions").delete(r.id); 
               } catch (e) { 
                 console.error(`Failed to delete reaction ${r.id}:`, e);
                 throw new Error(`Cannot delete reactions - user has required relations`);
               } 
             }

             // Finally delete the user
             await pb.collection("users").delete(id);
             deleted++;
           } catch (err) {
             failed++;
             console.error(`Failed to delete student ${id}:`, err);
           }
         }

        await loadStudents();
        setSelectedStudentIds(new Set());
        
        const resultMsg = locale === "ar"
          ? `تم حذف ${deleted} طالب/طالبة بنجاح${failed > 0 ? ` (فشل ${failed})` : ""}`
          : `Successfully deleted ${deleted} student(s)${failed > 0 ? ` (${failed} failed)` : ""}`;
        
        await alert(resultMsg);
      } catch (err) {
        console.error("Bulk delete error:", err);
        await alert(locale === "ar" ? "خطأ في الحذف الجماعي" : "Bulk delete failed");
      } finally {
        setIsDeleting(false);
      }
    }


    // Wizard Step 1: File upload
    async function handleFileUpload() {
      if (!csvFile) {
        setWizardError(locale === "ar" ? "يرجى اختيار ملف" : "Please select a file");
        return;
      }
      
      try {
        setCsvImporting(true);
        setWizardError(null);
        
        // Parse the file
        const rows = await parseStudentFile(csvFile);
        
        if (!rows || rows.length === 0) {
          throw new Error(locale === "ar" ? "لا توجد بيانات صحيحة في الملف" : "No valid data found in file");
        }
        
        // Fetch existing emails from PocketBase to ensure uniqueness
        let existingEmails: Set<string> = new Set();
        try {
          const existingUsers = await pb.collection("users").getFullList({ fields: "email" });
          existingEmails = new Set(existingUsers.map(u => u.email));
          console.log(`[WIZARD] Found ${existingEmails.size} existing emails in system`);
        } catch (err) {
          console.warn("[WIZARD] Could not fetch existing emails, proceeding without check:", err);
        }
        
        // Convert to import data with auto-generated defaults and unique emails
        const importData: StudentImportData[] = rows.map(row => {
          const email = generateUniqueEmail(row.name_ar, existingEmails);
          existingEmails.add(email); // Add to set for next iteration
          
          return {
            name_ar: row.name_ar,
            name_en: generateEnglishName(row.name_ar), // Auto-generate from Arabic name
            email: email,
            password: email, // Use email as default password
            section_id: ""
          };
        });
        
        // Log any duplicate emails detected and auto-fixed
        const emailCounts: Record<string, number> = {};
        importData.forEach(student => {
          emailCounts[student.email] = (emailCounts[student.email] || 0) + 1;
        });
        
        const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1);
        if (duplicateEmails.length > 0) {
          console.warn("[WIZARD] Duplicate emails detected and auto-fixed:", duplicateEmails);
        }
        
        setImportStudents(importData);
        setWizardStep(2);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setWizardError(errorMsg);
      } finally {
        setCsvImporting(false);
      }
    }
    
    // Update a student's data
    function updateStudent(index: number, data: Partial<StudentImportData>) {
      setImportStudents(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      });
    }
    
    // Regenerate email for a student
    function regenerateEmail(index: number) {
      try {
        // Build set of all OTHER students' emails (to avoid collision)
        const otherEmails = new Set<string>();
        for (let i = 0; i < importStudents.length; i++) {
          if (i !== index) {
            otherEmails.add(importStudents[i].email);
          }
        }
        
        // Generate unique email that doesn't collide with others
        const newEmail = generateUniqueEmail(importStudents[index].name_ar, otherEmails);
        updateStudent(index, { email: newEmail });
      } catch (err) {
        console.error("Error regenerating email", err);
      }
    }
    
    // Regenerate password for a student
    function regeneratePassword(index: number) {
      const newPassword = generatePassword();
      updateStudent(index, { password: newPassword });
    }
    
    // Validate Step 2
    function validateStep2(): boolean {
      setWizardError(null);
      
      // Check for duplicate emails within import list
      const emailSet = new Set<string>();
      for (let i = 0; i < importStudents.length; i++) {
        const student = importStudents[i];
        
        if (!student.name_en.trim()) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "الاسم الإنجليزي مطلوب" : "English name is required"}`);
          return false;
        }
        
        if (!student.email.trim()) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "البريد الإلكتروني مطلوب" : "Email is required"}`);
          return false;
        }
        
        if (!isValidEmail(student.email)) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format"}`);
          return false;
        }
        
        // Check for duplicate emails within the import list
        if (emailSet.has(student.email)) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "البريد الإلكتروني مكرر في القائمة" : "Email is duplicated in the list"} (${student.email}). ${locale === "ar" ? "يرجى تعديل البريد الإلكتروني" : "Please modify the email"}`);
          return false;
        }
        emailSet.add(student.email);
        
        if (!student.password.trim()) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "كلمة المرور مطلوبة" : "Password is required"}`);
          return false;
        }
        
        if (!isValidPassword(student.password)) {
          setWizardError(`${locale === "ar" ? "الطالب" : "Student"} ${i + 1}: ${locale === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters"}`);
          return false;
        }
      }
      
      return true;
    }
    
    // Validate Step 3
    function validateStep3(): boolean {
      setWizardError(null);
      
      for (const student of importStudents) {
        if (!student.section_id) {
          setWizardError(locale === "ar" ? "يجب تحديد الفصل لجميع الطلاب" : "Section must be selected for all students");
          return false;
        }
      }
      
      return true;
    }
    
    // Submit wizard (Step 4 confirm)
    async function handleWizardSubmit() {
      if (!validateStep3()) return;
      
      setCsvImporting(true);
      setWizardError(null);
      
      try {
        let created = 0;
        let failed = 0;
        const failedRecords: Array<{name: string, email: string, reason: string}> = [];
        
         // CRITICAL: Build final email set from ALL students to detect any remaining duplicates
         // This catches cases where:
         // 1. Admin manually edited emails and created duplicates
         // 2. New users were created in system after import preview
         // 3. Any other edge cases that created collisions
         const finalEmailSet = new Set<string>();
         
         // First, fetch latest existing emails from system
         try {
           // Use getFullList() with explicit limit and filter to ensure we get all records
           // Don't use fields parameter - fetch full records to ensure data integrity
           const existingUsers = await pb.collection("users").getFullList({
             // Get all records without limit
             batch: 500, // Fetch in batches of 500
           });
           
           // Extract emails from all users
           existingUsers.forEach((u: any) => {
             if (u.email) {
               finalEmailSet.add(u.email);
             }
           });
           
           console.log(`[WIZARD] Found ${finalEmailSet.size} existing emails in system (final check)`);
           console.log(`[WIZARD] Sample existing emails:`, Array.from(finalEmailSet).slice(0, 10));
           
           // Debug: log the exact emails that will be checked against
           if (finalEmailSet.size > 0) {
             console.log(`[WIZARD] Existing emails that will be checked:`, Array.from(finalEmailSet));
           }
         } catch (err) {
           console.error("[WIZARD] ERROR fetching existing emails:", err);
           // Try alternative method: use getList with pagination
           try {
             let allUsers: any[] = [];
             let page = 1;
             let hasMore = true;
             
             while (hasMore) {
               const batch = await pb.collection("users").getList(page, 500, { fields: "email" });
               allUsers = allUsers.concat(batch.items);
               hasMore = batch.items.length === 500; // More pages if got full batch
               page++;
             }
             
             allUsers.forEach((u: any) => {
               if (u.email) {
                 finalEmailSet.add(u.email);
               }
             });
             
             console.log(`[WIZARD] (Fallback method) Found ${finalEmailSet.size} existing emails`);
           } catch (fallbackErr) {
             console.warn("[WIZARD] Both methods failed to fetch emails, proceeding with caution:", fallbackErr);
           }
         }
        
        // Second, check all students in this import for duplicates
        const studentEmails = importStudents.map(s => s.email);
        const seenEmails = new Set<string>();
        const emailsNeedingRegen: number[] = [];
        
        console.log(`[WIZARD] Checking ${importStudents.length} students for duplicates:`);
        
        for (let i = 0; i < importStudents.length; i++) {
          const studentEmail = studentEmails[i];
          const isDupInSystem = finalEmailSet.has(studentEmail);
          const isDupInImport = seenEmails.has(studentEmail);
          
          if (isDupInSystem || isDupInImport) {
            console.warn(`[WIZARD] Duplicate email detected: ${studentEmail} for student ${importStudents[i].name_ar} (system: ${isDupInSystem}, import: ${isDupInImport})`);
            emailsNeedingRegen.push(i);
          } else {
            console.log(`[WIZARD]   ✓ ${i}: ${importStudents[i].name_ar} → ${studentEmail}`);
            seenEmails.add(studentEmail);
          }
        }
        
        // If duplicates found, regenerate them with uniqueness guarantee
        if (emailsNeedingRegen.length > 0) {
          console.log(`[WIZARD] Regenerating ${emailsNeedingRegen.length} duplicate emails...`);
          
          for (const idx of emailsNeedingRegen) {
            const student = importStudents[idx];
            try {
              const oldEmail = student.email;
              const newEmail = generateUniqueEmail(student.name_ar, finalEmailSet);
              importStudents[idx].email = newEmail;
              finalEmailSet.add(newEmail);
              seenEmails.add(newEmail);
              console.log(`[WIZARD] Regenerated email for ${student.name_ar}: ${oldEmail} → ${newEmail}`);
            } catch (err) {
              console.error(`[WIZARD] Failed to regenerate email for ${student.name_ar}:`, err);
            }
          }
        }
        
        console.log(`[WIZARD] Final emails to be created:`, importStudents.map(s => `${s.name_ar}: ${s.email}`));
        console.log(`[WIZARD] Starting to create ${importStudents.length} students...`);
        
        // Track all known emails: system emails + successfully created + failed attempts
        // This is the SINGLE SOURCE OF TRUTH for uniqueness checking
        const allKnownEmails = new Set<string>(finalEmailSet);
        
        for (const student of importStudents) {
          let currentEmail = student.email;
          const maxRetries = 5; // Maximum regeneration attempts
          
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 0) {
                // Regenerate email on retry - allKnownEmails already contains the failed email
                // so generateUniqueEmail will skip it and produce a different one
                const oldEmail = currentEmail;
                currentEmail = generateUniqueEmail(student.name_ar, allKnownEmails);
                console.log(`[WIZARD] Retry #${attempt} for ${student.name_ar}: ${oldEmail} → ${currentEmail}`);
              }
              
              console.log(`[WIZARD] Creating student: ${student.name_ar} (${currentEmail})`);
              
              // Create student
              const newStudent = await pb.collection("users").create({
                name_ar: student.name_ar,
                name_en: student.name_en,
                email: currentEmail,
                password: student.password,
                passwordConfirm: student.password,
                role: "student",
                sections: [student.section_id],
                emailVisibility: false,
              });
              
              console.log(`[WIZARD] Successfully created student: ${newStudent.id} (${currentEmail})`);
              allKnownEmails.add(currentEmail); // Track successfully created email
              created++;
              break; // Success, exit retry loop
              
            } catch (err: any) {
              // CRITICAL: Add the failed email to our known set IMMEDIATELY
              // This ensures generateUniqueEmail() will skip it on the next attempt
              allKnownEmails.add(currentEmail);
              console.warn(`[WIZARD] Attempt ${attempt + 1} failed for ${student.name_ar} (${currentEmail}):`, err?.message || String(err));
              console.log(`[WIZARD] Added failed email ${currentEmail} to known emails set (total: ${allKnownEmails.size})`);
              
              if (attempt < maxRetries) {
                console.log(`[WIZARD] Will retry with regenerated email (avoiding ${currentEmail})...`);
                continue; // Try again with regenerated email
              }
              
              // Max retries exceeded - report failure
              console.error(`[WIZARD] All ${maxRetries + 1} attempts failed for ${student.name_ar}`);
              failed++;
              
              // Extract detailed error message from last error
              let errorReason = "Unknown error";
              
              if (err?.data?.data) {
                const fieldErrors = Object.entries(err.data.data)
                  .map(([field, detail]: [string, any]) => {
                    const fieldMsg = detail?.message || detail || "Invalid value";
                    return `${field}: ${fieldMsg}`;
                  })
                  .join("; ");
                errorReason = fieldErrors;
              } else if (err?.response?.status === 400 && err?.data?.message) {
                errorReason = err.data.message;
              } else if (err?.message?.includes("email") || err?.message?.includes("unique")) {
                errorReason = locale === "ar" 
                  ? "البريد الإلكتروني مستخدم بالفعل في النظام" 
                  : "Email already exists in the system";
              } else {
                errorReason = err?.message || String(err);
              }
              
              failedRecords.push({
                name: student.name_ar,
                email: currentEmail,
                reason: errorReason
              });
              
              console.error(`[WIZARD] Failed to create student ${student.name_ar} (${currentEmail}):`, errorReason);
              break; // Exit retry loop - all retries exhausted
            }
          }
        }
        
        console.log(`[WIZARD] Created ${created} out of ${importStudents.length} students`);
        
        // Build detailed result message
        let resultMsg = locale === "ar"
          ? `تم إنشاء ${created} من أصل ${importStudents.length} طالب/طالبة بنجاح`
          : `Successfully created ${created} out of ${importStudents.length} students`;
        
        if (failed > 0) {
          const failedDetails = failedRecords
            .map(r => `• ${r.name} (${r.email})\n  ${locale === "ar" ? "السبب" : "Reason"}: ${r.reason}`)
            .join("\n");
          
          resultMsg += locale === "ar"
            ? `\n\n⚠️ فشل في إنشاء ${failed}:\n${failedDetails}`
            : `\n\n⚠️ Failed to create ${failed}:\n${failedDetails}`;
        }
        
        await alert(resultMsg);
        
        // Reset wizard
        setWizardStep(1);
        setImportStudents([]);
        setCsvFile(null);
        setShowCsvImport(false);
        
        console.log(`[WIZARD] Calling loadStudents()...`);
        // Load students and switch to tab
        await loadStudents();
        console.log(`[WIZARD] loadStudents() completed, students data:`, studentsData.items.length);
        
        // Small delay to ensure React state updates are batched properly
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`[WIZARD] Switching to students tab...`);
        setActiveTab("students");
        console.log(`[WIZARD] Done!`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[WIZARD] Error:`, errorMsg);
        setWizardError(errorMsg);
      } finally {
        setCsvImporting(false);
      }
    }
    
    // Close wizard
    function closeWizard() {
      setShowCsvImport(false);
      setWizardStep(1);
      setImportStudents([]);
      setCsvFile(null);
      setWizardError(null);
    }

  const filteredTeachers = teachersData.items
    .filter(t => {
      // Search filter
      const searchMatch = `${t.name_ar} ${t.name_en} ${t.email}`.toLowerCase().includes(teachersFilter.state.searchTerm.toLowerCase());
      
      // Section filter
      const sectionMatch = !teachersSectionFilter || t.sections.includes(teachersSectionFilter);
      
      // Subject filter
      const subjectMatch = !teachersSubjectFilter || t.subjects.includes(teachersSubjectFilter);
      
      return searchMatch && sectionMatch && subjectMatch;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (teachersSortBy) {
        case "name-az":
          return a.name_ar.localeCompare(b.name_ar);
        case "name-za":
          return b.name_ar.localeCompare(a.name_ar);
        case "email-az":
          return a.email.localeCompare(b.email);
        default:
          return 0;
      }
    });

  const filteredStudents = studentsData.items
    .filter(s => {
      // Search filter
      const searchMatch = `${s.name_ar} ${s.name_en} ${s.email}`.toLowerCase().includes(studentsFilter.state.searchTerm.toLowerCase());
      
      // Section filter
      let sectionMatch = true;
      if (studentsSectionFilter === "other") {
        // "Other" filter: show students with no sections
        sectionMatch = !s.sections || s.sections.length === 0;
      } else if (studentsSectionFilter) {
        // Regular section filter: show students in this section
        sectionMatch = s.sections.includes(studentsSectionFilter);
      }
      
      return searchMatch && sectionMatch;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (studentsSortBy) {
        case "name-az":
          return a.name_ar.localeCompare(b.name_ar);
        case "name-za":
          return b.name_ar.localeCompare(a.name_ar);
        case "email-az":
          return a.email.localeCompare(b.email);
        default:
          return 0;
      }
    });

  return (
    <main className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 font-semibold transition-colors ${
            tab === "teachers"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)]"
          }`}
        >
          {t_teachers.title}
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 font-semibold transition-colors ${
            tab === "students"
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)]"
          }`}
        >
          {t_students.title}
        </button>
      </div>

       {/* Teachers Tab */}
       {tab === "teachers" && (
         <div>
             <div className="mb-4 flex items-center justify-center gap-3">
               <div className="flex-1 max-w-md relative">
                 <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" />
                 <input
                   type="text"
                   placeholder={t_teachers.filterSearch}
                   value={teachersFilter.state.searchTerm}
                   onChange={e => teachersFilter.setSearchTerm(e.target.value)}
                   className="w-full ps-10 pe-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 />
               </div>
              <button
                onClick={openCreateTeacher}
                 aria-label={t_teachers.add}
                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <Plus className="h-4 w-4" />
                {t_teachers.add}
              </button>
            </div>

            {/* Teachers Filters */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Section Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
                  {t_teachers.filterSection}
                </label>
                <select
                  value={teachersSectionFilter}
                  onChange={(e) => setTeachersSectionFilter(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="">{t_teachers.filterAllSections}</option>
                  {teachersData.sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {formatSection(section, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
                  {t_teachers.filterSubject}
                </label>
                <select
                  value={teachersSubjectFilter}
                  onChange={(e) => setTeachersSubjectFilter(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="">{t_teachers.filterAllSubjects}</option>
                  {teachersData.subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {locale === "ar" ? subject.name_ar : subject.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
                  {t_teachers.sortBy}
                </label>
                <select
                  value={teachersSortBy}
                  onChange={(e) => setTeachersSortBy(e.target.value as "name-az" | "name-za" | "email-az")}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="name-az">{t_teachers.sortNameAz}</option>
                  <option value="name-za">{t_teachers.sortNameZa}</option>
                  <option value="email-az">{t_teachers.sortEmailAz}</option>
                </select>
              </div>

{/* Results count */}
              <div className="flex items-end justify-center">
                  <div className="text-sm font-semibold text-[var(--color-ink-secondary)]">
                    {filteredTeachers.length} {t_teachers.title}
                  </div>
                </div>
            </div>

          {teachersCrud.state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <p className="text-center py-8 text-[var(--color-ink-secondary)]">{t_teachers.empty}</p>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{locale === "ar" ? teacher.name_ar : teacher.name_en}</h3>
                      <p className="text-sm text-[var(--color-ink-secondary)]">{locale === "ar" ? teacher.name_en : teacher.name_ar}</p>
                      <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{teacher.email}</p>
                       {teacher.expand?.sections?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {teacher.expand.sections.map(s => (
                              <span key={s.id} className="inline-block rounded bg-[var(--color-accent)] bg-opacity-20 px-2 py-0.5 text-xs font-semibold text-white">
                                {formatSection(s, locale)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditTeacher(teacher)}
                        className="rounded bg-[var(--color-accent)] p-2 text-white transition-opacity hover:opacity-80"
                        title={c.edit}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTeacherDelete(teacher.id)}
                        disabled={teachersCrud.state.editingId === teacher.id}
                        className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        title={c.delete}
                      >
                        {teachersCrud.state.editingId === teacher.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Form Modal */}
          {teachersCrud.state.showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{teachersCrud.state.editingId ? t_teachers.editTitle : t_teachers.add}</h2>
                  <button onClick={closeTeacherForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameAr}</label>
                    <input
                      type="text"
                      value={teachersForm.state.data.name_ar}
                      onChange={e => teachersForm.setFieldValue("name_ar", e.target.value)}
                      placeholder={t_teachers.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.nameEn}</label>
                    <input
                      type="text"
                      value={teachersForm.state.data.name_en}
                      onChange={e => teachersForm.setFieldValue("name_en", e.target.value)}
                      placeholder={t_teachers.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_teachers.email}</label>
                    <input
                      type="email"
                      value={teachersForm.state.data.email}
                      onChange={e => teachersForm.setFieldValue("email", e.target.value)}
                      placeholder={t_teachers.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {teachersCrud.state.editingId ? t_teachers.newPassword : t_teachers.password}
                    </label>
                    <input
                      type="password"
                      value={teachersForm.state.data.password}
                      onChange={e => teachersForm.setFieldValue("password", e.target.value)}
                      placeholder={t_teachers.phPassword}
                      required={!teachersCrud.state.editingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                   <MultiSelect
                     label={t_teachers.assignedSections}
                     options={teachersData.sections.map(s => ({ id: s.id, label: formatSection(s, locale) }))}
                     selected={teachersForm.state.data.sections}
                     getLabel={id => {
                       const s = teachersData.sections.find(x => x.id === id);
                       return s ? formatSection(s, locale) : id;
                    }}
                    onChange={sections => teachersForm.setFieldValue("sections", sections)}
                  />
                  <MultiSelect
                    label={t_teachers.assignedSubjects}
                    options={teachersData.subjects.map(s => ({ id: s.id, label: s.name_en }))}
                    selected={teachersForm.state.data.subjects}
                    getLabel={id => {
                      const s = teachersData.subjects.find(x => x.id === id);
                      return s ? s.name_en : id;
                    }}
                    onChange={subjects => teachersForm.setFieldValue("subjects", subjects)}
                  />
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeTeacherForm}
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {c.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={teachersCrud.state.isLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {teachersCrud.state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {c.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

       {/* Students Tab */}
        {tab === "students" && (
           <div>
             <div className="mb-4 flex items-center justify-center gap-3 flex-wrap">
               <div className="flex-1 max-w-md relative">
                 <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-ink-placeholder)] pointer-events-none" />
                 <input
                   type="text"
                   placeholder={t_students.filterSearch}
                   value={studentsFilter.state.searchTerm}
                   onChange={e => studentsFilter.setSearchTerm(e.target.value)}
                   className="w-full ps-10 pe-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 />
               </div>
               <button
                 onClick={openCreateStudent}
                  aria-label={t_students.add}
                 className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
               >
                 <Plus className="h-4 w-4" />
                 {t_students.add}
               </button>
                <button
                  onClick={() => setShowCsvImport(true)}
                   aria-label="Import students from CSV"
                  className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-role-admin-bold)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                   <Upload className="h-4 w-4" />
                   {dict.dashboard.admin.students.importWizard.buttonText}
                </button>
             </div>

             {/* Students Filters */}
             <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Section Filter */}
              <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
                    {t_students.filterSection}
                  </label>
                  <select
                    value={studentsSectionFilter}
                    onChange={(e) => setStudentsSectionFilter(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="">{t_students.filterAllSections}</option>
                    <option value="other">{locale === "ar" ? "بدون فصل (أخرى)" : "No Class (Other)"}</option>
                    {studentsData.sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {formatSection(section, locale)}
                      </option>
                    ))}
                  </select>
                </div>

               {/* Sort By */}
               <div>
                 <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
                   {t_students.sortBy}
                 </label>
                 <select
                   value={studentsSortBy}
                   onChange={(e) => setStudentsSortBy(e.target.value as "name-az" | "name-za" | "email-az")}
                   className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                 >
                   <option value="name-az">{t_students.sortNameAz}</option>
                   <option value="name-za">{t_students.sortNameZa}</option>
                   <option value="email-az">{t_students.sortEmailAz}</option>
                 </select>
               </div>

{/* Results count */}
                <div className="flex items-end justify-center">
                  <div className="text-sm font-semibold text-[var(--color-ink-secondary)]">
                    {filteredStudents.length} {t_students.title}
                  </div>
                </div>
             </div>

           {studentsCrud.state.isLoading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
             </div>
           ) : filteredStudents.length === 0 ? (
             <p className="text-center py-8 text-[var(--color-ink-secondary)]">{t_students.empty}</p>
           ) : (
             <>
               {/* Bulk Delete Toolbar */}
               {selectedStudentIds.size > 0 && (
                 <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] p-4 border border-[var(--color-border)]">
                   <div className="text-sm font-semibold">
                     {locale === "ar" 
                       ? `تم تحديد ${selectedStudentIds.size} طالب/طالبة`
                       : `${selectedStudentIds.size} student(s) selected`}
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => setSelectedStudentIds(new Set())}
                       className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunken)]"
                     >
                       {locale === "ar" ? "إلغاء" : "Deselect All"}
                     </button>
                     <button
                       onClick={handleBulkDeleteStudents}
                       disabled={isDeleting}
                       className="flex items-center gap-2 rounded-[var(--radius-md)] bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                     >
                       {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                       {locale === "ar" ? "حذف المحددين" : "Delete Selected"}
                     </button>
                   </div>
                 </div>
               )}

               <div className="space-y-3">
                 {/* Select All Button */}
                 {filteredStudents.length > 0 && (
                   <div className="flex items-center gap-2 px-2">
                     <input
                       type="checkbox"
                       checked={selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0}
                       onChange={e => {
                         if (e.target.checked) {
                           setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
                         } else {
                           setSelectedStudentIds(new Set());
                         }
                       }}
                       className="h-4 w-4 cursor-pointer rounded border border-[var(--color-border)] accent-[var(--color-accent)]"
                     />
                     <label className="text-sm font-semibold text-[var(--color-ink)] cursor-pointer">
                       {locale === "ar" ? "تحديد الكل" : "Select All"}
                     </label>
                   </div>
                 )}

                 {filteredStudents.map(student => (
                   <div key={student.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
                     <div className="flex items-start justify-between gap-4">
                       <div className="flex items-start gap-3 flex-1">
                         <input
                           type="checkbox"
                           checked={selectedStudentIds.has(student.id)}
                           onChange={e => {
                             const newSet = new Set(selectedStudentIds);
                             if (e.target.checked) {
                               newSet.add(student.id);
                             } else {
                               newSet.delete(student.id);
                             }
                             setSelectedStudentIds(newSet);
                           }}
                           className="h-4 w-4 cursor-pointer rounded border border-[var(--color-border)] accent-[var(--color-accent)] mt-1 flex-shrink-0"
                         />
                         <div className="flex-1">
                           <h3 className="font-semibold">{locale === "ar" ? student.name_ar : student.name_en}</h3>
                           <p className="text-sm text-[var(--color-ink-secondary)]">{locale === "ar" ? student.name_en : student.name_ar}</p>
                            <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{student.email}</p>
                             {student.expand?.sections?.length ? (
                               <div className="mt-2 flex flex-wrap gap-1">
                                 {student.expand.sections.map(s => (
                                   <span key={s.id} className="inline-block rounded bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
                                     {formatSection(s, locale)}
                                   </span>
                                 ))}

                              </div>
                            ) : null}
                         </div>
                       </div>
                       <div className="flex gap-2 flex-shrink-0">
                         <button
                           onClick={() => openEditStudent(student)}
                           className="rounded bg-[var(--color-accent)] p-2 text-white transition-opacity hover:opacity-80"
                           title={c.edit}
                         >
                           <Pencil className="h-4 w-4" />
                         </button>
                         <button
                           onClick={() => handleStudentDelete(student.id)}
                           disabled={studentsCrud.state.editingId === student.id}
                           className="rounded bg-red-500 p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                           title={c.delete}
                         >
                           {studentsCrud.state.editingId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </>
           )}

          {/* Student Form Modal */}
          {studentsCrud.state.showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-md)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{studentsCrud.state.editingId ? t_students.editTitle : t_students.add}</h2>
                  <button onClick={closeStudentForm} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameAr}</label>
                    <input
                      type="text"
                      value={studentsForm.state.data.name_ar}
                      onChange={e => studentsForm.setFieldValue("name_ar", e.target.value)}
                      placeholder={t_students.phNameAr}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.nameEn}</label>
                    <input
                      type="text"
                      value={studentsForm.state.data.name_en}
                      onChange={e => studentsForm.setFieldValue("name_en", e.target.value)}
                      placeholder={t_students.phNameEn}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{t_students.email}</label>
                    <input
                      type="email"
                      value={studentsForm.state.data.email}
                      onChange={e => studentsForm.setFieldValue("email", e.target.value)}
                      placeholder={t_students.phEmail}
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {studentsCrud.state.editingId ? t_students.newPassword : t_students.password}
                    </label>
                    <input
                      type="password"
                      value={studentsForm.state.data.password}
                      onChange={e => studentsForm.setFieldValue("password", e.target.value)}
                      placeholder={t_students.phPassword}
                      required={!studentsCrud.state.editingId}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                   <SingleSelect
                     label={t_students.assignedSection}
                     options={studentsData.sections.map(s => ({ id: s.id, label: formatSection(s, locale) }))}
                     selected={studentsForm.state.data.sections[0] || ""}
                     getLabel={id => {
                       const s = studentsData.sections.find(x => x.id === id);
                       return s ? formatSection(s, locale) : id;
                     }}
                     onChange={section => studentsForm.setFieldValue("sections", [section])}
                   />
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={closeStudentForm}
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {c.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={studentsCrud.state.isLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                    >
                      {studentsCrud.state.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {c.save}
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           )}

            {/* CSV Import Modal */}
             {showCsvImport && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                 <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
                   {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-[var(--color-ink)]">
                          {dict.dashboard.admin.students.importWizard.title}
                        </h3>
                        <p className="text-sm text-[var(--color-ink-secondary)] mt-1">
                          {locale === "ar" ? `الخطوة ${wizardStep} من 4` : `Step ${wizardStep} of 4`}
                        </p>
                      </div>
                     <button
                       onClick={closeWizard}
                       className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                     >
                       <X className="h-5 w-5" />
                     </button>
                   </div>

                   {/* Step Indicator */}
                   <div className="mb-6">
                     <div className="flex items-center justify-between">
                       {[1, 2, 3, 4].map((step) => (
                         <div key={step} className="flex items-center flex-1">
                           <div
                             className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                               step < wizardStep
                                 ? 'bg-[var(--color-accent)] text-white'
                                 : step === wizardStep
                                 ? 'bg-[var(--color-accent)] text-white'
                                 : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]'
                             }`}
                           >
                             {step < wizardStep ? <Check className="h-4 w-4" /> : step}
                           </div>
                           {step < 4 && (
                             <div
                               className={`flex-1 h-0.5 mx-2 ${
                                 step < wizardStep ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                               }`}
                             />
                           )}
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Error message */}
                   {wizardError && (
                     <div className="mb-4 rounded-lg bg-red-50 p-3 text-base text-red-700 flex items-start gap-2">
                       <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                       <span>{wizardError}</span>
                     </div>
                   )}

                   {/* Step 1: File Upload */}
                   {wizardStep === 1 && (
                     <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-[var(--color-ink)] mb-1 text-lg">
                            {dict.dashboard.admin.students.importWizard.step1Title}
                          </h4>
                          <p className="text-sm text-[var(--color-ink-secondary)]">
                            {dict.dashboard.admin.students.importWizard.step1Desc}
                          </p>
                        </div>

                       <div className="text-base text-[var(--color-ink-secondary)]">
                         <p className="mb-2 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "تنسيقات مقبولة:" : "Accepted formats:"}</p>
                         <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                          <li>CSV (.csv)</li>
                          <li>Excel (.xlsx, .xls)</li>
                          <li>ODS (.ods)</li>
                        </ul>
                        <p className="mb-2 font-semibold text-[var(--color-ink)]">{locale === "ar" ? "العمود المطلوب:" : "Required column:"}</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><code>الاسم</code> {locale === "ar" ? "- الاسم بالعربية" : "- Arabic name"}</li>
                        </ul>
                      </div>

                      <div className="rounded-lg border-2 border-dashed border-[var(--color-border)] p-4 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv,.xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.oasis.opendocument.spreadsheet';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const validTypes = ['.csv', '.xlsx', '.xls', '.ods'];
                              const validMimes = [
                                'text/csv',
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                'application/vnd.ms-excel',
                                'application/vnd.oasis.opendocument.spreadsheet'
                              ];
                              const fileName = file.name.toLowerCase();
                              const isValidType = validTypes.some(ext => fileName.endsWith(ext)) || 
                                                 validMimes.includes(file.type);
                              
                              if (!isValidType) {
                                setWizardError(locale === "ar" ? "نوع الملف غير مدعوم. يرجى استخدام CSV أو Excel أو ODS." : "Unsupported file type. Please use CSV, Excel, or ODS.");
                                return;
                              }
                              setCsvFile(file);
                              setWizardError(null);
                            }
                          };
                          input.click();
                        }}
                      >
                        {csvFile ? (
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-accent)]">{csvFile.name}</p>
                            <p className="text-xs text-[var(--color-ink-secondary)]">{locale === "ar" ? "اضغط لتغيير" : "Click to change"}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{locale === "ar" ? "اختر ملف CSV أو Excel" : "Select CSV or Excel file"}</p>
                            <p className="text-xs text-[var(--color-ink-secondary)]">{locale === "ar" ? "أو اسحب وأفلت" : "or drag & drop"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Student Details */}
                   {wizardStep === 2 && (
                     <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-[var(--color-ink)] mb-1 text-lg">
                            {dict.dashboard.admin.students.importWizard.step2Title}
                          </h4>
                          <p className="text-sm text-[var(--color-ink-secondary)]">
                            {dict.dashboard.admin.students.importWizard.step2Desc}
                          </p>
                        </div>

                       <div className="space-y-3 max-h-96 overflow-y-auto">
                         {importStudents.map((student, idx) => (
                           <div key={idx} className="border border-[var(--color-border)] rounded-lg p-3 space-y-2">
                             <div className="flex items-center justify-between mb-2">
                               <p className="text-sm font-semibold text-[var(--color-ink)]">#{idx + 1}</p>
                               <p className="text-sm text-[var(--color-ink-secondary)]">{student.name_ar}</p>
                             </div>

                             {/* Email field */}
                             <div>
                               <label className="text-sm font-semibold text-[var(--color-ink-secondary)] block mb-1">
                                 {locale === "ar" ? dict.dashboard.admin.students.email : dict.dashboard.admin.students.email}
                               </label>
                               <div className="flex gap-1">
                                 <input
                                   type="email"
                                   value={student.email}
                                   onChange={(e) => updateStudent(idx, { email: e.target.value })}
                                   className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                 />
                                 <button
                                   type="button"
                                   onClick={() => regenerateEmail(idx)}
                                   className="px-2 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                   title={locale === "ar" ? "توليد تلقائي" : "Auto-generate"}
                                 >
                                   <RefreshCw className="h-4 w-4 text-[var(--color-ink-secondary)]" />
                                 </button>
                               </div>
                             </div>

                             {/* English name field */}
                             <div>
                               <label className="text-sm font-semibold text-[var(--color-ink-secondary)] block mb-1">
                                 {locale === "ar" ? dict.dashboard.admin.students.nameEn : dict.dashboard.admin.students.nameEn}
                               </label>
                               <input
                                 type="text"
                                 value={student.name_en}
                                onChange={(e) => updateStudent(idx, { name_en: e.target.value })}
                                placeholder={locale === "ar" ? "e.g. Noura Khalid" : "e.g. Noura Khalid"}
                                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                              />
                            </div>

                            {/* Password field */}
                            <div>
                              <label className="text-xs font-semibold text-[var(--color-ink-secondary)] block mb-1">
                                {locale === "ar" ? dict.dashboard.admin.students.password : dict.dashboard.admin.students.password}
                              </label>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={student.password}
                                  onChange={(e) => updateStudent(idx, { password: e.target.value })}
                                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => regeneratePassword(idx)}
                                  className="px-2 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                  title={locale === "ar" ? "توليد" : "Generate"}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-[var(--color-ink-secondary)]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Section Assignment */}
                   {wizardStep === 3 && (
                     <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-[var(--color-ink)] mb-1 text-lg">
                            {dict.dashboard.admin.students.importWizard.step3Title}
                          </h4>
                          <p className="text-sm text-[var(--color-ink-secondary)]">
                            {dict.dashboard.admin.students.importWizard.step3Desc}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-[var(--color-ink-secondary)] block mb-2">
                            {dict.dashboard.admin.students.assignedSection}
                          </label>
                         <select
                           value={importStudents[0]?.section_id || ""}
                           onChange={(e) => {
                             const sectionId = e.target.value;
                             setImportStudents(prev => prev.map(s => ({ ...s, section_id: sectionId })));
                           }}
                           className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                          >
                            <option value="">{dict.dashboard.admin.students.importWizard.selectSection}</option>
                            {studentsData.sections.map(section => (
                              <option key={section.id} value={section.id}>
                                {formatSection(section, locale)}
                              </option>
                           ))}
                         </select>
                       </div>

                       <p className="text-sm text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] p-3 rounded-lg">
                         {locale === "ar" 
                           ? `سيتم تعيين جميع الـ ${importStudents.length} طالب/ة للفصل المحدد`
                           : `All ${importStudents.length} students will be assigned to the selected section`}
                       </p>
                     </div>
                   )}

                   {/* Step 4: Review & Confirm */}
                   {wizardStep === 4 && (
                     <div className="space-y-4">
                       <div>
                         <h4 className="font-semibold text-[var(--color-ink)] mb-1 text-lg">
                           {locale === "ar" ? dict.dashboard.admin.students.importWizard.step4Title : dict.dashboard.admin.students.importWizard.step4Title}
                         </h4>
                         <p className="text-sm text-[var(--color-ink-secondary)]">
                           {locale === "ar" ? dict.dashboard.admin.students.importWizard.step4Desc : dict.dashboard.admin.students.importWizard.step4Desc}
                         </p>
                      </div>

                       <div className="space-y-3 max-h-96 overflow-y-auto">
                         {importStudents.map((student, idx) => (
                           <div key={idx} className="border border-[var(--color-border)] rounded-lg p-3">
                             <div className="grid grid-cols-2 gap-2 text-sm">
                               <div>
                                 <p className="text-[var(--color-ink-secondary)] font-semibold">#{idx + 1}</p>
                                 <p className="text-[var(--color-ink)] font-medium">{student.name_ar}</p>
                               </div>
                               <div>
                                 <p className="text-[var(--color-ink-secondary)] font-semibold">{locale === "ar" ? "English" : "English"}</p>
                                 <p className="text-[var(--color-ink)]">{student.name_en}</p>
                               </div>
                               <div>
                                 <p className="text-[var(--color-ink-secondary)] font-semibold">{locale === "ar" ? dict.dashboard.admin.students.email : dict.dashboard.admin.students.email}</p>
                                 <p className="text-[var(--color-ink)] break-all text-sm">{student.email}</p>
                               </div>
                               <div>
                                 <p className="text-[var(--color-ink-secondary)] font-semibold">{locale === "ar" ? dict.dashboard.admin.students.password : dict.dashboard.admin.students.password}</p>
                                 <p className="text-[var(--color-ink)] font-mono text-xs">{student.password}</p>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2 mt-6 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={closeWizard}
                      className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                      {locale === "ar" ? dict.dashboard.admin.students.importWizard.cancelButton : dict.dashboard.admin.students.importWizard.cancelButton}
                    </button>

                    {wizardStep > 1 && (
                      <button
                        onClick={() => setWizardStep(wizardStep - 1)}
                        disabled={csvImporting}
                        className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                      >
                        {locale === "ar" ? dict.dashboard.admin.students.importWizard.prevButton : dict.dashboard.admin.students.importWizard.prevButton}
                      </button>
                    )}

                    {wizardStep < 4 ? (
                      <button
                        onClick={() => {
                          if (wizardStep === 1) {
                            handleFileUpload();
                          } else if (wizardStep === 2) {
                            if (validateStep2()) setWizardStep(3);
                          } else if (wizardStep === 3) {
                            if (validateStep3()) setWizardStep(4);
                          }
                        }}
                        disabled={csvImporting || (wizardStep === 1 && !csvFile)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {csvImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {locale === "ar" ? dict.dashboard.admin.students.importWizard.nextButton : dict.dashboard.admin.students.importWizard.nextButton}
                      </button>
                    ) : (
                      <button
                        onClick={handleWizardSubmit}
                        disabled={csvImporting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {csvImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {locale === "ar" ? dict.dashboard.admin.students.importWizard.confirmButton : dict.dashboard.admin.students.importWizard.confirmButton}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
         </div>
       )}
     </main>
   );
 }
