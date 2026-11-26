import GoalsForm from "@/components/GoalsForm";

// Route skeletons (loading.tsx). Each mirrors its page: everything that does not need data (titles, labels, section heads,
// buttons, segment frames) renders with the page's own classes, so it sits exactly where the page will put it; only data is a
// .skel block, sized to the line it stands for. The swap to the real page then fills in, it never moves.

// A placeholder for one line of text: the box takes the line's height, the bar inside is shorter, like a text run.
function Line({ h = "h-6", bar = "h-3", w = "w-1/2", className = "" }: { h?: string; bar?: string; w?: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-center ${h} ${className}`}>
      <span className={`skel block ${bar} ${w}`} />
    </span>
  );
}

function Busy({ what, className, children }: { what: string; className: string; children: React.ReactNode }) {
  return (
    <>
      {/* Outside the section: inside, space-y would give the hidden line a margin and push the page down. */}
      <p role="status" className="sr-only">
        Loading {what}
      </p>
      <section className={className} aria-busy="true">
        {children}
      </section>
    </>
  );
}

// Segment frames with their labels but no active cell (the choice is in the URL, which loading.tsx cannot read).
function SegmentFrame({ labels }: { labels: string[] }) {
  return (
    <div aria-hidden="true" className="grid auto-cols-fr grid-flow-col gap-px border border-[var(--control)] bg-[var(--control)]">
      {labels.map((l) => (
        <span key={l} className="flex h-11 items-center justify-center bg-[var(--bg)] px-2 text-xs font-bold tracking-[0.12em] text-[var(--muted)]">
          {l}
        </span>
      ))}
    </div>
  );
}

function StatGridFrame({ labels, value = "h-8" }: { labels: string[]; value?: string }) {
  return (
    <div aria-hidden="true" className="grid auto-cols-fr grid-flow-col gap-px border border-[var(--divider)] bg-[var(--divider)]">
      {labels.map((l) => (
        <div key={l} className="bg-[var(--bg)] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{l}</div>
          <Line h={value} bar="h-5" w="w-3/5" />
        </div>
      ))}
    </div>
  );
}

// Train with no active workout (the common case; a live workout replaces the page anyway).
export function TrainSkeleton() {
  return (
    <Busy what="train" className="space-y-10">
      <header className="space-y-2">
        <p className="label">No active workout</p>
        {/* P3-08: the real title is GO—NAME. The name is data, so only it is a block; a long name later shrinks the line (sized to fit). */}
        <h1 className="display whitespace-nowrap text-[3rem]">
          <span className="sr-only">Train</span>
          <span aria-hidden="true">GO—</span>
          <span aria-hidden="true" className="skel inline-block h-[0.7em] w-[2.6em]" />
        </h1>
      </header>
      <div aria-hidden="true" className="btn btn-primary btn-lg w-full">
        Start blank
      </div>
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Goals</h2>
          <span className="label text-[var(--fg)] underline underline-offset-4">Edit</span>
        </div>
        <div className="grid grid-cols-2 gap-px border border-[var(--divider)] bg-[var(--divider)]">
          {["Weekly goal", "Monthly goal"].map((l) => (
            <div key={l} className="space-y-3 bg-[var(--bg)] p-4">
              <div className="label">{l}</div>
              <Line h="h-9" bar="h-7" w="w-2/5" />
              <div className="skel h-2" />
            </div>
          ))}
        </div>
      </section>
    </Busy>
  );
}

export function LogSkeleton() {
  return (
    <Busy what="log" className="space-y-6">
      <h1 className="display text-5xl">Log</h1>
      <section>
        <div className="flex items-baseline justify-between gap-3 py-3">
          <Line h="h-5" w="w-24" />
          <Line h="h-5" w="w-28" />
        </div>
        <div aria-hidden="true" className="grid h-[34px] grid-cols-[repeat(30,1fr)] items-end gap-[2px]">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="skel h-0.5" />
          ))}
        </div>
        {/* Day numbers and the key need no data: drawn as on the page. */}
        <div aria-hidden="true" className="mt-1.5 grid grid-cols-[repeat(30,1fr)] gap-[2px] text-[10px] font-semibold text-[var(--muted)] tabular">
          {[1, 8, 15, 22, 29].map((n) => (
            <span key={n} className="whitespace-nowrap" style={{ gridColumn: n }}>
              {n}
            </span>
          ))}
        </div>
        <p aria-hidden="true" className="mt-2 flex gap-4 text-[11px] text-[var(--muted)]">
          <span className="flex items-end gap-1.5"><span className="inline-block h-2 w-1.5 bg-[var(--divider)]" />Trained</span>
          <span className="flex items-end gap-1.5"><span className="inline-block h-3 w-1.5 bg-[var(--divider)]" />Record</span>
        </p>
        <ul aria-hidden="true" className="mt-4 border-b border-[var(--divider)]">
          {["w-3/5", "w-1/2", "w-4/5", "w-1/2", "w-3/5"].map((w, i) => (
            <li key={i} className="grid grid-cols-[3.25rem_1fr] border-t border-[var(--divider)] py-3.5">
              <span>
                <Line h="h-[27px]" bar="h-6" w="w-7" />
                <Line h="h-4" bar="h-2.5" w="w-7" className="mt-1.5" />
              </span>
              <span>
                <Line h="h-[22px]" w={w} />
                <Line h="h-[19.5px]" bar="h-2.5" w="w-2/5" className="mt-1" />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Busy>
  );
}

export function StatsSkeleton() {
  return (
    <Busy what="stats" className="space-y-10">
      <div>
        <div className="flex items-end justify-between gap-3">
          <h1 className="display text-5xl">Stats</h1>
          <div className="w-[6.5rem]">
            <SegmentFrame labels={["KG", "LB"]} />
          </div>
        </div>
        <div className="mt-5">
          <SegmentFrame labels={["1M", "3M", "1Y", "ALL"]} />
        </div>
        <Line h="h-5" bar="h-2.5" w="w-24" className="mt-2" />
        <div className="mt-8">
          <Line h="h-[75px]" bar="h-[62px]" w="w-36" />
          <Line h="h-[33px]" bar="h-5" w="w-52" className="mt-2" />
          <Line h="h-5" bar="h-2.5" w="w-44" className="mt-1.5" />
        </div>
      </div>
      <section>
        <h2 className="section-head">
          Lifts <span className="label">Best · change</span>
        </h2>
        <ul aria-hidden="true" className="mt-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="grid grid-cols-[1fr_5rem] items-center gap-3 border-t border-[var(--divider)] py-3 first:border-t-0">
              <span>
                <Line h="h-6" w={["w-3/5", "w-2/5", "w-1/2"][i % 3]} />
                {/* 21px: the detail line holds the New tag, which is taller than the text. */}
                <Line h="h-[21px]" bar="h-2.5" w="w-2/3" className="mt-1" />
              </span>
              <span className="flex flex-col items-end">
                <Line h="h-5" bar="h-4" w="w-16" className="justify-end" />
                <Line h="h-4" bar="h-2.5" w="w-8" className="mt-1 justify-end" />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Busy>
  );
}

export function WorkoutSkeleton() {
  return (
    <Busy what="workout" className="space-y-8">
      <span className="label inline-flex min-h-[var(--tap)] items-center text-[var(--fg)]">← Log</span>
      <header className="space-y-2">
        <Line h="h-4" bar="h-2.5" w="w-48" />
        <Line h="h-[46px]" bar="h-9" w="w-4/5" />
      </header>
      <StatGridFrame labels={["Time", "Sets", "Vol kg"]} />
      {[4, 3].map((sets, i) => (
        <article key={i} aria-hidden="true" className="space-y-3">
          <header className="flex items-baseline justify-between gap-3 border-t-2 border-[var(--fg)] pt-3">
            <Line h="h-[25px]" bar="h-4" w="w-1/2" className="flex-1" />
            <Line h="h-4" bar="h-2.5" w="w-20" />
          </header>
          <ol className="border-b border-[var(--divider)]">
            {Array.from({ length: sets }, (_, j) => (
              <li key={j} className="grid h-11 grid-cols-[2rem_1fr] items-center border-t border-[var(--divider)]">
                <span className="skel ml-1 h-2.5 w-2" />
                <span className="skel h-3 w-28" />
              </li>
            ))}
          </ol>
        </article>
      ))}
    </Busy>
  );
}

export function LiftSkeleton() {
  return (
    <Busy what="lift" className="space-y-8">
      <span className="label inline-flex min-h-[var(--tap)] items-center text-[var(--fg)]">← Back</span>
      {/* text-4xl's own 40px line height wins over .display's 0.95 (utilities beat components). */}
      <Line h="h-10" bar="h-7" w="w-2/3" />
      {/* The page's own labels: at 320px they wrap to two lines, and the skeleton must wrap with them (kg and lb are as wide). */}
      <StatGridFrame labels={["Heaviest kg", "Est. 1RM kg", "Sessions"]} value="h-7" />
      <section className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <h2 className="label">Est. 1RM over time</h2>
          <div className="w-40">
            <SegmentFrame labels={["3M", "1Y", "ALL"]} />
          </div>
        </div>
        <div aria-hidden="true" className="space-y-2">
          <Line h="h-8" bar="h-6" w="w-28" />
          <div className="skel aspect-[343/172] w-full" />
        </div>
      </section>
    </Busy>
  );
}

// Goals: the form is real (it only reads this browser's storage); the routines count waits for the server.
export function GoalsSkeleton() {
  return (
    <Busy what="goals" className="space-y-10">
      <header className="space-y-2">
        <h1 className="display text-4xl">Goals</h1>
        <p className="text-sm text-[var(--muted)]">Workout targets, tracked on Train.</p>
      </header>
      <GoalsForm />
      <section aria-hidden="true" className="space-y-4 border-t-2 border-[var(--fg)] pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Routines</h2>
          <Line h="h-4" bar="h-2.5" w="w-16" />
        </div>
        <Line h="h-12" bar="h-10" w="w-40" />
        <div className="skel h-2" />
        <Line h="h-5" bar="h-2.5" w="w-4/5" />
        <Line h="h-5" bar="h-2.5" w="w-3/5" />
      </section>
    </Busy>
  );
}
