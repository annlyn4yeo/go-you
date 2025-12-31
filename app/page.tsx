"use client";

import { signIn } from "next-auth/react";

export default function AuthPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <section className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2">TRACK YOUR WORK.</h1>

        <p className="text-[var(--muted)] mb-8">Sign in to continue</p>

        <form className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-[var(--divider)] px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-[var(--divider)] px-3 py-2 outline-none"
            />
          </div>

          <button
            type="button"
            className="w-full border border-[var(--fg)] py-2 font-medium"
            onClick={() =>
              signIn("credentials", {
                email: "user@example.com",
                password: "demo",
                callbackUrl: "/app",
              })
            }
          >
            LOG IN
          </button>
        </form>

        <div className="mt-6 text-sm text-[var(--muted)]">No account yet.</div>
      </section>
    </main>
  );
}
