import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Difficulty, MOCK_TESTS, Question, QuestionKind } from '../data/mockTests';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_TEST_PAID_EVENT,
  MOCK_TEST_PAID_MESSAGE,
  getMockTestAttempt,
  getMockTestResult,
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

const kindTone: Record<QuestionKind, string> = {
  MCQ: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/30',
  'Complete the code': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  'Write the code': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
};

type CompilerLanguage = 'python' | 'c' | 'cpp' | 'java';

const COMPILER_LANGUAGES: { id: CompilerLanguage; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

const JUDGE0_LANGUAGE_ID: Record<CompilerLanguage, number> = {
  python: 71,
  c: 50,
  cpp: 54,
  java: 62,
};

function formatRunOutput(data: any, ok: boolean): string {
  if (!ok) {
    return data?.error || data?.message || 'Compiler rejected this run. Try again.';
  }
  const status = String(data?.status?.description || '').trim();
  const compile = String(data?.compile_output || '').trim();
  const stderr = String(data?.stderr || '').trim();
  const stdout = String(data?.stdout || data?.run?.stdout || '').trim();
  const message = String(data?.message || '').trim();
  const parts = [status && status !== 'Accepted' ? status : '', compile, stderr, stdout, !stdout && message ? message : ''].filter(
    Boolean,
  );
  if (parts.length) return parts.join('\n');
  if (status === 'Accepted') return 'Program ran. No printed output.';
  return 'Could not run this code.';
}

function startersFor(question: Question): Record<CompilerLanguage, string> {
  const task = question.prompt;
  const hint = question.snippet ? `\n${question.snippet.split('\n').map((line) => `  ${line}`).join('\n')}\n` : '';
  if (question.kind === 'Complete the code') {
    return {
      python: `# ${task}\n# Fill in the missing part, then run.\n${question.snippet ? `# Idea:\n# ${question.snippet.replace(/\n/g, '\n# ')}\n` : ''}\ndef solve():\n    # write the completed code here\n    return None\n\nprint(solve())\n`,
      c: `/* ${task} */\n#include <stdio.h>\n\nint main() {\n    /* complete the code here */${hint}\n    return 0;\n}\n`,
      cpp: `/* ${task} */\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // complete the code here${hint}\n    return 0;\n}\n`,
      java: `// ${task}\nclass Main {\n    public static void main(String[] args) {\n        // complete the code here\n    }\n}\n`,
    };
  }
  return {
    python: `# ${task}\n# Write your program here.\n\nprint("")\n`,
    c: `/* ${task} */\n#include <stdio.h>\n\nint main() {\n    /* write your code here */\n    return 0;\n}\n`,
    cpp: `/* ${task} */\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // write your code here\n    return 0;\n}\n`,
    java: `// ${task}\nclass Main {\n    public static void main(String[] args) {\n        // write your code here\n    }\n}\n`,
  };
}

const QuestionCompiler: React.FC<{
  question: Question;
  disabled?: boolean;
  onCodeChange: (code: string, language: CompilerLanguage) => void;
}> = ({ question, disabled, onCodeChange }) => {
  const initial = startersFor(question);
  const [language, setLanguage] = useState<CompilerLanguage>('python');
  const [files, setFiles] = useState<Record<CompilerLanguage, string>>(initial);
  const [output, setOutput] = useState('Choose Python, C, C++ or Java. Type in this box, then Run.');
  const [running, setRunning] = useState(false);

  const setLangCode = (next: CompilerLanguage, code: string) => {
    setFiles((prev) => ({ ...prev, [next]: code }));
    onCodeChange(code, next);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running...');
    try {
      const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: files[language],
          language_id: JUDGE0_LANGUAGE_ID[language],
          stdin: '',
        }),
      });
      const data = await res.json().catch(() => null);
      setOutput(formatRunOutput(data, res.ok));
    } catch {
      setOutput('Compiler is unavailable right now. Try again.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 p-3 bg-indigo-50/40 dark:bg-charcoal-900/50">
      <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
        Do this question here. Pick one language, type the code in the box, then press Run.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {COMPILER_LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              setLanguage(item.id);
              onCodeChange(files[item.id], item.id);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              language === item.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <textarea
        value={files[language]}
        disabled={disabled}
        onChange={(e) => setLangCode(language, e.target.value)}
        spellCheck={false}
        className="w-full h-40 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-5 border border-white/10 focus:outline-none disabled:opacity-70"
      />
      <button
        type="button"
        onClick={runCode}
        disabled={running || disabled}
        className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold disabled:opacity-60"
      >
        {running ? 'Running...' : `Run ${COMPILER_LANGUAGES.find((item) => item.id === language)?.label}`}
      </button>
      <p className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Output</p>
      <pre className="p-3 rounded-xl bg-white dark:bg-charcoal-950 text-[11px] text-slate-700 dark:text-slate-300 min-h-[56px] overflow-x-auto whitespace-pre-wrap">
        {output}
      </pre>
    </div>
  );
};

export const MockTestPage: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const test = MOCK_TESTS.find((item) => item.id === setId);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasAccess, setHasAccess] = useState(() => isMockTestPaid(setId));
  const [alreadyTaken, setAlreadyTaken] = useState(() => isMockTestCompleted(setId));
  const [paying, setPaying] = useState(false);
  const [attemptReady, setAttemptReady] = useState(false);
  const savedResult = getMockTestResult(setId);

  useEffect(() => {
    setAttemptReady(false);
    if (isMockTestCompleted(setId)) {
      setAlreadyTaken(true);
      setSubmitted(true);
      setAttemptReady(true);
      return;
    }
    const attempt = getMockTestAttempt(setId);
    setMcqAnswers(attempt?.mcqAnswers || {});
    setCodeAnswers(attempt?.codeAnswers || {});
    setSubmitted(false);
    setAlreadyTaken(false);
    if (!attempt && isMockTestPaid(setId) && setId) {
      saveMockTestAttempt(setId, { mcqAnswers: {}, codeAnswers: {} });
    }
    setAttemptReady(true);
  }, [setId]);

  useEffect(() => {
    if (!attemptReady || !setId || alreadyTaken || submitted || !isMockTestPaid(setId)) return;
    saveMockTestAttempt(setId, { mcqAnswers, codeAnswers });
  }, [attemptReady, setId, mcqAnswers, codeAnswers, alreadyTaken, submitted]);

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

  if (alreadyTaken) {
    const result = savedResult;
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-white/80 dark:bg-charcoal-900/80 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Attempt used</p>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{test.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            You already took this paper. One ₹10 payment allows one attempt only.
          </p>
          {result && (
            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <div className="text-[10px] uppercase font-bold text-slate-500">MCQ score</div>
                <div className="text-lg font-extrabold">{result.mcqScore}/{result.mcqTotal}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
                <div className="text-[10px] uppercase font-bold text-slate-500">Code attempted</div>
                <div className="text-lg font-extrabold">{result.codeAttempted}/{result.codeTotal}</div>
              </div>
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

  const mcqItems = test.questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.kind === 'MCQ');
  const codeItems = test.questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.kind !== 'MCQ');
  const mcqScore = mcqItems.filter(
    ({ question, index }) => typeof question.answer === 'number' && mcqAnswers[index] === question.answer,
  ).length;
  const codeAttempted = codeItems.filter(({ index }) => (codeAnswers[index] || '').trim().length > 0).length;
  const answeredCount = Object.keys(mcqAnswers).length + codeAttempted;
  const totalQuestions = test.questions.length;
  const leftCount = Math.max(0, totalQuestions - answeredCount);
  const progressPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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
              <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">{answeredCount}</div>
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
            <div className="text-lg font-extrabold">{answeredCount}</div>
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
          <p><strong>MCQ</strong> — pick one option.</p>
          <p><strong>Complete the code</strong> — the compiler is under that question. Choose Python, C, C++ or Java, fill the missing part, and press Run.</p>
          <p><strong>Write the code</strong> — write the program in that same compiler box under the question.</p>
        </div>

        {submitted && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">MCQ score</div>
              <div className="text-lg font-extrabold">{mcqScore}/{mcqItems.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Code attempted</div>
              <div className="text-lg font-extrabold">{codeAttempted}/{codeItems.length}</div>
            </div>
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).slice(0, 0).map((level) => (
              <div key={level} />
            ))}
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/10 space-y-8">
          {test.questions.map((question, index) => {
            const chosen = mcqAnswers[index];
            const isCorrect = chosen === question.answer;
            const isCode = question.kind !== 'MCQ';
            return (
              <fieldset key={`${test.id}-${index}`} className="rounded-xl">
                <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex flex-wrap items-center gap-2">
                  <span>
                    {index + 1}. {question.prompt}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${kindTone[question.kind]}`}>
                    {question.kind}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${difficultyTone[question.difficulty]}`}>
                    {question.difficulty}
                  </span>
                </legend>

                {!isCode && question.options && (
                  <div className="space-y-1.5">
                    {question.options.map((option, optionIndex) => {
                      const picked = chosen === optionIndex;
                      const mark = submitted && optionIndex === question.answer;
                      const wrongPick = submitted && picked && !isCorrect;
                      return (
                        <label
                          key={`${index}-${optionIndex}`}
                          className={`flex items-start gap-2 text-xs ${
                            mark
                              ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                              : wrongPick
                                ? 'text-rose-600 dark:text-rose-300'
                                : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            className="mt-0.5"
                            name={`${test.id}-${index}`}
                            checked={picked}
                            disabled={submitted}
                            onChange={() => setMcqAnswers((prev) => ({ ...prev, [index]: optionIndex }))}
                          />
                          {option}
                          {submitted && mark ? ' ✓' : ''}
                          {submitted && wrongPick ? ' ✕' : ''}
                        </label>
                      );
                    })}
                  </div>
                )}

                {isCode && (
                  <>
                    {question.snippet && (
                      <pre className="mb-2 p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] overflow-x-auto">
                        <code>{question.snippet}</code>
                      </pre>
                    )}
                    <QuestionCompiler
                      question={question}
                      disabled={submitted}
                      onCodeChange={(code) => setCodeAnswers((prev) => ({ ...prev, [index]: code }))}
                    />
                  </>
                )}
              </fieldset>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pb-8">
          {!submitted ? (
            <button
              type="button"
              onClick={() => {
                markMockTestCompleted(test.id, {
                  mcqScore,
                  mcqTotal: mcqItems.length,
                  codeAttempted,
                  codeTotal: codeItems.length,
                  submittedAt: new Date().toISOString(),
                });
                setSubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Submit all answers
            </button>
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
    </div>
  );
};
