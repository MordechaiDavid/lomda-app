'use client';

import { useState } from 'react';
import { randomId } from '../utils';
import type { QuizBlock, QuizQuestion, QuizOption } from '../../../types/course';

interface Props {
  block: QuizBlock;
  onChange: (updated: QuizBlock) => void;
}

export function QuizEditor({ block, onChange }: Props) {
  const [activeQ, setActiveQ] = useState(0);

  const updateQuestion = (idx: number, q: QuizQuestion) => {
    const updated = [...block.questions];
    updated[idx] = q;
    onChange({ ...block, questions: updated });
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: randomId(),
      text: '',
      type: 'multiple_choice',
      options: [
        { id: randomId(), text: '' },
        { id: randomId(), text: '' }
      ],
      correctOptionId: ''
    };
    onChange({ ...block, questions: [...block.questions, newQ] });
    setActiveQ(block.questions.length);
  };

  const removeQuestion = (idx: number) => {
    const updated = block.questions.filter((_, i) => i !== idx);
    onChange({ ...block, questions: updated });
    setActiveQ(Math.min(activeQ, updated.length - 1));
  };

  const q = block.questions[activeQ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">ציון עובר (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={block.passingScore ?? ''}
            onChange={(e) => onChange({ ...block, passingScore: Number(e.target.value) })}
            placeholder="ברירת מחדל מהקורס"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">מקסימום ניסיונות</label>
          <input
            type="number"
            min={1}
            value={block.maxAttempts ?? 3}
            onChange={(e) => onChange({ ...block, maxAttempts: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={block.showCorrectAnswers ?? true}
          onChange={(e) => onChange({ ...block, showCorrectAnswers: e.target.checked })}
          className="rounded"
        />
        הצג תשובות נכונות לאחר הגשה
      </label>

      {/* Question tabs */}
      <div className="border-b border-gray-200 flex gap-1 overflow-x-auto">
        {block.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveQ(i)}
            className={`px-3 py-1.5 text-xs rounded-t whitespace-nowrap transition-colors ${
              activeQ === i ? 'bg-white border border-b-white border-gray-200 text-blue-600 font-medium -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            שאלה {i + 1}
          </button>
        ))}
        <button
          onClick={addQuestion}
          className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
        >
          + הוסף
        </button>
      </div>

      {q && (
        <QuestionForm
          question={q}
          onChange={(updated) => updateQuestion(activeQ, updated)}
          onRemove={block.questions.length > 1 ? () => removeQuestion(activeQ) : undefined}
        />
      )}
    </div>
  );
}

function QuestionForm({
  question,
  onChange,
  onRemove
}: {
  question: QuizQuestion;
  onChange: (q: QuizQuestion) => void;
  onRemove?: () => void;
}) {
  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, { id: randomId(), text: '' }]
    });
  };

  const updateOption = (id: string, text: string) => {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, text } : o))
    });
  };

  const removeOption = (id: string) => {
    const updated = question.options.filter((o) => o.id !== id);
    onChange({
      ...question,
      options: updated,
      correctOptionId: question.correctOptionId === id ? '' : question.correctOptionId
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">טקסט שאלה</label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          rows={2}
          placeholder="הכנס שאלה..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">תשובות</label>
        <div className="space-y-2">
          {question.options.map((opt: QuizOption) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctOptionId === opt.id}
                onChange={() => onChange({ ...question, correctOptionId: opt.id })}
                className="flex-shrink-0 accent-green-600"
                title="סמן כתשובה נכונה"
              />
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`תשובה ${question.options.indexOf(opt) + 1}`}
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
              {question.options.length > 2 && (
                <button
                  onClick={() => removeOption(opt.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          + הוסף תשובה
        </button>
        <p className="text-xs text-gray-400 mt-1">סמן את התשובה הנכונה עם עיגול ירוק</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">הסבר (מוצג לאחר תשובה)</label>
        <input
          type="text"
          value={question.explanation ?? ''}
          onChange={(e) => onChange({ ...question, explanation: e.target.value || undefined })}
          placeholder="אופציונלי"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {onRemove && (
        <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700">
          מחק שאלה
        </button>
      )}
    </div>
  );
}
