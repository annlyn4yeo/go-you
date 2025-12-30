export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>
        <div className="text-[var(--muted)] text-sm">
          No active workout
        </div>
      </header>

      <section className="border-t border-[var(--divider)] pt-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-[var(--muted)]">
              TOTAL TIME
            </div>
            <div className="text-2xl font-bold">
              0 MIN
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--muted)]">
              TOTAL VOLUME
            </div>
            <div className="text-2xl font-bold">
              0 KG
            </div>
          </div>

          <div>
            <div className="text-sm text-[var(--muted)]">
              SESSIONS THIS WEEK
            </div>
            <div className="text-2xl font-bold">
              0
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--divider)] pt-6">
        <button
          type="button"
          className="border border-[var(--fg)] px-6 py-2 font-medium"
        >
          START WORKOUT
        </button>
      </section>
    </section>
  );
}
