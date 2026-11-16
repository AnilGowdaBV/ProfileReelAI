import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, Moon, Pencil, Sun, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionSpinner, holdMin } from '../components/SectionSpinner';
import { ApiError, api, type CoursePlatformRow, type InterviewerApplicationRow, type JobApplicationRow, type MockTestResultRow } from '../services/api';

const TOKEN_KEY = 'profilereel_admin_token';
const PAPERS = [
  { id: 'react', label: 'React' },
  { id: 'java', label: 'Java' },
  { id: 'golang', label: 'Golang' },
  { id: 'dataengineer', label: 'Data Engineer' },
  { id: 'sdet', label: 'SDET Playwright' },
  { id: 'dataanalyst', label: 'Data Analyst' },
  { id: 'devops', label: 'DevOps' },
];

function togglePaper(current: string[], id: string) {
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

function paperLabels(value?: string) {
  const ids = (value || '').split(',').filter(Boolean);
  const labels = PAPERS.filter((paper) => ids.includes(paper.id)).map((paper) => paper.label);
  return labels.length ? labels.join(', ') : '—';
}

export function readAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = readAdminToken();
    if (!token) return;
    api.adminSession(token).then(() => navigate('/admin', { replace: true })).catch(() => sessionStorage.removeItem(TOKEN_KEY));
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.adminLogin(username, password);
      sessionStorage.setItem(TOKEN_KEY, result.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900">Admin login</h1>
        <label className="mt-4 block text-xs font-bold text-slate-600">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
        </label>
        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {busy ? 'Opening admin desk...' : 'Log in'}
        </button>
      </form>
    </div>
  );
};

