import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_TESTS } from '../data/mockTests';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_TEST_COMPLETED_EVENT,
  MOCK_TEST_JUST_SUBMITTED_KEY,
  MOCK_TEST_PAID_EVENT,
  MOCK_TEST_PAID_MESSAGE,
  MOCK_TEST_PAYWALL_ENABLED,
  getCompletedMockTests,
  getPaidMockTests,
  hasOpenMockTestAttempt,
  isMockTestCompleted,
  isMockTestPaid,
  markMockTestPaid,
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
    if (paidFromUrl && isMockTestPaid(paidFromUrl)) {
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

  const handleStart = async (testId: string) => {
    if (!MOCK_TEST_PAYWALL_ENABLED) {
      navigate(`/test/${testId}`);
      return;
    }
    if (isMockTestPaid(testId) || paidIds.includes(testId)) {
      if (!(isMockTestCompleted(testId) || completedIds.includes(testId))) {
        navigate(`/test/${testId}`);
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Interview preparation
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Mock test</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {MOCK_TEST_PAYWALL_ENABLED
              ? '3 DSA questions (Easy, Medium, Hard) mapped from LeetCode. Solve there, paste the submitted-answer link, and upload a snapshot. ₹10 per paper. Pay again after you finish for a different set. This does not unlock Pro.'
              : '3 DSA questions (Easy, Medium, Hard) mapped from LeetCode. Solve there, paste the submitted-answer link, and upload a snapshot. Payment is paused while we review the paper.'}
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
            {MOCK_TESTS.find((item) => item.id === justUnlocked)?.title || 'That test'} is unlocked. After you submit, pay ₹10 again for a new paper with different questions.
          </div>
        )}

        <div className="grid grid-cols-1 max-w-md mx-auto gap-4">
          {MOCK_TESTS.map((test) => {
            const completed = MOCK_TEST_PAYWALL_ENABLED && completedIds.includes(test.id);
            const unlocked = !completed && (paidIds.includes(test.id) || !MOCK_TEST_PAYWALL_ENABLED);
            const paying = payingId === test.id;
            return (
              <div
                key={test.id}
                className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between ${
                  completed
                    ? 'border-slate-300 dark:border-white/10'
                    : unlocked
                    ? 'border-emerald-500/40 ring-2 ring-emerald-500/15'
                    : 'border-slate-200 dark:border-white/5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{test.title}</h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {completed ? 'Taken' : MOCK_TEST_PAYWALL_ENABLED ? (unlocked ? 'Unlocked' : '₹10') : 'Open'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{test.blurb}</p>
                  <p className="text-[11px] text-slate-500 mt-3">
                    {test.minutes} min · {test.questionCount} DSA · Easy / Medium / Hard
                    {MOCK_TEST_PAYWALL_ENABLED ? ' · ₹10 · new paper each payment' : ' · payment paused'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStart(test.id)}
                  disabled={paying}
                  className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-60 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {paying
                    ? 'Opening Razorpay...'
                    : completed
                      ? 'Pay ₹10 for a new paper'
                      : unlocked
                        ? hasOpenMockTestAttempt(test.id)
                          ? 'Continue test'
                          : 'Start test'
                        : 'Pay ₹10 to start'}
                </button>
                {completed && (
                  <button
                    type="button"
                    onClick={() => navigate(`/test/${test.id}`)}
                    className="mt-2 w-full text-[11px] font-semibold text-slate-500"
                  >
                    View last result
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
