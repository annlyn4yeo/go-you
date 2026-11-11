import { test } from "node:test";
import assert from "node:assert/strict";
import { restState } from "./rest.ts";
import { formatClock } from "./time.ts";

test("rest counts down from the last set to the target", () => {
  assert.deepEqual(restState(0, 30_000, 120), { remainingMs: 90_000, done: false });
  assert.deepEqual(restState(0, 120_000, 120), { remainingMs: 0, done: true });
  assert.deepEqual(restState(0, 500_000, 120), { remainingMs: 0, done: true }); // stays done, no overrun count
  assert.equal(restState(10_000, 5_000, 60).remainingMs, 60_000); // clock skew never adds time
});

test("clock format: m:ss under an hour, h:mm:ss after", () => {
  assert.equal(formatClock(91_000), "1:31");
  assert.equal(formatClock(5_000), "0:05");
  assert.equal(formatClock(2_052_000), "34:12");
  assert.equal(formatClock(3_725_000), "1:02:05");
  assert.equal(formatClock(-5), "0:00");
});
