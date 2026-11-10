"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rememberTimeZone } from "@/lib/time";

const getCsrf = () =>
  fetch("/api/auth/csrf")
    .then((r) => r.json())
    .then((d: { csrfToken: string }) => d.csrfToken);

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const csrf = useRef<Promise<string> | null>(null);

  // While the user types: fetch the CSRF token and wake the server + database.
  useEffect(() => {
    rememberTimeZone();
    csrf.current = getCsrf().catch(() => "");
    fetch("/api/warm").catch(() => {});
  }, []);

  useEffect(() => {
    if (!error) return;

    function handleClearError() {
      setError(null);
    }

    document.addEventListener("click", handleClearError);

    return () => {
      document.removeEventListener("click", handleClearError);
    };
  }, [error]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const csrfToken = (await csrf.current) || (await getCsrf());
      // The same request next-auth's signIn() makes, without its extra session fetch and page reload.
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, password, csrfToken, json: "true" }),
      });
      const { url } = (await res.json()) as { url?: string };
      if (!url || new URL(url, location.href).searchParams.has("error")) {
        csrf.current = getCsrf().catch(() => "");
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.replace("/app");
    } catch {
      setError("No connection. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center px-5 sm:px-6">
      <section className="w-full max-w-[420px] mx-auto sm:translate-y-[-4vh]">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
          GO—YOU
        </h1>

        <p className="text-base md:text-lg text-[var(--muted)] mb-8 sm:mb-10">
          Train. Log. Progress.
        </p>

        <form className="space-y-8 md:space-y-10" onSubmit={handleLogin}>
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
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--fg)] text-[var(--bg)] py-4 text-sm font-medium tracking-[0.18em] sm:tracking-[0.2em]"
          >
            {loading ? "SIGNING IN…" : "ENTER"}
          </button>
        </form>

        {error && <div className="mt-6 text-sm text-red-600">{error}</div>}

        <div className="mt-10 text-xs text-[var(--muted)]">
          No account yet. Accounts are created automatically.
        </div>
      </section>
    </main>
  );
}
