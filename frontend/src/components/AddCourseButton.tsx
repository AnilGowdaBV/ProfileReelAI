import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';

const PAPERS = [
  { id: 'react', label: 'React' },
  { id: 'java', label: 'Java' },
  { id: 'golang', label: 'Golang' },
  { id: 'dataengineer', label: 'Data Engineer' },
  { id: 'sdet', label: 'SDET Playwright' },
  { id: 'dataanalyst', label: 'Data Analyst' },
  { id: 'devops', label: 'DevOps' },
];

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900';

export const AddCourseButton: React.FC<{ submittedBy: string; className?: string }> = ({ submittedBy, className }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [purpose, setPurpose] = useState('');
  const [papers, setPapers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    setSaved(false);
    setError('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSaved(false); setError(''); }}
        className={className || 'px-3 py-1.5 text-xs font-semibold text-emerald-700'}
      >
        Add your course
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-brand-500/30 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={close}
              className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {saved ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Sent for approval</h3>
                <p className="mt-2 text-sm text-slate-600">It will show in the course list after an admin approves it.</p>
                <button type="button" onClick={close} className="mt-5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white">
                  Done
                </button>
              </div>
            ) : (
              <form
                className="space-y-4 text-left"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError('');
                  setBusy(true);
                  try {
                    await api.suggestCoursePlatform({ name, url, purpose, recommendFor: papers.join(','), submittedBy });
                    setName('');
                    setUrl('');
                    setPurpose('');
                    setPapers([]);
                    setSaved(true);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not send this course.');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="mb-5 pr-8">
                  <h3 className="text-lg font-extrabold text-slate-900">Add your course</h3>
                  <p className="mt-2 inline-block rounded-lg bg-brand-500/15 px-2.5 py-1 text-sm font-extrabold text-brand-700">
                    Fill this in. It goes for approval before it appears.
                  </p>
                </div>
                <label className="block text-xs font-bold text-slate-700">
                  Course name *
                  <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. TakeUForward" className={fieldClass} />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Website link *
                  <input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className={fieldClass} />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Meant for
                  <input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="e.g. DSA" className={fieldClass} />
                </label>
                <div>
                  <p className="text-xs font-bold text-slate-700">Recommended for</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PAPERS.map((paper) => {
                      const on = papers.includes(paper.id);
                      return (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => setPapers((current) => (on ? current.filter((item) => item !== paper.id) : [...current, paper.id]))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                        >
                          {paper.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                  {busy ? 'Sending…' : 'Submit for approval'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
