import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, Home, Inbox, LayoutList, Search, Users, X, XCircle } from 'lucide-react';
import { InterviewReviewModal } from '../components/InterviewReviewModal';
import { markNoticesSeen } from '../components/InterviewerInbox';
import { ScheduleEdit } from '../components/ScheduleEdit';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type RequestRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  status: string;
  interviewDate?: string;
  interviewTime?: string;
  note?: string;
  meetLink?: string;
  linkClicked?: boolean;
  notice?: string;
  resumeFileName?: string;
  resumeUrl?: string;
  photoUrl?: string;
  headline?: string;
  createdAt: string;
  reviewOutcome?: string;
  reviewFeedback?: string;
  reviewRating?: number;
  needsReview?: boolean;
  reviewReady?: boolean;
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approved, setApproved] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.interviewCandidate>> | null>(null);
  const [profileError, setProfileError] = useState('');
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<RequestRow | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    api.interviewerInbox(user.email)
      .then((result) => {
        const next = result.requests || [];
        setApproved(result.approved);
        setRows(next);
        const waitingReview = next.find((row) => row.needsReview);
        if (waitingReview) setReview(waitingReview);
        if (user?.email) markNoticesSeen(user.email, next);
      })
      .catch(() => {
        setApproved(false);
        setRows([]);
      })
      .finally(() => setReady(true));
  }, [user?.email]);

  const waiting = rows.filter((row) => row.status !== 'ACCEPTED' && row.status !== 'REJECTED');
  const accepted = rows.filter((row) => row.status === 'ACCEPTED');
  const rejected = rows.filter((row) => row.status === 'REJECTED');
  const pool = filter === 'accepted' ? accepted : filter === 'rejected' ? rejected : filter === 'pending' ? waiting : rows;
  const needle = query.trim().toLowerCase();
  const visible = pool.filter((row) => !needle || `${row.candidateName} ${row.candidateEmail} ${row.jobTitle} ${row.companyName}`.toLowerCase().includes(needle));
  const initials = (user?.name || 'IN').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  const openProfile = async (id: string) => {
    if (!user?.email) return;
    setProfileError('');
    setProfile(null);
    try {
      setProfile(await api.interviewCandidate(id, user.email));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not open this profile.');
    }
  };

  const accept = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await api.acceptInterviewRequest(id, user.email);
      setRows((current) => current.map((row) => (row.id === id ? { ...row, status: 'ACCEPTED' } : row)));
    } finally {
      setBusyId('');
    }
  };

  const reject = async (id: string) => {
    if (!user?.email) return;
    setBusyId(id);
    try {
      await api.rejectInterviewRequest(id, user.email);
      setRows((current) => current.map((row) => (row.id === id ? { ...row, status: 'REJECTED' } : row)));
    } finally {
      setBusyId('');
    }
  };

  const nav = (id: 'all' | 'pending' | 'accepted', label: string, icon: React.ReactNode, count: number) => (
    <button
      type="button"
      onClick={() => setFilter(id === 'all' ? 'pending' : id)}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold ${filter === id || (id === 'all' && filter === 'pending') ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-white'}`}
    >
      <span className="inline-flex items-center gap-2">{icon}{label}</span>
      <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${filter === id || (id === 'all' && filter === 'pending') ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f3f0ff] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="flex w-[230px] shrink-0 flex-col border-r border-violet-100 bg-[#f7f5ff] px-4 py-5">
          <div className="flex items-center gap-2 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white">
              <LayoutList className="h-4 w-4" />
            </span>
            <span className="text-sm font-black">ProfileReel</span>
          </div>
          <nav className="mt-8 space-y-1">
            {nav('all', 'Requests', <Inbox className="h-4 w-4" />, waiting.length)}
            <button type="button" onClick={() => setFilter('accepted')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold ${filter === 'accepted' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-white'}`}>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Accepted</span>
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${filter === 'accepted' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{accepted.length}</span>
            </button>
            <button type="button" onClick={() => setFilter('rejected')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold ${filter === 'rejected' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-white'}`}>
              <span className="inline-flex items-center gap-2"><XCircle className="h-4 w-4" /> Rejected</span>
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${filter === 'rejected' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{rejected.length}</span>
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-white">
              <Home className="h-4 w-4" /> Dashboard
            </button>
          </nav>
          <div className="mt-auto flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-600 text-xs font-black text-white">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{user?.name || 'Interviewer'}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
          </div>
        </aside>
        <main className="relative flex-1 overflow-hidden px-6 py-5 sm:px-8">
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-72 rounded-full bg-violet-200/40 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <Inbox className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-black">{filter === 'accepted' ? 'Accepted' : filter === 'rejected' ? 'Rejected' : 'Requests'}</h1>
                  <p className="text-sm text-slate-500">{filter === 'accepted' ? 'Interviews you have taken on.' : filter === 'rejected' ? 'Requests you turned down.' : 'People waiting for a yes.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
                  <Bell className="h-4 w-4" />
                  {waiting.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" />}
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-xs font-black text-white">{initials.slice(0, 1)}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4">
                <Users className="h-5 w-5 text-violet-600" />
                <p className="mt-3 text-xs font-semibold text-slate-500">Total requests</p>
                <p className="text-2xl font-black">{rows.length}</p>
              </article>
              <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4">
                <Check className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-xs font-semibold text-slate-500">Accepted</p>
                <p className="text-2xl font-black">{accepted.length}</p>
              </article>
              <article className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-4">
                <Clock className="h-5 w-5 text-amber-500" />
                <p className="mt-3 text-xs font-semibold text-slate-500">Pending</p>
                <p className="text-2xl font-black">{waiting.length}</p>
              </article>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {([
                ['all', 'All requests', rows.length],
                ['pending', 'Pending', waiting.length],
                ['accepted', 'Accepted', accepted.length],
                ['rejected', 'Rejected', rejected.length],
              ] as const).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? 'bg-violet-600 text-white' : 'bg-white text-slate-500'}`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 ${filter === id ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-slate-400">
                <Search className="h-3.5 w-3.5" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests..." className="w-36 bg-transparent text-slate-700 outline-none placeholder:text-slate-400" />
              </label>
            </div>
            <div className="mt-4">
              {!ready ? (
                <p className="text-sm text-slate-500">Opening your requests...</p>
              ) : !approved ? (
                <p className="text-sm text-slate-500">This page is for approved interviewers.</p>
              ) : visible.length === 0 ? (
                <p className="rounded-2xl bg-white px-5 py-8 text-sm text-slate-500">Nothing in this list.</p>
              ) : (
                <ul className="space-y-3">
                  {visible.map((row) => {
                    const mark = row.candidateName.slice(0, 1).toUpperCase();
                    return (
                      <li key={row.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                        {row.photoUrl ? (
                          <img src={row.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">{mark}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black">{row.candidateName} {row.notice === 'RESCHEDULED' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Rescheduled</span>}</p>
                          <p className="truncate text-sm text-slate-500">{row.candidateEmail}</p>
                          {row.headline && <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{row.headline}</p>}
                          {row.interviewDate && <p className="mt-1 text-xs font-bold text-emerald-700">{row.interviewDate} · {row.interviewTime}</p>}
                          {row.status === 'ACCEPTED' && row.meetLink && (
                            <a
                              href={row.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mr-3 text-xs font-bold text-sky-700"
                              onClick={(event) => {
                                if (window.parent !== window) {
                                  event.preventDefault();
                                  window.parent.postMessage({ type: 'PROFILEREEL_PLUGIN_WEBSITE', purpose: 'meeting', url: `${window.location.origin}/notifications` }, '*');
                                  return;
                                }
                                if (!user?.email || row.reviewOutcome) return;
                                api.startInterview(row.id, user.email).then(() => {
                                  setRows((current) => current.map((item) => (item.id === row.id ? { ...item, linkClicked: true, needsReview: true } : item)));
                                  setReview(row);
                                }).catch(() => undefined);
                              }}
                            >
                              Meeting link
                            </a>
                          )}
                          {row.reviewOutcome === 'GOOD' && (
                            <button type="button" onClick={() => setReview(row)} className="text-xs font-bold text-[#0a66c2] underline">Share post</button>
                          )}
                          {row.resumeUrl && <a href={row.resumeUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-violet-700">Resume{row.resumeFileName ? ` · ${row.resumeFileName}` : ''}</a>}
                        </div>
                        <button type="button" onClick={() => void openProfile(row.id)} className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700">
                          View profile
                        </button>
                        {row.status !== 'REJECTED' && (
                          <button type="button" onClick={() => { setEditing(row); setEditError(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Edit</button>
                        )}
                        {row.status === 'ACCEPTED' ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Accepted</span>
                        ) : row.status === 'REJECTED' ? (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700">Rejected</span>
                        ) : (
                          <span className="flex gap-2">
                            <button type="button" disabled={busyId === row.id} onClick={() => void reject(row.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-60">
                              Reject
                            </button>
                            <button type="button" disabled={busyId === row.id} onClick={() => void accept(row.id)} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                              <Check className="h-3.5 w-3.5" />
                              {busyId === row.id ? 'Saving...' : 'Accept'}
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
      {review && user?.email && (
        <InterviewReviewModal
          row={review}
          email={user.email}
          onClose={() => setReview(null)}
          onDone={(id, outcome) => setRows((current) => current.map((row) => (row.id === id ? { ...row, reviewOutcome: outcome === 'NOT_YET' ? '' : outcome, linkClicked: outcome !== 'NOT_YET', needsReview: false } : row)))}
        />
      )}
      {editing && user?.email && (
        <ScheduleEdit
          title={editing.candidateName}
          date={editing.interviewDate || ''}
          time={editing.interviewTime || ''}
          meetLink={editing.meetLink || ''}
          note={editing.note || ''}
          busy={saving}
          error={editError}
          onClose={() => setEditing(null)}
          onSave={(value) => {
            setSaving(true);
            setEditError('');
            api.rescheduleInterview(editing.id, user.email, value)
              .then((saved) => {
                setRows((current) => current.map((row) => (row.id === editing.id ? { ...row, ...saved } : row)));
                setEditing(null);
              })
              .catch((error) => setEditError(error instanceof Error ? error.message : 'Could not save this schedule.'))
              .finally(() => setSaving(false));
          }}
        />
      )}
      {(profile || profileError) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => { setProfile(null); setProfileError(''); }}>
          <aside className="h-full w-full max-w-md overflow-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Candidate</p>
                <h2 className="mt-1 text-xl font-black">{profile?.fullName || 'Profile'}</h2>
              </div>
              <button type="button" onClick={() => { setProfile(null); setProfileError(''); }} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {profileError && <p className="mt-4 text-sm text-rose-600">{profileError}</p>}
            {profile && (
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ['Email', profile.email],
                  ['Phone', profile.phone],
                  ['Role', `${profile.jobTitle} · ${profile.companyName}`],
                  ['Location', profile.location],
                  ['Current CTC', profile.currentSalary],
                  ['Expected CTC', profile.expectedSalary],
                  ['Interviewing at', profile.interviewingAt],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{value}</dd>
                  </div>
                ))}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-bold text-violet-700 underline">
                    Open LinkedIn
                  </a>
                )}
                {(profile.resumeUrl || profile.resumeData) && (
                  <a
                    href={profile.resumeUrl || profile.resumeData}
                    target="_blank"
                    rel="noreferrer"
                    download={profile.resumeFileName || 'resume'}
                    className="mt-4 flex items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white"
                  >
                    Open resume{profile.resumeFileName ? ` · ${profile.resumeFileName}` : ''}
                  </a>
                )}
              </dl>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
