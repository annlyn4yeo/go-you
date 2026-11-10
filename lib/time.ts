// Calendar helpers in the user's time zone. Days are "YYYY-MM-DD" strings, so they compare as strings.

export const TZ_COOKIE = "tz";

export function safeTimeZone(tz: string | undefined): string {
  try {
    if (tz) return new Intl.DateTimeFormat("en", { timeZone: tz }).resolvedOptions().timeZone;
  } catch {}
  return "UTC";
}

// Returns a fast (date) => "YYYY-MM-DD" for one time zone.
export function dayIn(tz: string): (date: Date) => string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return (date) => f.format(date);
}

// Monday of the week that contains `day`.
export function weekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export const monthStart = (day: string) => `${day.slice(0, 8)}01`;

// `locale` comes from the Accept-Language header, so it may be junk ("*"): fall back instead of crashing the page.
export function formatDateTime(date: Date, tz: string, locale?: string): string {
  const opts = { dateStyle: "medium", timeStyle: "short", timeZone: tz } as const;
  try {
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", opts).format(date);
  }
}

// Client only: lets server components bucket weeks in the user's zone.
export function rememberTimeZone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
}
