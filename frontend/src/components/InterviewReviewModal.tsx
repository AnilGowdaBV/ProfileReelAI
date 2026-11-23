import React, { useEffect, useState } from 'react';
import { API_BASE, api } from '../services/api';

type ReviewRow = {
  id: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  photoUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  reviewOutcome?: string;
  reviewFeedback?: string;
  reviewRating?: number;
  experience?: string[];
};

export const InterviewReviewModal: React.FC<{
  row: ReviewRow;
  email: string;
  onClose: () => void;
  onDone: (id: string, outcome: string) => void;
}> = ({ row, email, onClose, onDone }) => {
  const [step, setStep] = useState<'choice' | 'good' | 'post'>(row.reviewOutcome === 'GOOD' ? 'post' : 'choice');
  const [rating, setRating] = useState(row.reviewRating || 5);
  const [feedback, setFeedback] = useState(row.reviewFeedback || '');
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.interviewCandidate>> | null>(null);
  const [post, setPost] = useState('');
  const [cardUrl, setCardUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notYet, setNotYet] = useState(false);

  const markNotYet = async () => {
    setBusy(true);
    setError('');
    try {
      await api.reviewInterview(row.id, email, { outcome: 'NOT_YET' });
      onDone(row.id, 'NOT_YET');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this.');
    } finally {
      setBusy(false);
    }
  };

  const chooseBad = async () => {
    setBusy(true);
    setError('');
    try {
      await api.reviewInterview(row.id, email, { outcome: 'BAD' });
      onDone(row.id, 'BAD');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this review.');
    } finally {
      setBusy(false);
    }
  };

  const openGood = async () => {
    setError('');
    setStep('good');
    try {
      setProfile(await api.interviewCandidate(row.id, email));
    } catch {
      setProfile(null);
    }
  };

  const prepare = async () => {
    setBusy(true);
    setError('');
    try {
      const saved = await api.reviewInterview(row.id, email, { outcome: 'GOOD', rating, feedback });
      setPost(saved.post);
      setStep('post');
      onDone(row.id, 'GOOD');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare the post.');
    } finally {
      setBusy(false);
    }
  };

  const buildCard = async () => {
    const canvas = document.createElement('canvas');
    const roles = (row.experience || []).slice(0, 4);
    canvas.width = 1080;
    canvas.height = roles.length ? 1280 : 1080;
    const pen = canvas.getContext('2d');
    if (!pen) throw new Error('Could not prepare the post image.');
    const gradient = pen.createLinearGradient(0, 0, 1080, canvas.height);
    gradient.addColorStop(0, '#4c1d95');
    gradient.addColorStop(1, '#7c3aed');
    pen.fillStyle = gradient;
    pen.fillRect(0, 0, 1080, canvas.height);
    pen.fillStyle = '#ffffff';
    roundRect(pen, 70, 70, 940, canvas.height - 140, 48);
    pen.fill();
    const photo = await loadPhoto(row.photoUrl || '');
    pen.save();
    pen.beginPath();
    pen.arc(540, 280, 120, 0, Math.PI * 2);
    pen.closePath();
    pen.clip();
    if (photo) pen.drawImage(photo, 420, 160, 240, 240);
    else {
      pen.fillStyle = '#4c1d95';
      pen.fillRect(420, 160, 240, 240);
      pen.fillStyle = '#ffffff';
      pen.font = '800 92px Segoe UI, Arial';
      pen.textAlign = 'center';
      pen.fillText(row.candidateName.slice(0, 1).toUpperCase(), 540, 312);
    }
    pen.restore();
    pen.textAlign = 'center';
    pen.fillStyle = '#4c1d95';
    pen.font = '800 64px Segoe UI, Arial';
    pen.fillText(row.candidateName, 540, 470);
    pen.fillStyle = '#6d28d9';
    pen.font = '700 28px Segoe UI, Arial';
    pen.fillText(`${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}  ·  Strong yes`, 540, 520);
    pen.fillStyle = '#334155';
    pen.font = '600 30px Segoe UI, Arial';
    const noteLines = wrapText(pen, feedback || post, 540, 580, 760, 40).slice(0, 3);
    let y = 580 + noteLines.length * 40 + 36;
    if (roles.length) {
      pen.fillStyle = '#6d28d9';
      pen.font = '800 22px Segoe UI, Arial';
      pen.fillText('EXPERIENCE', 540, y);
      y += 46;
      roles.forEach((role) => {
        pen.fillStyle = '#f5f3ff';
        roundRect(pen, 150, y - 30, 780, 64, 18);
        pen.fill();
        pen.fillStyle = '#312e81';
        pen.font = '700 24px Segoe UI, Arial';
        const clean = role.split(':')[0].replace(/\s+/g, ' ').trim();
        const text = clean.length > 64 ? `${clean.slice(0, 61)}...` : clean;
        pen.fillText(text, 540, y + 8);
        y += 78;
      });
    }
    pen.fillStyle = '#64748b';
    pen.font = '700 26px Segoe UI, Arial';
    pen.fillText(`${row.jobTitle}  ·  ${row.companyName}`, 540, canvas.height - 110);
    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (step !== 'post') return;
    let alive = true;
    buildCard().then((url) => { if (alive) setCardUrl(url); }).catch(() => undefined);
    return () => { alive = false; };
  }, [step]);

  const experienceStory = (name: string, roles?: string[]) => {
    const lines = (roles || []).map((role) => role.split(':')[0].replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 3);
    if (!lines.length) return '';
    if (lines.length === 1) return `${name} came into this interview from ${lines[0]}.`;
    const earlier = lines.slice(0, -1).join(', then ');
    return `${name} started with ${earlier}, and is now ${lines[lines.length - 1]}.`;
  };

  const share = async () => {
    setBusy(true);
    setError('');
    try {
      const image = cardUrl || await buildCard();
      downloadData(image, `${row.candidateName}-recommendation.png`);
      if (resume.startsWith('http')) {
        const file = await fetch(resume);
        if (file.ok) downloadBlob(await file.blob(), row.resumeFileName || `${row.candidateName}-resume.pdf`);
      }
      const fileName = (row.resumeFileName || 'resume.pdf').replace(/[^\w.\- ]+/g, '') || 'resume.pdf';
      const resumeLink = resume.startsWith('http') ? `${window.location.origin}/api/interviewers/resume/${row.id}/${encodeURIComponent(fileName)}` : '';
      const story = experienceStory(row.candidateName, row.experience);
      const caption = `I just interviewed ${row.candidateName}.\n\n${feedback || post}${story ? `\n\n${story}` : ''}\n\nStrong yes for ${row.jobTitle} at ${row.companyName}.${resumeLink ? `\n\n${fileName}\n${resumeLink}` : ''}`;
      await navigator.clipboard.writeText(caption).catch(() => undefined);
      window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare the LinkedIn post.');
    } finally {
      setBusy(false);
    }
  };

  const linkedin = profile?.linkedinUrl || '';
  const resume = profile?.resumeUrl || row.resumeUrl || '';

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">After the interview</p>
        <h2 className="mt-1 text-2xl font-black">How was {row.candidateName}?</h2>
        <p className="mt-1 text-sm text-slate-500">{row.jobTitle} · {row.companyName}</p>

        {step === 'choice' && (
          <div className="mt-6">
            <label className="mb-4 flex items-start gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={notYet} onChange={(event) => setNotYet(event.target.checked)} className="mt-1" />
              <span>Not yet interviewed. The candidate had trouble joining, so this meeting can be tried again.</span>
            </label>
            {notYet ? (
              <button type="button" disabled={busy} onClick={() => void markNotYet()} className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-black text-white disabled:opacity-60">Save and try again later</button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" disabled={busy} onClick={() => void chooseBad()} className="rounded-2xl border border-rose-200 px-4 py-4 text-sm font-black text-rose-600 disabled:opacity-60">Bad</button>
                <button type="button" onClick={() => void openGood()} className="rounded-2xl bg-violet-600 px-4 py-4 text-sm font-black text-white">Good</button>
              </div>
            )}
          </div>
        )}

        {step === 'good' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-violet-50 p-4 text-sm">
              <p className="font-black">{profile?.fullName || row.candidateName}</p>
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="mt-1 block font-bold text-violet-700">{linkedin}</a>}
              {resume && <a href={resume} target="_blank" rel="noreferrer" className="mt-1 block font-bold text-violet-700">Resume{profile?.resumeFileName || row.resumeFileName ? ` · ${profile?.resumeFileName || row.resumeFileName}` : ''}</a>}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Rating</p>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button key={score} type="button" onClick={() => setRating(score)} className={`h-10 w-10 rounded-full text-sm font-black ${rating === score ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{score}</button>
                ))}
              </div>
            </div>
            <label className="block text-xs font-bold text-slate-500">
              Note about this candidate
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900" placeholder="Skills, how the interview went, and why you would recommend them" />
            </label>
            <button type="button" disabled={busy} onClick={() => void prepare()} className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? 'Preparing...' : 'Prepare LinkedIn post'}</button>
          </div>
        )}

        {step === 'post' && (
          <>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {cardUrl && <img src={cardUrl} alt="LinkedIn card" className="mx-auto max-h-52 rounded-2xl" />}
              <p className="mt-2 text-xs text-slate-500">Posting downloads the card and the resume. Add both in the LinkedIn box. The caption is copied.</p>
            </div>
            <div className="mt-3 space-y-2">
              <button type="button" disabled={busy} onClick={() => void share()} className="w-full rounded-2xl bg-[#0a66c2] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? 'Preparing files...' : 'Post on LinkedIn'}</button>
              <button type="button" onClick={onClose} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Done</button>
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {step !== 'post' && <button type="button" onClick={onClose} className="mt-4 text-xs font-bold text-slate-400">Close</button>}
      </div>
    </div>
  );
};

function loadPhoto(url: string) {
  if (!url) return Promise.resolve(null);
  return fetch(`${API_BASE}/interviewers/portrait?url=${encodeURIComponent(url)}`)
    .then((response) => (response.ok ? response.blob() : null))
    .then((blob) => {
      if (!blob) return null;
      return new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = URL.createObjectURL(blob);
      });
    })
    .catch(() => null);
}

function roundRect(pen: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  pen.beginPath();
  pen.moveTo(x + radius, y);
  pen.arcTo(x + width, y, x + width, y + height, radius);
  pen.arcTo(x + width, y + height, x, y + height, radius);
  pen.arcTo(x, y + height, x, y, radius);
  pen.arcTo(x, y, x + width, y, radius);
  pen.closePath();
}

function wrapText(pen: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = '';
  const lines: string[] = [];
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (pen.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  lines.slice(0, 6).forEach((item, index) => pen.fillText(item, x, y + index * lineHeight));
  return lines;
}

function downloadData(dataUrl: string, name: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = name;
  link.click();
}

function downloadBlob(blob: Blob, name: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}
