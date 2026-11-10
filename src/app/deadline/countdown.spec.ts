import { describe, expect, it } from 'vitest';

import { millisUntilNextDisplayChange, secondsRemaining } from './countdown';

describe('secondsRemaining', () => {
  it('counts a partial second as still remaining', () => {
    expect(secondsRemaining(5_500, 0)).toBe(6);
  });

  it('is exact on a one-second boundary', () => {
    expect(secondsRemaining(5_000, 0)).toBe(5);
  });

  it('stops at zero', () => {
    expect(secondsRemaining(1_000, 2_500)).toBe(0);
  });
});

describe('millisUntilNextDisplayChange', () => {
  it('wakes when the displayed second changes', () => {
    expect(millisUntilNextDisplayChange(2_500, 0)).toBe(500);
  });

  it('waits a full second when already on a boundary', () => {
    expect(millisUntilNextDisplayChange(2_000, 0)).toBe(1000);
  });

  it('does not schedule after the deadline', () => {
    expect(millisUntilNextDisplayChange(1_000, 1_000)).toBe(0);
    expect(millisUntilNextDisplayChange(1_000, 1_500)).toBe(0);
  });

  it('steps down once per displayed second without drifting', () => {
    const deadline = 10_000;
    let now = 0;
    const seen: number[] = [];
    while (now <= deadline) {
      seen.push(secondsRemaining(deadline, now));
      const delay = millisUntilNextDisplayChange(deadline, now);
      if (delay === 0) {
        break;
      }
      now += delay;
    }
    expect(seen).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  });

  it('joins the next boundary when the clock starts mid-second', () => {
    const deadline = 10_500;
    let now = 0;
    const seen: number[] = [];
    while (seen.length < 4) {
      seen.push(secondsRemaining(deadline, now));
      now += millisUntilNextDisplayChange(deadline, now);
    }
    expect(seen).toEqual([11, 10, 9, 8]);
  });
});
