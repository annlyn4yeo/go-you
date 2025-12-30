export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--divider)] p-4">
        <nav className="space-y-4 text-sm font-medium">
          <div>WORKOUT</div>
          <div className="text-[var(--muted)]">Log</div>
          <div className="text-[var(--muted)]">Stats</div>
          <div className="text-[var(--muted)]">Settings</div>
        </nav>
      </aside>

      <main className="p-6">{children}</main>
    </div>
  );
}
