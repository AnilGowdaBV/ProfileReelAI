import { BadRequestException, Injectable, Logger } from '@nestjs/common';

type Kind = 'int' | 'bool' | 'str' | 'int[]' | 'str[]' | 'int[][]' | 'str[][]';

type TestCase = { args: unknown[]; output: unknown; hidden?: boolean };

const LANGUAGE_MATCH: Record<string, RegExp> = {
  c: /^C \(GCC /,
  cpp: /^C\+\+ \(GCC /,
  java: /^Java \(JDK /,
  python: /^Python \(3\./,
  javascript: /^JavaScript \(Node\.js /,
  csharp: /^C# \(Mono /,
  go: /^Go \(/,
  rust: /^Rust \(/,
  php: /^PHP \(/,
};

@Injectable()
export class CodeRunnerService {
  private readonly logger = new Logger(CodeRunnerService.name);

  async run(language: string, source: string, tests: TestCase[]) {
    if (!LANGUAGE_MATCH[language]) throw new BadRequestException('Choose a supported language.');
    if (!source?.trim()) throw new BadRequestException('Write a solution first.');
    if (!Array.isArray(tests) || tests.length < 1 || tests.length > 8) {
      throw new BadRequestException('This question has no test cases.');
    }
    const content = this.program(language, source, tests);
    const result = await this.execute(language, content);
    const lines = (result.stdout || '').trim().split(/\r?\n/).filter(Boolean);
    const compileError = result.statusId === 6 ? result.compileOutput || 'Compilation Error' : '';
    const runtimeError = result.stderr || '';
    const cases = tests.map((test, index) => {
      if (compileError) return { index, hidden: Boolean(test.hidden), passed: false, message: compileError.slice(0, 280) };
      const line = lines[index];
      if (!line) {
        return { index, hidden: Boolean(test.hidden), passed: false, message: (runtimeError || 'No output').slice(0, 280) };
      }
      if (line.startsWith('ERR:')) return { index, hidden: Boolean(test.hidden), passed: false, message: line.slice(0, 280) };
      const passed = line.trim() === JSON.stringify(test.output);
      return {
        index,
        hidden: Boolean(test.hidden),
        passed,
        message: passed ? 'Passed' : test.hidden ? 'Hidden case failed' : `Expected ${JSON.stringify(test.output)}`,
      };
    });
    const passedCases = cases.filter((item) => item.passed).length;
    const threw = cases.some((item) => item.message.startsWith('ERR:') || item.message.includes('SyntaxError'));
    const passed = !compileError && !threw && result.statusId !== 5 && result.statusId <= 3 && passedCases > cases.length - passedCases;
    const status = compileError
      ? 'Compilation Error'
      : result.statusId === 5
        ? 'Time Limit Exceeded'
        : result.statusId > 3 || threw
          ? 'Runtime Error'
          : passed
            ? 'Accepted'
            : 'Wrong Answer';
    const detail = [compileError, runtimeError, result.stdout].filter(Boolean).join('\n').slice(0, 4000);
    return {
      passedCases,
      total: cases.length,
      passed,
      note: `${passedCases}/${cases.length}`,
      status,
      time: result.time || '',
      memory: result.memory || 0,
      output: detail,
      cases,
    };
  }

  private baseUrl() {
    return (process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com').replace(/\/$/, '');
  }

  private async languageId(language: string): Promise<number> {
    const response = await fetch(`${this.baseUrl()}/languages`);
    if (!response.ok) throw new BadRequestException('Judge0 did not return its language list.');
    const list = (await response.json()) as Array<{ id: number; name: string }>;
    const match = LANGUAGE_MATCH[language];
    const found = list.filter((item) => match.test(item.name)).sort((a, b) => b.id - a.id)[0];
    if (!found) throw new BadRequestException(`Judge0 has no compiler for ${language}.`);
    return found.id;
  }

  private async execute(language: string, source: string) {
    const languageId = await this.languageId(language);
    const created = await fetch(`${this.baseUrl()}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: source,
        language_id: languageId,
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
    });
    if (!created.ok) {
      this.logger.warn(`Judge0 create ${created.status}`);
      throw new BadRequestException('Judge0 did not accept this run.');
    }
    const { token } = (await created.json()) as { token?: string };
    if (!token) throw new BadRequestException('Judge0 did not return a submission token.');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const polled = await fetch(`${this.baseUrl()}/submissions/${token}?base64_encoded=false`);
      if (!polled.ok) continue;
      const body = (await polled.json()) as {
        stdout?: string | null;
        stderr?: string | null;
        compile_output?: string | null;
        time?: string | null;
        memory?: number | null;
        status?: { id?: number; description?: string };
      };
      const statusId = body.status?.id || 1;
      if (statusId <= 2) continue;
      return {
        statusId,
        stdout: body.stdout || '',
        stderr: body.stderr || '',
        compileOutput: body.compile_output || '',
        time: body.time || '',
        memory: body.memory || 0,
      };
    }
    throw new BadRequestException('Judge0 did not finish this run in time.');
  }

  private program(language: string, source: string, tests: TestCase[]): string {
    const payload = JSON.stringify(tests.map((test) => test.args));
    if (language === 'python') {
      return `${source}\nimport json\ncases = json.loads(${JSON.stringify(payload)})\nfor args in cases:\n    try:\n        print(json.dumps(solve(*args), separators=(',', ':')))\n    except Exception as exc:\n        print('ERR:' + str(exc))\n`;
    }
    if (language === 'javascript') {
      return `${source}\nconst cases = ${payload};\nfor (const args of cases) {\n  try { console.log(JSON.stringify(solve(...args))); }\n  catch (err) { console.log('ERR:' + (err && err.message ? err.message : 'error')); }\n}\n`;
    }
    if (language === 'typescript') {
      return `${source}\nconst cases = ${payload} as unknown[][];\nfor (const args of cases) {\n  try { console.log(JSON.stringify((solve as (...a: unknown[]) => unknown)(...args))); }\n  catch (err) { console.log('ERR:' + (err instanceof Error ? err.message : 'error')); }\n}\n`;
    }
    if (language === 'ruby') {
      return `require 'json'\n${source}\ncases = JSON.parse(${JSON.stringify(payload)})\ncases.each do |args|\n  begin\n    puts JSON.generate(solve(*args))\n  rescue => e\n    puts 'ERR:' + e.message\n  end\nend\n`;
    }
    if (language === 'php') {
      return `<?php\n${source.replace(/^<\?php/, '')}\n$cases = json_decode(${JSON.stringify(payload)}, true);\nforeach ($cases as $args) {\n  try {\n    echo json_encode(solve(...array_values($args))), "\\n";\n  } catch (Throwable $e) {\n    echo 'ERR:', $e->getMessage(), "\\n";\n  }\n}\n`;
    }
    return this.staticProgram(language, source, tests);
  }

  private staticProgram(language: string, source: string, tests: TestCase[]): string {
    const kinds = (tests[0]?.args || []).map(kindOf);
    const output = kindOf(tests[0]?.output);
    const calls = tests.map((test) => test.args.map((value, index) => literal(language, value, kinds[index])).join(', '));
    if (language === 'java') {
      return `${source}\npublic class Main {\n  public static void main(String[] args) {\n${calls.map((call) => `    print(Solution.solve(${call}));`).join('\n')}\n  }\n  ${javaPrint(output)}\n}\n`;
    }
    if (language === 'kotlin') {
      return `${source}\nfun main() {\n${calls.map((call) => `  println(canon(solve(${call})))`).join('\n')}\n}\n${kotlinCanon(output)}\n`;
    }
    if (language === 'cpp') {
      const body = source.includes('#include') ? source : `#include <bits/stdc++.h>\nusing namespace std;\n${source}`;
      return `${body}\n${cppPrint(output)}\nint main() {\n${calls.map((call) => `  print(solve(${call}));`).join('\n')}\n  return 0;\n}\n`;
    }
    if (language === 'csharp') {
      return `using System;\nusing System.Linq;\n${source}\npublic class Program {\n  public static void Main() {\n${calls.map((call) => `    System.Console.WriteLine(Canon(Solution.solve(${call})));`).join('\n')}\n  }\n  ${csCanon(output)}\n}\n`;
    }
    if (language === 'go') {
      return `package main\nimport "fmt"\n${source}\nfunc main() {\n${calls.map((call) => `  fmt.Println(canon(solve(${call})))`).join('\n')}\n}\n${goCanon(output)}\n`;
    }
    if (language === 'swift') {
      return `${source}\n${calls.map((call) => `print(canon(solve(${call})))`).join('\n')}\n${swiftCanon(output)}\n`;
    }
    if (language === 'rust') {
      return `${source}\nfn main() {\n${calls.map((call) => `  println!("{}", canon(solve(${call})));`).join('\n')}\n}\n${rustCanon(output)}\n`;
    }
    if (language === 'scala') {
      return `${source}\n@main def entry(): Unit = {\n${calls.map((call) => `  println(canon(solve(${call})))`).join('\n')}\n}\n${scalaCanon(output)}\n`;
    }
    if (language === 'dart') {
      return `${source}\nvoid main() {\n${calls.map((call) => `  print(canon(solve(${call})));`).join('\n')}\n}\n${dartCanon(output)}\n`;
    }
    if (language === 'c') {
      return this.cProgram(source, tests, kinds, output);
    }
    throw new BadRequestException('That language is not ready yet.');
  }

  private cProgram(source: string, tests: TestCase[], kinds: Kind[], output: Kind): string {
    const calls = tests.map((test) => {
      const bits: string[] = [];
      test.args.forEach((value, index) => {
        const kind = kinds[index];
        if (kind === 'int' || kind === 'bool') bits.push(String(value));
        else if (kind === 'str') bits.push(JSON.stringify(value));
        else if (kind === 'int[]' && Array.isArray(value)) {
          bits.push(`(int[]){${value.join(',')}}`, String(value.length));
        } else bits.push('0');
      });
      return bits.join(', ');
    });
    const print =
      output === 'bool'
        ? 'printf("%s\\n", solve(CALL) ? "true" : "false");'
        : output === 'str'
          ? 'printf("\\"%s\\"\\n", solve(CALL));'
          : 'printf("%d\\n", solve(CALL));';
    return `${source.includes('#include') ? source : `#include <stdio.h>\n${source}`}\nint main() {\n${calls.map((call) => `  ${print.replace('CALL', call)}`).join('\n')}\n  return 0;\n}\n`;
  }
}

function kindOf(value: unknown): Kind {
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return 'int';
  if (typeof value === 'string') return 'str';
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'number')) return 'int[]';
    if (value.every((item) => typeof item === 'string')) return 'str[]';
    if (value.every((item) => Array.isArray(item) && item.every((part) => typeof part === 'number'))) return 'int[][]';
    if (value.every((item) => Array.isArray(item) && item.every((part) => typeof part === 'string'))) return 'str[][]';
  }
  return 'str';
}

function literal(language: string, value: unknown, kind: Kind): string {
  if (kind === 'int' || kind === 'bool') return language === 'swift' || language === 'kotlin' ? String(value) : String(value);
  if (kind === 'str') return JSON.stringify(value);
  if (!Array.isArray(value)) return '0';
  if (language === 'java') {
    if (kind === 'int[]') return `new int[]{${value.join(',')}}`;
    if (kind === 'str[]') return `new String[]{${value.map((item) => JSON.stringify(item)).join(',')}}`;
    if (kind === 'int[][]') return `new int[][]{${value.map((row) => `new int[]{${(row as number[]).join(',')}}`).join(',')}}`;
    return `new String[][]{${value.map((row) => `new String[]{${(row as string[]).map((item) => JSON.stringify(item)).join(',')}}`).join(',')}}`;
  }
  if (language === 'kotlin') {
    if (kind === 'int[]') return `intArrayOf(${value.join(',')})`;
    if (kind === 'str[]') return `arrayOf(${value.map((item) => JSON.stringify(item)).join(',')})`;
    if (kind === 'int[][]') return `arrayOf(${value.map((row) => `intArrayOf(${(row as number[]).join(',')})`).join(',')})`;
    return `arrayOf(${value.map((row) => `arrayOf(${(row as string[]).map((item) => JSON.stringify(item)).join(',')})`).join(',')})`;
  }
  if (language === 'cpp') {
    if (kind === 'int[]') return `vector<int>{${value.join(',')}}`;
    if (kind === 'str[]') return `vector<string>{${value.map((item) => JSON.stringify(item)).join(',')}}`;
    if (kind === 'int[][]') return `vector<vector<int>>{${value.map((row) => `vector<int>{${(row as number[]).join(',')}}`).join(',')}}`;
    return `vector<vector<string>>{${value.map((row) => `vector<string>{${(row as string[]).map((item) => JSON.stringify(item)).join(',')}}`).join(',')}}`;
  }
  if (language === 'csharp') {
    if (kind === 'int[]') return `new int[]{${value.join(',')}}`;
    if (kind === 'str[]') return `new string[]{${value.map((item) => JSON.stringify(item)).join(',')}}`;
    if (kind === 'int[][]') return `new int[][]{${value.map((row) => `new int[]{${(row as number[]).join(',')}}`).join(',')}}`;
    return `new string[][]{${value.map((row) => `new string[]{${(row as string[]).map((item) => JSON.stringify(item)).join(',')}}`).join(',')}}`;
  }
  if (language === 'go') {
    if (kind === 'int[]') return `[]int{${value.join(',')}}`;
    if (kind === 'str[]') return `[]string{${value.map((item) => JSON.stringify(item)).join(',')}}`;
    if (kind === 'int[][]') return `[][]int{${value.map((row) => `[]int{${(row as number[]).join(',')}}`).join(',')}}`;
    return `[][]string{${value.map((row) => `[]string{${(row as string[]).map((item) => JSON.stringify(item)).join(',')}}`).join(',')}}`;
  }
  if (language === 'swift') {
    if (kind === 'int[]' || kind === 'str[]') return `[${value.map((item) => JSON.stringify(item)).join(',')}]`;
    return `[${value.map((row) => `[${(row as unknown[]).map((item) => JSON.stringify(item)).join(',')}]`).join(',')}]`;
  }
  if (language === 'rust') {
    if (kind === 'int[]') return `vec![${value.join(',')}]`;
    if (kind === 'str[]') return `vec![${value.map((item) => `${JSON.stringify(item)}.to_string()`).join(',')}]`;
    if (kind === 'int[][]') return `vec![${value.map((row) => `vec![${(row as number[]).join(',')}]`).join(',')}]`;
    return `vec![${value.map((row) => `vec![${(row as string[]).map((item) => `${JSON.stringify(item)}.to_string()`).join(',')}]`).join(',')}]`;
  }
  if (language === 'scala') {
    if (kind === 'int[]') return `Array(${value.join(',')})`;
    if (kind === 'str[]') return `Array(${value.map((item) => JSON.stringify(item)).join(',')})`;
    if (kind === 'int[][]') return `Array(${value.map((row) => `Array(${(row as number[]).join(',')})`).join(',')})`;
    return `Array(${value.map((row) => `Array(${(row as string[]).map((item) => JSON.stringify(item)).join(',')})`).join(',')})`;
  }
  if (language === 'dart') {
    if (kind === 'int[]' || kind === 'str[]') return `[${value.map((item) => JSON.stringify(item)).join(',')}]`;
    return `[${value.map((row) => `[${(row as unknown[]).map((item) => JSON.stringify(item)).join(',')}]`).join(',')}]`;
  }
  return '0';
}

function javaPrint(kind: Kind): string {
  if (kind === 'int' || kind === 'bool') return 'static void print(Object v){ System.out.println(v); }';
  if (kind === 'str') return 'static void print(String v){ System.out.println("\\"" + v + "\\""); }';
  if (kind === 'int[]') return 'static void print(int[] a){ StringBuilder s=new StringBuilder("["); for(int i=0;i<a.length;i++){ if(i>0)s.append(","); s.append(a[i]); } System.out.println(s.append("]")); }';
  if (kind === 'str[]') return 'static void print(String[] a){ StringBuilder s=new StringBuilder("["); for(int i=0;i<a.length;i++){ if(i>0)s.append(","); s.append("\\"").append(a[i]).append("\\""); } System.out.println(s.append("]")); }';
  if (kind === 'int[][]') return 'static void print(int[][] a){ StringBuilder s=new StringBuilder("["); for(int i=0;i<a.length;i++){ if(i>0)s.append(","); s.append("["); for(int j=0;j<a[i].length;j++){ if(j>0)s.append(","); s.append(a[i][j]); } s.append("]"); } System.out.println(s.append("]")); }';
  return 'static void print(String[][] a){ StringBuilder s=new StringBuilder("["); for(int i=0;i<a.length;i++){ if(i>0)s.append(","); s.append("["); for(int j=0;j<a[i].length;j++){ if(j>0)s.append(","); s.append("\\"").append(a[i][j]).append("\\""); } s.append("]"); } System.out.println(s.append("]")); }';
}

function kotlinCanon(kind: Kind): string {
  if (kind === 'int' || kind === 'bool') return 'fun canon(v: Any?) = v.toString()';
  if (kind === 'str') return 'fun canon(v: String) = "\\"" + v + "\\""';
  if (kind === 'int[]') return 'fun canon(v: IntArray) = v.joinToString(",", "[", "]")';
  if (kind === 'str[]') return 'fun canon(v: Array<String>) = v.joinToString(",") { "\\"" + it + "\\"" }.let { "[$it]" }';
  if (kind === 'int[][]') return 'fun canon(v: Array<IntArray>) = v.joinToString(",") { it.joinToString(",", "[", "]") }.let { "[$it]" }';
  return 'fun canon(v: Array<Array<String>>) = v.joinToString(",") { row -> row.joinToString(",") { "\\"" + it + "\\"" }.let { "[$it]" } }.let { "[$it]" }';
}

function cppPrint(kind: Kind): string {
  if (kind === 'bool') return 'void print(bool v){ cout << (v ? "true" : "false") << "\\n"; }';
  if (kind === 'int') return 'void print(int v){ cout << v << "\\n"; }';
  if (kind === 'str') return 'void print(const string& v){ cout << "\\"" << v << "\\"\\n"; }';
  if (kind === 'int[]') return 'void print(const vector<int>& a){ cout << "["; for(size_t i=0;i<a.size();i++){ if(i) cout << ","; cout << a[i]; } cout << "]\\n"; }';
  if (kind === 'str[]') return 'void print(const vector<string>& a){ cout << "["; for(size_t i=0;i<a.size();i++){ if(i) cout << ","; cout << "\\"" << a[i] << "\\""; } cout << "]\\n"; }';
  if (kind === 'int[][]') return 'void print(const vector<vector<int>>& a){ cout << "["; for(size_t i=0;i<a.size();i++){ if(i) cout << ","; cout << "["; for(size_t j=0;j<a[i].size();j++){ if(j) cout << ","; cout << a[i][j]; } cout << "]"; } cout << "]\\n"; }';
  return 'void print(const vector<vector<string>>& a){ cout << "["; for(size_t i=0;i<a.size();i++){ if(i) cout << ","; cout << "["; for(size_t j=0;j<a[i].size();j++){ if(j) cout << ","; cout << "\\"" << a[i][j] << "\\""; } cout << "]"; } cout << "]\\n"; }';
}

function csCanon(kind: Kind): string {
  if (kind === 'bool') return 'static string Canon(bool v){ return v ? "true" : "false"; }';
  if (kind === 'int') return 'static string Canon(int v){ return v.ToString(); }';
  if (kind === 'str') return 'static string Canon(string v){ return "\\"" + v + "\\""; }';
  if (kind === 'int[]') return 'static string Canon(int[] a){ return "[" + string.Join(",", a) + "]"; }';
  if (kind === 'str[]') return 'static string Canon(string[] a){ return "[" + string.Join(",", a.Select(v => "\\"" + v + "\\"")) + "]"; }';
  if (kind === 'int[][]') return 'static string Canon(int[][] a){ return "[" + string.Join(",", a.Select(row => "[" + string.Join(",", row) + "]")) + "]"; }';
  return 'static string Canon(string[][] a){ return "[" + string.Join(",", a.Select(row => "[" + string.Join(",", row.Select(v => "\\"" + v + "\\"")) + "]")) + "]"; }';
}

function goCanon(kind: Kind): string {
  if (kind === 'bool') return 'func canon(v bool) string { if v { return "true" }; return "false" }';
  if (kind === 'int') return 'func canon(v int) string { return fmt.Sprint(v) }';
  if (kind === 'str') return 'func canon(v string) string { return "\\"" + v + "\\"" }';
  if (kind === 'int[]') return 'func canon(v []int) string { b := "[" ; for i,n := range v { if i>0 { b += "," }; b += fmt.Sprint(n) }; return b + "]" }';
  if (kind === 'str[]') return 'func canon(v []string) string { b := "[" ; for i,n := range v { if i>0 { b += "," }; b += "\\"" + n + "\\"" }; return b + "]" }';
  if (kind === 'int[][]') return 'func canon(v [][]int) string { b := "[" ; for i,row := range v { if i>0 { b += "," }; b += canon(row) }; return b + "]" }';
  return 'func canon(v [][]string) string { b := "[" ; for i,row := range v { if i>0 { b += "," }; b += canon(row) }; return b + "]" }';
}

function swiftCanon(kind: Kind): string {
  if (kind === 'bool') return 'func canon(_ v: Bool) -> String { v ? "true" : "false" }';
  if (kind === 'int') return 'func canon(_ v: Int) -> String { String(v) }';
  if (kind === 'str') return 'func canon(_ v: String) -> String { "\\"" + v + "\\"" }';
  if (kind === 'int[]') return 'func canon(_ v: [Int]) -> String { "[" + v.map{ String($0) }.joined(separator: ",") + "]" }';
  if (kind === 'str[]') return 'func canon(_ v: [String]) -> String { "[" + v.map{ "\\"" + $0 + "\\"" }.joined(separator: ",") + "]" }';
  if (kind === 'int[][]') return 'func canon(_ v: [[Int]]) -> String { "[" + v.map{ canon($0) }.joined(separator: ",") + "]" }';
  return 'func canon(_ v: [[String]]) -> String { "[" + v.map{ canon($0) }.joined(separator: ",") + "]" }';
}

function rustCanon(kind: Kind): string {
  if (kind === 'bool') return 'fn canon(v: bool) -> String { if v { "true".into() } else { "false".into() } }';
  if (kind === 'int') return 'fn canon(v: i32) -> String { v.to_string() }';
  if (kind === 'str') return 'fn canon(v: String) -> String { format!("\\"{}\\"", v) }';
  if (kind === 'int[]') return 'fn canon(v: Vec<i32>) -> String { format!("[{}]", v.iter().map(|n| n.to_string()).collect::<Vec<_>>().join(",")) }';
  if (kind === 'str[]') return 'fn canon(v: Vec<String>) -> String { format!("[{}]", v.iter().map(|n| format!("\\"{}\\"", n)).collect::<Vec<_>>().join(",")) }';
  if (kind === 'int[][]') return 'fn canon(v: Vec<Vec<i32>>) -> String { format!("[{}]", v.iter().map(|row| canon(row.clone())).collect::<Vec<_>>().join(",")) }';
  return 'fn canon(v: Vec<Vec<String>>) -> String { format!("[{}]", v.iter().map(|row| canon(row.clone())).collect::<Vec<_>>().join(",")) }';
}

function scalaCanon(kind: Kind): string {
  if (kind === 'bool') return 'def canon(v: Boolean): String = if (v) "true" else "false"';
  if (kind === 'int') return 'def canon(v: Int): String = v.toString';
  if (kind === 'str') return 'def canon(v: String): String = "\\"" + v + "\\""';
  if (kind === 'int[]') return 'def canon(v: Array[Int]): String = v.mkString("[", ",", "]")';
  if (kind === 'str[]') return 'def canon(v: Array[String]): String = v.map(s => "\\"" + s + "\\"").mkString("[", ",", "]")';
  if (kind === 'int[][]') return 'def canon(v: Array[Array[Int]]): String = v.map(_.mkString("[", ",", "]")).mkString("[", ",", "]")';
  return 'def canon(v: Array[Array[String]]): String = v.map(_.map(s => "\\"" + s + "\\"").mkString("[", ",", "]")).mkString("[", ",", "]")';
}

function dartCanon(kind: Kind): string {
  if (kind === 'bool') return 'String canon(bool v) => v ? "true" : "false";';
  if (kind === 'int') return 'String canon(int v) => v.toString();';
  if (kind === 'str') return 'String canon(String v) => "\\"" + v + "\\"";';
  if (kind === 'int[]') return 'String canon(List<int> v) => "[${v.join(",")}]";';
  if (kind === 'str[]') return 'String canon(List<String> v) => "[${v.map((s) => "\\"" + s + "\\"").join(",")}]";';
  if (kind === 'int[][]') return 'String canon(List<List<int>> v) => "[${v.map((row) => "[${row.join(",")}]").join(",")}]";';
  return 'String canon(List<List<String>> v) => "[${v.map((row) => "[${row.map((s) => "\\"" + s + "\\"").join(",")}]").join(",")}]";';
}
