"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CourseList from '../../features/courses/CourseList';
import AddCourseModal from '../../features/courses/AddCourseModal';
import { apiService } from '../../lib/apiService';

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => apiService.getCourses().then((res) => res.data.data.courses as any[]),
  });

  const createMutation = useMutation({
    mutationFn: (course: any) => apiService.createCourse(course),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteCourse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  function handleSave(course: any) {
    createMutation.mutate(course);
    setShowAdd(false);
    setShowEdit(false);
    setEditingCourse(null);
  }

  function handleEdit(id: string) {
    const course = data?.find((c: any) => c.id === id);
    if (course) {
      setEditingCourse(course);
      setShowEdit(true);
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
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

        <CourseList initialCourses={isLoading ? null : (data ?? [])} onEdit={handleEdit} onDelete={handleDelete} />
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
