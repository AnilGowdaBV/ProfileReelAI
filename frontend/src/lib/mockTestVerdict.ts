export type QuestionRead = {
  passed: boolean;
  note: string;
};

export type PaperVerdict = {
  verdict: 'Passed' | 'Failed';
  reason: string;
};

/** A question passes when the snapshot says Accepted, or more cases passed than failed. */
export function questionFromSnapshotText(text: string): QuestionRead {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const ratio = cleaned.match(/(\d+)\s*\/\s*(\d+)\s*test\s*cases?/i);
  if (ratio) {
    const passed = Number(ratio[1]);
    const total = Number(ratio[2]);
    if (total > 0 && passed <= total) {
      const ok = passed > total - passed;
      return { passed: ok, note: `${passed}/${total}` };
    }
  }
  if (/\baccepted\b/i.test(cleaned)) return { passed: true, note: 'Accepted' };
  if (/\b(wrong answer|runtime error|time limit|compile error|memory limit)\b/i.test(cleaned)) {
    return { passed: false, note: 'Not accepted' };
  }
  return { passed: false, note: 'Could not read the snapshot' };
}

export function paperVerdict(questions: QuestionRead[]): PaperVerdict {
  const notes = questions.map((question) => question.note).join(', ');
  const missed = questions.filter((question) => !question.passed).length;
  if (missed > 0) {
    return {
      verdict: 'Failed',
      reason: `${missed} of ${questions.length} did not pass. Cases: ${notes}`,
    };
  }
  return {
    verdict: 'Passed',
    reason: `${questions.length} questions. Cases: ${notes}`,
  };
}
