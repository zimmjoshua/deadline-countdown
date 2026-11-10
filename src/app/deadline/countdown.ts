/** Whole seconds left, counting the partial second that is still in progress. */
export function secondsRemaining(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

/**
 * How long to wait before the value returned by `secondsRemaining` changes.
 * Waiting until that boundary avoids drift and wakes the timer once per
 * displayed second.
 */
export function millisUntilNextDisplayChange(deadlineMs: number, nowMs: number): number {
  const remainingMs = deadlineMs - nowMs;
  if (remainingMs <= 0) {
    return 0;
  }
  const intoTheSecond = remainingMs % 1000;
  return intoTheSecond === 0 ? 1000 : intoTheSecond;
}
