"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WorkoutLogItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

export default function LogPage() {
  const [workouts, setWorkouts] = useState<WorkoutLogItem[]>([]);

  useEffect(() => {
    fetch("/api/workouts")
      .then((res) => res.json())
      .then(setWorkouts);
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Workout Log</h1>

      {workouts.length === 0 && (
        <div className="text-sm text-[var(--muted)]">
          No workouts logged yet
        </div>
      )}

      <ul className="space-y-2">
        {workouts.map((w) => (
          <li
            key={w.id}
            className="border-t border-[var(--divider)] pt-2 text-sm"
          >
            <Link href={`/app/log/${w.id}`}>
              {new Date(w.startedAt).toLocaleString()}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
