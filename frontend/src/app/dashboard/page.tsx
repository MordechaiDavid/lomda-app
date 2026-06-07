'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../lib/apiService';
import type { Enrollment } from '../../types/course';

const STATUS_CONFIG = {
  pending:     { label: 'לא התחלת',  color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'בתהליך',    color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'הושלם ✓',   color: 'bg-green-100 text-green-700' },
  failed:      { label: 'לא עבר',    color: 'bg-red-100 text-red-700' }
};

export default function DashboardPage() {
  const router = useRouter();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiService.getCurrentUser().then((res) => res.data.data.user),
    retry: false
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithJoins[]>({
    queryKey: ['myEnrollments'],
    queryFn: () => apiService.getMyEnrollments().then((res) => res.data.data),
    enabled: !!user,
    staleTime: 30_000
  });

  const enrollments: EnrollmentWithJoins[] = enrollmentsData ?? [];

  const handleLogout = async () => {
    try { await apiService.logout(); } finally { router.push('/login'); }
  };

  if (userLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const isTrainer = ['admin', 'trainer'].includes(user?.role);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-10" dir="rtl">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">לוח בקרה</p>
            <h1 className="text-2xl font-bold text-slate-900">שלום, {user?.name || 'לומד'}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <a
                href="/dashboard/admin/users"
                className="text-sm px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                ניהול משתמשים
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              התנתק
            </button>
          </div>
        </div>

        {/* Trainer actions */}
        {isTrainer && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <a
              href="/courses"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">📚</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">לומדות</p>
                <p className="text-xs text-slate-500">צפה וערוך לומדות</p>
              </div>
            </a>
            <a
              href="/dashboard/campaigns"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">📨</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">קמפיינים</p>
                <p className="text-xs text-slate-500">הפץ לומדות לעובדים</p>
              </div>
            </a>
            <a
              href="/dashboard/reports"
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">דוחות ציות</p>
                <p className="text-xs text-slate-500">ייצוא CSV לביקורת</p>
              </div>
            </a>
          </div>
        )}

        {/* My courses */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">הלומדות שלי 📚</h2>

          {enrollmentsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 h-40 animate-pulse" />
              ))}
            </div>
          )}

          {!enrollmentsLoading && enrollments.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">אין לומדות מוקצות עדיין.</p>
              <p className="text-xs mt-1">הקישור ייפתח אוטומטית כשמנהל ישלח לך לומדה במייל.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrollments.map((e) => (
              <EnrollmentCard key={e.id} enrollment={e} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// The API returns joined fields alongside the enrollment
type EnrollmentWithJoins = Enrollment & {
  course_title?: string;
  course_thumbnail_url?: string | null;
  course_estimated_minutes?: number | null;
  course_passing_score?: number;
  latest_score?: number | null;
};

function EnrollmentCard({ enrollment: e }: { enrollment: EnrollmentWithJoins }) {
  const status = (e.status ?? 'pending') as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const title = e.course_title ?? 'קורס';
  const thumbnail = e.course_thumbnail_url ?? null;
  const estimatedMin = e.course_estimated_minutes ?? null;
  const passingScore = e.course_passing_score ?? 70;
  const latestScore = e.latest_score ?? null;
  const progress = status === 'completed' ? 1 : status === 'in_progress' ? 0.5 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt={title} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <span className="text-3xl">📖</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          {estimatedMin && <span>⏱ {estimatedMin} דקות</span>}
          <span>✓ ציון עובר {passingScore}%</span>
          {latestScore !== null && latestScore !== undefined && (
            <span className={latestScore >= passingScore ? 'text-green-600' : 'text-red-600'}>
              ציון: {latestScore}%
            </span>
          )}
        </div>

        {status === 'in_progress' && (
          <div className="h-1.5 bg-gray-100 rounded-full mb-3">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {(status === 'pending' || status === 'in_progress' || status === 'failed') && (
          <a
            href={`/courses/${e.course_id}`}
            className="block w-full text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            {status === 'in_progress' ? 'המשך' : status === 'failed' ? 'נסה שוב' : 'התחל'}
          </a>
        )}
      </div>
    </div>
  );
}
