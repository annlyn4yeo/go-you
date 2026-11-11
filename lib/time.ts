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
export function formatIn(date: Date, tz: string, opts: Intl.DateTimeFormatOptions, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(date);
  }
}

export const formatDateTime = (date: Date, tz: string, locale?: string) =>
  formatIn(date, tz, { dateStyle: "medium", timeStyle: "short" }, locale);

// Fixed English parts so labels keep a 3-letter rhythm ("SEP", never "SEPT").
function partsIn(date: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: tz }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value.toUpperCase()]));
}

// "TUE 10 NOV" and "10 NOV": the label style used in lists.
export function formatDayLabel(date: Date, tz: string) {
  const p = partsIn(date, tz, { weekday: "short", day: "numeric", month: "short" });
  return `${p.weekday} ${p.day} ${p.month}`;
}
export function formatDayMonth(date: Date, tz: string) {
  const p = partsIn(date, tz, { day: "numeric", month: "short" });
  return `${p.day} ${p.month}`;
}

export const formatTime = (date: Date, tz: string) => formatIn(date, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "en-GB");

// "1:31", "34:12", or "1:02:05" past an hour (no leading zero on the first unit).
export function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const m = Math.floor(s / 60);
  return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(m % 60)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

// Client only: lets server components bucket weeks in the user's zone.
export function rememberTimeZone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
}
