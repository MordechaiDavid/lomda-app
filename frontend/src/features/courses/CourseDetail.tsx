'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../../lib/apiService';
import 'react-quill/dist/quill.snow.css';



interface CourseDetailProps {
  courseId: string;
  course?: any;
}

export default function CourseDetail({ courseId, course: initialCourse }: CourseDetailProps) {
  // Note: Back button is now in the page component
  const [course, setCourse] = useState<any | null>(initialCourse || null);
  const [loading, setLoading] = useState(!initialCourse);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If course is passed as prop, use it directly
    if (initialCourse) {
      setCourse(initialCourse);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
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
  }, [courseId, initialCourse]);

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
          {course.content.map((item: any) => (
            <div key={item.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {item.type === 'heading' && <h2 className="text-2xl font-semibold text-slate-900">{item.content}</h2>}
              {item.type === 'text' && (
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-2 [&_a]:text-blue-600 [&_a]:underline [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
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
              {course.quizzes && Array.isArray(course.quizzes) && course.quizzes.map((quiz: any) => (
                <div key={quiz?.id || Math.random()} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{String(quiz?.question || '')}</p>
                  {Array.isArray(quiz?.options) && quiz.options.map((option: any, idx: number) => {
                    let text = '';
                    if (typeof option === 'string') {
                      text = option;
                    } else if (option && typeof option === 'object' && 'text' in option) {
                      text = String(option.text);
                    }
                    return text ? (
                      <div key={idx} className="mt-2 text-gray-700">
                        • {text}
                      </div>
                    ) : null;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
