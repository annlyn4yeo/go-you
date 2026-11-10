import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTemplates } from "./templates.ts";

test("templates come from repeated sessions, most repeated first", () => {
  const push = ["bench_press", "overhead_press", "tricep_pushdown"];
  const pull = ["deadlift", "pull_up", "barbell_row"];
  const t = buildTemplates([
    pull, // newest
    ["overhead_press", "bench_press", "tricep_pushdown"], // same routine as push, different order
    push,
    pull,
    push,
    ["curl"], // single exercise: ignored
    ["squat", "leg_curl"], // done once: ignored
  ]);
  assert.deepEqual(t.map((x) => [x.name, x.timesDone]), [["ROUTINE A", 3], ["ROUTINE B", 2]]);
  // order comes from the newest session of that routine
  assert.deepEqual(t[0].exercises.map((e) => e.exerciseId), ["overhead_press", "bench_press", "tricep_pushdown"]);
  assert.equal(t[0].exercises[1].label, "BENCH PRESS");
  assert.deepEqual(buildTemplates([]), []);
  assert.equal(buildTemplates(Array.from({ length: 6 }, (_, i) => [`a${i}`, `b${i}`, `a${i}`]).flatMap((x) => [x, x])).length, 4);
});
