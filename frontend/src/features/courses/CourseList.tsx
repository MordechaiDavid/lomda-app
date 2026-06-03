'use client';

import { useEffect, useState } from 'react';
import CourseCard from './CourseCard';
import { apiService } from '../../lib/apiService';

interface CourseListProps {
  initialCourses?: any[] | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}


export default function CourseList({ initialCourses = null, onEdit, onDelete }: CourseListProps) {
  const [courses, setCourses] = useState<any[] | null>(initialCourses);
  const [loading, setLoading] = useState(!initialCourses);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If initialCourses is provided, sync the local state
    if (initialCourses) {
      setCourses(initialCourses);
      setLoading(false);
      return;
    }
    
    // Otherwise, fetch from API
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourses();
        if (mounted) setCourses(res.data.data.courses || []);
      } catch (e) {
        if (mounted) setError('Failed to load courses.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialCourses]);

  if (loading) return <p className="text-center text-gray-600">Loading courses...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!courses || !courses.length) return <p className="text-center text-gray-600">No courses available yet.</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          description={course.description}
          image={course.content?.find((c: any) => c.type === 'image')?.content}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
