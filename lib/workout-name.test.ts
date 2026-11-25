import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTitle, liftKind, timeOfDay, workoutName } from "./workout-name.ts";
import { LIBRARY } from "./exercises.ts";

test("every library lift has a group", () => {
  assert.deepEqual(LIBRARY.filter((l) => !liftKind(l.id, l.name)).map((l) => l.id), []);
});

test("the lifter's own workout type", () => {
  assert.equal(cleanTitle("  Chest &\n back  "), "Chest & back");
  assert.equal(cleanTitle("Push"), "Push");
  assert.equal(cleanTitle("x".repeat(30)), "x".repeat(30));
  assert.equal(cleanTitle("x".repeat(31)), undefined);
  assert.equal(cleanTitle("morning push day"), "push day"); // the time word is fixed: a typed one is dropped
  assert.equal(cleanTitle("Late evening: legs"), "legs");
  assert.equal(cleanTitle("Evening"), null);
  assert.equal(cleanTitle("Nightmare legs"), "Nightmare legs"); // whole words only
  assert.equal(cleanTitle("   "), null); // empty = the automatic name again
  assert.equal(cleanTitle(null), null);
  assert.equal(cleanTitle(42), undefined);
  assert.equal(cleanTitle(undefined), undefined);
  assert.equal(cleanTitle("Leg\u0000day"), undefined);
});

const w = (hour: number, ...ids: (string | [string, number])[]) =>
  workoutName(hour, ids.map((x) => (typeof x === "string" ? { id: x, name: x.replace(/_/g, " "), sets: 3 } : { id: x[0], name: x[0].replace(/_/g, " "), sets: x[1] })));

test("time of day, in the lifter's hours", () => {
  assert.deepEqual([4, 5, 11, 12, 16, 17, 21, 22, 0].map(timeOfDay), ["Night", "Morning", "Morning", "Afternoon", "Afternoon", "Evening", "Evening", "Night", "Night"]);
});

test("the four seeded routines (the lifter's own slugs) name themselves", () => {
  assert.equal(w(7, "bench_press", "incline_db_press", "overhead_press", "lateral_raise", "tricep_pushdown").name, "Morning push");
  assert.equal(w(7, "back_squat", "romanian_deadlift", "walking_lunge", "leg_curl", "standing_calf_raise").name, "Morning legs");
  assert.equal(w(14, "bench_press", "barbell_row", "overhead_press", "lat_pulldown", "incline_db_press").name, "Afternoon upper body");
  assert.equal(w(14, "deadlift", "pull_up", "barbell_row", "face_pull", "barbell_curl").name, "Afternoon pull");
});

test("deadlift joins legs when the rest is lower body", () => {
  assert.equal(w(18, "deadlift", "squat", "leg_press").name, "Evening legs");
});

test("arms, full body, core", () => {
  assert.equal(w(18, "bicep_curl", "hammer_curl", "skull_crusher", "tricep_pushdown").name, "Evening arms");
  assert.equal(w(18, "squat", "bench_press", "barbell_row").name, "Evening full body");
  assert.equal(w(18, "plank", "cable_crunch").name, "Evening core");
});

test("counted by sets: one stray exercise doesn't change the day", () => {
  assert.equal(w(9, ["bench_press", 8], ["overhead_press", 6], ["barbell_row", 2]).name, "Morning push");
});

test("an own type keeps the time word", () => {
  assert.deepEqual(w(7, "squat").type, "squat");
  assert.deepEqual(workoutName(19, [{ id: "squat", name: "SQUAT", sets: 3 }], "leg day"), { name: "Evening leg day", type: "leg day", known: true });
  assert.deepEqual(workoutName(19, [], null).name, "Evening workout");
});

test("one exercise is named after it; empty exercises don't count", () => {
  assert.deepEqual(w(19, "deadlift", ["squat", 0]), { name: "Evening deadlift", type: "deadlift", known: true });
});

test("unrecognised names don't guess", () => {
  assert.deepEqual(w(23, "sled_push", "farmer_carry", "battle_ropes"), { name: "Night workout", type: "workout", known: false });
  assert.deepEqual(w(23, "sled_push", "farmer_carry", "bench_press"), { name: "Night workout", type: "workout", known: false }); // 1 of 3 recognised
  assert.deepEqual(w(8, ["squat", 0]), { name: "Morning workout", type: "workout", known: false });
  assert.equal(liftKind("sled_push", "Sled push"), undefined);
});

test("the lifter's own names: keyword order", () => {
  assert.equal(liftKind("leg_curl_machine", "Leg curl machine")?.group, "legs");
  assert.equal(liftKind("leg_press_45", "Leg press 45")?.group, "legs");
  assert.equal(liftKind("rear_delt_cable_fly", "Rear delt cable fly")?.group, "pull");
  assert.equal(liftKind("ez_bar_curl", "EZ bar curl")?.arms, true);
  assert.equal(liftKind("hack_squat", "Hack squat")?.group, "legs");
  assert.equal(liftKind("tbar_row", "T-bar row")?.group, "pull");
  assert.equal(liftKind("arnold_press", "Arnold press")?.group, "push");
  assert.equal(liftKind("bp", "BP")?.group, "push"); // library alias
  assert.equal(liftKind("nordic_curl", "Nordic curl")?.group, "legs");
});
