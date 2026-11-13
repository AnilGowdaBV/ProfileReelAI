import { describe, expect, it } from 'vitest';
import { paperVerdict, questionFromSnapshotText } from './mockTestVerdict';

describe('questionFromSnapshotText', () => {
  it('passes an accepted snapshot', () => {
    expect(questionFromSnapshotText('Accepted  Runtime  4 ms')).toEqual({
      passed: true,
      note: 'Accepted',
    });
  });

  it('passes when more cases passed than failed', () => {
    expect(questionFromSnapshotText('40 / 50 testcases passed')).toEqual({
      passed: true,
      note: '40/50',
    });
  });

  it('fails when more cases failed than passed', () => {
    expect(questionFromSnapshotText('Wrong Answer  10 / 50 testcases passed')).toEqual({
      passed: false,
      note: '10/50',
    });
  });

  it('fails a half split because passed cases are not more than failed', () => {
    expect(questionFromSnapshotText('25 / 50 test cases passed').passed).toBe(false);
  });

  it('fails when the snapshot text cannot be read', () => {
    expect(questionFromSnapshotText('blurry photo').passed).toBe(false);
  });
});

describe('paperVerdict', () => {
  it('passes only when every question passes', () => {
    expect(
      paperVerdict([
        { passed: true, note: 'Accepted' },
        { passed: true, note: '40/50' },
        { passed: true, note: '38/40' },
      ]).verdict,
    ).toBe('Passed');
  });

  it('fails when one question misses', () => {
    const result = paperVerdict([
      { passed: true, note: 'Accepted' },
      { passed: false, note: '10/50' },
      { passed: true, note: 'Accepted' },
    ]);
    expect(result.verdict).toBe('Failed');
    expect(result.reason).toContain('1 of 3');
  });
});
