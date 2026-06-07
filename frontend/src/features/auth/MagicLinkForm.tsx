// Example React component for authentication
import React, { useState } from 'react';
import axios from 'axios';

interface MagicLinkFormProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function MagicLinkForm({ onSuccess, onError }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/magic-link`, {
        email,
      });

      setSent(true);
      onSuccess?.(response.data.data.message);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      onError?.(msg ?? 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Check your email</h3>
        <p className="text-green-800 mb-4">
          We have sent a login link to <strong>{email}</strong>. Click the link to access the course.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-green-600 hover:text-green-800"
        >
          ← Send to different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        No password needed. We will send you a secure link to sign in instantly.
      </p>
    </form>
  );
}

export default MagicLinkForm;
