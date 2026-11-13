export type InterviewRole = 'react' | 'java' | 'golang';

export type PlatformQuestion = {
  id: string;
  role: InterviewRole;
  title: string;
  pattern: string;
  statement: string;
  example: string;
  starter: string;
  /** Each input is the argument list passed to solve(...). */
  tests: Array<{ args: unknown[]; output: unknown; hidden?: boolean }>;
};

const pair = `function solve(numbers, target) {\n  \n}\n`;
const text = `function solve(text) {\n  \n}\n`;
const list = `function solve(items) {\n  \n}\n`;

export const PLATFORM_QUESTIONS: PlatformQuestion[] = [
  {
    id: 'react-1',
    role: 'react',
    title: 'Two indexes that add up',
    pattern: 'Hash map',
    statement:
      'Given a list of whole numbers and a target, return the two indexes whose values add up to the target. Exactly one pair exists. Indexes start at 0. Return them in increasing order.',
    example: 'solve([2, 7, 11, 15], 9) → [0, 1]',
    starter: pair,
    tests: [
      { args: [[2, 7, 11, 15], 9], output: [0, 1] },
      { args: [[3, 2, 4], 6], output: [1, 2], hidden: true },
      { args: [[3, 3], 6], output: [0, 1], hidden: true },
    ],
  },
  {
    id: 'react-2',
    role: 'react',
    title: 'Longest stretch without a repeat',
    pattern: 'Sliding window',
    statement:
      'Given a string, return the length of the longest piece that contains no repeated character.',
    example: 'solve("abcabcbb") → 3',
    starter: text,
    tests: [
      { args: ['abcabcbb'], output: 3 },
      { args: ['bbbbb'], output: 1, hidden: true },
      { args: ['pwwkew'], output: 3, hidden: true },
    ],
  },
  {
    id: 'react-3',
    role: 'react',
    title: 'Nested brackets',
    pattern: 'Stack',
    statement:
      'A string contains only the brackets () [] {}. Return true when every opener is closed by the same type in the right order. Return false otherwise.',
    example: 'solve("()[]{}") → true',
    starter: text,
    tests: [
      { args: ['()[]{}'], output: true },
      { args: ['(]'], output: false, hidden: true },
      { args: ['([)]'], output: false, hidden: true },
      { args: ['{[]}'], output: true, hidden: true },
    ],
  },
  {
    id: 'react-4',
    role: 'react',
    title: 'Merge overlapping ranges',
    pattern: 'Intervals',
    statement:
      'You are given ranges as pairs [start, end]. Merge any ranges that overlap or touch, and return the merged ranges sorted by start.',
    example: 'solve([[1,3],[2,6],[8,10],[15,18]]) → [[1,6],[8,10],[15,18]]',
    starter: list,
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], output: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], output: [[1, 5]], hidden: true },
    ],
  },
  {
    id: 'java-1',
    role: 'java',
    title: 'Smallest missing positive',
    pattern: 'Array',
    statement:
      'Given a list of integers, return the smallest missing positive whole number. The list may contain negatives and duplicates.',
    example: 'solve([1, 2, 0]) → 3',
    starter: list,
    tests: [
      { args: [[1, 2, 0]], output: 3 },
      { args: [[3, 4, -1, 1]], output: 2, hidden: true },
      { args: [[7, 8, 9]], output: 1, hidden: true },
    ],
  },
  {
    id: 'java-2',
    role: 'java',
    title: 'Can the courses be finished',
    pattern: 'Graph',
    statement:
      'There are n courses, numbered from 0. prerequisites is a list of pairs [course, mustFinishFirst]. Return true if every course can be finished, and false if the prerequisites form a cycle.',
    example: 'solve(2, [[1, 0]]) → true',
    starter: 'function solve(n, prerequisites) {\n  \n}\n',
    tests: [
      { args: [2, [[1, 0]]], output: true },
      { args: [2, [[1, 0], [0, 1]]], output: false, hidden: true },
    ],
  },
  {
    id: 'java-3',
    role: 'java',
    title: 'Top frequent numbers',
    pattern: 'Heap',
    statement:
      'Given a list of numbers and k, return the k numbers that appear most often. If there is a tie, the smaller number comes first. Return them from most frequent to least.',
    example: 'solve([1,1,1,2,2,3], 2) → [1, 2]',
    starter: 'function solve(numbers, k) {\n  \n}\n',
    tests: [
      { args: [[1, 1, 1, 2, 2, 3], 2], output: [1, 2] },
      { args: [[1], 1], output: [1], hidden: true },
      { args: [[4, 4, 3, 3, 2], 2], output: [3, 4], hidden: true },
    ],
  },
  {
    id: 'java-4',
    role: 'java',
    title: 'Islands in a grid',
    pattern: 'Grid',
    statement:
      'A grid of "1" and "0" marks land and water. Return how many islands there are. Land cells connect on the four sides, not diagonally.',
    example: 'solve([["1","1","0"],["0","1","0"],["0","0","1"]]) → 2',
    starter: list,
    tests: [
      { args: [[['1', '1', '0'], ['0', '1', '0'], ['0', '0', '1']]], output: 2 },
      { args: [[['1', '0'], ['0', '1']]], output: 2, hidden: true },
      { args: [[['0']]], output: 0, hidden: true },
    ],
  },
  {
    id: 'go-1',
    role: 'golang',
    title: 'Word break',
    pattern: 'Dynamic programming',
    statement:
      'Given a string and a dictionary of words, return true when the string can be split into a sequence of dictionary words.',
    example: 'solve("leetcode", ["leet", "code"]) → true',
    starter: 'function solve(text, words) {\n  \n}\n',
    tests: [
      { args: ['leetcode', ['leet', 'code']], output: true },
      { args: ['applepenapple', ['apple', 'pen']], output: true, hidden: true },
      { args: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], output: false, hidden: true },
    ],
  },
  {
    id: 'go-2',
    role: 'golang',
    title: 'Cheapest path with one stop',
    pattern: 'Graph',
    statement:
      'n cities are numbered from 0. flights is a list of [from, to, price]. Return the cheapest price from src to dst with at most k stops. A stop is a city in between. Return -1 when no such route exists.',
    example: 'solve(4, [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], 0, 3, 1) → 700',
    starter: 'function solve(n, flights, src, dst, k) {\n  \n}\n',
    tests: [
      { args: [4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1], output: 700 },
      { args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1], output: 200, hidden: true },
      { args: [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0], output: 500, hidden: true },
    ],
  },
  {
    id: 'go-3',
    role: 'golang',
    title: 'Decode ways',
    pattern: 'Dynamic programming',
    statement:
      'A string of digits maps 1 to A through 26 to Z. Return how many ways the string can be decoded. A leading zero makes a group invalid.',
    example: 'solve("226") → 3',
    starter: text,
    tests: [
      { args: ['226'], output: 3 },
      { args: ['12'], output: 2, hidden: true },
      { args: ['06'], output: 0, hidden: true },
    ],
  },
  {
    id: 'go-4',
    role: 'golang',
    title: 'Meeting rooms needed',
    pattern: 'Sweep line',
    statement:
      'Each meeting is [start, end). Return the smallest number of rooms that can host all meetings.',
    example: 'solve([[0,30],[5,10],[15,20]]) → 2',
    starter: list,
    tests: [
      { args: [[[0, 30], [5, 10], [15, 20]]], output: 2 },
      { args: [[[7, 10], [2, 4]]], output: 1, hidden: true },
    ],
  },
];

export function questionsForRole(role: InterviewRole): PlatformQuestion[] {
  return PLATFORM_QUESTIONS.filter((question) => question.role === role);
}
