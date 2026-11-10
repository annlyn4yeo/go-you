"use client";

// Label + [−][value][+] on one ruled grid. Steppers keep sweaty-thumb typing to a minimum.
export default function NumberField({
  id,
  label,
  value,
  onChange,
  step,
  min = 0,
  decimal = false,
  large = false,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  decimal?: boolean;
  large?: boolean;
  hint?: string;
}) {
  const bump = (delta: number) => {
    const current = Number(value) || 0;
    onChange(String(Math.max(min, Math.round((current + delta) * 100) / 100)));
  };
  const name = label.split(" · ")[0].toLowerCase(); // "Weight · kg" -> "weight" for the stepper labels
  const cell = large ? "h-[var(--tap-lg)]" : "h-[var(--tap)]";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <div className="grid grid-cols-[var(--tap)_1fr_var(--tap)] gap-px border border-[var(--control)] bg-[var(--control)]">
        <button type="button" className={`press ${cell} bg-[var(--bg)] text-lg font-bold`} onClick={() => bump(-step)} aria-label={`Decrease ${name} by ${step}`}>
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${cell} min-w-0 bg-[var(--bg)] text-center ${large ? "text-2xl" : "text-xl"} font-semibold tabular outline-none focus-visible:outline-offset-[-2px]`}
        />
        <button type="button" className={`press ${cell} bg-[var(--bg)] text-lg font-bold`} onClick={() => bump(step)} aria-label={`Increase ${name} by ${step}`}>
          +
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
