'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type {
  ContentBlock, Course, CourseStep,
  HeadingBlock, TextBlock, ImageBlock, VideoBlock, QuizBlock, QuizQuestion
} from '../../types/course';
import { QuizFlow } from './QuizFlow';
import { apiService } from '../../lib/apiService';
import { normalizeToSteps } from '../course-builder/utils';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface Props {
  course: Course;
  enrollmentId: string;
  campaignToken?: string;
  initialStep?: number;
  previewMode?: boolean;
}

type Phase = 'content' | 'quiz' | 'complete' | 'failed';

export function CoursePlayer({ course, enrollmentId, campaignToken, initialStep = 0, previewMode = false }: Props) {
  const router = useRouter();

  // Full-screen overlay — Esc exits
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  const steps: CourseStep[] = normalizeToSteps(course.content as unknown[]);
  const contentSteps = steps.filter((s) => !s.blocks.some((b) => b.type === 'quiz'));
  const quizSteps   = steps.filter((s) =>  s.blocks.some((b) => b.type === 'quiz'));
  const allQuestions: QuizQuestion[] = quizSteps.flatMap((s) =>
    s.blocks.filter((b) => b.type === 'quiz').flatMap((b) => (b as QuizBlock).questions)
  );

  const [stepIdx, setStepIdx] = useState(Math.min(initialStep, contentSteps.length - 1));
  const [phase, setPhase] = useState<Phase>('content');
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const totalTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = contentSteps[stepIdx];
  const isLastStep = stepIdx === contentSteps.length - 1;
  const hasQuiz = allQuestions.length > 0;
  const minSec = currentStep?.minTimeSeconds ?? 0;
  const [elapsed, setElapsed] = useState(0);

  // Per-step timer
  useEffect(() => {
    setElapsed(0);
    setMinTimeDone(minSec === 0);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setElapsed((e) => {
          const next = e + 1;
          if (next >= minSec) setMinTimeDone(true);
          return next;
        });
        totalTimeRef.current += 1;
      }
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [stepIdx, minSec]);

  // Auto-save progress every 30s (skip in preview)
  useEffect(() => {
    if (previewMode) return;
    const id = setInterval(() => {
      apiService.updateProgress(enrollmentId, {
        current_step: stepIdx,
        time_spent_sec: totalTimeRef.current
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [enrollmentId, stepIdx, previewMode]);

  // Save on step change (skip in preview)
  useEffect(() => {
    if (previewMode) return;
    apiService.updateProgress(enrollmentId, { current_step: stepIdx }).catch(() => {});
  }, [enrollmentId, stepIdx, previewMode]);

  // Background music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (course.background_music_url) {
      audioRef.current = new Audio(course.background_music_url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
    return () => { audioRef.current?.pause(); };
  }, [course.background_music_url]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      if (hasQuiz) { setPhase('quiz'); }
      else {
        if (previewMode) { setPhase('complete'); return; }
        apiService.submitQuiz(enrollmentId, {}, campaignToken)
          .then(() => setPhase('complete')).catch(() => {});
      }
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [isLastStep, hasQuiz, enrollmentId, campaignToken, previewMode]);

  const handlePrev = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }, [stepIdx]);

  const handleQuizSubmit = useCallback(async (answers: Record<string, string>) => {
    if (previewMode) {
      let correct = 0;
      allQuestions.forEach((q) => {
        if (answers[q.id] === q.correctOptionId) correct++;
      });
      const score = allQuestions.length > 0 ? Math.round((correct / allQuestions.length) * 100) : 100;
      const passed = score >= (course.passing_score ?? 70);
      setResult({ score, passed });
      setPhase(passed ? 'complete' : 'failed');
      return { score, passed };
    }
    const res = await apiService.submitQuiz(enrollmentId, answers, campaignToken);
    const { score, passed } = res.data.data;
    setResult({ score, passed });
    setPhase(passed ? 'complete' : 'failed');
    return { score, passed };
  }, [enrollmentId, campaignToken, previewMode, allQuestions, course.passing_score]);

  if (phase === 'complete' || phase === 'failed') {
    return <CompletionScreen score={result?.score} passed={phase === 'complete'} courseTitle={course.title} />;
  }

  if (phase === 'quiz') {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" dir="rtl">
        <button
          onClick={() => router.back()}
          title="לצאת (ESC)"
          className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/35 text-white text-xs font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          ESC
        </button>
        {previewMode && (
          <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 flex-shrink-0">
            👁 תצוגה מקדימה — כך ייראה המשתמש | הנתונים לא נשמרים
          </div>
        )}
        <StepProgressBar
          currentStep={contentSteps.length}
          totalSteps={contentSteps.length + 1}
          stepTitle="שאלון סיום"
          course={course}
        />
        <div className="flex-1 overflow-y-auto">
          <QuizFlow
            questions={allQuestions}
            passingScore={course.passing_score}
            onSubmit={handleQuizSubmit}
          />
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, minSec - elapsed);
  const canAdvance = minTimeDone;
  const totalSteps = contentSteps.length + (hasQuiz ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" dir="rtl">
      {/* Esc hint */}
      <button
        onClick={() => router.back()}
        title="לצאת (ESC)"
        className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/35 text-white text-xs font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        ESC
      </button>

      {previewMode && (
        <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 flex-shrink-0">
          👁 תצוגה מקדימה — כך ייראה המשתמש | הנתונים לא נשמרים
        </div>
      )}
      <StepProgressBar
        currentStep={stepIdx + 1}
        totalSteps={totalSteps}
        stepTitle={currentStep?.title}
        course={course}
        onStepClick={(i) => i < stepIdx && setStepIdx(i)}
        steps={contentSteps}
        activeIdx={stepIdx}
      />

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {(currentStep?.blocks ?? []).map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>

      {/* Navigation footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0 shadow-[0_-2px_12px_rgba(0,0,0,.06)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

          {/* Previous button */}
          <button
            onClick={handlePrev}
            disabled={stepIdx === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            הקודם
          </button>

          {/* Center: countdown OR step label */}
          <div className="flex flex-col items-center gap-1">
            {!canAdvance && minSec > 0 ? (
              <CountdownTimer remaining={remaining} total={minSec} />
            ) : (
              <div className="text-center">
                <p className="text-xs font-medium text-gray-500">
                  שלב {stepIdx + 1} מתוך {totalSteps}</p>
                <p className="text-xs text-gray-400 truncate max-w-xs">{currentStep?.title}</p>
              </div>
            )}
          </div>

          {/* Next / Finish button */}
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
              canAdvance
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300 hover:shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLastStep ? (hasQuiz ? 'לשאלון' : 'סיים') : 'הבא'}
            {!isLastStep && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </footer>

      {/* Floating step indicator (mobile-friendly) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 sm:hidden">
        <div className="flex gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow border border-gray-200">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === stepIdx
                  ? 'bg-blue-600 w-4'
                  : i < stepIdx
                  ? 'bg-blue-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Circular countdown timer ─────────────────────────────────────────────────
function CountdownTimer({ remaining, total }: { remaining: number; total: number }) {
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 0;
  const dashOffset = circ * (1 - progress);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#e5e7eb" strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={progress < 0.25 ? '#ef4444' : progress < 0.5 ? '#f59e0b' : '#3b82f6'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
          />
        </svg>
        {/* Countdown number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700 tabular-nums">{label}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500">שניות לפני המשך</p>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepProgressBar({
  currentStep,
  totalSteps,
  stepTitle,
  course,
  onStepClick,
  steps,
  activeIdx
}: {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  course: Course;
  onStepClick?: (i: number) => void;
  steps?: CourseStep[];
  activeIdx?: number;
}) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  const remaining = totalSteps - currentStep;
  const rightLabel =
    pct >= 100
      ? 'הושלמה ✓'
      : remaining === 1
      ? 'שלב אחד נותר'
      : remaining > 0
      ? `נותרו ${remaining} שלבים`
      : '';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{course.title}</h1>
          <span className="text-xs text-gray-500 flex-shrink-0">{rightLabel}</span>
        </div>

        {/* Main progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step dots — clickable for already-visited steps */}
        {steps && steps.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onStepClick?.(i)}
                disabled={i > (activeIdx ?? 0)}
                className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  i === activeIdx
                    ? 'bg-blue-600 text-white'
                    : i < (activeIdx ?? 0)
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >
                <span className="font-medium">{i + 1}</span>
                <span className="hidden sm:inline max-w-16 truncate">{s.title}</span>
              </button>
            ))}
            {/* Quiz dot */}
            <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              currentStep > steps.length ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <span>?</span>
              <span className="hidden sm:inline">שאלון</span>
            </div>
          </div>
        )}

        {stepTitle && (
          <p className="text-xs text-gray-500 mt-1">שלב {currentStep}: {stepTitle}</p>
        )}
      </div>
    </header>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────
function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock;
      const Tag = `h${b.level}` as 'h1' | 'h2' | 'h3';
      const sizes = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl' };
      return (
        <Tag className={`font-bold text-gray-900 ${sizes[b.level]} leading-snug`}
          style={{ textAlign: b.align ?? 'right' }}>
          {b.text}
        </Tag>
      );
    }
    case 'text': {
      const b = block as TextBlock;
      return (
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed" dir="rtl"
          dangerouslySetInnerHTML={{ __html: b.html }} />
      );
    }
    case 'image': {
      const b = block as ImageBlock;
      const w = b.width === 'medium' ? 'max-w-sm' : b.width === 'large' ? 'max-w-lg' : 'w-full';
      return (
        <div className={`${w} mx-auto`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.url} alt={b.alt ?? ''} className="w-full rounded-xl shadow-sm" />
          {b.caption && <p className="text-xs text-gray-500 text-center mt-2">{b.caption}</p>}
        </div>
      );
    }
    case 'video': {
      const b = block as VideoBlock;
      return (
        <div className="rounded-xl overflow-hidden shadow-sm bg-black">
          <ReactPlayer url={b.url} width="100%" height="360px" controls={true}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            playing={b.autoplay ?? false} {...({ config: { youtube: { playerVars: { rel: 0 } } } } as any)} />
          {b.caption && <p className="text-xs text-gray-500 text-center py-2 bg-gray-50">{b.caption}</p>}
        </div>
      );
    }
    case 'divider':
      return <hr className="border-gray-300" />;
    default:
      return null;
  }
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ score, passed, courseTitle }: { score?: number; passed: boolean; courseTitle: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center mx-4">
        <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
        <h1 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {passed ? 'כל הכבוד!' : 'נסה שוב'}
        </h1>
        <p className="text-gray-600 mb-2">{courseTitle}</p>
        {score !== undefined && (
          <p className={`text-4xl font-bold my-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        )}
        {passed
          ? <p className="text-sm text-gray-500">עברת את הלומדה בהצלחה!</p>
          : <p className="text-sm text-gray-500">לא עברת את הלומדה. פנה למנחה שלך.</p>
        }
        <a href="/dashboard"
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          חזרה לדשבורד
        </a>
      </div>
    </div>
  );
}
