"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { rememberTimeZone } from "@/lib/time";
import { useWorkoutStore } from "@/state/workoutStore";
import SignOutButton from "@/components/SignOutButton";

const NAV_ITEMS = [
  { label: "TRAIN", href: "/app" },
  { label: "LOG", href: "/app/log" },
  { label: "STATS", href: "/app/stats" },
  { label: "GOALS", href: "/app/settings" },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/app" && pathname.startsWith(href));

// The same four links, laid out as a desktop sidebar list or a mobile tab bar.
function NavList({ variant, live }: { variant: "side" | "tabs"; live: boolean }) {
  const pathname = usePathname();
  const tabs = variant === "tabs";
  return (
    <ul className={tabs ? "grid grid-cols-4" : "space-y-1"}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center text-xs font-bold tracking-[0.16em] ${
                tabs ? "h-[var(--tap-lg)] justify-center" : "min-h-[var(--tap)] justify-between px-3"
              } ${active ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`}
            >
              {item.label}
              {live && item.href === "/app" && (
                <span aria-label="workout in progress" className={tabs ? "absolute top-2 right-3 text-[8px]" : "text-[10px]"}>
                  {tabs ? "●" : "● LIVE"}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AppShell({ children, user }: { children: React.ReactNode; user: { email?: string | null } }) {
  const live = useWorkoutStore((s) => !!s.activeWorkout);

  useEffect(() => {
    rememberTimeZone();
    useWorkoutStore.persist.rehydrate();
    // Offline Train + installability (DD-039). Production only, so dev reloads never serve a stale copy.
    if (process.env.NODE_ENV === "production") navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-[var(--fg)] focus:p-3 focus:text-[var(--bg)]">
        Skip to content
      </a>

      {/* Mobile: brand bar. Navigation lives at the bottom, under the thumb. */}
      <header className="flex h-12 items-center border-b border-[var(--divider)] px-4 md:hidden">
        <span className="text-sm font-bold tracking-wide">GO—YOU</span>
      </header>

      <aside className="hidden flex-col gap-8 border-r border-[var(--divider)] p-5 md:flex">
        <span className="text-sm font-bold tracking-wide">GO—YOU</span>
        <nav aria-label="Main">
          <NavList variant="side" live={live} />
        </nav>
        <div className="mt-auto space-y-3 border-t border-[var(--divider)] pt-5 text-sm">
          <div className="break-all text-[var(--muted)]">{user.email}</div>
          <SignOutButton />
        </div>
      </aside>

      <main id="main" className="px-4 pt-6 pb-[calc(var(--tap-lg)+env(safe-area-inset-bottom)+2rem)] md:p-8">
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--fg)] bg-[var(--bg)] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <NavList variant="tabs" live={live} />
      </nav>
    </div>
  );
}
