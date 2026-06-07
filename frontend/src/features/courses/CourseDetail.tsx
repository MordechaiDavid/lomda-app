'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../../lib/apiService';
import 'react-quill/dist/quill.snow.css';

interface LegacyContentItem {
  id: string;
  type: 'heading' | 'text' | 'image' | 'video';
  content: string;
  order: number;
}

interface LegacyQuizOption {
  id?: string;
  text?: string;
}

interface LegacyQuiz {
  id?: string;
  question?: string;
  options?: (string | LegacyQuizOption)[];
}

interface CourseData {
  title: string;
  description: string;
  content: LegacyContentItem[];
  quizzes?: LegacyQuiz[];
}

interface CourseDetailProps {
  courseId: string;
  course?: CourseData;
}

export default function CourseDetail({ courseId, course: initialCourse }: CourseDetailProps) {
  const [course, setCourse] = useState<CourseData | null>(initialCourse ?? null);
  const [loading, setLoading] = useState(!initialCourse);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourse) {
      setCourse(initialCourse);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourse(courseId);
        if (mounted) setCourse(res.data.data as CourseData);
      } catch {
        if (mounted) setError('הלומדה לא נמצאה או אירעה שגיאה.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [courseId, initialCourse]);

  if (loading) return <p className="text-center text-gray-600">טוען פרטי לומדה...</p>;
  if (error)   return <p className="text-center text-red-600">{error}</p>;
  if (!course) return <p className="text-center text-gray-600">פרטי הלומדה אינם זמינים.</p>;

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
              {item.type === 'text' && (
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.content} alt="תוכן לומדה" className="w-full rounded-2xl object-cover" />
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
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">תצוגת שאלון</h2>
            <div className="space-y-4">
              {Array.isArray(course.quizzes) && course.quizzes.map((quiz, qi) => (
                <div key={quiz?.id ?? qi} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{String(quiz?.question ?? '')}</p>
                  {Array.isArray(quiz?.options) && quiz.options.map((option, idx) => {
                    const text = typeof option === 'string'
                      ? option
                      : (option as LegacyQuizOption)?.text ?? '';
                    return text ? (
                      <div key={idx} className="mt-2 text-gray-700">• {text}</div>
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
