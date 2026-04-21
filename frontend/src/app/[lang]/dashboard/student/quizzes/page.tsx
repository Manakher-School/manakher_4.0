"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { getTextDirection } from "@/lib/text-direction";
import { ClipboardList, Clock, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCrudState } from "@/lib/hooks";

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
}

// ─── Quiz status helper ───────────────────────────────────────────────────────

type QuizStatus = "upcoming" | "open" | "closed";

function getQuizStatus(quiz: Quiz): QuizStatus {
  const now = new Date();
  const opens = quiz.opens_at ? new Date(quiz.opens_at) : null;
  const closes = quiz.closes_at ? new Date(quiz.closes_at) : null;
  if (opens && now < opens) return "upcoming";
  if (closes && now > closes) return "closed";
  return "open";
}

// ─── Countdown component ──────────────────────────────────────────────────────

function Countdown({
  endTime,
  onExpire,
}: {
  endTime: Date;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000))
  );
  const called = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && !called.current) {
        called.current = true;
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isWarning = remaining < 60;

  return (
    <span className={["font-black tabular-nums", isWarning ? "text-red-500" : "text-[var(--color-ink)]"].join(" ")}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentQuizzesPage() {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { alert, confirm } = useDialog();
  const t = dict.dashboard.student.quizzes;

  // Quiz list state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const listCrudState = useCrudState();
  // Map: quizId -> attempt (null if not attempted)
  const [attemptMap, setAttemptMap] = useState<Record<string, Attempt | null>>({});

  // Active quiz-taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const quizCrudState = useCrudState();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [quizEndTime, setQuizEndTime] = useState<Date | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null);

  const subjectName = (s: Subject) => (locale === "ar" ? s.name_ar : s.name_en);

  // ── Load quizzes ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return;
    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];

    if (sections.length === 0) {
      listCrudState.setIsLoading(false);
      return;
    }

    try {
      listCrudState.setIsLoading(true);
      const sectionFilter = sections.map((id) => `section = "${id}"`).join(" || ");
      const qzs = await pb.collection("quizzes").getFullList<Quiz>({
        filter: sectionFilter,
        sort: "-created",
        expand: "section,subject",
      });
      setQuizzes(qzs);

      // Load all attempts for this student for these quizzes
      if (qzs.length > 0) {
        const quizFilter = qzs.map((q) => `quiz = "${q.id}"`).join(" || ");
        const ats = await pb.collection("quiz_attempts").getFullList<Attempt>({
          filter: `student = "${user.id}" && (${quizFilter})`,
        });
        const map: Record<string, Attempt | null> = {};
        qzs.forEach((q) => { map[q.id] = null; });
        ats.forEach((a) => { map[a.quiz] = a; });
        setAttemptMap(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      listCrudState.setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ── Monitor quiz close time during taking ──────────────────────────────────
  useEffect(() => {
    if (!activeQuiz || completedAttempt) return;
    
    const closes = activeQuiz.closes_at ? new Date(activeQuiz.closes_at) : null;
    if (!closes) return;
    
    // Check every 5 seconds if quiz has closed
    const interval = setInterval(() => {
      const now = new Date();
       if (now > closes && !completedAttempt) {
          clearInterval(interval);
          (async () => {
            await alert(locale === "ar" 
              ? "انتهى وقت الاختبار! سيتم إرسال إجاباتك تلقائياً." 
              : "Quiz time is up! Your answers will be submitted automatically.");
            submitQuiz(answers);
          })();
       }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeQuiz, completedAttempt, answers, locale]);

  // ── Auto-refresh quiz status every 30 seconds (to update badges) ───────────
  const [, setTick] = useState(0);
  useEffect(() => {
    // Only run when viewing the quiz list (not taking a quiz)
    if (activeQuiz) return;
    
    const interval = setInterval(() => {
      setTick((t) => t + 1); // Force re-render to update getQuizStatus() results
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeQuiz]);

  // ── Start quiz ───────────────────────────────────────────────────────────────

  async function startQuiz(quiz: Quiz) {
    // CRITICAL: Enforce open/close time before starting
    const now = new Date();
    const opens = quiz.opens_at ? new Date(quiz.opens_at) : null;
    const closes = quiz.closes_at ? new Date(quiz.closes_at) : null;
    
     if (opens && now < opens) {
       await alert(locale === "ar" 
         ? "هذا الاختبار لم يفتح بعد. يرجى الانتظار حتى وقت الفتح." 
         : "This quiz is not open yet. Please wait until the opening time.");
       return;
     }
     
     if (closes && now > closes) {
       await alert(locale === "ar" 
         ? "انتهى وقت هذا الاختبار. لم يعد بإمكانك المشاركة." 
         : "This quiz has closed. You can no longer participate.");
      // Refresh the quiz list to update status badges
      load();
      return;
    }
    
    quizCrudState.setIsLoading(true);
    setActiveQuiz(quiz);
    setAnswers({});
    setCurrentQ(0);
    setCompletedAttempt(null);

    const pb = getPocketBase();
    try {
      const qs = await pb.collection("quiz_questions").getFullList<Question>({
        filter: `quiz = "${quiz.id}"`,
        sort: "order,created",
      });
      setQuestions(qs);
      
      // Calculate end time: minimum of (time_limit from now) and (quiz closes_at)
      const timeLimitEnd = new Date(Date.now() + quiz.time_limit * 60 * 1000);
      const effectiveEndTime = closes && closes < timeLimitEnd ? closes : timeLimitEnd;
      setQuizEndTime(effectiveEndTime);
    } catch (e) {
      console.error(e);
      setActiveQuiz(null);
    } finally {
      quizCrudState.setIsLoading(false);
    }
  }

  // ── Submit quiz ──────────────────────────────────────────────────────────────

  async function submitQuiz(forceAnswers?: Record<string, number>) {
    if (!activeQuiz || !user || quizCrudState.state.isLoading) return;
    const finalAnswers = forceAnswers ?? answers;
    quizCrudState.setIsLoading(true);

    // Auto-grade: count correct answers
    let score = 0;
    questions.forEach((q) => {
      if (finalAnswers[q.id] === q.correct_answer) score++;
    });

    const pb = getPocketBase();
    try {
      const attempt = await pb.collection("quiz_attempts").create<Attempt>({
        quiz: activeQuiz.id,
        student: user.id,
        answers: finalAnswers,
        score,
        total_questions: questions.length,
        started_at: quizEndTime
          ? new Date(quizEndTime.getTime() - activeQuiz.time_limit * 60 * 1000).toISOString()
          : new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      });
      setCompletedAttempt(attempt);
      setAttemptMap((prev) => ({ ...prev, [activeQuiz.id]: attempt }));
    } catch (e) {
      console.error(e);
    } finally {
      quizCrudState.setIsLoading(false);
    }
  }

  function handleTimerExpire() {
    submitQuiz(answers);
  }

  function handleSubmitClick() {
    (async () => {
      if (!(await confirm(t.confirmSubmit))) return;
      submitQuiz();
    })();
  }

  // ── Quiz-taking view ─────────────────────────────────────────────────────────

  if (activeQuiz) {
    // Show score after submission
    if (completedAttempt) {
      const pct = completedAttempt.total_questions > 0
        ? Math.round((completedAttempt.score / completedAttempt.total_questions) * 100)
        : 0;
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: pct >= 60 ? "#dcfce7" : "#fee2e2" }}
          >
            <CheckCircle className={pct >= 60 ? "h-10 w-10 text-green-600" : "h-10 w-10 text-red-500"} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[var(--color-ink)]">{t.result}</h2>
            <p className="text-5xl font-black" style={{ color: pct >= 60 ? "#16a34a" : "#dc2626" }}>
              {pct}%
            </p>
            <p className="text-[var(--color-ink-secondary)] text-sm">
              {completedAttempt.score} {t.outOf} {completedAttempt.total_questions}
            </p>
          </div>
          <Button
             variant="primary"
             onClick={() => { setActiveQuiz(null); setCompletedAttempt(null); }}
             aria-label={locale === "ar" ? "العودة إلى الاختبارات" : "Back to Quizzes"}
           >
             {locale === "ar" ? "العودة إلى الاختبارات" : "Back to Quizzes"}
           </Button>
        </div>
      );
    }

    // Loading questions
    if (quizCrudState.state.isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
        </div>
      );
    }

    const q = questions[currentQ];
    const totalQ = questions.length;

    return (
      <div className="max-w-2xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
        {/* Quiz header */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-[var(--color-ink)] text-lg">{activeQuiz.title}</h2>
              <p className="text-sm text-[var(--color-ink-secondary)] font-semibold mt-0.5">
                {t.question} {currentQ + 1} {t.of} {totalQ}
              </p>
            </div>
            <div className="text-end shrink-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-secondary)]">
                <Clock className="h-4 w-4" />
                {t.timeRemaining}
              </div>
              {quizEndTime && (
                <Countdown endTime={quizEndTime} onExpire={handleTimerExpire} />
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-role-student-bold)] transition-all"
              style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        {q && (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-6">
            <p 
              className="text-base font-bold text-[var(--color-ink)] leading-relaxed"
              dir={getTextDirection(q.question_text)}
            >
              {q.question_text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    className={[
                      "w-full flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] border transition-all text-sm font-semibold",
                      selected
                        ? "border-[var(--color-role-student-bold)] bg-[var(--color-role-student-bg)] text-[var(--color-role-student-bold)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] hover:border-[var(--color-role-student-bold)] hover:bg-[var(--color-role-student-bg)]",
                    ].join(" ")}
                    dir={getTextDirection(opt)}
                  >
                    <span className="font-bold shrink-0">{String.fromCharCode(65 + oi)}.</span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

         {/* Navigation */}
         <div className="flex items-center justify-between gap-3">
           <Button
             variant="ghost"
             onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
             disabled={currentQ === 0}
             aria-label={locale === "ar" ? "السابق" : "Previous"}
           >
             {locale === "ar" ? "السابق" : "Previous"}
           </Button>
           <span className="text-xs text-[var(--color-ink-secondary)] font-semibold">
             {Object.keys(answers).length} / {totalQ} {locale === "ar" ? "أُجيب عليها" : "answered"}
           </span>
           {currentQ < totalQ - 1 ? (
             <Button
               variant="primary"
               onClick={() => setCurrentQ((c) => c + 1)}
               aria-label={locale === "ar" ? "التالي" : "Next"}
             >
               {locale === "ar" ? "التالي" : "Next"}
             </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmitClick}
                disabled={quizCrudState.state.isLoading}
                aria-label={quizCrudState.state.isLoading ? t.submitting : t.submit}
              >
                {quizCrudState.state.isLoading ? t.submitting : t.submit}
              </Button>
            )}
         </div>
      </div>
    );
  }

  // ── Quiz list view ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
        {t.title}
      </h2>

      {listCrudState.state.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-role-student-bold)] border-t-transparent animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <p className="text-[var(--color-ink-secondary)] text-sm">{t.empty}</p>
      ) : (
        <div className="space-y-5">
          {quizzes.map((quiz) => {
            const sub = quiz.expand?.subject;
            const status = getQuizStatus(quiz);
            const attempt = attemptMap[quiz.id];
            const hasAttempted = attempt !== null && attempt !== undefined;

            const statusBadgeLabel = {
              upcoming: locale === "ar" ? "قادم" : "Upcoming",
              open: locale === "ar" ? "مفتوح" : "Open",
              closed: locale === "ar" ? "مغلق" : "Closed",
            }[status];

            return (
              <div
                key={quiz.id}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                      style={{
                        background: status === "open" ? "var(--color-role-student-bg)" : "var(--color-surface-sunken)",
                        color: status === "open" ? "var(--color-role-student-bold)" : "var(--color-ink-secondary)",
                      }}
                    >
                      {status === "closed" || hasAttempted
                        ? <Lock className="h-4 w-4" />
                        : <ClipboardList className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{quiz.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-[var(--color-ink-secondary)] font-semibold">
                        {sub && <span>{subjectName(sub)}</span>}
                        <span>· {quiz.time_limit} {t.minutes}</span>
                        {quiz.opens_at && (
                          <span>· {t.opensAt}: {quiz.opens_at.slice(0, 16).replace("T", " ")}</span>
                        )}
                        {quiz.closes_at && (
                          <span>· {t.closesAt}: {quiz.closes_at.slice(0, 16).replace("T", " ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={status === "open" ? "accent" : "default"}>
                      {statusBadgeLabel}
                    </Badge>
                    {hasAttempted && attempt ? (
                      <div className="text-end">
                        <p className="text-xs font-semibold text-[var(--color-ink-secondary)]">
                          {locale === "ar" ? "نتيجتك:" : "Your score:"}
                        </p>
                        <p className={[
                          "text-sm font-black",
                          (attempt.score / Math.max(1, attempt.total_questions)) >= 0.6
                            ? "text-green-600"
                            : "text-red-500",
                        ].join(" ")}>
                          {attempt.score}/{attempt.total_questions}
                        </p>
                      </div>
                    ) : status === "open" ? (
                       <Button
                         variant="primary"
                         onClick={() => startQuiz(quiz)}
                         aria-label={`${t.startQuiz} ${quiz.title}`}
                       >
                         {t.startQuiz}
                       </Button>
                     ) : status === "upcoming" ? (
                      <span className="text-xs text-[var(--color-ink-disabled)]">{t.notOpen}</span>
                    ) : (
                      <span className="text-xs text-[var(--color-ink-disabled)]">{t.closed}</span>
                    )}
                  </div>
                </div>
                {/* Score bar for completed attempt */}
                {hasAttempted && attempt && (
                  <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-5 py-2 flex items-center gap-3">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100)}%`,
                          background: "var(--color-role-student-bold)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-ink-secondary)]">
                      {Math.round((attempt.score / Math.max(1, attempt.total_questions)) * 100)}%
                    </span>
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
