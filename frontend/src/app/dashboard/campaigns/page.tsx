'use client';

import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../../lib/apiService';
import type { Campaign } from '../../../types/course';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: 'טיוטה',   color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'נשלח',    color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'הושלם',   color: 'bg-green-100 text-green-700' }
};

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiService.getCampaigns().then((r) => r.data.data as (Campaign & { course_title: string; total_recipients: string; completed_count: string })[])
  });

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

            return (
              <a
                key={c.id}
                href={`/dashboard/campaigns/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
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
                <span className="text-slate-300 text-sm">›</span>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
