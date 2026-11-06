export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type DsaQuestion = {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  leetcodeSlug: string;
  leetcodeUrl: string;
  companies: string[];
};

/** Product companies this paper is built around. */
export const FOCUS_COMPANIES = ['Flipkart', 'Swiggy', 'PhonePe'] as const;

export type FocusCompany = (typeof FOCUS_COMPANIES)[number];

export type LeetCodeProblem = {
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: string;
  companies: string[];
  /** 1–10 relative interview frequency at product companies. */
  frequency: number;
};

/**
 * High-signal DSA bank for Flipkart / Swiggy / PhonePe-style interviews.
 * UI never embeds the LeetCode statement — only a title, pattern, and official URL.
 * Swap frequency or company tags here; the paper picker re-ranks automatically.
 */
export const LEETCODE_FOCUS_BANK: LeetCodeProblem[] = [
  {
    number: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    pattern: 'Hash Map',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon', 'Paytm'],
    frequency: 10,
  },
  {
    number: 206,
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    pattern: 'Linked List',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon'],
    frequency: 9,
  },
  {
    number: 141,
    title: 'Linked List Cycle',
    slug: 'linked-list-cycle',
    difficulty: 'Easy',
    pattern: 'Two Pointers',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 121,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    pattern: 'Kadane / Arrays',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 20,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    pattern: 'Stack',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 21,
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    pattern: 'Linked List',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
  {
    number: 543,
    title: 'Diameter of Binary Tree',
    slug: 'diameter-of-binary-tree',
    difficulty: 'Easy',
    pattern: 'Binary Tree',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
  {
    number: 146,
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: 'Medium',
    pattern: 'Hash Map + Linked List',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon', 'Uber'],
    frequency: 10,
  },
  {
    number: 56,
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    pattern: 'Intervals',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon'],
    frequency: 9,
  },
  {
    number: 3,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    pattern: 'Sliding Window',
    companies: ['Flipkart', 'PhonePe', 'Amazon', 'Paytm'],
    frequency: 9,
  },
  {
    number: 200,
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    pattern: 'Graph / DFS',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon'],
    frequency: 9,
  },
  {
    number: 207,
    title: 'Course Schedule',
    slug: 'course-schedule',
    difficulty: 'Medium',
    pattern: 'Graph / Topological Sort',
    companies: ['PhonePe', 'Flipkart', 'Uber'],
    frequency: 8,
  },
  {
    number: 322,
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    companies: ['PhonePe', 'Flipkart', 'Swiggy', 'Paytm'],
    frequency: 8,
  },
  {
    number: 31,
    title: 'Next Permutation',
    slug: 'next-permutation',
    difficulty: 'Medium',
    pattern: 'Arrays',
    companies: ['Flipkart', 'Amazon'],
    frequency: 8,
  },
  {
    number: 15,
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 215,
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    difficulty: 'Medium',
    pattern: 'Heap / Quickselect',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 139,
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 42,
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    pattern: 'Two Pointers / Stack',
    companies: ['Flipkart', 'Swiggy', 'PhonePe', 'Amazon'],
    frequency: 10,
  },
  {
    number: 23,
    title: 'Merge k Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'Hard',
    pattern: 'Heap / Linked List',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 9,
  },
  {
    number: 239,
    title: 'Sliding Window Maximum',
    slug: 'sliding-window-maximum',
    difficulty: 'Hard',
    pattern: 'Deque / Sliding Window',
    companies: ['PhonePe', 'Flipkart', 'Amazon'],
    frequency: 8,
  },
  {
    number: 4,
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    pattern: 'Binary Search',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 124,
    title: 'Binary Tree Maximum Path Sum',
    slug: 'binary-tree-maximum-path-sum',
    difficulty: 'Hard',
    pattern: 'Binary Tree / DFS',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 297,
    title: 'Serialize and Deserialize Binary Tree',
    slug: 'serialize-and-deserialize-binary-tree',
    difficulty: 'Hard',
    pattern: 'Binary Tree',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
  {
    number: 25,
    title: 'Reverse Nodes in k-Group',
    slug: 'reverse-nodes-in-k-group',
    difficulty: 'Hard',
    pattern: 'Linked List',
    companies: ['Flipkart', 'Amazon'],
    frequency: 7,
  },
];

function focusHits(problem: LeetCodeProblem): number {
  return problem.companies.filter((company) =>
    (FOCUS_COMPANIES as readonly string[]).includes(company),
  ).length;
}

function scoreProblem(problem: LeetCodeProblem): number {
  return focusHits(problem) * 100 + problem.frequency;
}

const TOP_POOL = 5;

function randomUnit(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

export function toDsaQuestion(problem: LeetCodeProblem): DsaQuestion {
  return {
    id: `lc-${problem.number}`,
    number: problem.number,
    title: problem.title,
    difficulty: problem.difficulty,
    pattern: problem.pattern,
    leetcodeSlug: problem.slug,
    leetcodeUrl: `https://leetcode.com/problems/${problem.slug}/`,
    companies: problem.companies.filter((company) =>
      (FOCUS_COMPANIES as readonly string[]).includes(company),
    ),
  };
}

function problemByQuestionId(id: string, problems: LeetCodeProblem[] = LEETCODE_FOCUS_BANK): LeetCodeProblem | undefined {
  const number = Number(String(id).replace(/^lc-/, ''));
  return problems.find((item) => item.number === number);
}

export function questionsFromIds(
  ids?: string[] | null,
  problems: LeetCodeProblem[] = LEETCODE_FOCUS_BANK,
): DsaQuestion[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => problemByQuestionId(id, problems))
    .filter((item): item is LeetCodeProblem => Boolean(item))
    .map(toDsaQuestion);
}

/** One Easy, one Medium, one Hard from the most-asked Flipkart / Swiggy / PhonePe pool. */
export function pickFocusPaper(
  problems: LeetCodeProblem[] = LEETCODE_FOCUS_BANK,
  excludeIds: Iterable<string> = [],
): DsaQuestion[] {
  const exclude = new Set(excludeIds);
  return (['Easy', 'Medium', 'Hard'] as Difficulty[])
    .map((difficulty) => {
      const ranked = problems
        .filter((item) => item.difficulty === difficulty)
        .sort((a, b) => {
          const diff = scoreProblem(b) - scoreProblem(a);
          return diff !== 0 ? diff : a.number - b.number;
        });
      const unused = ranked.filter((item) => !exclude.has(`lc-${item.number}`));
      const source = unused.length ? unused : ranked;
      const pool = source.slice(0, Math.max(1, Math.min(TOP_POOL, source.length)));
      const chosen = pool[Math.floor(randomUnit() * pool.length)] || pool[0];
      return chosen ? toDsaQuestion(chosen) : null;
    })
    .filter((item): item is DsaQuestion => Boolean(item));
}
