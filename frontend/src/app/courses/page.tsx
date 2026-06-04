"use client";

import { useEffect, useState } from 'react';
import CourseList from '../../features/courses/CourseList';
import AddCourseModal from '../../features/courses/AddCourseModal';
import { apiService } from '../../lib/apiService';

export default function CoursesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await apiService.getCourses();
        if (mounted) setCourses(res.data.data.courses || []);
      } catch (e) {
        if (mounted) setCourses([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleSave(course: any) {
    if (editingCourse) {
      // Update existing course
      setCourses((c) => c ? c.map((c) => c.id === course.id ? course : c) : [course]);
      setEditingCourse(null);
      setShowEdit(false);
    } else {
      // Add new course to local state immediately for instant UI feedback
      setCourses((c) => (c ? [course, ...c] : [course]));
    }
    
    // Sync with backend asynchronously (fire and forget)
    apiService.createCourse(course).catch((err) => {
      console.warn('Failed to save course to backend:', err);
    });
  }

  function handleEdit(id: string) {
    const course = courses?.find((c) => c.id === id);
    if (course) {
      setEditingCourse(course);
      setShowEdit(true);
    }
  }

  function handleDelete(id: string) {
    apiService.deleteCourse(id).then(() => {
      setCourses((c) => c ? c.filter((c) => c.id !== id) : []);
    }).catch((err) => {
      console.warn('Failed to delete course from backend:', err);
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Available Courses</h1>
              <p className="mt-3 text-gray-600">
                Browse the learning library and select a course to review the content and quiz preview.
              </p>
            </div>
            <div>
              <button onClick={() => setShowAdd(true)} className="rounded-md bg-blue-600 px-4 py-2 text-white">Add new course</button>
            </div>
          </div>
        </div>

        <CourseList initialCourses={courses} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {showEdit && editingCourse && (
        <AddCourseModal
          onClose={() => {
            setShowEdit(false);
            setEditingCourse(null);
          }}
          onSave={handleSave}
          initialData={editingCourse}
        />
      )}
    </main>
  );
}
