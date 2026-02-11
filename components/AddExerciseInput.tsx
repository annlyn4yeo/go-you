"use client";

import { useState } from "react";

function normalizeExercise(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}

export default function AddExerciseInput({
  onAdd,
}: {
  onAdd: (exerciseId: string, label: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!value.trim()) {
      setError("Exercise name cannot be empty");
      return;
    }

    const normalized = normalizeExercise(value);

    if (!normalized) {
      setError("Invalid exercise name");
      return;
    }

    onAdd(normalized, value.trim());

    setValue("");
    setError(null);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Add exercise</label>

      <input
        type="text"
        placeholder="Type exercise name and press Enter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="
          w-full
          border border-[var(--divider)]
          px-4 py-3
          text-sm
          outline-none
          focus:border-[var(--fg)]
        "
      />

      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
