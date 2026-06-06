'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ContentBlock, Course, HeadingBlock, TextBlock, ImageBlock, VideoBlock, QuizBlock, QuizQuestion } from '../../types/course';
import { QuizFlow } from './QuizFlow';
import { useBlockTimer } from './useBlockTimer';
import { apiService } from '../../lib/apiService';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface Props {
  course: Course;
  enrollmentId: string;
  campaignToken?: string;
  initialStep?: number;
}

type PlayerPhase = 'content' | 'quiz' | 'complete' | 'failed';

export function CoursePlayer({ course, enrollmentId, campaignToken, initialStep = 0 }: Props) {
  const contentBlocks = (course.content ?? []).filter((b) => b.type !== 'quiz');
  const quizBlocks = (course.content ?? []).filter((b) => b.type === 'quiz') as QuizBlock[];
  // Flatten all quiz questions from quiz blocks
  const allQuestions: QuizQuestion[] = quizBlocks.flatMap((b) => b.questions);

  const [step, setStep] = useState(Math.min(initialStep, contentBlocks.length - 1));
  const [phase, setPhase] = useState<PlayerPhase>('content');
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const totalTimeRef = useRef(0);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const block = contentBlocks[step];
  const isLastContent = step === contentBlocks.length - 1;
  const hasQuiz = allQuestions.length > 0;

  // Auto-save progress every 30 seconds
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      totalTimeRef.current += 30;
      apiService.updateProgress(enrollmentId, {
        current_step: step,
        time_spent_sec: totalTimeRef.current
      }).catch(() => {});
    }, 30000);
    return () => { if (saveIntervalRef.current) clearInterval(saveIntervalRef.current); };
  }, [enrollmentId, step]);

  // Save progress when step changes
  useEffect(() => {
    apiService.updateProgress(enrollmentId, { current_step: step }).catch(() => {});
  }, [enrollmentId, step]);

  // Background music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (course.background_music_url) {
      audioRef.current = new Audio(course.background_music_url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {}); // Browser may block autoplay
    }
    return () => { audioRef.current?.pause(); };
  }, [course.background_music_url]);

  const handleNext = useCallback(() => {
    if (isLastContent) {
      if (hasQuiz) {
        setPhase('quiz');
      } else {
        // No quiz — mark complete
        apiService.submitQuiz(enrollmentId, {}, campaignToken)
          .then(() => setPhase('complete'))
          .catch(() => {});
      }
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastContent, hasQuiz, enrollmentId, campaignToken]);

  const handleQuizSubmit = useCallback(async (answers: Record<string, string>) => {
    const res = await apiService.submitQuiz(enrollmentId, answers, campaignToken);
    const { score, passed } = res.data.data;
    setResult({ score, passed });
    setPhase(passed ? 'complete' : 'failed');
    return { score, passed };
  }, [enrollmentId, campaignToken]);

  if (phase === 'complete') {
    return <CompletionScreen score={result?.score} passed={true} courseTitle={course.title} enrollmentId={enrollmentId} />;
  }

  if (phase === 'failed') {
    return <CompletionScreen score={result?.score} passed={false} courseTitle={course.title} enrollmentId={enrollmentId} />;
  }

  if (phase === 'quiz') {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <PlayerHeader course={course} progress={1} label="שאלון" />
        <QuizFlow
          questions={allQuestions}
          passingScore={course.passing_score}
          onSubmit={handleQuizSubmit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <PlayerHeader
        course={course}
        progress={(step + 1) / (contentBlocks.length + (hasQuiz ? 1 : 0))}
        label={`${step + 1} / ${contentBlocks.length}${hasQuiz ? ' + שאלון' : ''}`}
      />
      <div className="flex-1 overflow-y-auto">
        {block && (
          <BlockWithGate
            key={block.id}
            block={block}
            onNext={handleNext}
            isLast={isLastContent}
            hasQuiz={hasQuiz}
          />
        )}
      </div>
    </div>
  );
}

function PlayerHeader({ course, progress, label }: { course: Course; progress: number; label: string }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{course.title}</h1>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function BlockWithGate({
  block,
  onNext,
  isLast,
  hasQuiz
}: {
  block: ContentBlock;
  onNext: () => void;
  isLast: boolean;
  hasQuiz: boolean;
}) {
  const required = block.minTimeSeconds ?? 0;
  const { canAdvance, remaining } = useBlockTimer(required);

  const nextLabel = isLast ? (hasQuiz ? 'לשאלון →' : 'סיים קורס') : 'הבא →';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <BlockRenderer block={block} onVideoReady={() => {}} />

      <div className="mt-8 flex items-center justify-between">
        {!canAdvance && required > 0 ? (
          <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            ⏱ המשך בעוד {remaining} שניות
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock; onVideoReady: () => void }) {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock;
      const Tag = `h${b.level}` as 'h1' | 'h2' | 'h3';
      const sizes = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl' };
      return (
        <Tag
          className={`font-bold text-gray-900 ${sizes[b.level]} leading-snug`}
          style={{ textAlign: b.align ?? 'right' }}
        >
          {b.text}
        </Tag>
      );
    }

    case 'text': {
      const b = block as TextBlock;
      return (
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: b.html }}
        />
      );
    }

    case 'image': {
      const b = block as ImageBlock;
      const widthClass = b.width === 'medium' ? 'max-w-sm' : b.width === 'large' ? 'max-w-lg' : 'w-full';
      return (
        <div className={`${widthClass} mx-auto`}>
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
          <ReactPlayer
            url={b.url}
            width="100%"
            height="360px"
            controls={true}
            playing={b.autoplay ?? false}
            {...({ config: { youtube: { playerVars: { rel: 0 } } } } as any)}
          />
          {b.caption && <p className="text-xs text-gray-500 text-center py-2 bg-gray-50">{b.caption}</p>}
        </div>
      );
    }

    case 'divider':
      return <hr className="border-gray-300 my-4" />;

    default:
      return null;
  }
}

function CompletionScreen({
  score,
  passed,
  courseTitle,
  enrollmentId
}: {
  score?: number;
  passed: boolean;
  courseTitle: string;
  enrollmentId: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center mx-4">
        <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
        <h1 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {passed ? 'כל הכבוד!' : 'נסה שוב'}
        </h1>
        <p className="text-gray-600 mb-2">{courseTitle}</p>
        {score !== undefined && (
          <p className={`text-4xl font-bold my-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {score}%
          </p>
        )}
        {passed ? (
          <>
            <p className="text-sm text-gray-500 mb-6">עברת את הלומדה בהצלחה!</p>
            <a
              href={`/learn/${enrollmentId}/certificate`}
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
            >
              הורד תעודה
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500">לא עברת את הלומדה. צור קשר עם המנחה שלך.</p>
        )}
      </div>
    </div>
  );
}
