import type { PlatformQuestion } from '../data/platformQuestions';

export type CodeLanguage = {
  id: string;
  label: string;
};

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python 3' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
];

type Kind = 'int' | 'bool' | 'str' | 'int[]' | 'str[]' | 'int[][]' | 'str[][]';

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

function params(question: PlatformQuestion): Kind[] {
  return (question.tests[0]?.args || []).map(kindOf);
}

function ret(question: PlatformQuestion): Kind {
  return kindOf(question.tests[0]?.output);
}

const names = ['a', 'b', 'c', 'd', 'e'];

export function starterFor(language: string, question: PlatformQuestion): string {
  if (language === 'javascript') return question.starter;
  const args = params(question);
  const out = ret(question);
  const list = names.slice(0, args.length).join(', ');
  if (language === 'python') return `def solve(${list}):\n    pass\n`;
  if (language === 'typescript') return `function solve(${args.map((kind, i) => `${names[i]}: ${ts(kind)}`).join(', ')}): ${ts(out)} {\n  \n}\n`;
  if (language === 'ruby') return `def solve(${list})\n  \nend\n`;
  if (language === 'php') return `function solve(${names.slice(0, args.length).map((name) => `$${name}`).join(', ')}) {\n  \n}\n`;
  if (language === 'java') {
    return `class Solution {\n    public static ${java(out)} solve(${args.map((kind, i) => `${java(kind)} ${names[i]}`).join(', ')}) {\n        return ${javaDefault(out)};\n    }\n}\n`;
  }
  if (language === 'kotlin') {
    return `fun solve(${args.map((kind, i) => `${names[i]}: ${kotlin(kind)}`).join(', ')}): ${kotlin(out)} {\n    return ${kotlinDefault(out)}\n}\n`;
  }
  if (language === 'cpp') {
    return `#include <bits/stdc++.h>\nusing namespace std;\n\n${cpp(out)} solve(${args.map((kind, i) => `${cpp(kind)} ${names[i]}`).join(', ')}) {\n    return ${cppDefault(out)};\n}\n`;
  }
  if (language === 'c') return cStarter(args, out);
  if (language === 'go') {
    return `func solve(${args.map((kind, i) => `${names[i]} ${go(kind)}`).join(', ')}) ${go(out)} {\n    return ${goDefault(out)}\n}\n`;
  }
  if (language === 'csharp') {
    return `public class Solution {\n    public static ${cs(out)} solve(${args.map((kind, i) => `${cs(kind)} ${names[i]}`).join(', ')}) {\n        return ${csDefault(out)};\n    }\n}\n`;
  }
  if (language === 'swift') {
    return `func solve(${args.map((kind, i) => `_${names[i]}: ${swift(kind)}`).join(', ')}) -> ${swift(out)} {\n    return ${swiftDefault(out)}\n}\n`;
  }
  if (language === 'rust') {
    return `fn solve(${args.map((kind, i) => `${names[i]}: ${rust(kind)}`).join(', ')}) -> ${rust(out)} {\n    ${rustDefault(out)}\n}\n`;
  }
  if (language === 'scala') {
    return `def solve(${args.map((kind, i) => `${names[i]}: ${scala(kind)}`).join(', ')}): ${scala(out)} = {\n    ${scalaDefault(out)}\n}\n`;
  }
  if (language === 'dart') {
    return `${dart(out)} solve(${args.map((kind, i) => `${dart(kind)} ${names[i]}`).join(', ')}) {\n  return ${dartDefault(out)};\n}\n`;
  }
  return question.starter;
}

