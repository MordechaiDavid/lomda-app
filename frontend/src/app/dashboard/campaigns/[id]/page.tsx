'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiService } from '../../../../lib/apiService';
import type { CampaignRecipient } from '../../../../types/course';

const RECIPIENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'ממתין',     color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'נשלח',      color: 'bg-blue-100 text-blue-700' },
  started:   { label: 'בתהליך',   color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'הושלם ✓',   color: 'bg-green-100 text-green-700' },
  failed:    { label: 'לא עבר',    color: 'bg-red-100 text-red-700' },
  expired:   { label: 'פג תוקף',   color: 'bg-gray-100 text-gray-500' }
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: campData, isLoading: campLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiService.getCampaign(id).then((r) => r.data.data)
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => apiService.getCampaignAnalytics(id).then((r) => r.data.data),
    enabled: !!campData
  });

  const downloadCSV = () => {
    apiService.getComplianceReport({ format: 'csv' }).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'compliance-report.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (campLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const campaign = campData;
  const stats = analyticsData?.stats;
  const recipients: (CampaignRecipient & { user_name?: string })[] = campaign?.recipients ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <a href="/dashboard/campaigns" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← חזרה לקמפיינים
        </a>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign?.title}</h1>
            <p className="text-sm text-slate-500 mt-1">קורס: {campaign?.course_title}</p>
            {campaign?.due_date && (
              <p className="text-xs text-slate-400 mt-0.5">
                תאריך יעד: {new Date(campaign.due_date).toLocaleDateString('he-IL')}
              </p>
            )}
          </div>
          <button
            onClick={downloadCSV}
            className="text-sm px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2"
          >
            ⬇ ייצא CSV
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="סה״כ נמענים" value={stats.total} />
            <StatCard label="השלימו" value={stats.completed} highlight="green" />
            <StatCard label="שיעור השלמה" value={`${stats.completion_rate ?? 0}%`} highlight="blue" />
            <StatCard label="שיעור מעבר" value={`${stats.pass_rate ?? 0}%`} highlight={Number(stats.pass_rate) >= 70 ? 'green' : 'red'} />
          </div>
        )}

        {/* Recipients table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">נמענים ({recipients.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="text-right px-4 py-3 font-medium">שם / מייל</th>
                  <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                  <th className="text-center px-4 py-3 font-medium">ציון</th>
                  <th className="text-center px-4 py-3 font-medium">הושלם</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipients.map((r) => {
                  const st = RECIPIENT_STATUS[r.status] ?? RECIPIENT_STATUS.pending;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{r.user_name || r.email}</p>
                        {r.user_name && <p className="text-xs text-slate-400">{r.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.score !== null && r.score !== undefined ? (
                          <span className={`font-medium ${r.score >= (campaign?.passing_score ?? 70) ? 'text-green-600' : 'text-red-600'}`}>
                            {r.score}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString('he-IL') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: 'green' | 'blue' | 'red' }) {
  const colorMap = { green: 'text-green-600', blue: 'text-blue-600', red: 'text-red-600' };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
      <p className={`text-2xl font-bold ${highlight ? colorMap[highlight] : 'text-slate-800'}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
