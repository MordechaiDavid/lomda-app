'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../../lib/apiService';

interface CourseContentItem {
  id: string;
  type: 'heading' | 'text' | 'image' | 'video';
  content: string;
}

interface QuizItem {
  id: string;
  question: string;
  type: string;
  options?: Array<{ id: string; text: string }>;
}

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourse(courseId);
        if (mounted) setCourse(res.data.data);
      } catch (e) {
        if (mounted) setError('Course not found or an error occurred.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (loading) return <p className="text-center text-gray-600">Loading course details...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!course) return <p className="text-center text-gray-600">Course details are unavailable.</p>;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">{course.title}</h1>
        <p className="mt-3 text-lg text-gray-600">{course.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {course.content.map((item) => (
            <div key={item.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {item.type === 'heading' && <h2 className="text-2xl font-semibold text-slate-900">{item.content}</h2>}
              {item.type === 'text' && <p className="text-gray-700 leading-relaxed">{item.content}</p>}
              {item.type === 'image' && (
                <img src={item.content} alt="Course content" className="w-full rounded-2xl object-cover" />
              )}
              {item.type === 'video' && (
                <video controls className="w-full rounded-2xl bg-black">
                  <source src={item.content} type="video/mp4" />
                </video>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Quiz Preview</h2>
            <div className="space-y-4">
              {course.quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{quiz.question}</p>
                  {quiz.options?.map((option) => (
                    <div key={option.id} className="mt-2 text-gray-700">• {option.text}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
