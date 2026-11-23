import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Loader2, Upload, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_TESTS } from '../data/mockTests';
import { PracticeCourseCards } from './PracticeCourseCards';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../services/api';
import {
  MOCK_TEST_COMPLETED_EVENT,
  MOCK_TEST_JUST_SUBMITTED_KEY,
  MOCK_TEST_PAID_EVENT,
  MOCK_TEST_PAID_MESSAGE,
  MOCK_TEST_PAYWALL_ENABLED,
  getCompletedMockTests,
  getMockTestUnlockRemaining,
  getPaidMockTests,
  hasOpenMockTestAttempt,
  isMockTestCompleted,
  isMockTestPaid,
  markMockTestPaid,
  startJobApplyCheckout,
  startMockTestCheckout,
} from '../lib/mockTestAccess';

export const MockTestsSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [paidIds, setPaidIds] = useState<string[]>(() => getPaidMockTests());
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCompletedMockTests());
  const [payingId, setPayingId] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [detailsTestId, setDetailsTestId] = useState<string | null>(null);
  const [formSaved, setFormSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [fullName, setFullName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [interviewingAt, setInterviewingAt] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [shownJobs, setShownJobs] = useState<Array<{ id: string; title: string; company: string; location: string; logo: string }>>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [incomingJobs, setIncomingJobs] = useState<Array<{ id: string; title: string; company: string; location: string; logo: string }>>([]);
  const [applyJob, setApplyJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [paywallJob, setPaywallJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [paywallBusy, setPaywallBusy] = useState(false);
  const [interviewers, setInterviewers] = useState<Array<{ id: string; fullName: string; currentCompany: string; currentTitle: string; photoUrl: string; companies: Array<{ name: string; logo: string; title: string }> }>>([]);
  const jobQueue = React.useRef<Array<{ id: string; title: string; company: string; location: string; logo: string }>>([]);
  const jobOffset = React.useRef(0);

  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(MOCK_TEST_JUST_SUBMITTED_KEY) === '1';
    } catch {
      flagged = false;
    }
    const fromState = Boolean((location.state as { mockTestSubmitted?: boolean } | null)?.mockTestSubmitted);
    if (!flagged && !fromState) return;
    setJustSubmitted(true);
    requestAnimationFrame(() => {
      document.getElementById('mock-tests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(MOCK_TEST_JUST_SUBMITTED_KEY);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidFromUrl = params.get('mock_test');
    if (paidFromUrl && isMockTestPaid(paidFromUrl) && !isMockTestCompleted(paidFromUrl)) {
      setJustUnlocked(paidFromUrl);
    }

    const refresh = (testId?: string) => {
      setPaidIds(getPaidMockTests());
      setCompletedIds(getCompletedMockTests());
      if (testId && !isMockTestCompleted(testId)) setJustUnlocked(testId);
    };
    const onPaid = (event: Event) => {
      const testId = (event as CustomEvent).detail?.testId as string | undefined;
      refresh(testId);
      document.getElementById('mock-tests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === MOCK_TEST_PAID_MESSAGE && event.data.testId) {
        markMockTestPaid(event.data.testId);
        refresh(event.data.testId);
        document.getElementById('mock-tests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    const onStorage = () => refresh();
    const onCompleted = () => refresh();
    window.addEventListener(MOCK_TEST_PAID_EVENT, onPaid);
    window.addEventListener(MOCK_TEST_COMPLETED_EVENT, onCompleted);
    window.addEventListener('storage', onStorage);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener(MOCK_TEST_PAID_EVENT, onPaid);
      window.removeEventListener(MOCK_TEST_COMPLETED_EVENT, onCompleted);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    jobQueue.current = [];
    const track = user?.jobTrack === 'frontend' ? 'frontend' : 'backend';
    const skill = track === 'frontend' ? (user?.jobSkill || 'React') : (user?.jobSkill || 'Java');
    const pullIntoQueue = async () => {
      const live = await Promise.race([
        api.getLiveInstahyreJobs(skill, 40, 0, track === 'frontend' ? undefined : 'companies').catch(() => []),
        new Promise<any[]>((resolve) => window.setTimeout(() => resolve([]), 2000)),
      ]);
      const rows = Array.isArray(live) && live.length > 0 ? live : track === 'frontend' ? [
        ['razorpay', 'Razorpay', 'Frontend Engineer', 'Bangalore', 'razorpay.com'],
        ['meesho-fe', 'Meesho', 'Frontend Developer', 'Bangalore', 'meesho.com'],
        ['cred', 'CRED', 'React Developer', 'Bangalore', 'cred.club'],
      ].map(([id, company, title, location, domain]) => ({
        id, title, company, location, skills: ['React'],
        logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      })) : [
        ['target', 'Target in India', 'Java Developer', 'Bangalore', 'target.com'],
        ['omnissa', 'Omnissa', 'SMTS - Java', 'Bangalore', 'omnissa.com'],
        ['kla', 'KLA-Tencor', 'Java Developer', 'Chennai', 'kla.com'],
        ['innovaccer', 'Innovaccer', 'SSE - Java', 'Gurgaon', 'innovaccer.com'],
        ['meesho', 'Meesho', 'SDE - Java', 'Bangalore', 'meesho.com'],
        ['ey', 'EY', 'Java Developer', 'Bangalore', 'ey.com'],
        ['greyorange', 'GreyOrange', 'SDE III - Java', 'Gurgaon', 'greyorange.com'],
        ['arcticwolf', 'Arctic Wolf', 'Sr. Backend Engineer - Java', 'Bangalore', 'arcticwolf.com'],
      ].map(([id, company, title, location, domain]) => ({
        id, title, company, location,
        skills: ['Java'],
        logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      }));
      if (!alive) return;
      const seen = new Set(jobQueue.current.map((job) => job.id));
      const roleMatch = track === 'frontend'
        ? /react|frontend|front-end|ui|angular|vue/i
        : /java|spring|j2ee|jvm|hibernate|microservices|backend|python|golang|node/i;
      const featuredCompany = (name: string) => {
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return key.startsWith('target') || key.includes('omnissa') || key.includes('omnisa') || key.includes('kla') || key.includes('innovaccer') || key.includes('innovacer') || key.includes('meesho') || key === 'ey' || key.startsWith('eyg') || key.startsWith('eyi') || key.includes('ernstyoung') || key.includes('greyorange') || key.includes('arcticwolf');
      };
      rows.forEach((job: any) => {
        const id = String(job.id);
        const title = job.title || '';
        const company = job.company || job.companyName || '';
        const skills = Array.isArray(job.skills) ? job.skills.join(' ') : '';
        if (seen.has(id) || (track === 'backend' && !featuredCompany(company)) || !roleMatch.test(`${title} ${skills}`)) return;
        seen.add(id);
        jobQueue.current.push({
          id,
          title: title || 'Java Developer',
          company: job.company || job.companyName || 'Company',
          location: job.location || 'India',
          logo: job.logo || job.companyLogo || '',
        });
      });
    };
    const takeThree = () => {
      const picked: typeof jobQueue.current = [];
      const companies = new Set<string>();
      const left: typeof jobQueue.current = [];
      for (const job of jobQueue.current) {
        const key = job.company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^target.*/, 'target');
        if (picked.length < 3 && !companies.has(key)) {
          companies.add(key);
          picked.push(job);
        } else {
          left.push(job);
        }
      }
      jobQueue.current = left;
      return picked;
    };
    const boot = async () => {
      await pullIntoQueue();
      if (!alive) return;
      setShownJobs(takeThree());
    };
    boot().catch(() => undefined).finally(() => {
      if (alive) setJobsLoading(false);
    });
    const timer = window.setInterval(() => {
      const swap = async () => {
        if (jobQueue.current.length < 3) await pullIntoQueue();
        if (!alive || jobQueue.current.length < 3) return;
        const incoming = takeThree();
        setIncomingJobs(incoming);
        window.setTimeout(() => {
          if (!alive) return;
          setShownJobs(incoming);
          setIncomingJobs([]);
          if (jobQueue.current.length < 3) pullIntoQueue().catch(() => undefined);
        }, 700);
      };
      swap().catch(() => undefined);
    }, 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [user?.jobTrack, user?.jobSkill]);

  useEffect(() => {
    api.interviewerPicks().then((rows) => setInterviewers(rows)).catch(() => setInterviewers([]));
  }, []);

  const openDetailsForm = (testId: string) => {
    setApplyJob(null);
    setDetailsTestId(testId);
    setFormSaved(false);
    setFormError('');
    setResumeFile(null);
    setFullName((current) => current || user?.name || '');
    setEmail((current) => current || user?.email || '');
    setLinkedinUrl((current) => current || user?.linkedinUrl || '');
  };

  const handleStart = async (testId: string) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PROFILEREEL_PLUGIN_WEBSITE', purpose: 'test', url: `${window.location.origin}/dashboard` }, '*');
      return;
    }
    if (!MOCK_TEST_PAYWALL_ENABLED) {
      navigate(`/test/${testId}`);
      return;
    }
    if (isMockTestPaid(testId) || paidIds.includes(testId)) {
      if (!(isMockTestCompleted(testId) || completedIds.includes(testId))) {
        openDetailsForm(testId);
        return;
      }
    }
    setPayingId(testId);
    try {
      await startMockTestCheckout({
        testId,
        userId: user?.id,
        userEmail: user?.email,
        customerName: user?.name,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setPayingId(null), 1500);
    }
  };

  return (
    <section id="mock-tests" className="scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Interview preparation
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
            Best suitable for Product companies
          </h2>
          <p className="hidden md:block text-sm text-slate-600 dark:text-slate-400 mt-2">
            {MOCK_TEST_PAYWALL_ENABLED
              ? 'Four coding questions on each track. You solve them on this page. ₹10 for this attempt.'
              : 'Four coding questions on each track. You solve them on this page. Payment is paused while we review the test.'}
          </p>
        </div>

        {justSubmitted && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 text-center inline-flex items-center justify-center gap-2 w-full">
            <CheckCircle2 className="w-4 h-4" />
            Paper submitted. Your links and snapshots were saved.
          </div>
        )}

        {justUnlocked && !justSubmitted && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 text-center">
            This attempt is unlocked. After you submit, pay ₹10 again for the next attempt.
          </div>
        )}

        <div className="grid grid-cols-3 max-w-5xl mx-auto gap-2 md:gap-4">
          {MOCK_TESTS.filter((test) => !test.comingSoon).map((test) => {
            const completed = MOCK_TEST_PAYWALL_ENABLED && completedIds.includes(test.id);
            const unlocked = !completed && (paidIds.includes(test.id) || !MOCK_TEST_PAYWALL_ENABLED);
            const paying = payingId === test.id;
            const soon = Boolean(test.comingSoon);
            return (
              <div
                key={test.id}
                className={`glass-panel overflow-hidden p-2 md:p-5 rounded-2xl border flex flex-col justify-between ${
                  soon
                    ? 'border-slate-200 dark:border-white/5 opacity-80'
                    : unlocked
                    ? 'border-emerald-500/40 ring-2 ring-emerald-500/15'
                    : 'border-slate-200 dark:border-white/5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {!soon && (
                      <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1 md:mb-2 md:gap-1.5">
                        {[
                          { name: 'Swiggy', domain: 'swiggy.com' },
                          { name: 'Flipkart', domain: 'flipkart.com' },
                          { name: 'Zepto', domain: 'zeptonow.com' },
                          { name: 'Uber', domain: 'uber.com' },
                        ].map((company) => (
                          <img
                            key={company.name}
                            src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`}
                            alt={company.name}
                            title={company.name}
                            className="h-4 w-4 rounded border border-slate-200 bg-white object-contain md:h-6 md:w-6 md:rounded-md md:p-0.5"
                          />
                        ))}
                      </div>
                      )}
                      <h3 className="text-[11px] font-bold leading-4 text-slate-900 dark:text-white md:text-base">{test.title}</h3>
                    </div>
                    <span className={`hidden md:inline shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${soon ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'}`}>
                      {soon ? 'Soon' : MOCK_TEST_PAYWALL_ENABLED ? (unlocked ? 'Unlocked' : '₹10') : 'Open'}
                    </span>
                  </div>
                  <p className="mt-2 hidden text-xs text-slate-600 dark:text-slate-400 md:block">{soon ? 'This track is not open yet.' : test.blurb}</p>
                  {!soon && (
                  <p className="mt-3 hidden text-[11px] text-slate-500 md:block">
                    {test.minutes} min · {test.questionCount} questions · solved here
                    {MOCK_TEST_PAYWALL_ENABLED
                      ? unlocked
                        ? ` · open for ${Math.max(1, Math.ceil(getMockTestUnlockRemaining(test.id) / 60000))} min`
                        : ' · ₹10 · open for 1 hour after payment'
                      : ' · payment paused'}
                  </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { if (!soon) handleStart(test.id); }}
                  disabled={paying || soon}
                  className={`mt-2 md:mt-4 w-full py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold disabled:opacity-60 ${soon ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  <span className="md:hidden">{soon ? 'Soon' : paying ? '…' : unlocked ? 'Start' : 'Pay ₹10'}</span>
                  <span className="hidden md:inline">{soon
                    ? 'Coming soon'
                    : paying
                    ? 'Opening Razorpay...'
                    : completed
                      ? 'Pay ₹10 for this attempt'
                      : unlocked
                        ? hasOpenMockTestAttempt(test.id)
                          ? 'Continue test'
                          : 'Start test'
                        : 'Pay ₹10 to take test'}</span>
                </button>
              </div>
            );
          })}
        </div>
        {(jobsLoading || shownJobs.length > 0) && (
          <div className="mt-8">
            <h3 className="text-center text-lg font-black text-slate-900 dark:text-white">Open roles</h3>
            {jobsLoading && shownJobs.length === 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2 md:mt-4 md:gap-4">
                {[0, 1, 2].map((slot) => (
                  <div key={slot} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="h-14 bg-slate-100" />
                    <div className="space-y-2 px-4 py-3">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-1/4 rounded bg-slate-100" />
                      <div className="mt-3 h-8 rounded-xl bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="relative mt-2 grid grid-cols-3 gap-2 md:mt-4 md:gap-4">
              {[0, 1, 2].map((slot) => {
                const current = shownJobs[slot];
                const incoming = incomingJobs[slot];
                const card = (job: (typeof shownJobs)[number]) => (
                  <>
                    <div className="flex h-8 items-center justify-center border-b border-slate-100 bg-slate-50 px-1.5 md:h-14 md:px-4">
                      {job.logo ? (
                        <img src={job.logo} alt="" className="max-h-6 max-w-full object-contain md:max-h-10 md:max-w-[148px]" />
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 md:text-xs">{job.company}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-1.5 py-2 md:px-4 md:py-3">
                      <div className="flex items-start justify-between gap-1 md:gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[11px] font-bold leading-4 text-slate-900 dark:text-white md:text-base md:line-clamp-1">{job.title}</h3>
                          <p className="line-clamp-1 text-[10px] text-slate-500 md:text-xs">{job.company}</p>
                        </div>
                        <span className="hidden md:inline shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">Open</span>
                      </div>
                      <p className="mt-1 hidden text-xs text-slate-600 dark:text-slate-400 md:mt-2 md:block">{job.location}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const allowance = await api.jobApplyAllowance(user?.email || '', user?.linkedinUrl || '').catch(() => ({ needsPayment: false }));
                        if (allowance.needsPayment) {
                          setPaywallJob(job);
                          return;
                        }
                        setApplyJob(job);
                        setDetailsTestId(job.id);
                        setFormSaved(false);
                        setFormError('');
                        setResumeFile(null);
                        setFullName((name) => name || user?.name || '');
                        setEmail((value) => value || user?.email || '');
                        setLinkedinUrl((value) => value || user?.linkedinUrl || '');
                      }}
                      className="mt-1.5 w-full rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500 md:mt-3 md:rounded-xl md:py-2 md:text-xs"
                    >
                      Apply
                    </button>
                    </div>
                  </>
                );
                return (
                  <div key={current?.id || slot} className="relative min-h-[148px]">
                    {current && (
                      <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-700 ease-in-out ${incoming ? 'pointer-events-none -translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}`}>
                        {card(current)}
                      </div>
                    )}
                    {incoming && (
                      <div className="absolute inset-0 flex translate-x-4 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-0 shadow-sm animate-[roleIn_700ms_ease-in-out_forwards]">
                        {card(incoming)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
        {interviewers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-center text-lg font-black text-slate-900 dark:text-white">Clear the test. Get interviewed by experts.</h3>
            <div className="mt-2 grid grid-cols-3 gap-2 md:mt-4 md:flex md:flex-wrap md:justify-center md:gap-3">
              {interviewers.map((person) => {
                const initials = person.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
                const currentKey = (person.currentCompany || '').trim().toLowerCase();
                const currentLogo = (person.companies || []).find((company) => {
                  const name = company.name.trim().toLowerCase();
                  return name === currentKey || name.includes(currentKey) || currentKey.includes(name);
                });
                const past = (person.companies || []).filter((company) => company.logo && company.name !== currentLogo?.name).slice(0, 4);
                return (
                  <article key={person.id} className="flex w-full flex-col items-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-1.5 pb-2 pt-3 text-center shadow-sm md:w-[240px] md:rounded-3xl md:px-4 md:pb-4 md:pt-5">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover md:h-16 md:w-16" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-xs font-black text-white md:h-16 md:w-16 md:text-sm">{initials || 'IN'}</span>
                    )}
                    <p className="mt-2 line-clamp-2 text-[11px] font-black leading-4 text-slate-950 md:mt-3 md:text-sm">{person.fullName}</p>
                    <p className="line-clamp-2 text-[10px] leading-3 text-slate-500 md:mt-1 md:text-[11px]">{person.currentTitle}</p>
                    <p className="mt-1 inline-flex max-w-full items-center justify-center gap-1 text-[10px] font-bold leading-3 text-violet-700 md:text-[12px]">
                      {currentLogo?.logo && <img src={currentLogo.logo} alt="" className="h-3.5 w-3.5 shrink-0 rounded bg-white object-contain md:h-4 md:w-4" />}
                      <span className="line-clamp-1">{person.currentCompany}</span>
                    </p>
                    {past.length > 0 && (
                      <div className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-1 md:mt-3 md:gap-1.5">
                        {past.map((company) => (
                          <img key={company.name} src={company.logo} alt={company.name} title={company.name} className="h-5 w-5 rounded-md border border-slate-200 bg-white object-contain md:h-7 md:w-7 md:rounded-lg md:p-0.5" />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-8">
          <PracticeCourseCards heading="Courses" />
        </div>
      </div>

      {paywallJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Pay ₹100 for more jobs</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your first 3 job applications are free. Pay ₹100 once to keep applying for more roles.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPaywallJob(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paywallBusy}
                onClick={async () => {
                  if (!user?.email) return;
                  setPaywallBusy(true);
                  try {
                    const paid = await startJobApplyCheckout({
                      userId: user.id,
                      userEmail: user.email,
                      customerName: user.name,
                      linkedinUrl: user.linkedinUrl,
                    });
                    if (!paid) {
                      setPaywallJob(null);
                      return;
                    }
                    const job = paywallJob;
                    setPaywallJob(null);
                    setApplyJob(job);
                    setDetailsTestId(job.id);
                    setFormSaved(false);
                    setFormError('');
                    setResumeFile(null);
                    setFullName((name) => name || user.name || '');
                    setEmail((value) => value || user.email || '');
                    setLinkedinUrl((value) => value || user.linkedinUrl || '');
                  } catch (err: any) {
                    setFormError(err?.message || 'Payment could not be completed.');
                    setPaywallJob(null);
                  } finally {
                    setPaywallBusy(false);
                  }
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {paywallBusy ? 'Opening payment…' : 'Make payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel-elevated max-w-lg w-full rounded-3xl p-6 sm:p-8 border-2 border-brand-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto bg-white dark:bg-charcoal-900">
            <button
              type="button"
              onClick={() => setDetailsTestId(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {formSaved ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Submitted successfully</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{applyJob ? 'Your application is saved.' : 'Your details are saved. You can take the test now.'}</p>
                {!applyJob && (
                <button
                  type="button"
                  onClick={() => navigate(`/test/${detailsTestId}`)}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
                >
                  Take test
                </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Your details</h3>
                  <p className="notice-blink mt-2 inline-block rounded-lg bg-brand-500/15 px-2.5 py-1 text-sm font-extrabold text-brand-700 dark:text-brand-300">
                    {applyJob ? 'Fill this in to apply for the role.' : 'Fill this in before you start the test.'}
                  </p>
                </div>
                <form
                  className="space-y-4 text-left"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setFormBusy(true);
                    setFormError('');
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
                      const test = MOCK_TESTS.find((item) => item.id === detailsTestId);
                      const payload = {
                        jobId: applyJob?.id || detailsTestId,
                        jobTitle: applyJob?.title || test?.title || 'Mock Test',
                        companyName: applyJob?.company || 'Swiggy, Flipkart, Zepto, Uber',
                        fullName: fullName.trim(),
                        linkedinUrl: linkedinUrl.trim(),
                        email: email.trim(),
                        phone: phone.trim(),
                        currentSalary: currentSalary.trim(),
                        expectedSalary: expectedSalary.trim(),
                        location: locationValue.trim(),
                        interviewingAt: interviewingAt.trim(),
                        resumeFileName: resumeFile?.name,
                        resumeData,
                        applicationType: applyJob ? 'Job Application' : 'Express Interest',
                        sheetName: applyJob ? 'Sheet1' : 'Sheet2',
                      };
                      try {
                        await api.applyForJob(payload);
                      } catch (err) {
                        if (applyJob && err instanceof ApiError && err.status === 402) {
                          setPaywallJob(applyJob);
                          setDetailsTestId(null);
                          return;
                        }
                        throw err;
                      }
                      setFormSaved(true);
                    } catch (err: any) {
                      setFormError(err?.message || 'Could not save your details. Try again.');
                    } finally {
                      setFormBusy(false);
                    }
                  }}
                >
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name *
                    <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Anil BV" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                  </label>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    LinkedIn Profile URL *
                    <input required type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://www.linkedin.com/in/username" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address *
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                    </label>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phone Number *
                      <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Current CTC
                      <input value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} placeholder="e.g. 12 LPA" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                    </label>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Expected CTC
                      <input value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} placeholder="e.g. 18 LPA" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                    </label>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Location
                      <input value={locationValue} onChange={(e) => setLocationValue(e.target.value)} placeholder="Bangalore / Remote" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Where are you interviewing at?
                    <input value={interviewingAt} onChange={(e) => setInterviewingAt(e.target.value)} placeholder="Company name, e.g. Google" className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-white/10 text-xs" />
                  </label>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Upload Resume / CV (Optional)</p>
                    <label className="block border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center cursor-pointer">
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                      <Upload className="w-5 h-5 mx-auto text-brand-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{resumeFile ? resumeFile.name : 'Click to upload resume (PDF recommended)'}</span>
                    </label>
                  </div>
                  {formError && <p className="text-xs text-rose-600">{formError}</p>}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setDetailsTestId(null)} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
                    <button type="submit" disabled={formBusy} className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-extrabold disabled:opacity-60 inline-flex items-center gap-2">
                      {formBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {formBusy ? 'Saving...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
