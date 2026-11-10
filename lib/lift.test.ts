import { test } from "node:test";
import assert from "node:assert/strict";
import { durationMinutes, e1rmKg, formatLoad, prFlags, sessionSummary, toKg } from "./lift.ts";

test("lifting maths and formatting", () => {
  assert.equal(Math.round(toKg(100, "lb") * 100) / 100, 45.36);
  assert.equal(e1rmKg(100, 0, "kg"), 100);
  assert.equal(Math.round(e1rmKg(100, 5, "kg") * 10) / 10, 116.7);
  assert.equal(formatLoad(0, "kg"), "BW");
  assert.equal(formatLoad(82.5, "kg"), "82.5 KG");
  assert.equal(sessionSummary([]), "");
  assert.equal(
    sessionSummary([
      { reps: 10, weight: 60, unit: "kg" },
      { reps: 8, weight: 80, unit: "kg" },
      { reps: 8, weight: 80, unit: "kg" },
      { reps: 8, weight: 80, unit: "kg" },
    ]),
    "3 × 8 @ 80 KG",
  );
  assert.equal(sessionSummary([{ reps: 12, weight: 0, unit: "kg" }]), "12 @ BW");
});

test("PR flags: beat the history, then each earlier set; ties don't count", () => {
  const set = (weight: number, reps = 5) => ({ weight, reps, unit: "kg" });
  const best = e1rmKg(100, 5, "kg");
  assert.deepEqual(prFlags([set(90), set(100), set(105), set(105), set(110)], best), [false, false, true, false, true]);
  assert.deepEqual(prFlags([set(60), set(80)], undefined), [false, false]);
  assert.deepEqual(prFlags([set(50, 1)], best), [false]);
  assert.equal(durationMinutes(0, 20_000), 1);
  assert.equal(durationMinutes(0, 47 * 60_000), 47);
});
