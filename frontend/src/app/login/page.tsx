'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../lib/apiService';
import { useLang } from '../../lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, dir } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError(t('יש להזין כתובת מייל וסיסמה.', 'Please enter both email and password.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.login(email.trim(), password);
      const name = response.data.data.user.name;
      setSuccessMessage(t(`ברוך הבא, ${name}! מעביר לדשבורד...`, `Welcome back, ${name}! Redirecting…`));
      setTimeout(() => router.push('/dashboard'), 600);
    } catch (submissionError: unknown) {
      const msg = (submissionError as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? t('כתובת מייל או סיסמה שגויים.', 'Invalid email or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10" dir={dir}>
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">📖</div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('כניסה ללומדה', 'Sign in to Lomda')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('הזן את פרטי הכניסה שלך', 'Enter your credentials to access the dashboard')}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              {t('כתובת מייל', 'Email address')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
              placeholder={t('admin@lomda.app', 'admin@lomda.app')}
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              {t('סיסמה', 'Password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
              placeholder={t('הזן סיסמה', 'Enter your password')}
              autoComplete="current-password"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? t('מתחבר...', 'Signing in…') : t('כניסה', 'Sign in')}
          </button>
        </form>
      </div>
    </main>
  );
}
