'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../lib/apiService';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService
      .getCurrentUser()
      .then((response) => {
        setUser(response.data.data.user);
      })
      .catch(() => {
        setError('Your session has expired. Please sign in again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Take me to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back, {user?.name || 'Learner'}.</h1>
            <p className="mt-2 text-sm text-slate-600">
              You are signed in as <strong>{user?.email}</strong> with the <strong>{user?.role}</strong> role.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold text-slate-900">Protected content</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This page is protected by a cookie-based auth check. Only authenticated users with a valid session can reach this route.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Next step</p>
              <p className="mt-2 text-sm text-slate-600">Add course administration or learner progress views behind this dashboard.</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Auth model</p>
              <p className="mt-2 text-sm text-slate-600">The LMS backend controls the HTTP-only JWT cookie and validates it for protected APIs.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
