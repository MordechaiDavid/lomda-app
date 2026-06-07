/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Import Quill styles
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Props {
  onClose: () => void;
  onSave: (course: any) => void;
  initialData?: any;
}

export default function AddCourseModal({ onClose, onSave, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.content?.find((c: any) => c.type === 'image')?.content || null
  );
  const [contentText, setContentText] = useState(
    initialData?.content?.find((c: any) => c.type === 'text')?.content || ''
  );
  const [quizzes, setQuizzes] = useState<any[]>(initialData?.quizzes || []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (f) setImagePreview(URL.createObjectURL(f));
  }

  function addQuiz() {
    setQuizzes((q) => [
      ...q,
      {
        id: `quiz-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    ]);
  }

  function updateQuiz(idx: number, field: string, value: any) {
    setQuizzes((q) => {
      const copy = [...q];
      if (field === 'question') copy[idx].question = value;
      if (field === 'option') copy[idx].options = value;
      if (field === 'correct') copy[idx].correctIndex = value;
      return copy;
    });
  }

  function handleSave() {
    const id = initialData?.id || `course-${Date.now()}`;
    const content: any[] = [];
    if (contentText.trim()) {
      content.push({ id: `c-${Date.now()}`, type: 'text', content: contentText, order: 1 });
    }
    if (imagePreview) {
      content.push({ id: `cimg-${Date.now()}`, type: 'image', content: imagePreview, order: content.length + 1 });
    }

    const quizzesPayload = quizzes.map((q: any, i: number) => ({
      id: q.id,
      courseId: id,
      question: q.question,
      type: 'multiple-choice',
      options: q.options.map((opt: string, oi: number) => ({ id: `${q.id}-opt-${oi}`, text: opt, order: oi + 1 })),
      correctAnswer: q.options[q.correctIndex] || '',
      order: i + 1,
    }));

    const course = {
      id,
      title,
      description,
      content,
      quizzes: quizzesPayload,
    };

    onSave(course);
    onClose();
  }

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">Add New Course</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Main image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1" />
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" className="mt-2 h-36 w-full object-cover rounded-md" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <div className="mt-1 bg-white rounded-md border">
                <ReactQuill
                  value={contentText}
                  onChange={setContentText}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'font': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  placeholder="Start typing your course content..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Quizzes</h4>
                <button onClick={addQuiz} className="text-sm text-blue-600">Add question</button>
              </div>

              <div className="mt-2 space-y-3">
                {quizzes.map((q, idx) => (
                  <div key={q.id} className="rounded-md border p-3">
                    <input placeholder="Question" value={q.question} onChange={(e) => updateQuiz(idx, 'question', e.target.value)} className="w-full rounded-md border px-2 py-1" />
                    <div className="mt-2 grid gap-2 grid-cols-1">
                      {q.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input value={opt} onChange={(e) => {
                            const options = [...q.options];
                            options[oi] = e.target.value;
                            updateQuiz(idx, 'option', options);
                          }} className="flex-1 rounded-md border px-2 py-1" />
                          <label className="text-sm">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oi} onChange={() => updateQuiz(idx, 'correct', oi)} /> Correct
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="rounded-md border px-4 py-2">Cancel</button>
          <button onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-white">{initialData ? 'Update course' : 'Save course'}</button>
        </div>
      </div>
    </div>
  );
}
