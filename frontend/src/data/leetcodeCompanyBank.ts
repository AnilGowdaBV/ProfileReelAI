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
  {
    number: 53,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Easy',
    pattern: 'Kadane / Arrays',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 70,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    pattern: 'Dynamic Programming',
    companies: ['Flipkart', 'Swiggy', 'PhonePe'],
    frequency: 7,
  },
  {
    number: 226,
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    difficulty: 'Easy',
    pattern: 'Binary Tree',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
  {
    number: 104,
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    difficulty: 'Easy',
    pattern: 'Binary Tree',
    companies: ['Flipkart', 'Swiggy', 'PhonePe'],
    frequency: 7,
  },
  {
    number: 876,
    title: 'Middle of the Linked List',
    slug: 'middle-of-the-linked-list',
    difficulty: 'Easy',
    pattern: 'Two Pointers',
    companies: ['PhonePe', 'Swiggy', 'Amazon'],
    frequency: 6,
  },
  {
    number: 234,
    title: 'Palindrome Linked List',
    slug: 'palindrome-linked-list',
    difficulty: 'Easy',
    pattern: 'Linked List',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 6,
  },
  {
    number: 11,
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 33,
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    difficulty: 'Medium',
    pattern: 'Binary Search',
    companies: ['Flipkart', 'Swiggy', 'PhonePe'],
    frequency: 8,
  },
  {
    number: 102,
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    difficulty: 'Medium',
    pattern: 'BFS',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 238,
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    pattern: 'Arrays',
    companies: ['Flipkart', 'Swiggy', 'PhonePe'],
    frequency: 8,
  },
  {
    number: 560,
    title: 'Subarray Sum Equals K',
    slug: 'subarray-sum-equals-k',
    difficulty: 'Medium',
    pattern: 'Prefix Sum / Hash Map',
    companies: ['Flipkart', 'PhonePe', 'Paytm'],
    frequency: 8,
  },
  {
    number: 76,
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    difficulty: 'Hard',
    pattern: 'Sliding Window',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 8,
  },
  {
    number: 84,
    title: 'Largest Rectangle in Histogram',
    slug: 'largest-rectangle-in-histogram',
    difficulty: 'Hard',
    pattern: 'Stack',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
  {
    number: 295,
    title: 'Find Median from Data Stream',
    slug: 'find-median-from-data-stream',
    difficulty: 'Hard',
    pattern: 'Heap',
    companies: ['Flipkart', 'Swiggy', 'PhonePe'],
    frequency: 7,
  },
  {
    number: 72,
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    pattern: 'Dynamic Programming',
    companies: ['Flipkart', 'PhonePe', 'Amazon'],
    frequency: 7,
  },
];

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

export function questionsFromIds(
  ids?: string[] | null,
  problems: LeetCodeProblem[] = QUESTION_LOOKUP,
): DsaQuestion[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => problemByQuestionId(id, problems))
    .filter((item): item is LeetCodeProblem => Boolean(item))
    .map(toDsaQuestion);
}

export type InterviewRole = 'react' | 'java' | 'golang';

type HardSeed = [number, string, string, string];

function hardProblems(role: InterviewRole, seeds: HardSeed[]): Array<LeetCodeProblem & { role: InterviewRole }> {
  return seeds.map(([number, title, slug, pattern], index) => ({
    number,
    title,
    slug,
    difficulty: 'Hard' as const,
    pattern,
    companies: ['Flipkart', 'Swiggy'],
    frequency: 30 - index,
    role,
  }));
}

