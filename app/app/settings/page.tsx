import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplateProgress } from "@/lib/history";
import { TEMPLATE_UNLOCK_SESSIONS } from "@/lib/templates";
import GoalsForm from "@/components/GoalsForm";
import SegmentedBar from "@/components/SegmentedBar";
import SignOutButton from "@/components/SignOutButton";
import InstallApp from "@/components/InstallApp";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  const { sessions, templates } = await getTemplateProgress(session!.user.id);
  const left = Math.max(0, TEMPLATE_UNLOCK_SESSIONS - sessions);

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="display text-4xl">Goals</h1>
        <p className="text-sm text-[var(--muted)]">Workout targets, tracked on Train.</p>
      </header>

      <GoalsForm />

      {/* Routines are earned: a reason to come back for the next session (DD-037). */}
      <section aria-labelledby="routines" className="space-y-4 border-t-2 border-[var(--fg)] pt-6">
        <div className="flex items-baseline justify-between">
          <h2 id="routines" className="label">
            Routines
          </h2>
          <span className="label text-[var(--fg)]">{left ? `${left} to go` : "Unlocked"}</span>
        </div>
        <p className="text-5xl font-bold leading-none tracking-[-0.02em] tabular">
          {Math.min(sessions, TEMPLATE_UNLOCK_SESSIONS)}
          <span className="text-base font-semibold text-[var(--muted)]"> / {TEMPLATE_UNLOCK_SESSIONS} sessions</span>
        </p>
        <SegmentedBar
          count={sessions}
          target={TEMPLATE_UNLOCK_SESSIONS}
          label={`${Math.min(sessions, TEMPLATE_UNLOCK_SESSIONS)} of ${TEMPLATE_UNLOCK_SESSIONS} sessions`}
        />
        <p className="text-sm text-[var(--muted)]">
          {left
            ? `Log ${left} more ${left === 1 ? "session" : "sessions"} and GO—YOU builds routines from the workouts you repeat, one tap to start on Train.`
            : templates.length
              ? "Built from the workouts you repeat. Start them on Train."
              : "Unlocked. Repeat a session (same exercises) and it becomes a routine."}
        </p>
        {templates.length > 0 && (
          <>
            <ul className="border-b border-[var(--divider)]">
              {templates.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-3 border-t border-[var(--divider)] py-3">
                  <span className="text-base font-bold tracking-[-0.01em]">{t.name}</span>
                  <span className="label">
                    {t.exercises.length} EX · Done {t.timesDone}×
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn w-full">
              Start one on Train →
            </Link>
          </>
        )}
      </section>

      <InstallApp />

      {/* On mobile the sidebar (and its log out) is hidden, so the account lives here. */}
      <section className="space-y-3 border-t border-[var(--divider)] pt-6 md:hidden">
        <h2 className="label">Account</h2>
        <p className="break-all text-sm">{session?.user.email}</p>
        <SignOutButton />
      </section>
    </section>
  );
}
