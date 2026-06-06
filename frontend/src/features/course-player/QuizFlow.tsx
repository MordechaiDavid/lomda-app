'use client';

import { useState } from 'react';
import type { QuizQuestion, QuizOption } from '../../types/course';

interface Props {
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
  onSubmit: (answers: Record<string, string>) => Promise<{ score: number; passed: boolean }>;
}

type Phase = 'answering' | 'submitted';

export function QuizFlow({ questions, passingScore, showCorrectAnswers = true, onSubmit }: Props) {
  const [phase, setPhase] = useState<Phase>('answering');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const answered = !!answers[q?.id];

  const selectAnswer = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
  };

  const next = () => {
    if (isLast) {
      submitAnswers();
    } else {
      setCurrentQ((i) => i + 1);
    }
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
      setPhase('submitted');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'submitted' && result) {
    return (
      <ResultScreen
        score={result.score}
        passed={result.passed}
        passingScore={passingScore}
        questions={questions}
        answers={answers}
        showCorrectAnswers={showCorrectAnswers}
      />
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4" dir="rtl">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>שאלה {currentQ + 1} מתוך {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentQ ? 'bg-blue-500' : i === currentQ ? 'bg-blue-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <p className="text-lg font-semibold text-gray-800 mb-6 leading-relaxed">{q.text}</p>

        <div className="space-y-3">
          {q.options.map((opt: QuizOption) => {
            const selected = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => selectAnswer(opt.id)}
                className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={next}
            disabled={!answered || submitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'שולח...' : isLast ? 'הגש שאלון' : 'הבא →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  score,
  passed,
  passingScore,
  questions,
  answers,
  showCorrectAnswers
}: {
  score: number;
  passed: boolean;
  passingScore: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  showCorrectAnswers: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto py-8 px-4" dir="rtl">
      <div className={`rounded-2xl p-8 text-center mb-6 ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
        <h2 className={`text-2xl font-bold mb-1 ${passed ? 'text-green-800' : 'text-red-800'}`}>
          {passed ? 'עברת את הלומדה!' : 'לא עברת'}
        </h2>
        <p className={`text-4xl font-bold my-3 ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
        <p className="text-sm text-gray-600">ציון עובר: {passingScore}%</p>
      </div>

      {showCorrectAnswers && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">סיכום תשובות:</p>
          {questions.map((q) => {
            const selected = q.options.find((o: QuizOption) => o.id === answers[q.id]);
            const correct = q.options.find((o: QuizOption) => o.id === q.correctOptionId);
            const isCorrect = answers[q.id] === q.correctOptionId;
            return (
              <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-sm font-medium text-gray-800 mb-2">{q.text}</p>
                <p className="text-xs text-gray-600">תשובתך: <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 line-through'}>{selected?.text ?? '—'}</span></p>
                {!isCorrect && <p className="text-xs text-green-700 mt-0.5">תשובה נכונה: <span className="font-medium">{correct?.text}</span></p>}
                {q.explanation && <p className="text-xs text-gray-500 mt-1 italic">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
