'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CoursePlayer } from '../../../../features/course-player/CoursePlayer';
import { apiService } from '../../../../lib/apiService';
import type { Course, Enrollment } from '../../../../types/course';

export default function DashboardLearnPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [courseRes, enrollRes] = await Promise.all([
          apiService.getCourse(courseId),
          apiService.enrollInCourse(courseId)  // idempotent — creates or returns existing
        ]);
        setCourse(courseRes.data.data);
        setEnrollment(enrollRes.data.data);
      } catch {
        setError('לא ניתן לטעון את הלומדה');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">טוען לומדה...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm mx-4">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">לא ניתן לטעון</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <a href="/dashboard" className="mt-4 inline-block text-sm text-blue-600 underline">חזרה ללוח הבקרה</a>
        </div>
      </div>
    );
  }

  return (
    <CoursePlayer
      course={course}
      enrollmentId={enrollment.id}
      initialStep={enrollment.current_step ?? 0}
    />
  );
}
