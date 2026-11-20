import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.get('token') || '', password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update the password.');
      setMessage('Password updated. You can sign in with it now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form onSubmit={save} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-500">This replaces the database password for your email.</p>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={saving} className="mt-4 w-full rounded-xl bg-slate-950 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </main>
  );
};
