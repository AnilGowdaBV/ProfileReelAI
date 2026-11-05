export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionKind = 'MCQ' | 'Complete the code' | 'Write the code';

export type Question = {
  kind: QuestionKind;
  prompt: string;
  snippet?: string;
  options?: string[];
  answer?: number;
  difficulty: Difficulty;
  codeOptions?: boolean;
};

export type MockTest = {
  id: string;
  title: string;
  minutes: number;
  blurb: string;
  questions: Question[];
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'set-1',
    title: 'Mock Test Set 1',
    minutes: 25,
    blurb: 'One mixed paper: MCQs, complete the code, and write the code. Compiler: Python, C, C++, Java.',
    questions: [
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'A train covers 120 km in 2 hours. What is its speed?', options: ['40 km/h', '60 km/h', '80 km/h', '120 km/h'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the function so it returns the sum of a and b.', snippet: 'function add(a, b) {\n  return _____;\n}', codeOptions: true, options: ['a - b', 'a + b', 'a * b', 'a / b'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Easy', prompt: 'Which program prints Hello?', codeOptions: true, options: ['print("Hi")', 'print("Hello")', 'print(Hello)', 'console.log()'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'Find 25% of 200.', options: ['25', '40', '50', '75'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the loop so it prints 0, 1, 2.', snippet: 'for (let i = 0; i < 3; i++) {\n  console.log(_____);\n}', codeOptions: true, options: ['i + 1', 'i', '3', 'i * 2'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program returns the square of n?', codeOptions: true, options: ['function sq(n) { return n + n; }', 'function sq(n) { return n * n; }', 'function sq(n) { return n / n; }', 'function sq(n) { return n - n; }'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'Find the next number: 2, 6, 12, 20, ?', options: ['28', '30', '32', '36'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Medium', prompt: 'Complete the filter so only even numbers remain.', snippet: 'const evens = nums.filter(n => _____);', codeOptions: true, options: ['n > 0', 'n % 2 === 0', 'n % 2', 'n === 2'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program sums all numbers in arr?', codeOptions: true, options: ['return arr.length;', 'return arr.reduce((a, b) => a + b, 0);', 'return arr.join("+");', 'return arr[0] + arr[1];'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'A shop offers 20% off ₹800. What is the selling price?', options: ['₹600', '₹640', '₹680', '₹720'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete binary search so it searches the left half.', snippet: 'if (arr[mid] > target) {\n  high = _____;\n}', codeOptions: true, options: ['mid + 1', 'mid - 1', 'low', 'arr.length'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program returns unique values from arr, keeping first order?', codeOptions: true, options: ['return arr.sort();', 'return [...new Set(arr)];', 'return arr.filter(Boolean);', 'return arr.reverse();'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Hard', prompt: 'A number is increased by 20% and then decreased by 20%. The net change is:', options: ['No change', '4% decrease', '4% increase', '2% decrease'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete the check for a palindrome.', snippet: 'return s === s.split("").reverse()._____("");', codeOptions: true, options: ['split', 'join', 'concat', 'slice'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program checks if two strings are anagrams?', codeOptions: true, options: ['return a === b;', 'return [...a].sort().join("") === [...b].sort().join("");', 'return a.includes(b);', 'return a.length > b.length;'], answer: 1 },
    ],
  },
  {
    id: 'set-2',
    title: 'Mock Test Set 2',
    minutes: 25,
    blurb: 'One mixed paper: MCQs, complete the code, and write the code. Compiler: Python, C, C++, Java.',
    questions: [
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'If 3 pens cost ₹45, what is the cost of 5 pens?', options: ['₹60', '₹70', '₹75', '₹90'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the condition that is true when n is even.', snippet: 'if (_____) {\n  console.log("even");\n}', codeOptions: true, options: ['n % 2 === 1', 'n % 2 === 0', 'n === 1', 'n > 2'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Easy', prompt: 'Which program checks if a number is positive?', codeOptions: true, options: ['return n === 0;', 'return n > 0;', 'return n < 0;', 'return n != n;'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'Find the next number: 2, 4, 8, 16, ?', options: ['18', '24', '32', '36'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the array access for the first item.', snippet: 'const nums = [10, 20, 30];\nconst first = nums[_____];', codeOptions: true, options: ['1', '0', '2', '10'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program finds the length of array arr?', codeOptions: true, options: ['arr.size', 'arr.length', 'len.arr', 'arr.count()'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'The average of 10, 20, and 30 is:', options: ['15', '20', '25', '30'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Medium', prompt: 'Complete the function so it returns the largest of two numbers.', snippet: 'function max(a, b) {\n  return a > b ? _____ : b;\n}', codeOptions: true, options: ['b', 'a', '0', 'a + b'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program returns true if array arr contains x?', codeOptions: true, options: ['return arr[x];', 'return arr.includes(x);', 'return arr === x;', 'return arr.push(x);'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'A sum of ₹5000 earns 10% simple interest in 2 years. What is the interest?', options: ['₹500', '₹800', '₹1000', '₹1200'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete the reverse of a string.', snippet: 'return s.split("")._____().join("");', codeOptions: true, options: ['sort', 'reverse', 'map', 'filter'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program finds the second largest number in a unique-number array?', codeOptions: true, options: ['return Math.max(...arr);', 'return [...arr].sort((a, b) => b - a)[1];', 'return arr[1];', 'return arr.pop();'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Hard', prompt: 'A and B can finish a job in 12 days and 18 days. How many days together?', options: ['6.2', '7.2', '8', '9'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete two-sum lookup using a map.', snippet: 'if (seen.has(target - n)) return true;\nseen._____ (n);', codeOptions: true, options: ['get', 'add', 'delete', 'clear'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program returns true if a string has all unique characters?', codeOptions: true, options: ['return s.length > 0;', 'return new Set(s).size === s.length;', 'return s === s.toLowerCase();', 'return s.includes(s[0]);'], answer: 1 },
    ],
  },
  {
    id: 'set-3',
    title: 'Mock Test Set 3',
    minutes: 25,
    blurb: 'One mixed paper: MCQs, complete the code, and write the code. Compiler: Python, C, C++, Java.',
    questions: [
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'A clock shows 3:00. What is the angle between the hour and minute hands?', options: ['60°', '90°', '120°', '180°'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the string so it becomes Hello World.', snippet: 'const text = "Hello" + _____ ;', codeOptions: true, options: ['"Hello"', '" World"', '"Hello World"', 'World'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Easy', prompt: 'Which program converts a string to uppercase?', codeOptions: true, options: ['s.lower()', 's.toUpperCase()', 's.trim()', 's.split()'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Easy', prompt: 'If all roses are flowers and some flowers fade, which statement must be true?', options: ['All roses fade', 'Some roses are flowers', 'No flowers are roses', 'All flowers are roses'], answer: 1 },
      { kind: 'Complete the code', difficulty: 'Easy', prompt: 'Complete the swap of a and b using a temp variable.', snippet: 'let temp = a;\na = _____;\nb = temp;', codeOptions: true, options: ['temp', 'b', 'a', '0'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program returns the last item of arr?', codeOptions: true, options: ['return arr[0];', 'return arr[arr.length - 1];', 'return arr[arr.length];', 'return arr.pop(0);'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'If the ratio of boys to girls is 3:2 and there are 30 boys, how many girls are there?', options: ['15', '18', '20', '25'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Medium', prompt: 'Complete the map so each number is doubled.', snippet: 'const doubled = nums.map(n => _____);', codeOptions: true, options: ['n + 2', 'n * 2', 'n / 2', 'n ** 2'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Medium', prompt: 'Which program counts vowels in a lowercase string s?', codeOptions: true, options: ['return s.length;', 'return [...s].filter(c => "aeiou".includes(c)).length;', 'return s.split(" ").length;', 'return s.indexOf("a");'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Medium', prompt: 'Find the odd one out: 2, 3, 6, 7, 8, 11', options: ['3', '7', '8', '11'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete the recursion base case for factorial.', snippet: 'function fact(n) {\n  if (_____) return 1;\n  return n * fact(n - 1);\n}', codeOptions: true, options: ['n > 1', 'n === 0 || n === 1', 'n < 0', 'n === 2'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program reverses an array without mutating the original?', codeOptions: true, options: ['return arr.reverse();', 'return [...arr].reverse();', 'return arr.sort();', 'return arr.pop();'], answer: 1 },
      { kind: 'MCQ', difficulty: 'Hard', prompt: 'A pipe fills a tank in 8 hours and a leak empties it in 12 hours. Time to fill with both open?', options: ['16 hours', '20 hours', '24 hours', '28 hours'], answer: 2 },
      { kind: 'Complete the code', difficulty: 'Hard', prompt: 'Complete the count of character c in string s.', snippet: 'return [...s].filter(ch => _____).length;', codeOptions: true, options: ['ch !== c', 'ch === c', 'ch > c', 'ch.length === 1'], answer: 1 },
      { kind: 'Write the code', difficulty: 'Hard', prompt: 'Which program flattens one level of nested arrays?', codeOptions: true, options: ['return arr.join();', 'return arr.flat();', 'return arr.concat();', 'return [arr];'], answer: 1 },
    ],
  },
];
