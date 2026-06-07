'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
}

type Phase = 'content' | 'quiz' | 'complete' | 'failed';

export function CoursePlayer({ course, enrollmentId, campaignToken, initialStep = 0 }: Props) {
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

  // Auto-save progress every 30s
  useEffect(() => {
    const id = setInterval(() => {
      apiService.updateProgress(enrollmentId, {
        current_step: stepIdx,
        time_spent_sec: totalTimeRef.current
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [enrollmentId, stepIdx]);

  // Save on step change
  useEffect(() => {
    apiService.updateProgress(enrollmentId, { current_step: stepIdx }).catch(() => {});
  }, [enrollmentId, stepIdx]);

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
        apiService.submitQuiz(enrollmentId, {}, campaignToken)
          .then(() => setPhase('complete')).catch(() => {});
      }
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [isLastStep, hasQuiz, enrollmentId, campaignToken]);

  const handlePrev = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }, [stepIdx]);

  const handleQuizSubmit = useCallback(async (answers: Record<string, string>) => {
    const res = await apiService.submitQuiz(enrollmentId, answers, campaignToken);
    const { score, passed } = res.data.data;
    setResult({ score, passed });
    setPhase(passed ? 'complete' : 'failed');
    return { score, passed };
  }, [enrollmentId, campaignToken]);

  if (phase === 'complete' || phase === 'failed') {
    return <CompletionScreen score={result?.score} passed={phase === 'complete'} courseTitle={course.title} />;
  }

  if (phase === 'quiz') {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <StepProgressBar
          currentStep={contentSteps.length}
          totalSteps={contentSteps.length + 1}
          stepTitle="שאלון סיום"
          course={course}
        />
        <QuizFlow
          questions={allQuestions}
          passingScore={course.passing_score}
          onSubmit={handleQuizSubmit}
        />
      </div>
    );
  }

  const remaining = Math.max(0, minSec - elapsed);
  const canAdvance = minTimeDone;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <StepProgressBar
        currentStep={stepIdx + 1}
        totalSteps={contentSteps.length + (hasQuiz ? 1 : 0)}
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
      <footer className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={stepIdx === 0}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← הקודם
          </button>

          <div className="text-center">
            {!canAdvance && minSec > 0 ? (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                ⏱ עוד {remaining} שניות
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                שלב {stepIdx + 1} מתוך {contentSteps.length + (hasQuiz ? 1 : 0)}
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLastStep ? (hasQuiz ? 'לשאלון →' : 'סיים') : 'הבא →'}
          </button>
        </div>
      </footer>
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

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{course.title}</h1>
          <span className="text-xs text-gray-500 flex-shrink-0">{pct}% הושלם</span>
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
          <img src={b.url} alt={b.alt ?? ''} className="w-full rounded-xl shadow-sm" />
          {b.caption && <p className="text-xs text-gray-500 text-center mt-2">{b.caption}</p>}
        </div>
      );
    }
    case 'video': {
      const b = block as VideoBlock;
      return (
        <div className="rounded-xl overflow-hidden shadow-sm bg-black">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ReactPlayer url={b.url} width="100%" height="360px" controls={true}
            playing={b.autoplay ?? false}
            {...({ config: { youtube: { playerVars: { rel: 0 } } } } as any)} />
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