function ts(kind: Kind): string {
  if (kind === 'int') return 'number';
  if (kind === 'bool') return 'boolean';
  if (kind === 'str') return 'string';
  if (kind === 'int[]' || kind === 'str[]') return `${kind === 'int[]' ? 'number' : 'string'}[]`;
  return `${kind === 'int[][]' ? 'number' : 'string'}[][]`;
}
function java(kind: Kind): string {
  if (kind === 'int') return 'int';
  if (kind === 'bool') return 'boolean';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return 'int[]';
  if (kind === 'str[]') return 'String[]';
  if (kind === 'int[][]') return 'int[][]';
  return 'String[][]';
}
function javaDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  if (kind === 'int[]') return 'new int[0]';
  if (kind === 'str[]') return 'new String[0]';
  if (kind === 'int[][]') return 'new int[0][]';
  return 'new String[0][]';
}
function kotlin(kind: Kind): string {
  if (kind === 'int') return 'Int';
  if (kind === 'bool') return 'Boolean';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return 'IntArray';
  if (kind === 'str[]') return 'Array<String>';
  if (kind === 'int[][]') return 'Array<IntArray>';
  return 'Array<Array<String>>';
}
function kotlinDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  if (kind === 'int[]') return 'intArrayOf()';
  if (kind === 'str[]') return 'arrayOf()';
  if (kind === 'int[][]') return 'arrayOf()';
  return 'arrayOf()';
}
function cpp(kind: Kind): string {
  if (kind === 'int') return 'int';
  if (kind === 'bool') return 'bool';
  if (kind === 'str') return 'string';
  if (kind === 'int[]') return 'vector<int>';
  if (kind === 'str[]') return 'vector<string>';
  if (kind === 'int[][]') return 'vector<vector<int>>';
  return 'vector<vector<string>>';
}
function cppDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  return '{}';
}
function go(kind: Kind): string {
  if (kind === 'int') return 'int';
  if (kind === 'bool') return 'bool';
  if (kind === 'str') return 'string';
  if (kind === 'int[]') return '[]int';
  if (kind === 'str[]') return '[]string';
  if (kind === 'int[][]') return '[][]int';
  return '[][]string';
}
function goDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  return 'nil';
}
function cs(kind: Kind): string {
  if (kind === 'int') return 'int';
  if (kind === 'bool') return 'bool';
  if (kind === 'str') return 'string';
  if (kind === 'int[]') return 'int[]';
  if (kind === 'str[]') return 'string[]';
  if (kind === 'int[][]') return 'int[][]';
  return 'string[][]';
}
function csDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  if (kind === 'int[]') return 'new int[0]';
  if (kind === 'str[]') return 'new string[0]';
  if (kind === 'int[][]') return 'new int[0][]';
  return 'new string[0][]';
}
function swift(kind: Kind): string {
  if (kind === 'int') return 'Int';
  if (kind === 'bool') return 'Bool';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return '[Int]';
  if (kind === 'str[]') return '[String]';
  if (kind === 'int[][]') return '[[Int]]';
  return '[[String]]';
}
function swiftDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  return '[]';
}
function rust(kind: Kind): string {
  if (kind === 'int') return 'i32';
  if (kind === 'bool') return 'bool';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return 'Vec<i32>';
  if (kind === 'str[]') return 'Vec<String>';
  if (kind === 'int[][]') return 'Vec<Vec<i32>>';
  return 'Vec<Vec<String>>';
}
function rustDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return 'String::new()';
  return 'vec![]';
}
function scala(kind: Kind): string {
  if (kind === 'int') return 'Int';
  if (kind === 'bool') return 'Boolean';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return 'Array[Int]';
  if (kind === 'str[]') return 'Array[String]';
  if (kind === 'int[][]') return 'Array[Array[Int]]';
  return 'Array[Array[String]]';
}
function scalaDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  return 'Array()';
}
function dart(kind: Kind): string {
  if (kind === 'int') return 'int';
  if (kind === 'bool') return 'bool';
  if (kind === 'str') return 'String';
  if (kind === 'int[]') return 'List<int>';
  if (kind === 'str[]') return 'List<String>';
  if (kind === 'int[][]') return 'List<List<int>>';
  return 'List<List<String>>';
}
function dartDefault(kind: Kind): string {
  if (kind === 'int') return '0';
  if (kind === 'bool') return 'false';
  if (kind === 'str') return '""';
  return '[]';
}
function cStarter(args: Kind[], out: Kind): string {
  const parts = args.map((kind, i) => cParam(kind, names[i]));
  return `#include <stdio.h>\n#include <stdlib.h>\n\n${cTypes()}${cReturn(out)} solve(${parts.join(', ')}) {\n    return ${cReturnDefault(out)};\n}\n`;
}
function cTypes(): string {
  return [
    'typedef struct { int *data; int n; } IntArr;',
    'typedef struct { char **data; int n; } StrArr;',
    'typedef struct { int **data; int n; int *m; } IntMat;',
    'typedef struct { char ***data; int n; int *m; } StrMat;',
    '',
  ].join('\n');
}
function cParam(kind: Kind, name: string): string {
  if (kind === 'int[]') return `int *${name}, int ${name}n`;
  if (kind === 'str[]') return `char **${name}, int ${name}n`;
  if (kind === 'int[][]') return `int **${name}, int ${name}n, int *${name}m`;
  if (kind === 'str[][]') return `char ***${name}, int ${name}n, int *${name}m`;
  if (kind === 'str') return `char *${name}`;
  return `int ${name}`;
}
function cReturn(kind: Kind): string {
  if (kind === 'str') return 'char*';
  if (kind === 'int[]') return 'IntArr';
  if (kind === 'str[]') return 'StrArr';
  if (kind === 'int[][]') return 'IntMat';
  if (kind === 'str[][]') return 'StrMat';
  return 'int';
}
function cReturnDefault(kind: Kind): string {
  if (kind === 'str') return '""';
  if (kind === 'int[]') return '(IntArr){NULL, 0}';
  if (kind === 'str[]') return '(StrArr){NULL, 0}';
  if (kind === 'int[][]') return '(IntMat){NULL, 0, NULL}';
  if (kind === 'str[][]') return '(StrMat){NULL, 0, NULL}';
  return '0';
}
