'use client';

import { useEffect, useState } from 'react';
import CourseCard from './CourseCard';
import { apiService } from '../../lib/apiService';

interface CourseSummary {
  id: string;
  title: string;
  description: string;
  content?: { type: string; content?: string }[];
}

interface CourseListProps {
  initialCourses?: CourseSummary[] | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function CourseList({ initialCourses = null, onEdit, onDelete }: CourseListProps) {
  const [courses, setCourses] = useState<CourseSummary[] | null>(initialCourses);
  const [loading, setLoading] = useState(!initialCourses);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourses) {
      setCourses(initialCourses);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourses();
        if (mounted) setCourses((res.data.data.courses as CourseSummary[]) || []);
      } catch {
        if (mounted) setError('שגיאה בטעינת הקורסים.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [initialCourses]);

  if (loading) return <p className="text-center text-gray-600">טוען קורסים...</p>;
  if (error)   return <p className="text-center text-red-600">{error}</p>;
  if (!courses || !courses.length) return <p className="text-center text-gray-600">אין לומדות זמינות עדיין.</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          description={course.description}
          image={course.content?.find((c) => c.type === 'image')?.content}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
