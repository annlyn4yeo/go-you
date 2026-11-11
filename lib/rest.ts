// Rest between sets, derived from the last set's timestamp: no timer state, so it survives a locked phone or a reload.

export const REST_TARGETS = [60, 90, 120, 180] as const; // seconds, offered as a segmented choice
export const DEFAULT_REST = 120;

export function restState(lastSetMs: number, nowMs: number, targetSec: number) {
  const elapsedMs = Math.max(0, nowMs - lastSetMs);
  const remainingMs = Math.max(0, targetSec * 1000 - elapsedMs);
  return { remainingMs, done: remainingMs === 0 };
}
