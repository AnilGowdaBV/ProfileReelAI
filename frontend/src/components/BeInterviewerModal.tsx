import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { SectionSpinner } from './SectionSpinner';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../services/api';

const STATUS_COPY: Record<string, { title: string; detail: string; stamp: string; tone: string }> = {
  UNDER_REVIEW: {
    title: 'Profile under review',
    detail: 'You already applied. We will update this when a decision is made.',
    stamp: 'Under review',
    tone: 'border-amber-500 text-amber-600',
  },
  APPROVED: {
    title: 'You are approved',
    detail: 'Your interviewer profile is approved.',
    stamp: 'Approved',
    tone: 'border-emerald-600 text-emerald-600',
  },
  REJECTED: {
    title: 'Not accepted',
    detail: 'This application was not accepted.',
    stamp: 'Rejected',
    tone: 'border-rose-600 text-rose-600',
  },
};

export const BeInterviewerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [previous, setPrevious] = useState<string[]>([]);
  const [existingStatus, setExistingStatus] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (user?.email) setEmail(user.email);
    if (!user?.email) {
      setExistingStatus('');
      return;
    }
    setChecking(true);
    api.interviewerStatus(user.email)
      .then((result) => setExistingStatus(result.found ? result.status || 'UNDER_REVIEW' : ''))
      .catch(() => setExistingStatus(''))
      .finally(() => setChecking(false));
  }, [open, user?.email]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await api.applyInterviewer({ fullName, linkedinUrl, currentCompany, email, phone });
      setPrevious(result.previousCompanies || []);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not submit this application.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-charcoal-900 shadow-2xl border border-slate-200 dark:border-white/10">
        <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100">ProfileReel</p>
            <h2 className="mt-1 text-xl font-extrabold">{existingStatus ? STATUS_COPY[existingStatus]?.title || 'Application status' : 'Be an interviewer'}</h2>
            <p className="mt-1 text-sm text-violet-100">{existingStatus ? 'This is the decision on your interviewer profile.' : 'Tell us where you work. We read your past companies from LinkedIn.'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-white/15" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        {checking ? (
          <SectionSpinner compact label="Checking your application" />
        ) : existingStatus ? (
          <div className="relative px-6 py-8 text-center">
            <div className={`mx-auto w-fit rotate-[-8deg] rounded-lg border-4 px-4 py-1 text-2xl font-black uppercase tracking-[0.16em] ${STATUS_COPY[existingStatus]?.tone || 'border-amber-500 text-amber-600'}`}>
              {STATUS_COPY[existingStatus]?.stamp || 'Under review'}
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-slate-900 dark:text-white">{STATUS_COPY[existingStatus]?.title || 'Profile under review'}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{STATUS_COPY[existingStatus]?.detail || 'Your profile is under review.'}</p>
            <button type="button" onClick={onClose} className="mt-6 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Close
            </button>
          </div>
        ) : done ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="mx-auto w-10 h-10 text-emerald-600" />
            <h3 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">Application submitted successfully.</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Profile is under review.</p>
            {previous.length > 0 && (
              <p className="mt-4 text-xs text-slate-500">Past companies found: {previous.join(', ')}</p>
            )}
            <button type="button" onClick={onClose} className="mt-6 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="px-6 py-5 space-y-3">
            {([
              ['Name', fullName, setFullName, 'text'],
              ['LinkedIn URL', linkedinUrl, setLinkedinUrl, 'url'],
              ['Currently working at', currentCompany, setCurrentCompany, 'text'],
              ['Email', email, setEmail, 'email'],
              ['Phone number', phone, setPhone, 'tel'],
            ] as [string, string, (next: string) => void, string][]).map(([label, value, setter, type]) => (
              <label key={label} className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                {label}
                <input
                  required
                  type={type}
                  value={value}
                  onChange={(event) => setter(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-charcoal-950 px-3 py-2 text-sm font-medium"
                />
              </label>
            ))}
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Reading LinkedIn and saving...' : 'Submit application'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};
