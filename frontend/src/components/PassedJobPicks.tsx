import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, Upload, X } from 'lucide-react';
import { api } from '../services/api';
import { SectionSpinner } from './SectionSpinner';

type Pick = {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
};

const QUERY: Record<string, string> = {
  react: 'React Frontend UI',
  java: 'Java Backend Full Stack',
  golang: 'Golang Backend DevOps',
};

const KEEP: Record<string, RegExp[]> = {
  react: [/react/, /frontend/, /front[- ]?end/, /\bui\b/, /ui\/ux/, /next\.?js/],
  java: [/java/, /backend/, /back[- ]?end/, /full[- ]?stack/, /spring/],
  golang: [/golang/, /\bgo\b/, /backend/, /back[- ]?end/, /devops/, /\bsre\b/, /cloud/],
};

const DROP: Record<string, RegExp[]> = {
  react: [/\bjava\b/, /golang/, /\bgo\b/, /devops/, /backend/, /android/, /\bios\b/, /data scientist/],
  java: [/react/, /frontend/, /front[- ]?end/, /golang/, /\bgo\b/, /android/, /\bios\b/],
  golang: [/react/, /frontend/, /front[- ]?end/, /\bjava\b/, /android/, /\bios\b/],
};

function fits(job: Pick, role: string) {
  const text = `${job.title}`.toLowerCase();
  const keep = KEEP[role] || [];
  const drop = DROP[role] || [];
  return keep.some((rule) => rule.test(text)) && !drop.some((rule) => rule.test(text));
}

