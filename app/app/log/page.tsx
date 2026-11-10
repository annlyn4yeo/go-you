import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, safeTimeZone, TZ_COOKIE } from "@/lib/time";

const PAGE = 30;

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const [session, jar, h, { before }] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
    headers(),
    searchParams,
  ]);
  const tz = safeTimeZone(jar.get(TZ_COOKIE)?.value);
  const locale = h.get("accept-language")?.split(",")[0] || undefined;
  const cursor = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : null;

  const rows = await prisma.workout.findMany({
    where: { userId: session!.user.id, ...(cursor ? { startedAt: { lt: cursor } } : {}) },
    orderBy: { startedAt: "desc" },
    take: PAGE + 1,
    select: { id: true, startedAt: true },
  });
  const workouts = rows.slice(0, PAGE);
  const older = rows.length > PAGE ? workouts[PAGE - 1].startedAt.toISOString() : null;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Workout Log</h1>

      {workouts.length === 0 && (
        <div className="text-sm text-[var(--muted)]">No workouts logged yet</div>
      )}

      <ul className="space-y-2">
        {workouts.map((w) => (
          <li key={w.id} className="border-t border-[var(--divider)] pt-2 text-sm">
            <Link href={`/app/log/${w.id}`}>{formatDateTime(w.startedAt, tz, locale)}</Link>
          </li>
        ))}
      </ul>

      {(older || cursor) && (
        <nav className="flex gap-3 border-t border-[var(--divider)] pt-4 text-xs font-bold tracking-wide">
          {cursor && (
            <Link href="/app/log" className="border border-[var(--fg)] px-4 py-3">
              ← NEWEST
            </Link>
          )}
          {older && (
            <Link href={`/app/log?before=${encodeURIComponent(older)}`} className="border border-[var(--fg)] px-4 py-3">
              OLDER →
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
