"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CourseList from '../../features/courses/CourseList';
import { apiService } from '../../lib/apiService';
import { useLang } from '../../lib/i18n';

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t, dir } = useLang();

  // "New course" quick-create dialog state
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => apiService.getCourses().then((res) => res.data.data.courses as { id: string; title: string; description: string; is_published: boolean }[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteCourse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  async function handleCreate() {
    if (!newTitle.trim()) { setCreateError(t('חובה להזין שם קורס', 'Course title is required')); return; }
    setCreating(true);
    setCreateError('');
    try {
      const res = await apiService.createCourse({ title: newTitle.trim(), description: '' });
      const newId = res.data.data.id;
      // Navigate directly into the drag-and-drop builder
      router.push(`/dashboard/courses/${newId}/edit`);
    } catch {
      setCreateError(t('שגיאה ביצירת הקורס', 'Failed to create course'));
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10" dir={dir}>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{t('לומדות', 'Courses')}</h1>
              <p className="mt-3 text-gray-600">
                {t('צפה בספריית הלומדות, ערוך עם הבנאי הגרפי, או צור לומדה חדשה.',
                   'Browse the learning library, edit with the visual builder, or create a new course.')}
              </p>
            </div>
            <button
              onClick={() => { setShowNew(true); setNewTitle(''); setCreateError(''); }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700"
            >
              {t('+ לומדה חדשה', '+ New Course')}
            </button>
          </div>
        </div>

        <CourseList
          initialCourses={isLoading ? null : (data ?? [])}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>

      {/* Quick-create dialog → goes straight to builder */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6" dir={dir}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {t('לומדה חדשה', 'New Course')}
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('שם הלומדה', 'Course title')}
            </label>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder={t('לדוגמה: הדרכת הגנת פרטיות 2025', 'e.g. Data Privacy Training 2025')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {createError && <p className="text-xs text-red-600 mb-2">{createError}</p>}
            <p className="text-xs text-gray-400 mb-5">
              {t('לאחר הלחיצה תועבר לבנאי הגרפי להוספת תכנים.',
                 'You\'ll be taken to the visual builder to add content.')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                {t('ביטול', 'Cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {creating ? t('יוצר...', 'Creating…') : t('צור ופתח בנאי →', 'Create & open builder →')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
