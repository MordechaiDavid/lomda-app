'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../lib/apiService';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('teacher@lms.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.login(email.trim(), password);
      setSuccessMessage(`Welcome back, ${response.data.data.user.name}! Redirecting to your dashboard...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch (submissionError: any) {
      setError(
        submissionError?.response?.data?.error?.message || 'Invalid email or password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Secure login
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Sign in to Lomda
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Use your LMS email and password to access your dashboard.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-900">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
              placeholder="teacher@lms.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-6">
          <p className="text-sm font-semibold text-slate-800">Alternate sign-in</p>
          <p className="mt-2 text-sm text-slate-600">
            In the future, you can add passwordless login using passkeys or WebAuthn here.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 opacity-70"
          >
            Login with Passkey (coming soon)
          </button>
        </div>
      </div>
    </main>
  );
}
