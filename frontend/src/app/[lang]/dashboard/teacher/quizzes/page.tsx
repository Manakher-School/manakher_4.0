"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import {
  ClipboardList, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp,
  BarChart2, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDisplayName } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  grade_ar: string;
  grade_en: string;
  section_ar: string;
  section_en: string;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit: number;
  teacher: string;
  section: string;
  subject: string;
  opens_at: string;
  closes_at: string;
  created: string;
  expand?: { section?: Section; subject?: Subject };
}

interface Question {
  id: string;
  quiz: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Attempt {
  id: string;
  quiz: string;
  student: string;
  answers: Record<string, number>;
  score: number;
  total_questions: number;
  submitted_at: string;
  expand?: { student?: { id: string; name_ar: string; name_en: string; email: string } };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_QUIZ = {
  title: "",
  description: "",
  time_limit: 30,
  section: "",
  subject: "",
  opens_at: "",
  closes_at: "",
};

const EMPTY_QUESTION = {
  question_text: "",
  options: ["", "", "", ""],
  correct_answer: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherQuizzesPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.dashboard.teacher.quizzes;
  const common = dict.common;

  // Lists
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz form
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState({ ...EMPTY_QUIZ });
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Expanded quiz panel: "questions" | "results" | null
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<"questions" | "results" | null>(null);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Results / attempts
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const sectionName = (s: Section) =>
    locale === "ar" ? `${s.grade_ar} — ${s.section_ar}` : `${s.grade_en} — ${s.section_en}`;
  const subjectName = (s: Subject) => (locale === "ar" ? s.name_ar : s.name_en);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sectionIds: string[] = (user as any).sections ?? [];

    try {
      const [secs, subs, qzs] = await Promise.all([
        sectionIds.length > 0
          ? pb.collection("class_sections").getFullList<Section>({
              filter: sectionIds.map((id) => `id = "${id}"`).join(" || "),
              sort: "grade_order,section_ar",
            })
          : Promise.resolve([] as Section[]),
        pb.collection("subjects").getFullList<Subject>({ sort: "name_ar" }),
        pb.collection("quizzes").getFullList<Quiz>({
          filter: `teacher = "${user.id}"`,
          sort: "-created",
          expand: "section,subject",
        }),
      ]);
      setSections(secs);
      setSubjects(subs);
      setQuizzes(qzs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Quiz CRUD ───────────────────────────────────────────────────────────────

  function openCreateQuiz() {
    setQuizForm({ ...EMPTY_QUIZ });
    setEditingQuizId(null);
    setShowQuizForm(true);
  }

  function openEditQuiz(q: Quiz) {
    setQuizForm({
      title: q.title,
      description: q.description ?? "",
      time_limit: q.time_limit,
      section: q.section,
      subject: q.subject,
      opens_at: q.opens_at ? q.opens_at.slice(0, 16) : "",
      closes_at: q.closes_at ? q.closes_at.slice(0, 16) : "",
    });
    setEditingQuizId(q.id);
    setShowQuizForm(true);
  }

  async function saveQuiz() {
    if (!user || !quizForm.title || !quizForm.section || !quizForm.subject || !quizForm.time_limit) return;
    
    // If creating a new quiz, warn that questions are required
     if (!editingQuizId) {
       const confirmMsg = locale === "ar" 
         ? "تذكري: يجب إضافة سؤال واحد على الأقل بعد حفظ الاختبار. هل تريدين المتابعة؟"
         : "Remember: You must add at least one question after saving the quiz. Continue?";
       if (!(await confirm(confirmMsg))) return;
     }
    
    setSavingQuiz(true);
    const pb = getPocketBase();
    try {
      const payload = { ...quizForm, teacher: user.id };
      let quizId: string;
      
      if (editingQuizId) {
        await pb.collection("quizzes").update(editingQuizId, payload);
        quizId = editingQuizId;
      } else {
        const newQuiz = await pb.collection("quizzes").create(payload);
        quizId = newQuiz.id;
      }
      
      setShowQuizForm(false);
      await load();
      
      // If new quiz, auto-expand questions panel and prompt to add question
      if (!editingQuizId) {
        setExpandedQuiz(quizId);
        setExpandedPanel("questions");
        setQuestions([]);
        setShowQuestionForm(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingQuiz(false);
    }
  }

  async function deleteQuiz(id: string) {
    if (!(await confirm(t.confirmDelete))) return;
    const pb = getPocketBase();
    await pb.collection("quizzes").delete(id);
    await load();
  }

  // ── Panel toggle ────────────────────────────────────────────────────────────

  async function togglePanel(quizId: string, panel: "questions" | "results") {
    if (expandedQuiz === quizId && expandedPanel === panel) {
      setExpandedQuiz(null);
      setExpandedPanel(null);
      return;
    }
    setExpandedQuiz(quizId);
    setExpandedPanel(panel);
    setShowQuestionForm(false);

    if (panel === "questions") {
      setLoadingQuestions(true);
      const pb = getPocketBase();
      try {
        const qs = await pb.collection("quiz_questions").getFullList<Question>({
          filter: `quiz = "${quizId}"`,
          sort: "order,created",
        });
        setQuestions(qs);
      } catch (e) { console.error(e); }
      finally { setLoadingQuestions(false); }
    } else {
      setLoadingAttempts(true);
      const pb = getPocketBase();
      try {
        const ats = await pb.collection("quiz_attempts").getFullList<Attempt>({
          filter: `quiz = "${quizId}"`,
          sort: "-submitted_at",
          expand: "student",
        });
        setAttempts(ats);
      } catch (e) { console.error(e); }
      finally { setLoadingAttempts(false); }
    }
  }

  // ── Question CRUD ───────────────────────────────────────────────────────────

  async function saveQuestion() {
    if (!expandedQuiz || !questionForm.question_text) return;
    const filtered = questionForm.options.map((o) => o.trim()).filter(Boolean);
    if (filtered.length < 2) return;
    setSavingQuestion(true);
    const pb = getPocketBase();
    try {
      await pb.collection("quiz_questions").create({
        quiz: expandedQuiz,
        question_text: questionForm.question_text,
        options: filtered,
        correct_answer: Math.min(questionForm.correct_answer, filtered.length - 1),
        order: questions.length + 1,
      });
      setShowQuestionForm(false);
      setQuestionForm({ ...EMPTY_QUESTION });
      // reload questions
      const qs = await pb.collection("quiz_questions").getFullList<Question>({
        filter: `quiz = "${expandedQuiz}"`,
        sort: "order,created",
      });
      setQuestions(qs);
    } catch (e) { console.error(e); }
    finally { setSavingQuestion(false); }
  }

  async function deleteQuestion(id: string) {
    if (!(await confirm(t.deleteQuestion + "?"))) return;
    const pb = getPocketBase();
    await pb.collection("quiz_questions").delete(id);
    if (expandedQuiz) {
      const qs = await pb.collection("quiz_questions").getFullList<Question>({
        filter: `quiz = "${expandedQuiz}"`,
        sort: "order,created",
      });
      setQuestions(qs);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>
        <Button variant="primary" onClick={openCreateQuiz}>
          <Plus className="h-4 w-4" />
          {t.add}
        </Button>
      </div>

      {/* Quiz create/edit form */}
      {showQuizForm && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[var(--color-ink)]">
              {editingQuizId ? t.editTitle : t.add}
            </h3>
            <button onClick={() => setShowQuizForm(false)} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t.quizTitle}
                value={quizForm.title}
                onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t.phTitle}
              />
            </div>
            {/* Section */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSection}</label>
              <select
                value={quizForm.section}
                onChange={(e) => setQuizForm((f) => ({ ...f, section: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option value="">—</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{sectionName(s)}</option>)}
              </select>
            </div>
            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.selectSubject}</label>
              <select
                value={quizForm.subject}
                onChange={(e) => setQuizForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option value="">—</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{subjectName(s)}</option>)}
              </select>
            </div>
            {/* Time limit */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.timeLimit}</label>
              <input
                type="number"
                min={1}
                max={180}
                value={quizForm.time_limit}
                onChange={(e) => setQuizForm((f) => ({ ...f, time_limit: Number(e.target.value) }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            {/* Opens at */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.opensAt}</label>
              <input
                type="datetime-local"
                value={quizForm.opens_at}
                onChange={(e) => setQuizForm((f) => ({ ...f, opens_at: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
            {/* Closes at */}
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">{t.closesAt}</label>
              <input
                type="datetime-local"
                value={quizForm.closes_at}
                onChange={(e) => setQuizForm((f) => ({ ...f, closes_at: e.target.value }))}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowQuizForm(false)}>{common.cancel}</Button>
            <Button variant="primary" onClick={saveQuiz} disabled={savingQuiz}>
              {savingQuiz ? common.loading : common.save}
            </Button>
          </div>
        </div>
      )}

      {/* Quiz list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const sec = quiz.expand?.section;
            const sub = quiz.expand?.subject;
            const isQOpen = expandedQuiz === quiz.id && expandedPanel === "questions";
            const isROpen = expandedQuiz === quiz.id && expandedPanel === "results";
            const now = new Date();
            const opensAt = quiz.opens_at ? new Date(quiz.opens_at) : null;
            const closesAt = quiz.closes_at ? new Date(quiz.closes_at) : null;
            const status: "upcoming" | "open" | "closed" =
              opensAt && now < opensAt
                ? "upcoming"
                : closesAt && now > closesAt
                ? "closed"
                : "open";

            return (
              <div
                key={quiz.id}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
              >
                {/* Quiz header row */}
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                      style={{ background: "var(--color-role-teacher-bg)", color: "var(--color-role-teacher-bold)" }}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{quiz.title}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        {sec && <span>{sectionName(sec)}</span>}
                        {sub && <span>· {subjectName(sub)}</span>}
                        <span>· {quiz.time_limit} {t.minutes}</span>
                        <Badge variant={status === "open" ? "accent" : "default"} className="text-[10px] px-1.5 py-0">
                          {status === "upcoming" ? "upcoming" : status === "closed" ? "closed" : "open"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <button
                      onClick={() => togglePanel(quiz.id, "questions")}
                      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      {t.questions}
                      {isQOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => togglePanel(quiz.id, "results")}
                      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <BarChart2 className="h-3 w-3" />
                      {t.results}
                      {isROpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => openEditQuiz(quiz)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Questions panel */}
                {isQOpen && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] p-4 space-y-4">
                    {loadingQuestions ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Question list */}
                        {questions.length === 0 ? (
                          <p className="text-sm text-[var(--color-ink-secondary)]">{t.noQuestions}</p>
                        ) : (
                          <div className="space-y-2">
                            {questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-3 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                                    {idx + 1}. {q.question_text}
                                  </p>
                                  <button
                                    onClick={() => deleteQuestion(q.id)}
                                    className="shrink-0 p-1 rounded-[var(--radius-md)] text-[var(--color-ink-secondary)] hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <ul className="grid grid-cols-2 gap-1">
                                  {q.options.map((opt, oi) => (
                                    <li
                                      key={oi}
                                      className={[
                                        "text-xs rounded-[var(--radius-md)] px-2 py-1 flex items-center gap-1.5",
                                        oi === q.correct_answer
                                          ? "bg-green-50 text-green-700 font-semibold"
                                          : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]",
                                      ].join(" ")}
                                    >
                                      {oi === q.correct_answer && <CheckCircle className="h-3 w-3 shrink-0" />}
                                      {opt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add question form */}
                        {showQuestionForm ? (
                          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-black text-[var(--color-ink)]">{t.addQuestion}</p>
                              <button
                                onClick={() => setShowQuestionForm(false)}
                                className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {/* Question text */}
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-[var(--color-ink)]">{t.questionText}</label>
                              <textarea
                                rows={2}
                                value={questionForm.question_text}
                                onChange={(e) => setQuestionForm((f) => ({ ...f, question_text: e.target.value }))}
                                placeholder={t.phQuestionText}
                                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                              />
                            </div>
                            {/* Options */}
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-[var(--color-ink)]">{t.options}</label>
                              {questionForm.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="correct_answer"
                                    checked={questionForm.correct_answer === oi}
                                    onChange={() => setQuestionForm((f) => ({ ...f, correct_answer: oi }))}
                                    className="accent-[var(--color-accent)]"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const opts = [...questionForm.options];
                                      opts[oi] = e.target.value;
                                      setQuestionForm((f) => ({ ...f, options: opts }));
                                    }}
                                    placeholder={`${t.option} ${oi + 1}`}
                                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                  />
                                </div>
                              ))}
                              <p className="text-[10px] text-[var(--color-ink-secondary)]">
                                {locale === "ar" ? "اختاري الخيار الصحيح بالنقر على الدائرة" : "Select the correct answer using the radio button"}
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" onClick={() => setShowQuestionForm(false)}>{common.cancel}</Button>
                              <Button variant="primary" onClick={saveQuestion} disabled={savingQuestion}>
                                {savingQuestion ? "..." : t.saveQuestion}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="ghost" onClick={() => { setShowQuestionForm(true); setQuestionForm({ ...EMPTY_QUESTION }); }}>
                            <Plus className="h-4 w-4" />
                            {t.addQuestion}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Results panel */}
                {isROpen && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] p-4 space-y-3">
                    {loadingAttempts ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 rounded-full border-2 border-[var(--color-role-teacher-bold)] border-t-transparent animate-spin" />
                      </div>
                    ) : attempts.length === 0 ? (
                      <p className="text-sm text-[var(--color-ink-secondary)]">{t.noResults}</p>
                    ) : (
                      <div className="space-y-2">
                        {attempts.map((att) => {
                          const student = att.expand?.student;
                          const pct = att.total_questions > 0
                            ? Math.round((att.score / att.total_questions) * 100)
                            : 0;
                          return (
                            <div
                              key={att.id}
                              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-3 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[var(--color-ink)]">
                                  {student ? getDisplayName(student as any, locale) : att.student}
                                </p>
                                <p className="text-xs text-[var(--color-ink-secondary)]">
                                  {att.submitted_at ? att.submitted_at.slice(0, 16).replace("T", " ") : "—"}
                                </p>
                              </div>
                              <div className="text-end shrink-0">
                                <p className="text-sm font-black text-[var(--color-ink)]">
                                  {att.score} / {att.total_questions}
                                </p>
                                <p className={[
                                  "text-xs font-bold",
                                  pct >= 60 ? "text-green-600" : "text-red-500",
                                ].join(" ")}>
                                  {pct}%
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
