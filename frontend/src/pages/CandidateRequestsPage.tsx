import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, Home, Inbox, LayoutList, XCircle } from 'lucide-react';
import { markNoticesSeen } from '../components/InterviewerInbox';
import { ScheduleEdit } from '../components/ScheduleEdit';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type Row = {
  id: string;
  interviewerName: string;
  photoUrl?: string;
  jobTitle: string;
  companyName: string;
  status: string;
  interviewDate?: string;
  interviewTime?: string;
  note?: string;
  meetLink?: string;
  notice?: string;
};

export const CandidateRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<'requested' | 'accepted' | 'rejected'>('requested');
  const [editing, setEditing] = useState<Row | null>(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    api.myInterviewRequests(user.email)
      .then((next) => {
        setRows(next);
        if (user?.email) markNoticesSeen(user.email, next);
      })
      .catch(() => setRows([]))
      .finally(() => setReady(true));
  }, [user?.email]);

  const waiting = rows.filter((row) => row.status !== 'ACCEPTED' && row.status !== 'REJECTED');
  const accepted = rows.filter((row) => row.status === 'ACCEPTED');
  const rejected = rows.filter((row) => row.status === 'REJECTED');
  const visible = filter === 'accepted' ? accepted : filter === 'rejected' ? rejected : waiting;
  const initials = (user?.name || 'C').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

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
            <button type="button" onClick={() => setFilter('requested')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold ${filter === 'requested' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-white'}`}>
              <span className="inline-flex items-center gap-2"><Inbox className="h-4 w-4" /> Requested</span>
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${filter === 'requested' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{waiting.length}</span>
            </button>
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
              <p className="truncate text-xs font-bold">{user?.name || 'Candidate'}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
          </div>
        </aside>
        <main className="flex-1 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                {filter === 'accepted' ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </span>
              <div>
                <h1 className="text-2xl font-black">{filter === 'accepted' ? 'Accepted' : filter === 'rejected' ? 'Rejected' : 'Requested'}</h1>
                <p className="text-sm text-slate-500">{filter === 'accepted' ? 'Interviewers who accepted you.' : filter === 'rejected' ? 'Requests that were turned down.' : 'Waiting for the interviewer to respond.'}</p>
              </div>
            </div>
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
              <Bell className="h-4 w-4" />
              {waiting.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" />}
            </span>
          </div>
          <div className="mt-6">
            {!ready ? (
              <p className="text-sm text-slate-500">Opening your requests...</p>
            ) : visible.length === 0 ? (
              <p className="rounded-2xl bg-white px-5 py-8 text-sm text-slate-500">{filter === 'accepted' ? 'None accepted yet.' : filter === 'rejected' ? 'Nothing rejected.' : 'You have not requested an interviewer yet.'}</p>
            ) : (
              <ul className="space-y-3">
                {visible.map((row) => (
                  <li key={row.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                    {row.photoUrl ? (
                      <img src={row.photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                    ) : (
                      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white">{row.interviewerName.slice(0, 1).toUpperCase()}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{row.interviewerName} {row.notice === 'RESCHEDULED' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Rescheduled</span>}</p>
                      <p className="truncate text-sm text-slate-600">Asked to interview you</p>
                      {row.interviewDate && (
                        <div className="mt-2 text-sm text-slate-700">
                          <p className="font-bold text-emerald-700">{row.interviewDate} · {row.interviewTime}</p>
                          {row.meetLink && <a href={row.meetLink} target="_blank" rel="noreferrer" className="font-bold text-sky-700">Open meeting</a>}
                        </div>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${row.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' : row.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                      {row.status === 'ACCEPTED' ? 'Accepted' : row.status === 'REJECTED' ? 'Rejected' : 'Requested'}
                    </span>
                    {row.status !== 'REJECTED' && (
                      <button type="button" onClick={() => { setEditing(row); setEditError(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Edit</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
      {editing && user?.email && (
        <ScheduleEdit
          title={editing.interviewerName}
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
    </div>
  );
};
