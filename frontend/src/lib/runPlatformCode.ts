import type { PlatformQuestion } from '../data/platformQuestions';

export type CaseResult = {
  index: number;
  hidden: boolean;
  passed: boolean;
  message: string;
};

export type QuestionRun = {
  passedCases: number;
  total: number;
  passed: boolean;
  note: string;
  output?: string;
  status?: string;
  time?: string;
  memory?: number;
  cases: CaseResult[];
};

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export function runQuestion(question: PlatformQuestion, code: string): QuestionRun {
  const cases: CaseResult[] = [];
  let solve: (...args: unknown[]) => unknown;
  try {
    solve = new Function(`${code}\nreturn typeof solve === 'function' ? solve : null;`)() as (
      ...args: unknown[]
    ) => unknown;
    if (typeof solve !== 'function') throw new Error('Define a function named solve.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The code could not run.';
    return {
      passedCases: 0,
      total: question.tests.length,
      passed: false,
      note: message,
      output: message,
      cases: question.tests.map((item, index) => ({
        index,
        hidden: Boolean(item.hidden),
        passed: false,
        message,
      })),
    };
  }

  const logs: string[] = [];
  question.tests.forEach((item, index) => {
    const label = item.hidden ? `Hidden case ${index + 1}` : `Sample ${index + 1}`;
    try {
      const actual = solve(...item.args.map((arg) => structuredClone(arg)));
      const passed = same(actual, item.output);
      const detail = `got ${JSON.stringify(actual)}`;
      if (!passed) logs.push(`${label}: ${detail}`);
      cases.push({
        index,
        hidden: Boolean(item.hidden),
        passed,
        message: passed ? 'Passed' : item.hidden ? `Hidden case failed, ${detail}` : `Expected ${JSON.stringify(item.output)}, ${detail}`,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Runtime error';
      logs.push(`${label}: ${detail}`);
      cases.push({
        index,
        hidden: Boolean(item.hidden),
        passed: false,
        message: detail,
      });
    }
  });

  const passedCases = cases.filter((item) => item.passed).length;
  const total = cases.length;
  const passed = passedCases > total - passedCases;
  return {
    passedCases,
    total,
    passed,
    note: `${passedCases}/${total}`,
    output: [...new Set(logs)].join('\n'),
    cases,
  };
}
