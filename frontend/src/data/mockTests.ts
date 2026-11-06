import type { Difficulty, DsaQuestion } from './leetcodeCompanyBank';

export type { Difficulty, DsaQuestion };

export const MOCK_TEST_QUESTION_COUNT = 3;

export type MockTest = {
  id: string;
  title: string;
  minutes: number;
  blurb: string;
  questionCount: number;
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'set-1',
    title: 'Mock Test',
    minutes: 75,
    blurb:
      '3 DSA questions mapped from LeetCode (Easy, Medium, Hard). Each attempt draws a different paper from the Flipkart / Swiggy / PhonePe bank. Solve on LeetCode, paste the submitted-answer link, and upload a snapshot.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
];
