"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app" },
  { label: "Log", href: "/app/log" },
  { label: "Stats", href: "/app/stats" },
  { label: "Settings", href: "/app/settings" },
];

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email?: string | null };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      {/* SIDEBAR / TOPBAR */}
      <aside className="border-b md:border-b-0 md:border-r border-[var(--divider)] p-4">
        <nav className="space-y-6">
          <div className="text-sm font-bold tracking-wide">GO—YOU</div>

          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-2 py-1 ${
                      isActive
                        ? "font-semibold text-[var(--fg)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="pt-6 border-t border-[var(--divider)] text-sm space-y-3">
            <div className="text-[var(--muted)] break-all">{user.email}</div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="border border-[var(--fg)] px-3 py-1 w-full text-left"
            >
              LOG OUT
            </button>
          </div>
        </nav>
      </aside>

      <main className="p-6">{children}</main>
    </div>
  );
}
