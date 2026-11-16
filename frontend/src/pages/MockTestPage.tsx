import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { MOCK_TESTS } from '../data/mockTests';
import { PracticeCourseCards } from '../components/PracticeCourseCards';
import { PassedJobPicks } from '../components/PassedJobPicks';
import { SectionSpinner } from '../components/SectionSpinner';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { questionsForRole } from '../data/platformQuestions';
import { paperVerdict } from '../lib/mockTestVerdict';
import { CODE_LANGUAGES, starterFor } from '../lib/languages';
import { runQuestion, type QuestionRun } from '../lib/runPlatformCode';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../services/api';
import {
  MOCK_TEST_JUST_SUBMITTED_KEY,
  beginMockTestClock,
  expireMockTestUnlock,
  getMockTestRemainingMs,
  markMockTestCompleted,
} from '../lib/mockTestAccess';

const WATCH_TAB_AND_PASTE = true;

function withWarnings(
  verdict: { verdict: 'Passed' | 'Failed'; reason: string },
  tabCount: number,
  pasteCount: number,
) {
  const note = `Tab switches ${tabCount}. Copy-paste ${pasteCount}.`;
  if (tabCount > 0 || pasteCount > 0) {
    return { verdict: 'Failed' as const, reason: `${verdict.reason} ${note}` };
  }
  return { verdict: verdict.verdict, reason: `${verdict.reason} ${note}` };
}

