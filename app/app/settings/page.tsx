import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GoalsForm from "@/components/GoalsForm";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="display text-4xl">Goals</h1>
        <p className="text-sm text-[var(--muted)]">Workout targets, tracked on Train.</p>
      </header>

      <GoalsForm />

      {/* On mobile the sidebar (and its log out) is hidden, so the account lives here. */}
      <section className="md:hidden space-y-3 border-t border-[var(--divider)] pt-6">
        <h2 className="label">Account</h2>
        <p className="break-all text-sm">{session?.user.email}</p>
        <SignOutButton />
      </section>
    </section>
  );
}