/** 30 hard LeetCode problems per track. Titles and official slugs only. */
export const ROLE_HARD_BANK: Array<LeetCodeProblem & { role: InterviewRole }> = [
  ...hardProblems('react', [
    [10, 'Regular Expression Matching', 'regular-expression-matching', 'String / DP'],
    [30, 'Substring with Concatenation of All Words', 'substring-with-concatenation-of-all-words', 'Sliding Window'],
    [32, 'Longest Valid Parentheses', 'longest-valid-parentheses', 'Stack'],
    [44, 'Wildcard Matching', 'wildcard-matching', 'String / DP'],
    [65, 'Valid Number', 'valid-number', 'String Parsing'],
    [68, 'Text Justification', 'text-justification', 'String'],
    [76, 'Minimum Window Substring', 'minimum-window-substring', 'Sliding Window'],
    [84, 'Largest Rectangle in Histogram', 'largest-rectangle-in-histogram', 'Stack'],
    [85, 'Maximal Rectangle', 'maximal-rectangle', 'Stack / Matrix'],
    [87, 'Scramble String', 'scramble-string', 'String / DP'],
    [115, 'Distinct Subsequences', 'distinct-subsequences', 'String / DP'],
    [132, 'Palindrome Partitioning II', 'palindrome-partitioning-ii', 'String / DP'],
    [140, 'Word Break II', 'word-break-ii', 'Backtracking'],
    [214, 'Shortest Palindrome', 'shortest-palindrome', 'String / KMP'],
    [224, 'Basic Calculator', 'basic-calculator', 'Stack / Parsing'],
    [233, 'Number of Digit One', 'number-of-digit-one', 'Math'],
    [239, 'Sliding Window Maximum', 'sliding-window-maximum', 'Deque'],
    [273, 'Integer to English Words', 'integer-to-english-words', 'String'],
    [282, 'Expression Add Operators', 'expression-add-operators', 'Backtracking'],
    [301, 'Remove Invalid Parentheses', 'remove-invalid-parentheses', 'BFS / String'],
    [321, 'Create Maximum Number', 'create-maximum-number', 'Stack / Greedy'],
    [336, 'Palindrome Pairs', 'palindrome-pairs', 'Trie / String'],
    [420, 'Strong Password Checker', 'strong-password-checker', 'String / Greedy'],
    [591, 'Tag Validator', 'tag-validator', 'Stack / Parsing'],
    [727, 'Minimum Window Subsequence', 'minimum-window-subsequence', 'Sliding Window'],
    [730, 'Count Different Palindromic Subsequences', 'count-different-palindromic-subsequences', 'String / DP'],
    [736, 'Parse Lisp Expression', 'parse-lisp-expression', 'Stack / Parsing'],
    [761, 'Special Binary String', 'special-binary-string', 'String / Recursion'],
    [770, 'Basic Calculator IV', 'basic-calculator-iv', 'Parsing'],
    [772, 'Basic Calculator III', 'basic-calculator-iii', 'Stack / Parsing'],
  ]),
  ...hardProblems('java', [
    [4, 'Median of Two Sorted Arrays', 'median-of-two-sorted-arrays', 'Binary Search'],
    [23, 'Merge k Sorted Lists', 'merge-k-sorted-lists', 'Heap'],
    [25, 'Reverse Nodes in k-Group', 'reverse-nodes-in-k-group', 'Linked List'],
    [37, 'Sudoku Solver', 'sudoku-solver', 'Backtracking'],
    [41, 'First Missing Positive', 'first-missing-positive', 'Array'],
    [42, 'Trapping Rain Water', 'trapping-rain-water', 'Two Pointers'],
    [51, 'N-Queens', 'n-queens', 'Backtracking'],
    [52, 'N-Queens II', 'n-queens-ii', 'Backtracking'],
    [72, 'Edit Distance', 'edit-distance', 'Dynamic Programming'],
    [123, 'Best Time to Buy and Sell Stock III', 'best-time-to-buy-and-sell-stock-iii', 'Dynamic Programming'],
    [124, 'Binary Tree Maximum Path Sum', 'binary-tree-maximum-path-sum', 'Tree / DFS'],
    [126, 'Word Ladder II', 'word-ladder-ii', 'Graph / BFS'],
    [135, 'Candy', 'candy', 'Greedy'],
    [149, 'Max Points on a Line', 'max-points-on-a-line', 'Geometry / Hash'],
    [154, 'Find Minimum in Rotated Sorted Array II', 'find-minimum-in-rotated-sorted-array-ii', 'Binary Search'],
    [164, 'Maximum Gap', 'maximum-gap', 'Bucket Sort'],
    [174, 'Dungeon Game', 'dungeon-game', 'Dynamic Programming'],
    [188, 'Best Time to Buy and Sell Stock IV', 'best-time-to-buy-and-sell-stock-iv', 'Dynamic Programming'],
    [212, 'Word Search II', 'word-search-ii', 'Trie'],
    [218, 'The Skyline Problem', 'the-skyline-problem', 'Heap / Sweep'],
    [295, 'Find Median from Data Stream', 'find-median-from-data-stream', 'Heap'],
    [297, 'Serialize and Deserialize Binary Tree', 'serialize-and-deserialize-binary-tree', 'Tree / Design'],
    [312, 'Burst Balloons', 'burst-balloons', 'Dynamic Programming'],
    [315, 'Count of Smaller Numbers After Self', 'count-of-smaller-numbers-after-self', 'Merge Sort / Tree'],
    [327, 'Count of Range Sum', 'count-of-range-sum', 'Merge Sort'],
    [329, 'Longest Increasing Path in a Matrix', 'longest-increasing-path-in-a-matrix', 'DFS / Memo'],
    [354, 'Russian Doll Envelopes', 'russian-doll-envelopes', 'Binary Search / DP'],
    [363, 'Max Sum of Rectangle No Larger Than K', 'max-sum-of-rectangle-no-larger-than-k', 'Matrix / Prefix'],
    [403, 'Frog Jump', 'frog-jump', 'Dynamic Programming'],
    [410, 'Split Array Largest Sum', 'split-array-largest-sum', 'Binary Search'],
  ]),
  ...hardProblems('golang', [
    [269, 'Alien Dictionary', 'alien-dictionary', 'Graph / Topological Sort'],
    [332, 'Reconstruct Itinerary', 'reconstruct-itinerary', 'Graph / Euler'],
    [381, 'Insert Delete GetRandom O(1) - Duplicates allowed', 'insert-delete-getrandom-o1-duplicates-allowed', 'Design'],
    [391, 'Perfect Rectangle', 'perfect-rectangle', 'Geometry / Hash'],
    [407, 'Trapping Rain Water II', 'trapping-rain-water-ii', 'Heap / BFS'],
    [428, 'Serialize and Deserialize N-ary Tree', 'serialize-and-deserialize-n-ary-tree', 'Tree / Design'],
    [432, "All O'one Data Structure", 'all-oone-data-structure', 'Design'],
    [460, 'LFU Cache', 'lfu-cache', 'Design'],
    [465, 'Optimal Account Balancing', 'optimal-account-balancing', 'Backtracking'],
    [480, 'Sliding Window Median', 'sliding-window-median', 'Heap'],
    [502, 'IPO', 'ipo', 'Heap'],
    [514, 'Freedom Trail', 'freedom-trail', 'Dynamic Programming'],
    [546, 'Remove Boxes', 'remove-boxes', 'Dynamic Programming'],
    [552, 'Student Attendance Record II', 'student-attendance-record-ii', 'Dynamic Programming'],
    [564, 'Find the Closest Palindrome', 'find-the-closest-palindrome', 'Math / String'],
    [587, 'Erect the Fence', 'erect-the-fence', 'Geometry'],
    [600, 'Non-negative Integers without Consecutive Ones', 'non-negative-integers-without-consecutive-ones', 'Digit DP'],
    [629, 'K Inverse Pairs Array', 'k-inverse-pairs-array', 'Dynamic Programming'],
    [632, 'Smallest Range Covering Elements from K Lists', 'smallest-range-covering-elements-from-k-lists', 'Heap'],
    [642, 'Design Search Autocomplete System', 'design-search-autocomplete-system', 'Trie / Design'],
    [664, 'Strange Printer', 'strange-printer', 'Dynamic Programming'],
    [668, 'Kth Smallest Number in Multiplication Table', 'kth-smallest-number-in-multiplication-table', 'Binary Search'],
    [675, 'Cut Off Trees for Golf Event', 'cut-off-trees-for-golf-event', 'BFS'],
    [679, '24 Game', '24-game', 'Backtracking'],
    [685, 'Redundant Connection II', 'redundant-connection-ii', 'Union Find'],
    [689, 'Maximum Sum of 3 Non-Overlapping Subarrays', 'maximum-sum-of-3-non-overlapping-subarrays', 'Prefix / DP'],
    [691, 'Stickers to Spell Word', 'stickers-to-spell-word', 'Bitmask DP'],
    [699, 'Falling Squares', 'falling-squares', 'Segment Tree'],
    [710, 'Random Pick with Blacklist', 'random-pick-with-blacklist', 'Design / Hash'],
    [715, 'Range Module', 'range-module', 'Design / Intervals'],
  ]),
];

const QUESTION_LOOKUP = [...ROLE_HARD_BANK, ...LEETCODE_FOCUS_BANK];

function problemByQuestionId(id: string, problems: LeetCodeProblem[] = QUESTION_LOOKUP): LeetCodeProblem | undefined {
  const number = Number(String(id).replace(/^lc-/, ''));
  return problems.find((item) => item.number === number);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const buf = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf);
    const j = (buf[0] || Math.floor(Math.random() * 0xffffffff)) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Three unused hard questions, shuffled from that track's 30. The next attempt skips used ones. */
export function pickRolePaper(role: InterviewRole, excludeIds: Iterable<string> = []): DsaQuestion[] {
  const exclude = new Set(excludeIds);
  return shuffle(
    ROLE_HARD_BANK.filter((item) => item.role === role && item.difficulty === 'Hard' && !exclude.has(`lc-${item.number}`)),
  )
    .slice(0, 3)
    .map(toDsaQuestion);
}
