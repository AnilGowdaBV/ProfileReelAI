import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { User } from '../context/AuthContext';

export const CareerProfileModal: React.FC<{ user: User; onSaved: (user: User) => void; onClose?: () => void }> = ({ user, onSaved, onClose }) => {
  const [name, setName] = useState(user.name || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || '');
  const [track, setTrack] = useState<'frontend' | 'backend' | ''>(user.jobTrack === 'backend' ? 'backend' : user.jobTrack === 'frontend' ? 'frontend' : '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !linkedinUrl.trim() || !track || (!file && !onClose)) {
      setError('Fill your name, LinkedIn, resume, and what you want to work on.');
      return;
    }
    setBusy(true);
    try {
      const resumeData = file ? await file.arrayBuffer().then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
      }) : '';
      const saved = await api.saveCareerProfile({
        userId: user.id,
        name: name.trim(),
        linkedinUrl: linkedinUrl.trim(),
        track,
        resumeFileName: file?.name || '',
        resumeData,
      });
      const next = { ...user, ...saved, loginMethod: user.loginMethod };
      if (typeof onSaved === 'function') onSaved(next);
      else sessionStorage.setItem('profilereel_user', JSON.stringify(next));
      if (onClose) onClose();
      else window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">{onClose ? 'Your profile' : 'Before the roles'}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{onClose ? 'Update your details' : 'Tell us who you are'}</h2>
          </div>
          {onClose && <button type="button" onClick={onClose} className="text-sm font-bold text-slate-400">Close</button>}
        </div>
        <p className="mt-1 text-sm text-slate-500">The three open roles follow what you pick.</p>
        <div className="mt-5 grid gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="LinkedIn URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <label className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600">
            <span className="font-semibold">{file ? file.name : onClose ? 'Replace resume, or leave this and keep the current one' : 'Upload your resume'}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="mt-2 block w-full text-xs" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['frontend', 'backend'] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setTrack(choice)}
                className={`rounded-xl px-3 py-2 text-sm font-bold capitalize ${track === choice ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-800'}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 w-full rounded-xl bg-slate-950 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? 'Saving…' : 'Show my roles'}
        </button>
      </form>
    </div>,
    document.body,
  );
};
