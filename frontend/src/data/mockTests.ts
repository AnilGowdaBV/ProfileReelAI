import type { InterviewRole } from './platformQuestions';

export type { InterviewRole };

export const MOCK_TEST_QUESTION_COUNT = 4;

export type MockTest = {
  id: string;
  title: string;
  role: InterviewRole;
  minutes: number;
  blurb: string;
  questionCount: number;
  comingSoon?: boolean;
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'set-1',
    role: 'react',
    title: 'React',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
  {
    id: 'set-2',
    role: 'java',
    title: 'Java',
    minutes: 75,
    blurb: '2 coding questions, drawn from 3 papers.',
    questionCount: 2,
  },
  {
    id: 'set-3',
    role: 'golang',
    title: 'Golang',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
  },
  {
    id: 'set-4',
    role: 'dataengineer',
    title: 'Data Engineer',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
    comingSoon: true,
  },
  {
    id: 'set-5',
    role: 'sdet',
    title: 'SDET Playwright',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
    comingSoon: true,
  },
  {
    id: 'set-6',
    role: 'dataanalyst',
    title: 'Data Analyst',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
    comingSoon: true,
  },
  {
    id: 'set-7',
    role: 'devops',
    title: 'DevOps',
    minutes: 75,
    blurb: '4 coding questions, solved inside this test.',
    questionCount: MOCK_TEST_QUESTION_COUNT,
    comingSoon: true,
  },
];
