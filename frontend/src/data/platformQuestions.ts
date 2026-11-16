import { getUsedQuestionIds } from '../lib/mockTestAccess';

export type InterviewRole = 'react' | 'java' | 'golang' | 'dataengineer' | 'sdet' | 'dataanalyst' | 'devops';

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
    id: 'java-koko',
    role: 'java',
    title: 'Koko Eating Bananas',
    pattern: 'Binary search',
    statement:
      'Koko has piles of bananas. piles[i] is how many bananas are in that pile. She chooses a speed k, eats k bananas from one pile each hour, and will not start another pile in the same hour. Return the smallest k that lets her finish every pile within h hours.',
    example: 'solve([3, 6, 7, 11], 8) → 4',
    starter: 'function solve(piles, hours) {\n  \n}\n',
    tests: [
      { args: [[3, 6, 7, 11], 8], output: 4 },
      { args: [[30, 11, 23, 4, 20], 5], output: 30, hidden: true },
      { args: [[30, 11, 23, 4, 20], 6], output: 23, hidden: true },
    ],
  },
  {
    id: 'java-oranges',
    role: 'java',
    title: 'Rotting Oranges',
    pattern: 'Grid',
    statement:
      'A grid uses 0 for empty, 1 for a fresh orange, and 2 for a rotten orange. Every minute, a rotten orange rots the fresh oranges on its four sides. Return the minutes until every orange is rotten. Return -1 if a fresh orange can never rot. Return 0 if there is no fresh orange.',
    example: 'solve([[2,1,1],[1,1,0],[0,1,1]]) → 4',
    starter: list,
    tests: [
      { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], output: 4 },
      { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], output: -1, hidden: true },
      { args: [[[0, 2]]], output: 0, hidden: true },
    ],
  },
  {
    id: 'java-edit',
    role: 'java',
    title: 'Edit Distance',
    pattern: 'Dynamic programming',
    statement:
      'Given two words, return the fewest edits that turn the first word into the second. One edit is inserting a character, deleting a character, or replacing a character.',
    example: 'solve("horse", "ros") → 3',
    starter: 'function solve(word1, word2) {\n  \n}\n',
    tests: [
      { args: ['horse', 'ros'], output: 3 },
      { args: ['intention', 'execution'], output: 5, hidden: true },
      { args: ['', 'a'], output: 1, hidden: true },
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
  {
    id: 'de-1',
    role: 'dataengineer',
    title: 'Rows that pass a quality check',
    pattern: 'Filtering',
    statement: 'Each row is [id, value]. Return the ids, in the same order, whose value is a whole number of 0 or more.',
    example: 'solve([[1, 10], [2, -1], [3, 0]]) → [1, 3]',
    starter: list,
    tests: [
      { args: [[[1, 10], [2, -1], [3, 0]]], output: [1, 3] },
      { args: [[[4, 1]]], output: [4], hidden: true },
    ],
  },
  {
    id: 'de-2',
    role: 'dataengineer',
    title: 'Duplicate keys',
    pattern: 'Deduping',
    statement: 'Given a list of strings, return the ones that appear more than once. Keep the order of their first repeat.',
    example: 'solve(["a", "b", "a", "c", "b"]) → ["a", "b"]',
    starter: list,
    tests: [
      { args: [['a', 'b', 'a', 'c', 'b']], output: ['a', 'b'] },
      { args: [['x']], output: [], hidden: true },
    ],
  },
  {
    id: 'de-3',
    role: 'dataengineer',
    title: 'Late events',
    pattern: 'Watermarks',
    statement: 'Each event is [time, id]. A watermark is the largest time seen so far. Return the ids that arrive with a time smaller than the watermark already seen. Keep their order.',
    example: 'solve([[1, "a"], [3, "b"], [2, "c"]]) → ["c"]',
    starter: list,
    tests: [
      { args: [[[1, 'a'], [3, 'b'], [2, 'c']]], output: ['c'] },
      { args: [[[5, 'a'], [5, 'b']]], output: [], hidden: true },
    ],
  },
  {
    id: 'de-4',
    role: 'dataengineer',
    title: 'Daily totals',
    pattern: 'Aggregation',
    statement: 'Each record is [day, amount]. Return the totals as pairs [day, total], sorted by day.',
    example: 'solve([["d1", 2], ["d2", 3], ["d1", 4]]) → [["d1", 6], ["d2", 3]]',
    starter: list,
    tests: [
      { args: [[['d1', 2], ['d2', 3], ['d1', 4]]], output: [['d1', 6], ['d2', 3]] },
      { args: [[['d3', 1]]], output: [['d3', 1]], hidden: true },
    ],
  },
  {
    id: 'sdet-1',
    role: 'sdet',
    title: 'Stable test order',
    pattern: 'Sorting',
    statement: 'Each test is [name, priority]. Lower priority numbers run first. Return the names in run order. If priorities match, keep the original order.',
    example: 'solve([["login", 2], ["home", 1], ["cart", 2]]) → ["home", "login", "cart"]',
    starter: list,
    tests: [
      { args: [[['login', 2], ['home', 1], ['cart', 2]]], output: ['home', 'login', 'cart'] },
      { args: [[['a', 1]]], output: ['a'], hidden: true },
    ],
  },
  {
    id: 'sdet-2',
    role: 'sdet',
    title: 'Flaky reruns',
    pattern: 'Retries',
    statement: 'A result list contains "pass" or "fail". A case passes if it has at least one "pass". Return how many cases pass.',
    example: 'solve([["fail", "pass"], ["fail"], ["pass"]]) → 2',
    starter: list,
    tests: [
      { args: [[['fail', 'pass'], ['fail'], ['pass']]], output: 2 },
      { args: [[['fail', 'fail']]], output: 0, hidden: true },
    ],
  },
  {
    id: 'sdet-3',
    role: 'sdet',
    title: 'Selector match',
    pattern: 'Locators',
    statement: 'You get a locator and a list of element ids. Return true when the locator equals one of the ids.',
    example: 'solve("submit", ["name", "submit"]) → true',
    starter: `function solve(locator, ids) {\n  \n}\n`,
    tests: [
      { args: ['submit', ['name', 'submit']], output: true },
      { args: ['pay', ['name']], output: false, hidden: true },
    ],
  },
  {
    id: 'sdet-4',
    role: 'sdet',
    title: 'Failed step',
    pattern: 'Assertions',
    statement: 'Steps are "ok" or "fail". Return the index of the first "fail". Return -1 when every step is ok.',
    example: 'solve(["ok", "fail", "ok"]) → 1',
    starter: list,
    tests: [
      { args: [['ok', 'fail', 'ok']], output: 1 },
      { args: [['ok', 'ok']], output: -1, hidden: true },
    ],
  },
  {
    id: 'da-1',
    role: 'dataanalyst',
    title: 'Average of the middle',
    pattern: 'Summaries',
    statement: 'Given a list of numbers, drop the smallest and the largest, then return the average of what remains. Round to the nearest whole number. If fewer than 3 numbers remain after the drop, return 0.',
    example: 'solve([1, 2, 3, 4]) → 3',
    starter: list,
    tests: [
      { args: [[1, 2, 3, 4]], output: 3 },
      { args: [[5, 5]], output: 0, hidden: true },
    ],
  },
  {
    id: 'da-2',
    role: 'dataanalyst',
    title: 'Top category',
    pattern: 'Grouping',
    statement: 'Each sale is [category, amount]. Return the category with the highest total. If two tie, return the one that appears first.',
    example: 'solve([["a", 2], ["b", 5], ["a", 2]]) → "b"',
    starter: list,
    tests: [
      { args: [[['a', 2], ['b', 5], ['a', 2]]], output: 'b' },
      { args: [[['a', 3], ['b', 3]]], output: 'a', hidden: true },
    ],
  },
  {
    id: 'da-3',
    role: 'dataanalyst',
    title: 'Month over month',
    pattern: 'Change',
    statement: 'Given monthly totals in order, return the difference of each month from the previous one. The first month has no difference, so skip it.',
    example: 'solve([10, 12, 9]) → [2, -3]',
    starter: list,
    tests: [
      { args: [[10, 12, 9]], output: [2, -3] },
      { args: [[4]], output: [], hidden: true },
    ],
  },
  {
    id: 'da-4',
    role: 'dataanalyst',
    title: 'Missing days',
    pattern: 'Gaps',
    statement: 'You are given sorted day numbers that have data. Return the missing day numbers from the first day to the last day.',
    example: 'solve([1, 2, 4]) → [3]',
    starter: list,
    tests: [
      { args: [[1, 2, 4]], output: [3] },
      { args: [[1, 2, 3]], output: [], hidden: true },
    ],
  },
  {
    id: 'ops-1',
    role: 'devops',
    title: 'Healthy hosts',
    pattern: 'Health checks',
    statement: 'Each host is [name, status]. Status is "up" or "down". Return the names that are up, in the same order.',
    example: 'solve([["a", "up"], ["b", "down"], ["c", "up"]]) → ["a", "c"]',
    starter: list,
    tests: [
      { args: [[['a', 'up'], ['b', 'down'], ['c', 'up']]], output: ['a', 'c'] },
      { args: [[['a', 'down']]], output: [], hidden: true },
    ],
  },
  {
    id: 'ops-2',
    role: 'devops',
    title: 'Deploy window',
    pattern: 'Windows',
    statement: 'A deploy may start only when the hour is from 1 to 5 inclusive. Given a list of hours, return how many are inside that window.',
    example: 'solve([1, 6, 5, 0]) → 2',
    starter: list,
    tests: [
      { args: [[1, 6, 5, 0]], output: 2 },
      { args: [[9]], output: 0, hidden: true },
    ],
  },
  {
    id: 'ops-3',
    role: 'devops',
    title: 'Rollback point',
    pattern: 'Releases',
    statement: 'Releases are "good" or "bad" from oldest to newest. Return the index of the latest "good" release. Return -1 when none are good.',
    example: 'solve(["good", "bad", "good", "bad"]) → 2',
    starter: list,
    tests: [
      { args: [['good', 'bad', 'good', 'bad']], output: 2 },
      { args: [['bad']], output: -1, hidden: true },
    ],
  },
  {
    id: 'ops-4',
    role: 'devops',
    title: 'Disk alert',
    pattern: 'Thresholds',
    statement: 'Each server is [name, usedPercent]. Return the names whose used percent is 80 or more, in the same order.',
    example: 'solve([["a", 80], ["b", 79]]) → ["a"]',
    starter: list,
    tests: [
      { args: [[['a', 80], ['b', 79]]], output: ['a'] },
      { args: [[['b', 10]]], output: [], hidden: true },
    ],
  },
];

const JAVA_PAPERS = [
  ['java-koko', 'java-oranges'],
  ['java-koko', 'java-edit'],
  ['java-oranges', 'java-edit'],
];

export function questionsForRole(role: InterviewRole, lockedIds?: string[]): PlatformQuestion[] {
  const bank = PLATFORM_QUESTIONS.filter((question) => question.role === role);
  if (role !== 'java') return bank;
  const known = new Set(bank.map((question) => question.id));
  const locked = (lockedIds || []).filter((id) => known.has(id));
  if (locked.length === 2) {
    return locked.map((id) => bank.find((question) => question.id === id)!);
  }
  const used = new Set(getUsedQuestionIds());
  const fresh = JAVA_PAPERS.filter((paper) => paper.some((id) => !used.has(id)));
  const pool = fresh.length ? fresh : JAVA_PAPERS;
  const paper = pool[Math.floor(Math.random() * pool.length)];
  return paper.map((id) => bank.find((question) => question.id === id)!);
}
