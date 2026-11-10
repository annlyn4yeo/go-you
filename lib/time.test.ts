import { test } from "node:test";
import assert from "node:assert/strict";
import { dayIn, weekStart, monthStart, safeTimeZone, formatDateTime } from "./time.ts";

test("a junk Accept-Language never crashes date formatting", () => {
  const d = new Date("2026-11-10T14:02:00Z");
  assert.match(formatDateTime(d, "Asia/Kolkata", "*"), /19:32/);
  assert.match(formatDateTime(d, "UTC", "en-US"), /2:02/);
});

test("week and month start in the user's zone", () => {
  // Monday 03:00 in India is Sunday 21:30 UTC: it belongs to the new week in Kolkata.
  const t = new Date("2026-11-08T21:30:00Z");
  assert.equal(dayIn("Asia/Kolkata")(t), "2026-11-09");
  assert.equal(dayIn("UTC")(t), "2026-11-08");
  assert.equal(weekStart("2026-11-09"), "2026-11-09");
  assert.equal(weekStart("2026-11-08"), "2026-11-02");
  assert.equal(weekStart("2026-03-01"), "2026-02-23");
  assert.equal(monthStart("2026-11-09"), "2026-11-01");
  assert.equal(safeTimeZone("Not/AZone"), "UTC");
  assert.equal(safeTimeZone(undefined), "UTC");
});
