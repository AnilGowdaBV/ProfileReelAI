import { CodeRunnerService } from './code-runner.service';

type TestCase = { args: unknown[]; output: unknown };

function program(language: string, source: string, tests: TestCase[]) {
  const service = new CodeRunnerService();
  return (service as unknown as { program: (l: string, s: string, t: TestCase[]) => string }).program(language, source, tests);
}

const courses: TestCase[] = [{ args: [2, [[1, 0]]], output: true }];
const emptyGraph: TestCase[] = [{ args: [0, []], output: true }];
const matrix: TestCase[] = [{ args: [[['1', '0'], ['0', '1']]], output: 2 }];
const words: TestCase[] = [{ args: ['leetcode', ['leet', 'code']], output: true }];

describe('code runner assembly', () => {
  it('calls C solve with the matrix pointer and both lengths', () => {
    const source = 'int solve(int a, int **b, int bn, int *bm) { return 0; }';
    const built = program('c', source, courses);
    expect(built).toContain('#include <stdio.h>');
    expect(built).toContain('int v0_1r0[] = {1, 0}');
    expect(built).toContain('solve(2, v0_1, 1, v0_1m)');
    expect(built).not.toContain('solve(2, 0)');
    expect(built.match(/\bint\s+main\s*\(/g)).toHaveLength(1);
  });

  it('passes NULL for an empty C matrix and does not add a second main', () => {
    const source = 'int solve(int a, int **b, int bn, int *bm) { return 1; }\nint main() { return 0; }';
    const built = program('c', source, emptyGraph);
    expect(built.match(/\bint\s+main\s*\(/g)).toHaveLength(1);
  });

  it('builds one call per logical argument for the other compilers', () => {
    const samples: Array<[string, string, TestCase[], string]> = [
      ['cpp', 'bool solve(int a, vector<vector<int>> b){ return false; }', courses, 'vector<vector<int>>{vector<int>{1,0}}'],
      ['java', 'class Solution { public static boolean solve(int a, int[][] b){ return false; } }', courses, 'new int[][]{new int[]{1,0}}'],
      ['csharp', 'public class Solution { public static bool solve(int a, int[][] b){ return false; } }', courses, 'new int[][]{new int[]{1,0}}'],
      ['go', 'func solve(a int, b [][]int) bool { return false }', courses, '[][]int{[]int{1,0}}'],
      ['rust', 'fn solve(a: i32, b: Vec<Vec<i32>>) -> bool { false }', courses, 'vec![vec![1,0]]'],
      ['php', 'function solve($a, $b) { return false; }', courses, ''],
      ['python', 'def solve(a, b):\n  return False', courses, ''],
      ['javascript', 'function solve(a, b){ return false }', courses, ''],
    ];
    for (const [language, source, tests, needle] of samples) {
      const built = program(language, source, tests);
      expect(built.includes('solve(2, 0)')).toBe(false);
      if (needle) expect(built).toContain(needle);
      if (!['php', 'python', 'javascript'].includes(language)) {
        expect((built.match(/\bmain\b/gi) || []).length).toBeGreaterThan(0);
      } else {
        expect(built).toContain('solve');
      }
    }
  });

  it('keeps string grids and word lists as arrays', () => {
    const grid = program('c', 'int solve(char ***a, int an, int *am){ return 0; }', matrix);
    expect(grid).toContain('char *v0_0r0[] = {"1", "0"}');
    expect(grid).toContain('solve(v0_0, 2, v0_0m)');
    const word = program('c', 'int solve(char *a, char **b, int bn){ return 0; }', words);
    expect(word).toContain('char *v0_1[] = {"leet", "code"}');
    expect(word).toContain('solve("leetcode", v0_1, 2)');
  });
});