function groupPapers(rows: MockTestResultRow[]) {
  const groups = new Map<string, MockTestResultRow[]>();
  for (const row of rows) {
    const key = `${row.email}|${row.testId}|${row.createdAt.slice(0, 19)}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return [...groups.values()]
    .map((items) => {
      const first = items[0];
      const [verdict, detail = ''] = (first.status || '').split(' — ');
      const result = /pass/i.test(verdict) ? 'Passed' : 'Failed';
      const cheated = /copy paste|switching tab/i.test(detail);
      const why = result === 'Passed' ? 'Solved' : cheated ? `Cheated — ${detail}` : 'Could not answer';
      return {
        id: first.id,
        createdAt: first.createdAt,
        fullName: first.fullName,
        email: first.email,
        testId: first.testId,
        result,
        why,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function IconTip({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative grid h-8 w-8 place-items-center rounded-lg ${className || ''}`}
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

const STATUS_LABEL: Record<string, string> = {
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [rows, setRows] = useState<InterviewerApplicationRow[]>([]);
  const [tests, setTests] = useState<MockTestResultRow[]>([]);
  const [jobs, setJobs] = useState<JobApplicationRow[]>([]);
  const [interest, setInterest] = useState<JobApplicationRow[]>([]);
  const [courses, setCourses] = useState<CoursePlatformRow[]>([]);
  const [recordings, setRecordings] = useState<Array<{ id: string; candidateName: string; candidateEmail: string; interviewerName: string; interviewDate: string; interviewTime: string; meetLink: string; state: string; watchUrl: string; detail?: string }>>([]);
  const [courseName, setCourseName] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [coursePurpose, setCoursePurpose] = useState('');
  const [coursePapers, setCoursePapers] = useState<string[]>([]);
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editPapers, setEditPapers] = useState<string[]>([]);
  const [section, setSection] = useState('');
  const [theme, setTheme] = useState(() => (localStorage.getItem('profilereel_admin_theme') === 'light' ? 'light' : 'dark'));
  const [filter, setFilter] = useState('ALL');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addLinkedin, setAddLinkedin] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [booting, setBooting] = useState(true);
  const [paneBusy, setPaneBusy] = useState(false);
  const paneTimer = useRef<number | null>(null);

  const load = (token: string) =>
    Promise.all([
      api.mockTestResults(token).then(setTests).catch(() => setTests([])),
      api.jobApplications(token, 'jobs').then(setJobs).catch(() => setJobs([])),
      api.jobApplications(token, 'interest').then(setInterest).catch(() => setInterest([])),
      api.coursePlatforms().then(setCourses).catch(() => setCourses([])),
      api.interviewerApplications(token).then(setRows).catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load applications.');
      }),
    ]);

  const openSection = (id: string) => {
    if (id === section) return;
    setSection(id);
    setPaneBusy(true);
    if (id === 'recordings') {
      const token = readAdminToken();
      api.interviewRecordings(token)
        .then(setRecordings)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load recordings.'));
    }
    if (paneTimer.current) window.clearTimeout(paneTimer.current);
    paneTimer.current = window.setTimeout(() => setPaneBusy(false), 480);
  };

  useEffect(() => () => {
    if (paneTimer.current) window.clearTimeout(paneTimer.current);
  }, []);

  useEffect(() => {
    const token = readAdminToken();
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    const begun = Date.now();
    api.adminSession(token)
      .then(async (session) => {
        setUsername(session.username);
        await load(token);
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        navigate('/admin/login', { replace: true });
      })
      .finally(() => {
        void holdMin(begun, 560).then(() => setBooting(false));
      });
  }, [navigate]);

  const decide = async (id: string, status: string) => {
    const token = readAdminToken();
    setBusyId(id);
    try {
      const updated = await api.setInterviewerStatus(token, id, status);
      setRows((current) => current.map((row) => (row.id === id ? updated : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this application.');
    } finally {
      setBusyId('');
    }
  };

  const papers = groupPapers(tests);
  const visible = rows.filter((row) => filter === 'ALL' || row.status === filter);
  const count = (status: string) => rows.filter((row) => row.status === status).length;

  const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  const activity = [
    ...rows.map((row) => ({ id: row.id, title: 'Interviewer request', detail: row.fullName, at: row.createdAt, section: 'review' })),
    ...papers.map((paper) => ({ id: paper.id, title: `Test ${paper.result.toLowerCase()}`, detail: `${paper.fullName} · ${paper.testId}`, at: paper.createdAt, section: 'tests' })),
    ...jobs.map((row) => ({ id: row.id, title: 'Job application', detail: `${row.fullName} · ${row.jobTitle}`, at: row.createdAt, section: 'jobs' })),
    ...interest.map((row) => ({ id: row.id, title: 'Company interest', detail: `${row.fullName} · ${row.companyName}`, at: row.createdAt, section: 'interest' })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  const dark = theme === 'dark';
  const panel = dark ? 'border border-white/10 bg-[#14182e] text-white' : 'bg-white text-slate-900 shadow-sm';
  const soft = dark ? 'bg-white/5' : 'bg-[#f6f4fb]';
  const kicker = dark ? 'text-violet-300' : 'text-violet-700';
  const chooseTheme = (next: 'light' | 'dark') => {
    localStorage.setItem('profilereel_admin_theme', next);
    setTheme(next);
  };
  const navClass = (id: string) => `mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${section === id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' : dark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-violet-50'}`;
  const pillClass = (id: string) => `rounded-full px-2 py-0.5 text-[11px] font-bold ${section === id ? 'bg-white/20 text-white' : dark ? 'bg-white/10 text-violet-200' : 'bg-violet-50 text-violet-800'}`;
  const paneLabel: Record<string, string> = {
    '': 'Opening home',
    review: 'Loading interviewer requests',
    'add-interviewer': 'Opening add interviewer',
    tests: 'Loading test results',
    jobs: 'Loading job applications',
    interest: 'Loading company interest',
    courses: 'Loading course platforms',
    recordings: 'Loading recordings',
  };

  if (booting) {
    return (
      <div className={`flex h-screen items-center justify-center ${dark ? 'bg-[#070b16]' : 'bg-[#f4f2fb]'}`}>
        <SectionSpinner dark={dark} label="Opening admin desk" />
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${dark ? 'bg-[#070b16]' : 'bg-[#f4f2fb]'} text-slate-900`}>
      <aside className={`flex w-[250px] shrink-0 flex-col border-r ${dark ? 'border-white/10 bg-[#0c1024]' : 'border-slate-200 bg-white'}`}>
        <button type="button" onClick={() => openSection('')} className="flex items-center gap-3 px-4 py-4 text-left">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">PR</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">ProfileReel</p>
            <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>Home</p>
          </div>
        </button>

        <nav className="px-3">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <button type="button" onClick={() => openSection('')} className={navClass('')}>
            <span className="text-sm font-bold">Home</span>
          </button>
          <button type="button" onClick={() => openSection('review')} className={navClass('review')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Profile under review</span>
              <span className={`block text-[11px] ${section === 'review' ? 'text-white/70' : 'text-slate-500'}`}>Interviewer requests</span>
            </span>
            <span className={pillClass('review')}>{rows.length}</span>
          </button>
          <button type="button" onClick={() => openSection('add-interviewer')} className={navClass('add-interviewer')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Add interviewer</span>
              <span className={`block text-[11px] ${section === 'add-interviewer' ? 'text-white/70' : 'text-slate-500'}`}>Approved login</span>
            </span>
          </button>
          <button type="button" onClick={() => openSection('tests')} className={navClass('tests')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Test results</span>
              <span className={`block text-[11px] ${section === 'tests' ? 'text-white/70' : 'text-slate-500'}`}>Mock test papers</span>
            </span>
            <span className={pillClass('tests')}>{papers.length}</span>
          </button>
          <button type="button" onClick={() => openSection('jobs')} className={navClass('jobs')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Job applications</span>
              <span className={`block text-[11px] ${section === 'jobs' ? 'text-white/70' : 'text-slate-500'}`}>Applied roles</span>
            </span>
            <span className={pillClass('jobs')}>{jobs.length}</span>
          </button>
          <button type="button" onClick={() => openSection('interest')} className={navClass('interest')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Interest received</span>
              <span className={`block text-[11px] ${section === 'interest' ? 'text-white/70' : 'text-slate-500'}`}>Company interest</span>
            </span>
            <span className={pillClass('interest')}>{interest.length}</span>
          </button>
          <button type="button" onClick={() => openSection('recordings')} className={navClass('recordings')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Recordings</span>
              <span className={`block text-[11px] ${section === 'recordings' ? 'text-white/70' : 'text-slate-500'}`}>Interview meetings</span>
            </span>
            <span className={pillClass('recordings')}>{recordings.length}</span>
          </button>
          <button type="button" onClick={() => openSection('courses')} className={navClass('courses')}>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Course platforms</span>
              <span className={`block text-[11px] ${section === 'courses' ? 'text-white/70' : 'text-slate-500'}`}>Name and website</span>
            </span>
            <span className={pillClass('courses')}>{courses.length}</span>
          </button>
        </nav>

        <div className={`mt-auto border-t p-4 ${dark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-black text-white">{(username || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{username || 'Admin'}</p>
              <p className="text-[11px] text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(TOKEN_KEY);
              navigate('/admin/login', { replace: true });
            }}
            className={`w-full rounded-xl py-2.5 text-xs font-bold text-white ${dark ? 'bg-white/10' : 'bg-slate-900'}`}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className={`relative min-h-0 min-w-0 flex-1 ${section === '' ? 'overflow-hidden p-3' : 'overflow-auto px-5 py-5'}`}>
        {paneBusy && <SectionSpinner overlay dark={dark} label={paneLabel[section] || 'Loading'} />}
        <button
          type="button"
          onClick={() => chooseTheme(dark ? 'light' : 'dark')}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
          className={`absolute right-4 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl border shadow-sm ${dark ? 'border-white/10 bg-[#14182e] text-amber-300' : 'border-slate-200 bg-white text-slate-700'}`}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {section === '' && (
          <AdminHome
            light={!dark}
            username={username || 'admin'}
            cards={[
              { id: 'review', label: 'Profile under review', hint: 'Interview requests', count: rows.length, color: '#a78bfa' },
              { id: 'tests', label: 'Test results', hint: 'Mock papers', count: papers.length, color: '#34d399' },
              { id: 'jobs', label: 'Job applications', hint: 'Applied roles', count: jobs.length, color: '#60a5fa' },
              { id: 'interest', label: 'Interest received', hint: 'Company interest', count: interest.length, color: '#fb923c' },
            ]}
            activity={activity}
            slices={[
              { label: 'Under review', count: rows.filter((row) => row.status === 'UNDER_REVIEW').length, color: '#a78bfa' },
              { label: 'Tested', count: papers.length, color: '#34d399' },
              { label: 'Applied', count: jobs.length, color: '#60a5fa' },
              { label: 'Interest', count: interest.length, color: '#fb923c' },
            ]}
            series={dailySeries([...rows, ...papers, ...jobs, ...interest].map((item) => item.createdAt))}
            onOpen={openSection}
          />
        )}

        {section === 'add-interviewer' && (
          <form
            className={`grid max-w-xl gap-3 rounded-xl p-5 ${panel}`}
            onSubmit={(event) => {
              event.preventDefault();
              const token = readAdminToken();
              setAdding(true);
              setError('');
              api.addInterviewer(token, {
                fullName: addName.trim(),
                email: addEmail.trim(),
                password: addPassword,
                linkedinUrl: addLinkedin.trim(),
                currentCompany: addCompany.trim(),
              })
                .then((row) => {
                  setRows((current) => [row, ...current.filter((item) => item.id !== row.id)]);
                  setAddName('');
                  setAddEmail('');
                  setAddPassword('');
                  setAddLinkedin('');
                  setAddCompany('');
                  setError('');
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Could not add this interviewer.'))
                .finally(() => setAdding(false));
            }}
          >
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${kicker}`}>Direct add</p>
              <h1 className="text-lg font-black">Add an interviewer</h1>
              <p className={`mt-1 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>They are saved as approved and can log in with this email and password.</p>
            </div>
            <input required value={addName} onChange={(event) => setAddName(event.target.value)} placeholder="Name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input required type="email" value={addEmail} onChange={(event) => setAddEmail(event.target.value)} placeholder="Email" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input required minLength={6} type="password" value={addPassword} onChange={(event) => setAddPassword(event.target.value)} placeholder="Password" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input required value={addCompany} onChange={(event) => setAddCompany(event.target.value)} placeholder="Currently working at" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input required type="url" value={addLinkedin} onChange={(event) => setAddLinkedin(event.target.value)} placeholder="LinkedIn URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button type="submit" disabled={adding} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {adding ? 'Reading LinkedIn and saving...' : 'Add as approved'}
            </button>
          </form>
        )}

        {section === 'recordings' && (
          <section className={`rounded-xl p-5 ${panel}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${kicker}`}>Meetings</p>
            <h1 className="text-lg font-black">Recordings</h1>
            <p className={`mt-1 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>A file appears here after the company Meet account finishes recording the interview.</p>
            <div className="mt-4 grid gap-3">
              {recordings.length === 0 && <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No scheduled meetings yet.</p>}
              {recordings.map((row) => (
                <article key={row.id} className={`rounded-xl px-4 py-3 ${soft}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{row.candidateName}</p>
                      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{row.candidateEmail} · with {row.interviewerName || 'interviewer'}</p>
                      <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{row.interviewDate} {row.interviewTime}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                      {row.state === 'FILE_GENERATED' ? 'Ready' : row.state === 'PASTED_LINK' ? 'Older pasted link' : 'Waiting for the meeting'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                    {row.meetLink && <a href={row.meetLink} target="_blank" rel="noreferrer" className="text-sky-600">Open meeting</a>}
                    {row.watchUrl && <a href={row.watchUrl} target="_blank" rel="noreferrer" className="text-violet-600">Watch recording</a>}
                  </div>
                  {row.detail && <p className="mt-2 text-xs text-rose-500">{row.detail}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'review' && (
          <>
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${panel}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${kicker}`}>Applications</p>
                <h1 className="text-lg font-black leading-tight">Profile under review</h1>
              </div>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{rows.length} request{rows.length === 1 ? '' : 's'}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['ALL', 'All', rows.length, 'bg-slate-900'],
                ['UNDER_REVIEW', 'Waiting', count('UNDER_REVIEW'), 'bg-amber-500'],
                ['APPROVED', 'Approved', count('APPROVED'), 'bg-emerald-500'],
                ['REJECTED', 'Rejected', count('REJECTED'), 'bg-rose-500'],
              ].map(([status, label, value, tone]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(String(status))}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${filter === status ? `${tone} text-white shadow-md` : dark ? 'bg-white/10 text-slate-200' : 'bg-white text-slate-600'}`}
                >
                  {label} · {value}
                </button>
              ))}
            </div>

            {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="mt-3 space-y-3">
              {visible.length === 0 && (
                <div className={`rounded-xl px-4 py-8 text-center text-sm ${dark ? 'text-slate-400' : 'text-slate-500'} ${panel}`}>No applications in this view.</div>
              )}
              {visible.map((row) => {
                const previous = row.previousCompanies.split(',').map((item) => item.trim()).filter(Boolean);
                const fields = [
                  ['Name', row.fullName],
                  ['Currently working at', row.currentCompany || 'Not given'],
                  ['Gmail', row.email],
                  ['Phone number', row.phone],
                  ['Submitted', new Date(row.createdAt).toLocaleString()],
                ];
                return (
                  <article key={row.id} className={`relative w-full overflow-hidden rounded-2xl px-5 py-4 ${panel}`}>
                    {row.status === 'APPROVED' && (
                      <div className="pointer-events-none absolute right-8 top-14 rotate-[-12deg] rounded-lg border-4 border-emerald-600 px-4 py-1 text-2xl font-black uppercase tracking-[0.2em] text-emerald-600">
                        Approved
                      </div>
                    )}
                    {row.status === 'REJECTED' && (
                      <div className="pointer-events-none absolute right-8 top-14 rotate-[-12deg] rounded-lg border-4 border-rose-600 px-4 py-1 text-2xl font-black uppercase tracking-[0.2em] text-rose-600">
                        Rejected
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-[11px] font-black text-white">{initials(row.fullName) || 'PR'}</div>
                        <h2 className="text-base font-black">{row.fullName}</h2>
                      </div>
                      {row.status === 'UNDER_REVIEW' && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">Under review</span>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {fields.map(([label, value]) => (
                        <div key={label} className={`rounded-xl px-3 py-2 ${soft}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${kicker}`}>{label}</p>
                          <p className={`mt-1 break-all text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 rounded-xl px-3 py-2 ${soft}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${kicker}`}>LinkedIn profile</p>
                      <a href={row.linkedinUrl} target="_blank" rel="noreferrer" className={`mt-1 block break-all text-sm font-semibold ${kicker}`}>{row.linkedinUrl}</a>
                    </div>
                    <div className="mt-3">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${kicker}`}>Previous companies</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previous.length === 0 && <span className="text-xs text-slate-400">None found</span>}
                        {previous.map((company) => (
                          <span key={company} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-50 text-violet-800'}`}>{company}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" disabled={busyId === row.id} onClick={() => void decide(row.id, 'APPROVED')} className="rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">Approve</button>
                      <button type="button" disabled={busyId === row.id} onClick={() => void decide(row.id, 'REJECTED')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">Reject</button>
                      <button type="button" disabled={busyId === row.id} onClick={() => void decide(row.id, 'UNDER_REVIEW')} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-50 ${dark ? 'bg-white/10 text-slate-200' : 'bg-stone-100 text-slate-600'}`}>Hold</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {section === 'tests' && (
          <>
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${panel}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${kicker}`}>Mock tests</p>
                <h1 className="text-lg font-black leading-tight">Test results</h1>
              </div>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{papers.length} papers</p>
            </div>
            <div className={`mt-3 overflow-hidden rounded-2xl ${panel}`}>
              {papers.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No test results saved yet. New submissions will appear here.</p>}
              {papers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className={`${dark ? 'bg-white/5 text-violet-200' : 'bg-[#f6f4fb] text-violet-800'} text-[10px] uppercase tracking-[0.12em]`}>
                      <tr>
                        {['Submitted', 'Candidate', 'Gmail', 'Test', 'Result', 'Why'].map((label) => (
                          <th key={label} className="px-3 py-2 font-bold">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {papers.map((paper) => (
                        <tr key={paper.id} className={`border-t ${dark ? 'border-white/10' : 'border-stone-100'}`}>
                          <td className={`px-3 py-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(paper.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 font-semibold">{paper.fullName}</td>
                          <td className="px-3 py-2 text-xs">{paper.email}</td>
                          <td className="px-3 py-2">{paper.testId}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${paper.result === 'Passed' ? 'bg-teal-50 text-teal-800' : 'bg-rose-50 text-rose-700'}`}>{paper.result}</span>
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold">{paper.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {(section === 'jobs' || section === 'interest') && (
          <ApplicationTable
            title={section === 'jobs' ? 'Job applications' : 'Interest received'}
            kicker={section === 'jobs' ? 'Applied roles' : 'Company interest'}
            dark={dark}
            rows={section === 'jobs' ? jobs : interest}
          />
        )}

        {section === 'courses' && (
          <>
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${panel}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${kicker}`}>Failed-test recommendations</p>
                <h1 className="text-lg font-black leading-tight">Course platforms</h1>
              </div>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{courses.length} platforms</p>
            </div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setError('');
                if (coursePapers.length === 0) {
                  setError('Choose which failed paper this platform is for.');
                  return;
                }
                try {
                  const saved = await api.addCoursePlatform(readAdminToken(), { name: courseName, url: courseUrl, purpose: coursePurpose, recommendFor: coursePapers.join(',') });
                  setCourses((current) => [...current, saved]);
                  setCourseName('');
                  setCourseUrl('');
                  setCoursePurpose('');
                  setCoursePapers([]);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not save this platform.');
                }
              }}
              className={`mt-3 grid gap-2 rounded-2xl px-4 py-4 sm:grid-cols-[1fr_1.2fr_1fr_auto] ${panel}`}
            >
              <input value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Name" required className={`rounded-xl px-3 py-2 text-sm ${dark ? 'bg-white/5 text-white' : 'border border-slate-200'}`} />
              <input value={courseUrl} onChange={(event) => setCourseUrl(event.target.value)} placeholder="Website link" required className={`rounded-xl px-3 py-2 text-sm ${dark ? 'bg-white/5 text-white' : 'border border-slate-200'}`} />
              <input value={coursePurpose} onChange={(event) => setCoursePurpose(event.target.value)} placeholder="Meant for, e.g. DSA" className={`rounded-xl px-3 py-2 text-sm ${dark ? 'bg-white/5 text-white' : 'border border-slate-200'}`} />
              <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">Add</button>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-4">
                <span className={`text-[11px] font-bold ${dark ? 'text-slate-300' : 'text-slate-500'}`}>Recommend after fail</span>
                {PAPERS.map((paper) => (
                  <label key={paper.id} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${coursePapers.includes(paper.id) ? 'bg-violet-600 text-white' : dark ? 'bg-white/10 text-slate-200' : 'bg-violet-50 text-violet-800'}`}>
                    <input type="checkbox" className="sr-only" checked={coursePapers.includes(paper.id)} onChange={() => setCoursePapers((current) => togglePaper(current, paper.id))} />
                    {paper.label}
                  </label>
                ))}
              </div>
            </form>
            {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
            <div className={`mt-3 overflow-visible rounded-2xl ${panel}`}>
              {courses.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No platforms saved yet.</p>}
              {courses.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className={`${dark ? 'bg-white/5 text-violet-200' : 'bg-[#f6f4fb] text-violet-800'} text-[10px] uppercase tracking-[0.12em]`}>
                    <tr>
                      {['Name', 'Website', 'Meant for', 'After fail', ''].map((label) => (
                        <th key={label || 'actions'} className="px-3 py-2 font-bold">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => {
                      const editing = editingId === course.id;
                      const field = `w-full rounded-lg px-2 py-1.5 text-sm ${dark ? 'bg-white/5 text-white' : 'border border-slate-200 bg-white'}`;
                      return (
                        <tr key={course.id} className={`border-t ${dark ? 'border-white/10' : 'border-stone-100'}`}>
                          <td className="px-3 py-2 font-semibold">
                            {editing ? <input value={editName} onChange={(event) => setEditName(event.target.value)} className={field} /> : course.name}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {editing ? (
                              <input value={editUrl} onChange={(event) => setEditUrl(event.target.value)} className={field} />
                            ) : (
                              <a href={course.url} target="_blank" rel="noreferrer" className={kicker}>{course.url}</a>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {editing ? <input value={editPurpose} onChange={(event) => setEditPurpose(event.target.value)} className={field} /> : (course.purpose || '—')}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {editing ? (
                              <div className="flex flex-wrap gap-1">
                                {PAPERS.map((paper) => (
                                  <label key={paper.id} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${editPapers.includes(paper.id) ? 'bg-violet-600 text-white' : dark ? 'bg-white/10' : 'bg-violet-50 text-violet-800'}`}>
                                    <input type="checkbox" className="sr-only" checked={editPapers.includes(paper.id)} onChange={() => setEditPapers((current) => togglePaper(current, paper.id))} />
                                    {paper.label}
                                  </label>
                                ))}
                              </div>
                            ) : paperLabels(course.recommendFor)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              {editing ? (
                                <>
                                  <IconTip
                                    label="Save"
                                    className={dark ? 'text-emerald-300 hover:bg-white/10' : 'text-emerald-600 hover:bg-emerald-50'}
                                    onClick={() => {
                                      if (editPapers.length === 0) {
                                        setError('Choose which failed paper this platform is for.');
                                        return;
                                      }
                                      void api.updateCoursePlatform(readAdminToken(), course.id, { name: editName, url: editUrl, purpose: editPurpose, recommendFor: editPapers.join(',') }).then((saved) => {
                                        setCourses((current) => current.map((row) => (row.id === saved.id ? saved : row)));
                                        setEditingId('');
                                        setError('');
                                      }).catch((err) => setError(err instanceof Error ? err.message : 'Could not update this platform.'));
                                    }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </IconTip>
                                  <IconTip
                                    label="Cancel"
                                    className={dark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}
                                    onClick={() => setEditingId('')}
                                  >
                                    <X className="h-4 w-4" />
                                  </IconTip>
                                </>
                              ) : (
                                <>
                                  <IconTip
                                    label="Edit"
                                    className={dark ? 'text-violet-200 hover:bg-white/10' : 'text-violet-600 hover:bg-violet-50'}
                                    onClick={() => {
                                      setEditingId(course.id);
                                      setEditName(course.name);
                                      setEditUrl(course.url);
                                      setEditPurpose(course.purpose || '');
                                      setEditPapers((course.recommendFor || '').split(',').filter(Boolean));
                                      setError('');
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </IconTip>
                                  <IconTip
                                    label="Remove"
                                    className={dark ? 'text-rose-300 hover:bg-white/10' : 'text-rose-600 hover:bg-rose-50'}
                                    onClick={() => {
                                      void api.removeCoursePlatform(readAdminToken(), course.id).then(() => {
                                        setCourses((current) => current.filter((row) => row.id !== course.id));
                                        if (editingId === course.id) setEditingId('');
                                      }).catch((err) => setError(err instanceof Error ? err.message : 'Could not remove this platform.'));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </IconTip>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

function dailySeries(dates: string[]) {
  const days = 14;
  const buckets = Array.from({ length: days }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (days - 1 - index));
    return { day, count: 0 };
  });
  for (const value of dates) {
    const time = new Date(value).getTime();
    const bucket = buckets.find((item) => time >= item.day.getTime() && time < item.day.getTime() + 86400000);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

const AdminHome: React.FC<{
  light?: boolean;
  username: string;
  cards: { id: string; label: string; hint: string; count: number; color: string }[];
  activity: { id: string; title: string; detail: string; at: string; section: string }[];
  slices: { label: string; count: number; color: string }[];
  series: { day: Date; count: number }[];
  onOpen: (id: string) => void;
}> = ({ light, username, cards, activity, slices, series, onOpen }) => {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0) || 1;
  const max = Math.max(1, ...series.map((point) => point.count));
  const coords = series.map((point, index) => [16 + (index / (series.length - 1)) * 250, 8 + (1 - point.count / max) * 68]);
  const points = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `16,76 ${points} 266,76`;
  let offset = 0;
  const rings = slices.map((slice) => {
    const length = (slice.count / total) * 100;
    const ring = { ...slice, length, offset };
    offset += length;
    return ring;
  });
  const saved = slices.reduce((sum, slice) => sum + slice.count, 0);
  const box = light ? 'rounded-2xl border border-violet-100 bg-white text-slate-900 shadow-sm' : 'rounded-2xl border border-white/10 bg-[#14182e]';
  return (
    <div className={`grid h-full grid-rows-[auto_auto_minmax(0,1.05fr)_minmax(0,0.95fr)] gap-2.5 ${light ? 'text-slate-900' : 'text-white'}`}>
      <div className={`flex items-center justify-between overflow-hidden rounded-2xl border px-4 py-2.5 ${light ? 'border-violet-100 bg-gradient-to-r from-violet-100 to-white' : 'border-violet-400/20 bg-gradient-to-r from-[#1a1033] via-[#14182e] to-[#12182e]'}`}>
        <div>
          <p className="text-[11px] text-violet-200">Welcome back, {username}</p>
          <h1 className={`text-xl font-black leading-tight ${light ? 'text-slate-900' : 'bg-gradient-to-r from-white to-fuchsia-300 bg-clip-text text-transparent'}`}>Good to see you again</h1>
          <p className={`text-[11px] ${light ? 'text-slate-500' : 'text-slate-400'}`}>Every request, test, application, and company interest in one place.</p>
        </div>
        <span className="w-10" />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card) => (
          <button key={card.id} type="button" onClick={() => onOpen(card.id)} className={`${box} px-3 py-2.5 text-left shadow-[0_0_24px_rgba(124,58,237,0.08)] hover:border-violet-400/50`}>
            <div className="flex items-start justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-white" style={{ background: card.color }}>{card.count}</span>
              <svg width="58" height="20" viewBox="0 0 72 28" aria-hidden="true"><path d="M0 20 C12 18 18 8 28 12 S48 24 72 6" fill="none" stroke={card.color} strokeWidth="2" /></svg>
            </div>
            <p className="mt-2 text-xs font-bold">{card.label}</p>
            <p className="text-[11px] text-slate-400">{card.hint}</p>
          </button>
        ))}
      </div>
      <div className="grid min-h-0 grid-cols-[1.45fr_0.9fr] gap-2.5">
        <div className={`flex min-h-0 flex-col ${box} p-3`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Overview</p>
            <p className="text-[11px] text-slate-400">Last 14 days</p>
          </div>
          <svg viewBox="0 0 280 90" className="mt-1 min-h-0 w-full flex-1">
            <defs>
              <linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((line) => <line key={line} x1="16" x2="266" y1={8 + line * 22} y2={8 + line * 22} stroke="#ffffff14" />)}
            <polygon points={area} fill="url(#overviewFill)" />
            <polyline points={points} fill="none" stroke="#c4b5fd" strokeWidth="2.4" />
            <circle cx={coords[coords.length - 1]?.[0]} cy={coords[coords.length - 1]?.[1]} r="3.5" fill="#fff" stroke="#a78bfa" />
          </svg>
          <div className="flex justify-between px-4 text-[10px] text-slate-500">
            <span>{series[0]?.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{series[Math.floor(series.length / 2)]?.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{series[series.length - 1]?.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        <div className={`flex min-h-0 flex-col ${box} p-3`}>
          <p className="text-sm font-bold">Quick actions</p>
          <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 gap-2">
            {cards.map((card) => (
              <button key={card.id} type="button" onClick={() => onOpen(card.id)} className="rounded-xl bg-white/5 px-2.5 py-2 text-left hover:bg-white/10">
                <span className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-black text-white" style={{ background: card.color }}>{card.count}</span>
                <span className="mt-1 block text-[11px] font-bold leading-4">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-[1.25fr_0.85fr] gap-2.5">
        <div className={`flex min-h-0 flex-col ${box} p-3`}>
          <p className="text-sm font-bold">Recent activity</p>
          <div className="mt-2 grid min-h-0 flex-1 content-between">
            {activity.length === 0 && <p className="text-sm text-slate-400">Nothing saved yet.</p>}
            {activity.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpen(item.section)} className="flex items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-white/5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{item.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{item.detail}</span>
                </span>
                <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-200">{new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={`flex min-h-0 items-center gap-4 ${box} p-3`}>
          <div className="relative grid h-28 w-28 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4.5" />
              {rings.map((ring) => (
                <circle key={ring.label} cx="18" cy="18" r="14" fill="none" stroke={ring.color} strokeWidth="4.5" strokeDasharray={`${ring.length} ${100 - ring.length}`} strokeDashoffset={-ring.offset} pathLength="100" />
              ))}
            </svg>
            <div className="text-center">
              <p className="text-xl font-black leading-none">{saved}</p>
              <p className="text-[10px] text-slate-400">Total</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">Application status</p>
            <div className="mt-2 space-y-1 text-xs">
              {slices.map((slice) => (
                <p key={slice.label} className="text-slate-300">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: slice.color }} />
                  {slice.label}
                  <span className="ml-2 text-slate-500">{slice.count} ({Math.round((slice.count / total) * 100)}%)</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationTable: React.FC<{ title: string; kicker: string; rows: JobApplicationRow[]; dark: boolean }> = ({ title, kicker, rows, dark }) => {
  const [preview, setPreview] = useState<{ name: string; src: string } | null>(null);
  const [busyId, setBusyId] = useState('');
  const [resumeError, setResumeError] = useState('');

  const closePreview = () => {
    if (preview?.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
    setPreview(null);
  };

  const openResume = async (row: JobApplicationRow) => {
    setBusyId(row.id);
    setResumeError('');
    try {
      const file = await api.applicationResume(readAdminToken(), row.id);
      const raw = file.resumeData || file.resumeUrl;
      let src = raw;
      if (raw.startsWith('data:')) {
        const [meta, encoded] = raw.split(',');
        const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/pdf';
        const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
        src = URL.createObjectURL(new Blob([bytes], { type: mime }));
      }
      setPreview({ name: file.fileName || row.fullName, src });
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Could not open this resume.');
    } finally {
      setBusyId('');
    }
  };

  return (
  <>
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${dark ? 'border border-white/10 bg-[#14182e] text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-violet-300' : 'text-violet-700'}`}>{kicker}</p>
        <h1 className="text-lg font-black leading-tight">{title}</h1>
      </div>
      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{rows.length} rows</p>
    </div>
    <div className={`mt-3 overflow-hidden rounded-2xl ${dark ? 'border border-white/10 bg-[#14182e] text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
      {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">Nothing saved yet.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className={`${dark ? 'bg-white/5 text-violet-200' : 'bg-[#f6f4fb] text-violet-800'} text-[10px] uppercase tracking-[0.12em]`}>
              <tr>
                {['Candidate', 'Gmail', 'Phone', 'Job', 'Company', 'Location', 'Interviewing at', 'Resume'].map((label) => (
                  <th key={label} className="px-3 py-2 font-bold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t ${dark ? 'border-white/10' : 'border-stone-100'}`}>
                  <td className="px-3 py-2 font-semibold">{row.fullName}</td>
                  <td className="px-3 py-2 text-xs">{row.email}</td>
                  <td className="px-3 py-2 text-xs">{row.phone}</td>
                  <td className="px-3 py-2">{row.jobTitle}</td>
                  <td className="px-3 py-2">{row.companyName}</td>
                  <td className="px-3 py-2 text-xs">{row.location || '—'}</td>
                  <td className="px-3 py-2 text-xs">{row.interviewingAt || '—'}</td>
                  <td className="px-3 py-2">
                    {row.hasResume ? (
                      <button type="button" disabled={busyId === row.id} onClick={() => void openResume(row)} title="View resume" aria-label="View resume" className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white disabled:opacity-50">
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {resumeError && <p className="mt-2 text-xs text-rose-500">{resumeError}</p>}
    {preview && (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" onClick={closePreview}>
        <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-900">{preview.name}</p>
            <button type="button" onClick={closePreview} aria-label="Close resume" className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <iframe title={preview.name} src={preview.src} className="min-h-0 w-full flex-1 bg-slate-100" />
        </div>
      </div>
    )}
  </>
  );
};
