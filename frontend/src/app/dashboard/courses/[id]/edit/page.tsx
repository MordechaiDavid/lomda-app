'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseBuilder } from '../../../../../features/course-builder/CourseBuilder';
import { apiService } from '../../../../../lib/apiService';
import type { Course } from '../../../../../types/course';

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getCourse(id)
      .then((res) => setCourse(res.data.data))
      .catch(() => setError('לא ניתן לטעון את הקורס'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600">{error || 'קורס לא נמצא'}</p>
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 underline text-sm">
          חזרה ללוח הבקרה
        </button>
      </div>
    );
  }

  return <CourseBuilder course={course} onSaved={setCourse} />;
}
