"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen flex items-center px-5 sm:px-6">
      <section className="w-full max-w-[420px] mx-auto sm:translate-y-[-4vh]">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
          GO—YOU
        </h1>

        <p className="text-base md:text-lg text-[var(--muted)] mb-8 sm:mb-10">
          Train. Log. Progress.
        </p>

        <form className="space-y-8 md:space-y-10">
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2 text-[var(--muted)]">
              Email
            </label>
            <input
              id="email"
              autoComplete="false"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 border border-[var(--fg)] bg-transparent px-4 text-base leading-none outline-none"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase mb-2 text-[var(--muted)]">
              Password
            </label>
            <input
              id="pwd"
              type="password"
              autoComplete="false"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 border border-[var(--fg)] bg-transparent px-4 text-base leading-none outline-none"
            />
          </div>

          <button
            type="button"
            className="w-full bg-[var(--fg)] text-[var(--bg)] py-4 text-sm font-medium tracking-[0.18em] sm:tracking-[0.2em]"
            onClick={() =>
              signIn("credentials", {
                email,
                password,
                callbackUrl: "/app",
              })
            }
          >
            ENTER
          </button>
        </form>

        <div className="mt-10 text-xs text-[var(--muted)]">
          No account yet. Accounts are created automatically.
        </div>
      </section>
    </main>
  );
}