const PassedScreen: React.FC<{
  title: string;
  role: string;
  prefill?: { name?: string; email?: string; linkedinUrl?: string };
  onDone: () => void;
}> = ({ title, role, prefill, onDone }) => {
  const [stage, setStage] = useState<'jobs' | 'people'>('jobs');
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#eef6f1]">
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-[28px] border border-white/80 bg-white px-6 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">{title} paper cleared</p>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                {stage === 'people' ? 'Get interviewed by these people' : 'You are suitable for these roles'}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {stage === 'people'
              ? 'These are approved interviewers. Request one of them to take your interview.'
              : 'These are the best open roles for that track. Apply, and the interviewer step opens next.'}
          </p>
          <div className="mt-6">
            <PassedJobPicks roles={[role]} prefill={prefill} onStage={setStage} />
          </div>
          <button type="button" onClick={onDone} className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export const MockTestPage: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const test = MOCK_TESTS.find((item) => item.id === setId);
  const questions = test ? questionsForRole(test.role) : [];
  const [activeId, setActiveId] = useState(questions[0]?.id || '');
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((question) => [question.id, question.starter])),
  );
  const [runs, setRuns] = useState<Record<string, QuestionRun>>({});
  const [sharing, setSharing] = useState(false);
  const [shareStopped, setShareStopped] = useState(false);
  const [shareError, setShareError] = useState('');
  const [integrityReason, setIntegrityReason] = useState('');
  const [timeLeftMs, setTimeLeftMs] = useState(() => getMockTestRemainingMs(setId, test?.minutes));
  const [timeOver, setTimeOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [verdictLine, setVerdictLine] = useState('');
  const [resultReady, setResultReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [entering, setEntering] = useState(true);
  const noticeTimer = useRef<number | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const shareEndedByUs = useRef(false);
  const integrityOn = useRef(false);
  const tabWarningsRef = useRef(0);
  const pasteWarningsRef = useRef(0);
  const savedRef = useRef(false);
  const active = questions.find((question) => question.id === activeId) || questions[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setEntering(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 3000);
  };

  const giveWarning = (kind: 'tab' | 'paste') => {
    if (!WATCH_TAB_AND_PASTE || !integrityOn.current || integrityReason) return;
    if (kind === 'tab') {
      showNotice('Do not switch the tab.');
      tabWarningsRef.current += 1;
      if (tabWarningsRef.current >= 3) {
        integrityOn.current = false;
        setIntegrityReason('Tab switching limit reached.');
        if (setId) expireMockTestUnlock(setId);
      }
      return;
    }
    showNotice('Trying to copy paste. Do not do that.');
    pasteWarningsRef.current += 1;
    if (pasteWarningsRef.current >= 3) {
      integrityOn.current = false;
      setIntegrityReason('Copy-paste limit reached.');
      if (setId) expireMockTestUnlock(setId);
    }
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setShareError('This browser cannot share the screen. Use Chrome or Edge.');
      return;
    }
    setShareError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as MediaTrackConstraints,
        audio: false,
      });
      screenStreamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        screenStreamRef.current = null;
        if (shareEndedByUs.current) return;
        setSharing(false);
        setShareStopped(true);
        if (setId) expireMockTestUnlock(setId);
      });
      setSharing(true);
      window.setTimeout(() => {
        integrityOn.current = true;
      }, 1500);
    } catch {
      setShareError('Share your screen to start this test.');
    }
  };

  useEffect(() => {
    if (!sharing || shareStopped || integrityReason) return;
    const watch = window.setInterval(() => {
      const track = screenStreamRef.current?.getVideoTracks()[0];
      if (shareEndedByUs.current || (track && track.readyState !== 'ended')) return;
      screenStreamRef.current = null;
      setSharing(false);
      setShareStopped(true);
      if (setId) expireMockTestUnlock(setId);
    }, 1000);
    return () => window.clearInterval(watch);
  }, [sharing, shareStopped, integrityReason, setId]);

  useEffect(() => () => {
    const stream = screenStreamRef.current;
    if (!stream) return;
    shareEndedByUs.current = true;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!setId || !sharing || integrityReason) return;
    beginMockTestClock(setId);
    const tick = () => {
      const left = getMockTestRemainingMs(setId, test?.minutes);
      setTimeLeftMs(left);
      if (left <= 0) {
        setTimeOver(true);
        expireMockTestUnlock(setId);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [setId, sharing, integrityReason, test?.minutes]);

  useEffect(() => {
    if (!sharing || integrityReason) return;
    const onHide = () => {
      if (document.hidden) giveWarning('tab');
    };
    const onClipboard = () => {
      giveWarning('paste');
    };
    document.addEventListener('visibilitychange', onHide);
    document.addEventListener('copy', onClipboard);
    document.addEventListener('cut', onClipboard);
    document.addEventListener('paste', onClipboard);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      document.removeEventListener('copy', onClipboard);
      document.removeEventListener('cut', onClipboard);
      document.removeEventListener('paste', onClipboard);
    };
  }, [sharing, integrityReason]);

  useEffect(() => {
    if (!integrityReason || savedRef.current || !user?.email || !test) return;
    savedRef.current = true;
    const latest: Record<string, QuestionRun> = {};
    questions.forEach((question) => {
      const source = code[`${language}:${question.id}`] ?? starterFor(language, question);
      latest[question.id] = language === 'javascript'
        ? runQuestion(question, source)
        : { passedCases: 0, total: question.tests.length, passed: false, note: `0/${question.tests.length}`, cases: [] };
    });
    const reads = questions.map((question) => ({
      passed: latest[question.id].passed,
      note: latest[question.id].note,
    }));
    const verdict = withWarnings(paperVerdict(reads), tabWarningsRef.current, pasteWarningsRef.current);
    verdict.verdict = 'Failed';
    verdict.reason = `${integrityReason} ${verdict.reason}`;
    void api.submitMockTest({
      testId: test.id,
      userId: user.id,
      fullName: user.name || 'Candidate',
      email: user.email,
      linkedinUrl: user.linkedinUrl,
      verdict: 'Failed',
      verdictReason: verdict.reason,
      tabWarnings: String(tabWarningsRef.current),
      pasteWarnings: String(pasteWarningsRef.current),
      answers: questions.map((question) => ({
        questionId: question.id,
        title: question.title,
        difficulty: 'Hard',
        pattern: question.pattern,
        code: code[`${language}:${question.id}`] ?? starterFor(language, question),
        caseNote: latest[question.id].note,
      })),
    }).catch(() => undefined);
    setVerdictLine('Failed. This paper is closed and will not be counted.');
  }, [integrityReason]);

  useEffect(() => {
    if (!verdictLine) return;
    setResultReady(false);
    const timer = window.setTimeout(() => setResultReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, [verdictLine]);

  if (entering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-charcoal-950">
        <SectionSpinner label="Opening this paper" />
      </div>
    );
  }

  if (!test || !active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-bold text-brand-600">
          Back to dashboard
        </button>
      </div>
    );
  }

  const clock = `${String(Math.floor(timeLeftMs / 60000)).padStart(2, '0')}:${String(Math.floor((timeLeftMs % 60000) / 1000)).padStart(2, '0')}`;
  const run = runs[active.id];

  const sourceFor = (questionId: string, fallback: string) => code[`${language}:${questionId}`] ?? fallback;

  const evaluate = async (question: (typeof questions)[number]) => {
    const source = sourceFor(question.id, starterFor(language, question));
    return api.runCode({ language, source, testsJson: JSON.stringify(question.tests) });
  };

  const runActive = async () => {
    if (running) return;
    setRunning(true);
    setSubmitError('');
    try {
      const result = await evaluate(active);
      setRuns((prev) => ({ ...prev, [active.id]: result }));
      setSubmitError('');
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Could not run this code.';
      setSubmitError('');
      setRuns((prev) => ({
        ...prev,
        [active.id]: {
          passedCases: 0,
          total: active.tests.length,
          passed: false,
          note: `0/${active.tests.length}`,
          output: message,
          cases: [],
        },
      }));
    } finally {
      setRunning(false);
    }
  };

  const submitPaper = async () => {
    if (!sharing || shareStopped) {
      setSubmitError('Screen share has to stay on until you submit.');
      return;
    }
    if (timeOver || getMockTestRemainingMs(setId, test.minutes) <= 0) {
      setSubmitError('Time is over. This paper is not counted.');
      return;
    }
    if (!user?.email) {
      setSubmitError('Log in so this paper can be saved.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const latest: Record<string, QuestionRun> = {};
    try {
    await Promise.all(
      questions.map(async (question) => {
        latest[question.id] = await evaluate(question);
      }),
    );
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Could not check the answers. Try again.';
      setSubmitError(message);
      setSubmitting(false);
      return;
    }
    setRuns(latest);
    const reads = questions.map((question) => ({
      passed: latest[question.id].passed,
      note: latest[question.id].note,
    }));
    const verdict = withWarnings(paperVerdict(reads), tabWarningsRef.current, pasteWarningsRef.current);
    savedRef.current = true;
    try {
      await api.submitMockTest({
        testId: test.id,
        userId: user.id,
        fullName: user.name || 'Candidate',
        email: user.email,
        linkedinUrl: user.linkedinUrl,
        verdict: verdict.verdict,
        verdictReason: verdict.reason,
        tabWarnings: String(tabWarningsRef.current),
        pasteWarnings: String(pasteWarningsRef.current),
        answers: questions.map((question) => ({
          questionId: question.id,
          title: question.title,
          difficulty: 'Hard',
          pattern: question.pattern,
          code: sourceFor(question.id, starterFor(language, question)),
          caseNote: `${latest[question.id].note} · ${language}`,
        })),
      });
      shareEndedByUs.current = true;
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      markMockTestCompleted(test.id, {
        uploaded: questions.filter((question) => latest[question.id].passed).length,
        total: questions.length,
        submittedAt: new Date().toISOString(),
        questionIds: questions.map((question) => question.id),
        verdict: verdict.verdict,
        verdictReason: verdict.reason,
      });
      try {
        sessionStorage.setItem(MOCK_TEST_JUST_SUBMITTED_KEY, '1');
      } catch {
        /* ignore */
      }
      setVerdictLine(verdict.verdict === 'Passed' ? `Passed. ${reads.map((item) => item.note).join(', ')}` : `Failed. ${reads.map((item) => item.note).join(', ')}`);
    } catch (error) {
      savedRef.current = false;
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Could not save this paper. Try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return test?.comingSoon ? (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">{test.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Coming soon</p>
        <button type="button" onClick={() => navigate('/dashboard')} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">
          Back to dashboard
        </button>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-slate-100 dark:bg-charcoal-950 text-slate-900 dark:text-slate-100" onContextMenu={(event) => event.preventDefault()}>
      {notice && (
        <div className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}
      <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-charcoal-900">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-slate-500">
          Dashboard
        </button>
        <div className="text-sm font-extrabold">{test.title}</div>
        <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">{clock}</div>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr_320px] min-h-[calc(100vh-56px)]">
        <aside className="border-r border-slate-200 dark:border-white/10 bg-white/80 dark:bg-charcoal-900 p-3 space-y-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setActiveId(question.id)}
              className={`w-full text-left rounded-xl px-3 py-2 border ${question.id === active.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10'}`}
            >
              <div className="text-[10px] font-bold text-slate-500">{index + 1}. {question.pattern}</div>
              <div className="text-xs font-bold">{question.title}</div>
              {runs[question.id] && (
                <div className={`text-[10px] font-bold ${runs[question.id].passed ? 'text-emerald-600' : 'text-rose-600'}`}>{runs[question.id].note}</div>
              )}
            </button>
          ))}
        </aside>

        <main className="p-4 flex flex-col gap-3 min-w-0">
          <article className="rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-white/10 p-4">
            <h1 className="text-lg font-extrabold">{active.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{active.statement}</p>
            <p className="mt-3 text-xs font-mono rounded-lg bg-slate-50 dark:bg-charcoal-950 p-2">{active.example}</p>
          </article>
          <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold"
            >
              {CODE_LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <textarea
            value={code[`${language}:${active.id}`] ?? starterFor(language, active)}
            spellCheck={false}
            onChange={(event) => setCode((prev) => ({ ...prev, [`${language}:${active.id}`]: event.target.value }))}
            className="flex-1 min-h-[320px] w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-950 text-slate-100 font-mono text-sm p-4 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button type="button" disabled={running} onClick={() => void runActive()} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60">
              {running ? 'Running...' : 'Run tests'}
            </button>
            <button type="button" disabled={submitting} onClick={() => void submitPaper()} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60">
              {submitting ? 'Saving...' : 'Submit paper'}
            </button>
            {submitError && <p className="text-[11px] text-rose-600">{submitError}</p>}
          </div>
        </main>

        <aside className="border-l border-slate-200 dark:border-white/10 bg-white dark:bg-charcoal-900 p-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Analysis</h2>
          <p className="mt-2 text-xs text-slate-500">A question passes when more cases pass than fail. The paper passes only when all {questions.length} do.</p>
          {run ? (
            <div className="mt-4 space-y-2">
              <p className={`text-sm font-extrabold ${run.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{run.status || (run.passed ? 'Accepted' : 'Wrong Answer')} · {run.note}</p>
              {(run.time || run.memory) && (
                <p className="text-[11px] text-slate-500">{run.time ? `${run.time}s` : ''}{run.memory ? ` · ${run.memory} KB` : ''}</p>
              )}
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Output</div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px] text-rose-200">{run.output || (run.passed ? 'All cases passed.' : 'No output.')}</pre>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Run the current question to see the case results here.</p>
          )}
        </aside>
      </div>

      {!sharing && !shareStopped && !integrityReason && !verdictLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-charcoal-900 p-6 text-center shadow-2xl">
            <h2 className="text-lg font-extrabold">Share your screen</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Share your screen to start. The questions and the code editor stay on this page.</p>
            {shareError && <p className="mt-3 text-xs text-rose-600">{shareError}</p>}
            <button type="button" onClick={() => void startScreenShare()} className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Share screen and start
            </button>
          </div>
        </div>
      )}

      {(shareStopped || integrityReason || timeOver) && !verdictLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-charcoal-900 p-6 text-center shadow-2xl">
            <h2 className="text-lg font-extrabold">Paper closed</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {shareStopped ? 'Screen share stopped before you submitted.' : 'This paper is closed and will not be counted.'}
            </p>
            <button type="button" onClick={() => navigate('/dashboard#mock-tests')} className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Back to dashboard
            </button>
          </div>
        </div>
      )}

      {verdictLine && !resultReady && (
        <div className="fixed inset-0 z-[60]">
          <FullPageSpinner
            title={verdictLine.startsWith('Passed') ? 'Paper cleared' : 'Closing this paper'}
            subtitle={verdictLine.startsWith('Passed') ? 'Opening the roles that fit this result.' : 'Opening the courses for your next attempt.'}
            badge="ProfileReel AI"
            variant={verdictLine.startsWith('Passed') ? 'success' : 'brand'}
          />
        </div>
      )}

      {verdictLine && resultReady && verdictLine.startsWith('Passed') && (
        <PassedScreen title={test.title} role={test.role} prefill={{ name: user?.name, email: user?.email, linkedinUrl: user?.linkedinUrl }} onDone={() => navigate('/dashboard#mock-tests')} />
      )}

      {verdictLine && resultReady && !verdictLine.startsWith('Passed') && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#f7f5fb]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-80px] top-[-40px] h-56 w-56 rounded-full bg-violet-200/50 blur-3xl" />
            <div className="absolute right-[-40px] top-10 h-52 w-52 rounded-full bg-rose-100/70 blur-3xl" />
            <div className="absolute bottom-[-60px] left-1/3 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />
          </div>
          <div className="relative flex h-full items-start justify-center px-8 pt-[8vh]">
            <div className="w-full max-w-[1040px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-500">Paper closed</p>
              <h2 className="mt-1.5 text-[30px] font-black tracking-tight text-slate-900">This is your next move</h2>
              <p className="mt-2 max-w-xl text-[13px] leading-5 text-slate-500">Go with these courses. They are the straight path back into the {test.title} paper.</p>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600">For {test.title}</p>
              <h3 className="mt-1 text-base font-black tracking-tight text-slate-900">Go with these courses</h3>
              <div className="mt-4">
                <PracticeCourseCards heading="" roles={[test.role]} />
              </div>
              <button type="button" onClick={() => navigate('/dashboard#mock-tests')} className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
