"use client";

import CourseDetail from '../../../features/courses/CourseDetail';
import AddCourseModal from '../../../features/courses/AddCourseModal';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiService } from '../../../lib/apiService';

interface CourseDetailPageProps {
  params: { id: string };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [course, setCourse] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourse(params.id);
        if (mounted) setCourse(res.data.data);
      } catch (e) {
        console.error('Failed to load course:', e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  function handleEdit() {
    setShowEdit(true);
  }

  function handleSave(updatedCourse: any) {
    // Update local state immediately
    setCourse(updatedCourse);
    setShowEdit(false);
    
    // Sync with backend asynchronously
    apiService.createCourse(updatedCourse).catch((err) => {
      console.warn('Failed to save course to backend:', err);
    });
  }

  async function handleDelete() {
    if (confirm('Delete this course?')) {
      setDeleting(true);
      try {
        // Simulate delete (in real app, call API endpoint to delete)
        await new Promise(resolve => setTimeout(resolve, 300));
        // Redirect after delete
        window.location.href = '/courses';
      } catch (err) {
        console.error('Failed to delete:', err);
        setDeleting(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="inline-block rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition"
          >
            ← Back to courses
          </Link>
          <button
            onClick={handleEdit}
            title="Edit course"
            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete course"
            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        </div>

        <CourseDetail courseId={params.id} course={course} />
      </div>

      {showEdit && course && (
        <AddCourseModal
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
          initialData={course}
        />
      )}
    </main>
  );
}
