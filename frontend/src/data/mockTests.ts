import type { Difficulty, DsaQuestion, InterviewRole } from './leetcodeCompanyBank';

export type { Difficulty, DsaQuestion };

export const MOCK_TEST_QUESTION_COUNT = 3;

export type MockTest = {
  id: string;
  title: string;
  role: InterviewRole;
  minutes: number;
  blurb: string;
  questionCount: number;
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'set-1',
    role: 'react',
    title: 'React',
    minutes: 75,
    blurb: '3 hard LeetCode questions asked in React interviews.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
  {
    id: 'set-2',
    role: 'java',
    title: 'Java',
    minutes: 75,
    blurb: '3 hard LeetCode questions asked in Java interviews.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
  {
    id: 'set-3',
    role: 'golang',
    title: 'Golang',
    minutes: 75,
    blurb: '3 hard LeetCode questions asked in Golang interviews.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
];
