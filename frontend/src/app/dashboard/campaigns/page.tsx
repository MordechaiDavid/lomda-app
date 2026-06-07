'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../../lib/apiService';
import type { Campaign } from '../../../types/course';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: 'טיוטה',   color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'נשלח',    color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'הושלם',   color: 'bg-green-100 text-green-700' }
};

type CampaignRow = Campaign & { course_title: string; total_recipients: string; completed_count: string };

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiService.getCampaigns().then((r) => r.data.data as CampaignRow[])
  });

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });

  function openEdit(c: CampaignRow) {
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditDueDate(c.due_date ? new Date(c.due_date).toISOString().slice(0, 10) : '');
    setEditScore(String(c.passing_score ?? 70));
    setEditError('');
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim()) { setEditError('שם הקמפיין לא יכול להיות ריק'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      await apiService.updateCampaign(editingId, {
        title: editTitle.trim(),
        due_date: editDueDate || undefined,
        passing_score: editScore ? Number(editScore) : undefined
      });
      await queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setEditError(msg ?? 'שגיאה בשמירה');
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">קמפיינים</h1>
            <p className="text-sm text-slate-500 mt-1">הפץ לומדות לעובדים באמצעות מייל</p>
          </div>
          <a
            href="/dashboard/campaigns/new"
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            + קמפיין חדש
          </a>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-200" />)}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            <p className="text-4xl mb-3">📨</p>
            <p className="text-sm">אין קמפיינים עדיין.</p>
            <a href="/dashboard/campaigns/new" className="mt-3 inline-block text-sm text-blue-600 underline">
              צור קמפיין ראשון
            </a>
          </div>
        )}

        <div className="space-y-3">
          {(data ?? []).map((c) => {
            const st = STATUS_LABEL[c.status] ?? STATUS_LABEL.draft;
            const total = parseInt(c.total_recipients, 10) || 0;
            const done = parseInt(c.completed_count, 10) || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isDraft = c.status === 'draft';

            return (
              <div
                key={c.id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                {/* Clickable main area → campaign detail */}
                <a href={`/dashboard/campaigns/${c.id}`} className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      <span className="text-xs text-slate-400">{c.course_title}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                    {c.due_date && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        תאריך יעד: {new Date(c.due_date).toLocaleDateString('he-IL')}
                      </p>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="text-left w-28 flex-shrink-0">
                      <p className="text-xs text-slate-500 mb-1">{done}/{total} השלימו ({pct}%)</p>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </a>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isDraft && (
                    <button
                      onClick={() => openEdit(c)}
                      title="ערוך קמפיין"
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('לבטל קמפיין זה? הוא לא יוצג יותר ברשימה.')) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    title="בטל / הסתר קמפיין"
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6" dir="rtl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">ערוך קמפיין</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">שם הקמפיין</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד (אופציונלי)</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">ציון עובר (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editScore}
              onChange={(e) => setEditScore(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />

            {editError && <p className="text-xs text-red-600 mb-2">{editError}</p>}

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {editSaving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
