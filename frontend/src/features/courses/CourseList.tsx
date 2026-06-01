'use client';

import { useEffect, useState } from 'react';
import CourseCard from './CourseCard';
import { apiService } from '../../lib/apiService';

interface CourseSummary {
  id: string;
  title: string;
  description: string;
}

export default function CourseList() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  if (loading) return <p className="text-center text-gray-600">Loading courses...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!courses.length) return <p className="text-center text-gray-600">No courses available yet.</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} id={course.id} title={course.title} description={course.description} />
      ))}
    </div>
  );
}
