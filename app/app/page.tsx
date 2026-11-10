import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExerciseHistory, getTemplateProgress } from "@/lib/history";
import { dayIn, monthStart, safeTimeZone, TZ_COOKIE, weekStart } from "@/lib/time";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "Train" };

export default async function DashboardPage() {
  const [session, jar] = await Promise.all([getServerSession(authOptions), cookies()]);
  const userId = session!.user.id; // app/app/layout.tsx already redirects when signed out
  const day = dayIn(safeTimeZone(jar.get(TZ_COOKIE)?.value));

  const today = day(new Date());
  const from = [weekStart(today), monthStart(today)].sort()[0];
  const [recent, history, progress] = await Promise.all([
    // Only this week's and month's start times (one day of margin for time-zone offsets), not the whole history.
    prisma.workout.findMany({
      where: { userId, startedAt: { gte: new Date(Date.parse(`${from}T00:00:00Z`) - 86400000) } },
      select: { startedAt: true },
    }),
    getExerciseHistory(userId),
    getTemplateProgress(userId),
  ]);
  const days = recent.map((w) => day(w.startedAt)).filter((d) => d >= from);

  return (
    <Dashboard
      userId={userId}
      weeklyCount={days.filter((d) => d >= weekStart(today)).length}
      monthlyCount={days.filter((d) => d >= monthStart(today)).length}
      history={history}
      templates={progress.templates}
    />
  );
}