export const PassedJobPicks: React.FC<{
  roles: string[];
  prefill?: { name?: string; email?: string; linkedinUrl?: string };
  onStage?: (stage: 'jobs' | 'people') => void;
}> = ({ roles, prefill, onStage }) => {
  const [jobs, setJobs] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState<Pick | null>(null);
  const [fullName, setFullName] = useState(prefill?.name || '');
  const [email, setEmail] = useState(prefill?.email || '');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState(prefill?.linkedinUrl || '');
  const [currentSalary, setCurrentSalary] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [location, setLocation] = useState('');
  const [interviewingAt, setInterviewingAt] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [appliedJob, setAppliedJob] = useState<Pick | null>(null);
  const [interviewers, setInterviewers] = useState<Array<{ id: string; fullName: string; currentCompany: string; currentTitle?: string; previousCompanies: string; linkedinUrl?: string; photoUrl?: string; companies?: Array<{ name: string; logo: string; title?: string }> }>>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [asking, setAsking] = useState('');
  const [schedulePerson, setSchedulePerson] = useState<{ id: string; fullName: string } | null>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotHour, setSlotHour] = useState('10');
  const [slotMinute, setSlotMinute] = useState('00');
  const [slotPeriod, setSlotPeriod] = useState<'AM' | 'PM'>('AM');
  const [slotNote, setSlotNote] = useState('');
  const [openProfileId, setOpenProfileId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const seen = new Set<string>();
      const picked: Pick[] = [];
      for (const role of roles) {
        const live = await api.getLiveInstahyreJobs(QUERY[role] || role, 40, 0).catch(() => []);
        for (const row of live) {
          const job: Pick = {
            id: String(row.id),
            title: row.title || 'Software Engineer',
            company: row.company || row.companyName || 'Tech Company',
            location: row.location || 'India',
            logo: row.logo || row.companyLogo || '',
          };
          if (seen.has(job.id) || !fits(job, role)) continue;
          seen.add(job.id);
          picked.push(job);
          if (picked.length >= 5) break;
        }
        if (picked.length >= 5) break;
      }
      if (!cancelled) {
        setJobs(picked.slice(0, 5));
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [roles.join('|')]);

  useEffect(() => {
    onStage?.(appliedJob ? 'people' : 'jobs');
  }, [appliedJob, onStage]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applyJob) return;
    setBusy(true);
    setError('');
    try {
      let resumeData: string | undefined;
      if (resumeFile) {
        resumeData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(resumeFile);
        });
      }
      await api.applyForJob({
        jobId: applyJob.id,
        jobTitle: applyJob.title,
        companyName: applyJob.company,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        linkedinUrl: linkedinUrl.trim(),
        currentSalary: currentSalary.trim(),
        expectedSalary: expectedSalary.trim(),
        location: location.trim(),
        interviewingAt: interviewingAt.trim(),
        resumeFileName: resumeFile?.name,
        resumeData,
      });
      setDone(applyJob.id);
      setAppliedJob(applyJob);
      setApplyJob(null);
      const picks = await api.interviewerPicks().catch(() => []);
      setInterviewers(picks.slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this application.');
    } finally {
      setBusy(false);
    }
  };

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!appliedJob || !schedulePerson) return;
    setAsking(schedulePerson.id);
    setError('');
    try {
      await api.requestInterview({
        interviewerId: schedulePerson.id,
        candidateName: fullName.trim(),
        candidateEmail: email.trim(),
        jobTitle: appliedJob.title,
        companyName: appliedJob.company,
        date: slotDate,
        time: `${slotHour}:${slotMinute} ${slotPeriod}`,
        note: slotNote.trim(),
      });
      setAsked((current) => (current.includes(schedulePerson.id) ? current : [...current, schedulePerson.id]));
      setSchedulePerson(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this request.');
    } finally {
      setAsking('');
    }
  };

  if (loading) return <SectionSpinner compact label="Finding roles that fit" />;
  if (jobs.length === 0) return <p className="text-sm text-slate-500">No matching roles are open right now.</p>;

  const openPerson = interviewers.find((person) => person.id === openProfileId);

  if (appliedJob) {
    return (
      <section>
        {interviewers.length === 0 ? (
          <p className="text-sm text-slate-500">No approved interviewer profiles are open yet.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {interviewers.map((person) => {
              const initials = person.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
              const sent = asked.includes(person.id);
              const currentKey = person.currentCompany.trim().toLowerCase();
              const currentLogo = (person.companies || []).find((company) => {
                const name = company.name.trim().toLowerCase();
                return name === currentKey || name.includes(currentKey) || currentKey.includes(name);
              });
              const past = (person.companies || []).filter((company) => company.logo && company.name !== currentLogo?.name).slice(0, 4);
              return (
                <article key={person.id} className="flex w-[260px] shrink-0 flex-col items-center rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 pb-4 pt-5 text-center shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600">Meet your interviewer</p>
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt="" className="mt-3 h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md" />
                  ) : (
                    <span className="mt-3 grid h-20 w-20 place-items-center rounded-full bg-slate-900 text-lg font-black text-white ring-4 ring-white shadow-md">{initials || 'IN'}</span>
                  )}
                  <p className="mt-3 text-base font-black text-slate-950">{person.fullName}</p>
                  <p className="mt-1 text-[12px] leading-snug text-slate-500">
                    This is {person.fullName.split(' ')[0]}, currently working{person.currentTitle ? ` as ${person.currentTitle}` : ''} at
                  </p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-black text-violet-700">
                    {currentLogo?.logo && <img src={currentLogo.logo} alt="" className="h-5 w-5 rounded-md bg-white object-contain" />}
                    {person.currentCompany}
                  </p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Worked at</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {past.map((company) => (
                      <img key={company.name} src={company.logo} alt={company.name} title={company.name} className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm" />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={sent || asking === person.id}
                    onClick={() => { setSchedulePerson({ id: person.id, fullName: person.fullName }); setSlotDate(''); setSlotHour('10'); setSlotMinute('00'); setSlotPeriod('AM'); setSlotNote(''); setError(''); }}
                    className="mt-4 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white disabled:bg-emerald-600"
                  >
                    {sent ? 'Requested' : asking === person.id ? 'Sending...' : 'Request interview'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
        {error && !schedulePerson && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        {schedulePerson && createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4">
            <form onSubmit={(event) => void ask(event)} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Schedule interview</p>
              <h2 className="mt-1 text-xl font-black">{schedulePerson.fullName}</h2>
              <label className="mt-4 block text-xs font-bold text-slate-600">Date
                <input required type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="mt-3 block text-xs font-bold text-slate-600">Time
                <span className="mt-1 flex gap-2">
                  <select value={slotHour} onChange={(event) => setSlotHour(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <select value={slotMinute} onChange={(event) => setSlotMinute(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {['00', '15', '30', '45'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                  <select value={slotPeriod} onChange={(event) => setSlotPeriod(event.target.value as 'AM' | 'PM')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </span>
              </label>
              <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">A Google Meet link is created for this interview and set to record automatically.</p>
              <label className="mt-3 block text-xs font-bold text-slate-600">Note
                <textarea value={slotNote} onChange={(event) => setSlotNote(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                Resume attached: {resumeFile?.name || 'the resume from this application'}
              </p>
              {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setSchedulePerson(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={asking === schedulePerson.id} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{asking === schedulePerson.id ? 'Sending...' : 'Send request'}</button>
              </div>
            </form>
          </div>,
          document.body,
        )}
        {openPerson && createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4" onClick={() => setOpenProfileId('')}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-900 text-lg font-black text-white">
                    {openPerson.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'IN'}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Approved interviewer</p>
                    <h3 className="mt-1 text-2xl font-black text-slate-900">{openPerson.fullName}</h3>
                    <p className="text-sm text-slate-500">{openPerson.currentCompany}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpenProfileId('')} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Past companies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(openPerson.previousCompanies || '').split(',').map((name) => name.trim()).filter(Boolean).map((name) => (
                    <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{name}</span>
                  ))}
                  {!openPerson.previousCompanies && <span className="text-sm text-slate-500">None listed</span>}
                </div>
              </div>
              {openPerson.linkedinUrl && (
                <a href={openPerson.linkedinUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center rounded-xl bg-sky-700 px-4 py-3 text-sm font-bold text-white">
                  Open LinkedIn profile
                </a>
              )}
            </div>
          </div>,
          document.body,
        )}
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {jobs.map((job) => (
          <article key={job.id} className="flex h-[148px] w-[220px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{job.company}</p>
            <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-slate-900">{job.title}</p>
            <p className="mt-1 truncate text-[11px] text-slate-500">{job.location}</p>
            <button
              type="button"
              disabled={done === job.id}
              onClick={() => {
                setApplyJob(job);
                setError('');
              }}
              className="mt-auto rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white disabled:bg-emerald-600"
            >
              {done === job.id ? 'Applied' : 'Apply'}
            </button>
          </article>
        ))}
      </div>
      {applyJob && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
          <form onSubmit={(event) => void submit(event)} className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setApplyJob(null)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-500" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <div>
              <p className="mb-2 inline-flex rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">ProfileReel AI talent direct</p>
              <h3 className="text-lg font-bold text-slate-900">Apply for Job Opportunity</h3>
              <p className="mt-0.5 text-xs text-slate-600">Applying for <strong>{applyJob.title}</strong> at {applyJob.company}</p>
            </div>
            <label className="block text-xs font-semibold text-slate-700">Full Name *
              <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">LinkedIn Profile URL *
              <input required type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/username" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700">Email Address *
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Phone Number *
                <input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700">Current Salary / CTC
                <input value={currentSalary} onChange={(event) => setCurrentSalary(event.target.value)} placeholder="e.g. ₹12 LPA" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Expected Salary / CTC
                <input value={expectedSalary} onChange={(event) => setExpectedSalary(event.target.value)} placeholder="e.g. ₹18 LPA" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              </label>
            </div>
            <label className="block text-xs font-semibold text-slate-700">Where are you interviewing at? *
              <input required value={interviewingAt} onChange={(event) => setInterviewingAt(event.target.value)} placeholder="Company name, e.g. Google" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </label>
            <label className="block text-xs font-semibold text-slate-700">Current Location *
              <input required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Bangalore, India" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
            </label>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-700">Attach Resume (PDF / DOCX) *</p>
              <label className="relative block cursor-pointer rounded-xl border-2 border-dashed border-brand-500/30 p-4 text-center">
                <input required type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
                <Upload className="mx-auto h-5 w-5 text-brand-500" />
                <span className="mt-1 block text-xs font-medium text-slate-700">{resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOCX)'}</span>
              </label>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setApplyJob(null)} className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex w-2/3 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                {busy ? 'Submitting Application...' : 'Submit Application'}
                {!busy && <Briefcase className="h-3.5 w-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
