"use client";

import { useState } from "react";
import { exerciseName } from "@/lib/lift";

function normalizeExercise(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}

export default function AddExerciseInput({
  onAdd,
  suggestions = [],
}: {
  onAdd: (exerciseId: string, label: string) => void;
  suggestions?: string[]; // slugs already in the user's history, so names don't fork ("bench" vs "bench press")
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeExercise(value);
    if (!normalized) return setError("Type an exercise name.");
    onAdd(normalized, value.trim());
    setValue("");
    setError(null);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="add-exercise" className="label block">
        Add exercise
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          id="add-exercise"
          type="text"
          list="known-exercises"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="e.g. Cable fly"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          className="field h-[var(--tap-lg)]"
        />
        <button type="submit" className="btn btn-lg px-5">
          Add
        </button>
      </div>
      <datalist id="known-exercises">
        {suggestions.map((slug) => (
          <option key={slug} value={exerciseName(slug)} />
        ))}
      </datalist>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}
