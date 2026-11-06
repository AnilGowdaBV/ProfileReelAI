import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, ImagePlus, Trash2 } from 'lucide-react';
import { Difficulty, MOCK_TESTS, type DsaQuestion } from '../data/mockTests';
import { pickFocusPaper, questionsFromIds } from '../data/leetcodeCompanyBank';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { readProofImage } from '../lib/proofImage';
import {
  MOCK_TEST_JUST_SUBMITTED_KEY,
  MOCK_TEST_PAID_EVENT,
  MOCK_TEST_PAID_MESSAGE,
  getMockTestAttempt,
  getMockTestResult,
  getUsedQuestionIds,
  rememberUsedQuestionIds,
  isLeetCodeSubmissionUrl,
  leetCodeSubmissionUrlIssue,
  parseLeetCodeProblemPath,
  isMockTestCompleted,
  isMockTestPaid,
  markMockTestCompleted,
  markMockTestPaid,
  saveMockTestAttempt,
  startMockTestCheckout,
} from '../lib/mockTestAccess';

const difficultyTone: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  Hard: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
};

const SnapshotUpload: React.FC<{
  question: DsaQuestion;
  preview?: string;
  disabled?: boolean;
  error?: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
}> = ({ question, preview, disabled, error, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file || disabled) return;
    setBusy(true);
    try {
      onUpload(await readProofImage(file));
    } catch (err) {
      console.error(err);
      onUpload('');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 p-3 bg-white/60 dark:bg-charcoal-900/50">
      <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
        Upload a snapshot of your accepted LeetCode solution.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        disabled={disabled || busy}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {preview ? (
        <div className="space-y-2">
          <img
            src={preview}
            alt={`${question.title} snapshot`}
            className="w-full max-h-72 object-contain rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-charcoal-950"
          />
          {!disabled && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold"
              >
                Replace snapshot
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="w-full py-8 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <ImagePlus className="w-4 h-4" />
            {busy ? 'Reading snapshot...' : 'Upload snapshot'}
          </span>
        </button>
      )}
      {error && <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">{error}</p>}
    </div>
  );
};

export const MockTestPage: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const test = MOCK_TESTS.find((item) => item.id === setId);
  const [questions, setQuestions] = useState<DsaQuestion[]>([]);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmittedPopup, setShowSubmittedPopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(() => isMockTestPaid(setId));
  const [alreadyTaken, setAlreadyTaken] = useState(() => isMockTestCompleted(setId));
  const [paying, setPaying] = useState(false);
  const [attemptReady, setAttemptReady] = useState(false);
  const savedResult = getMockTestResult(setId);

  useEffect(() => {
    setAttemptReady(false);
    if (isMockTestCompleted(setId)) {
      setQuestions(questionsFromIds(getMockTestResult(setId)?.questionIds));
      setAlreadyTaken(true);
      setSubmitted(true);
      setAttemptReady(true);
      return;
    }
    const attempt = getMockTestAttempt(setId);
    let paper = questionsFromIds(attempt?.questionIds);
    if (paper.length !== (test?.questionCount || 3)) {
      paper = pickFocusPaper(undefined, getUsedQuestionIds());
      rememberUsedQuestionIds(paper.map((question) => question.id));
    }
    const allowed = new Set(paper.map((question) => question.id));
    const shots = Object.fromEntries(
      Object.entries(attempt?.screenshots || {}).filter(([id]) => allowed.has(id)),
    );
    const links = Object.fromEntries(
      Object.entries(attempt?.submissionUrls || {}).filter(([id]) => allowed.has(id)),
    );
    setQuestions(paper);
    setScreenshots(shots);
    setSubmissionUrls(links);
    setSubmitted(false);
    setAlreadyTaken(false);
    if (isMockTestPaid(setId) && setId) {
      saveMockTestAttempt(setId, {
        screenshots: shots,
        submissionUrls: links,
        questionIds: paper.map((question) => question.id),
      });
    }
    setAttemptReady(true);
  }, [setId]);

  useEffect(() => {
    if (!attemptReady || !setId || alreadyTaken || submitted || !isMockTestPaid(setId)) return;
    try {
      saveMockTestAttempt(setId, {
        screenshots,
        submissionUrls,
        questionIds: questions.map((question) => question.id),
      });
    } catch {
      setUploadError((prev) => ({ ...prev, persist: 'Could not save snapshots on this device.' }));
    }
  }, [attemptReady, setId, screenshots, submissionUrls, questions, alreadyTaken, submitted]);

  useEffect(() => {
    if (!showSubmittedPopup) return;
    const timer = window.setTimeout(() => {
      navigate('/dashboard#mock-tests', { state: { mockTestSubmitted: true } });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [showSubmittedPopup, navigate]);

  useEffect(() => {
    if (!setId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1' || params.get('mock_test') === setId) {
      markMockTestPaid(setId);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const refresh = () => {
      setHasAccess(isMockTestPaid(setId));
      setAlreadyTaken(isMockTestCompleted(setId));
    };
    refresh();
    const onPaid = () => refresh();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === MOCK_TEST_PAID_MESSAGE && event.data.testId === setId) {
        markMockTestPaid(setId);
        refresh();
      }
    };
    window.addEventListener(MOCK_TEST_PAID_EVENT, onPaid);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener(MOCK_TEST_PAID_EVENT, onPaid);
      window.removeEventListener('message', onMessage);
    };
  }, [setId]);

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-3">That test set was not found.</p>
          <button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-bold text-brand-600">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const paperQuestions = questions.length ? questions : questionsFromIds(savedResult?.questionIds);
  const isQuestionDone = (questionId: string) => {
    const question = paperQuestions.find((item) => item.id === questionId);
    return (
      Boolean(screenshots[questionId]) &&
      isLeetCodeSubmissionUrl(submissionUrls[questionId], question?.leetcodeSlug)
    );
  };
  const uploadedCount = paperQuestions.filter((question) => isQuestionDone(question.id)).length;
  const resultUploaded = savedResult?.uploaded ?? uploadedCount;
  const resultTotal = savedResult?.total ?? (paperQuestions.length || test.questionCount);

  if (alreadyTaken) {
    const result = savedResult;
    const resultShots = result?.screenshots || {};
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/80 dark:bg-charcoal-900/80 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Attempt used</p>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{test.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            You already took this paper. One ₹10 payment allows one attempt only.
          </p>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 mb-5 text-left">
            <div className="text-[10px] uppercase font-bold text-slate-500">Snapshots uploaded</div>
            <div className="text-lg font-extrabold">
              {resultUploaded}/{resultTotal}
            </div>
          </div>
          {paperQuestions.some((question) => resultShots[question.id]) && (
            <div className="space-y-2 mb-5 text-left">
              {paperQuestions.map((question) =>
                resultShots[question.id] ? (
                  <img
                    key={question.id}
                    src={resultShots[question.id]}
                    alt={`${question.title} snapshot`}
                    className="w-full max-h-40 object-contain rounded-lg border border-slate-200 dark:border-white/10"
                  />
                ) : null,
              )}
            </div>
          )}
          <button type="button" onClick={() => navigate('/dashboard')} className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/80 dark:bg-charcoal-900/80 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-2">₹10 mock test</p>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{test.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            Pay ₹10 to unlock this paper. This does not activate ProfileReel Pro.
          </p>
          <button
            type="button"
            disabled={paying}
            onClick={async () => {
              setPaying(true);
              try {
                await startMockTestCheckout({
                  testId: test.id,
                  userId: user?.id,
                  userEmail: user?.email,
                  customerName: user?.name,
                });
              } catch (err) {
                console.error(err);
              } finally {
                setTimeout(() => setPaying(false), 1500);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-60"
          >
            {paying ? 'Opening Razorpay...' : 'Pay ₹10 to start'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="mt-3 text-xs font-semibold text-slate-500">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = paperQuestions.length || test.questionCount;
  const leftCount = Math.max(0, totalQuestions - uploadedCount);
  const progressPct = totalQuestions ? Math.round((uploadedCount / totalQuestions) * 100) : 0;

  const setShot = (questionId: string, dataUrl: string) => {
    if (!dataUrl) {
      setUploadError((prev) => ({ ...prev, [questionId]: 'Could not read that screenshot. Try a PNG or JPG.' }));
      return;
    }
    setUploadError((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setScreenshots((prev) => ({ ...prev, [questionId]: dataUrl }));
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-charcoal-950 text-slate-800 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-white/5 bg-white/90 dark:bg-charcoal-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="text-sm font-extrabold text-center truncate">{test.title}</div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{uploadedCount}</div>
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mt-0.5">Attempted</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{leftCount}</div>
              <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mt-0.5">Left</div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-slate-100 dark:bg-white/10">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white/70 dark:bg-charcoal-900/60">
            <div className="text-[10px] uppercase font-bold text-slate-500">Attempted</div>
            <div className="text-lg font-extrabold">{uploadedCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white/70 dark:bg-charcoal-900/60">
            <div className="text-[10px] uppercase font-bold text-slate-500">Left</div>
            <div className="text-lg font-extrabold">{leftCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white/70 dark:bg-charcoal-900/60">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total</div>
            <div className="text-lg font-extrabold">{totalQuestions}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white mb-1">How this paper works</p>
          <p>
            Open each mapped LeetCode question, solve it there, paste the submitted-answer link, and upload a snapshot. Both are saved to Sheet 3. Submit once — this is your only attempt.
          </p>
        </div>

        {submitted && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
            <div className="text-[10px] uppercase font-bold text-slate-500">Snapshots uploaded</div>
            <div className="text-lg font-extrabold">
              {uploadedCount}/{totalQuestions}
            </div>
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 space-y-8">
          {paperQuestions.map((question, index) => {
            const linkIssue = leetCodeSubmissionUrlIssue(submissionUrls[question.id], question.leetcodeSlug);
            return (
            <article key={question.id} className="rounded-xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {index + 1}. {question.title}
                </h2>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${difficultyTone[question.difficulty]}`}>
                  {question.difficulty}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 dark:border-white/10 text-slate-500">
                  {question.pattern}
                </span>
              </div>
              {question.companies.length > 0 && (
                <p className="text-[11px] text-slate-500 mb-3">Asked at {question.companies.join(', ')}</p>
              )}
              <a
                href={question.leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
              >
                Open on LeetCode
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <label className="block mt-3">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Submitted answer link</span>
                <input
                  type="url"
                  value={submissionUrls[question.id] || ''}
                  disabled={submitted}
                  placeholder={`https://leetcode.com/problems/${question.leetcodeSlug}/submissions/`}
                  onChange={(event) =>
                    setSubmissionUrls((prev) => ({ ...prev, [question.id]: event.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-charcoal-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-70"
                />
                {linkIssue && (
                  <span className="mt-1 block text-[11px] text-rose-600 dark:text-rose-300">
                    {linkIssue}
                  </span>
                )}
              </label>
              <SnapshotUpload
                question={question}
                preview={screenshots[question.id]}
                disabled={submitted}
                error={uploadError[question.id]}
                onUpload={(dataUrl) => setShot(question.id, dataUrl)}
                onRemove={() =>
                  setScreenshots((prev) => {
                    const next = { ...prev };
                    delete next[question.id];
                    return next;
                  })
                }
              />
            </article>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pb-8">
          {!submitted ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  const incomplete = paperQuestions.some((question) => !isQuestionDone(question.id));
                  if (incomplete) {
                    setSubmitError('Add the matching submissions link and snapshot for all 3 questions.');
                    return;
                  }
                  const slugs = paperQuestions
                    .map((question) => parseLeetCodeProblemPath(submissionUrls[question.id])?.slug)
                    .filter(Boolean);
                  if (new Set(slugs).size !== slugs.length) {
                    setSubmitError('Each question needs its own submissions link. Do not paste the same link on all 3.');
                    return;
                  }
                  if (!user?.email) {
                    setSubmitError('Log in so this paper can be saved to Sheet 3.');
                    return;
                  }
                  setSubmitting(true);
                  setSubmitError('');
                  try {
                    const kept: Record<string, string> = {};
                    const links: Record<string, string> = {};
                    paperQuestions.forEach((question) => {
                      if (screenshots[question.id]) kept[question.id] = screenshots[question.id];
                      if (submissionUrls[question.id]) links[question.id] = submissionUrls[question.id].trim();
                    });
                    await api.submitMockTest({
                      testId: test.id,
                      userId: user.id,
                      fullName: user.name || 'Candidate',
                      email: user.email,
                      linkedinUrl: user.linkedinUrl,
                      answers: paperQuestions.map((question) => ({
                        questionId: question.id,
                        number: String(question.number),
                        title: question.title,
                        difficulty: question.difficulty,
                        pattern: question.pattern,
                        leetcodeUrl: question.leetcodeUrl,
                        submissionUrl: links[question.id],
                        snapshotData: kept[question.id],
                      })),
                    });
                    markMockTestCompleted(test.id, {
                      uploaded: Object.keys(kept).length,
                      total: paperQuestions.length,
                      submittedAt: new Date().toISOString(),
                      screenshots: kept,
                      submissionUrls: links,
                      questionIds: paperQuestions.map((question) => question.id),
                    });
                    setSubmitted(true);
                    setShowSubmittedPopup(true);
                    try {
                      sessionStorage.setItem(MOCK_TEST_JUST_SUBMITTED_KEY, '1');
                    } catch {
                      /* ignore */
                    }
                  } catch (err) {
                    console.error(err);
                    setSubmitError('Could not save this paper to Sheet 3. Try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold disabled:opacity-60"
              >
                {submitting ? 'Saving to Sheet 3...' : 'Submit paper'}
              </button>
              {submitError && <p className="text-[11px] text-rose-600 dark:text-rose-300">{submitError}</p>}
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              This was your only attempt. You cannot retake this paper.
            </p>
          )}
          <button type="button" onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-slate-500">
            Back to dashboard
          </button>
        </div>
      </main>

      {showSubmittedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-white dark:bg-charcoal-900 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Paper submitted</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your submitted links and snapshots were saved. Taking you back to the dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard#mock-tests', { state: { mockTestSubmitted: true } })}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
