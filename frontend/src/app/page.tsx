'use client';

import Link from 'next/link';
import { useLang } from '../lib/i18n';

export default function Home() {
  const { t, dir } = useLang();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24" dir={dir}>
      <div className="max-w-3xl text-center">
        <div className="text-5xl mb-4">📖</div>
        <h1 className="text-5xl font-bold mb-6">
          {t('ברוכים הבאים ללומדה', 'Welcome to Lomda')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t(
            'מערכת הדרכה ארגונית להפצת לומדות, הכשרות ציות ומעקב אחר לימוד עובדים.',
            'Enterprise Learning Management System for compliance training, course distribution, and employee learning tracking.'
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-8 py-3 text-white text-lg font-semibold transition hover:bg-blue-700"
          >
            {t('כניסה למערכת', 'Sign In')}
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-400">
          {t('כניסה לעובדים באמצעות הקישור שנשלח למייל שלך.', 'Employees: use the link sent to your email.')}
        </p>
      </div>
    </main>
  );
}
