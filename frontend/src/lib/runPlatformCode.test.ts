import { describe, expect, it } from 'vitest';
import { questionsForRole } from '../data/platformQuestions';
import { runQuestion } from './runPlatformCode';

describe('runQuestion', () => {
  it('passes a correct two-index solution when more cases pass than fail', () => {
    const question = questionsForRole('react')[0];
    const result = runQuestion(
      question,
      `function solve(numbers, target) {
        const seen = new Map();
        for (let i = 0; i < numbers.length; i++) {
          const need = target - numbers[i];
          if (seen.has(need)) return [seen.get(need), i];
          seen.set(numbers[i], i);
        }
      }`,
    );
    expect(result.note).toBe('3/3');
    expect(result.passed).toBe(true);
  });

  it('fails when the function is missing', () => {
    const question = questionsForRole('react')[0];
    expect(runQuestion(question, 'const x = 1;').passed).toBe(false);
  });
});
