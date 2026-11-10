// Pure lifting maths + formatting, shared by server pages and the live logger.

export type Unit = "kg" | "lb";
export const KG_PER_LB = 0.45359237;

export const toKg = (weight: number, unit: string) => (unit === "lb" ? weight * KG_PER_LB : weight);
export const fromKg = (kg: number, unit: string) => (unit === "lb" ? kg / KG_PER_LB : kg);

// Epley estimate of a one-rep max.
export const e1rmKg = (weight: number, reps: number, unit: string) => toKg(weight, unit) * (1 + reps / 30);

// For one exercise's sets in order: true where a set beats the best before it (all-time best, then earlier sets).
// No history (bestKg undefined) means nothing to beat yet, so no PRs.
export function prFlags(sets: { weight: number; reps: number; unit: string }[], bestKg: number | undefined) {
  let best = bestKg ?? Infinity;
  return sets.map((s) => {
    const e = e1rmKg(s.weight, s.reps, s.unit);
    if (e <= best + 1e-6) return false;
    best = e;
    return true;
  });
}

export const durationMinutes = (startMs: number, endMs: number) => Math.max(1, Math.round((endMs - startMs) / 60000));

export const exerciseName = (slug: string) => slug.replace(/_/g, " ").toUpperCase();

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
export const formatNumber = (value: number) => (Math.abs(value) >= 1000 ? whole : number).format(value);

// "100 KG", or "BW" for a bodyweight set (0 load).
export const formatLoad = (weight: number, unit: string) => (weight === 0 ? "BW" : `${number.format(weight)} ${unit.toUpperCase()}`);

// Best set of a session, e.g. "3 × 8 @ 80 KG" (sets that share the top load are counted).
export function sessionSummary(sets: { reps: number; weight: number; unit: string }[]) {
  if (!sets.length) return "";
  const top = sets.reduce((a, b) => (toKg(b.weight, b.unit) > toKg(a.weight, a.unit) ? b : a));
  const same = sets.filter((s) => s.weight === top.weight && s.unit === top.unit && s.reps === top.reps).length;
  return `${same > 1 ? `${same} × ` : ""}${top.reps} @ ${formatLoad(top.weight, top.unit)}`;
}
