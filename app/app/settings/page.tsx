"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_GOALS, readGoals, writeGoals } from "@/lib/goals";
import {
  DEFAULT_TEMPLATES,
  ProgramTemplate,
  readCustomTemplates,
  writeCustomTemplates,
} from "@/lib/templates";

function toExerciseId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseTemplateLines(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, right] = line.split("|").map((item) => item.trim());
      if (right) {
        return {
          exerciseId: toExerciseId(left),
          label: right,
        };
      }

      return {
        exerciseId: toExerciseId(left),
        label: left,
      };
    })
    .filter((item) => item.exerciseId && item.label);
}

export default function SettingsPage() {
  const [weeklyGoal, setWeeklyGoal] = useState(
    DEFAULT_GOALS.weeklyWorkoutTarget,
  );
  const [monthlyGoal, setMonthlyGoal] = useState(
    DEFAULT_GOALS.monthlyWorkoutTarget,
  );
  const [customTemplates, setCustomTemplates] = useState<ProgramTemplate[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exerciseInput, setExerciseInput] = useState("");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    const goals = readGoals();
    setWeeklyGoal(goals.weeklyWorkoutTarget);
    setMonthlyGoal(goals.monthlyWorkoutTarget);
    setCustomTemplates(readCustomTemplates());
  }, []);

  useEffect(() => {
    if (!goalSaved) return;
    const timer = window.setTimeout(() => setGoalSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [goalSaved]);

  const allTemplates = useMemo(
    () => [...DEFAULT_TEMPLATES, ...customTemplates],
    [customTemplates],
  );

  function handleSaveGoals() {
    const normalized = {
      weeklyWorkoutTarget: Math.max(1, Math.min(14, Math.round(weeklyGoal))),
      monthlyWorkoutTarget: Math.max(1, Math.min(60, Math.round(monthlyGoal))),
    };

    writeGoals(normalized);
    setWeeklyGoal(normalized.weeklyWorkoutTarget);
    setMonthlyGoal(normalized.monthlyWorkoutTarget);
    setGoalSaved(true);
  }

  function handleCreateTemplate() {
    setTemplateError(null);

    const trimmedName = name.trim().toUpperCase();
    const trimmedDescription = description.trim().toUpperCase();
    const exercises = parseTemplateLines(exerciseInput);

    if (!trimmedName) {
      setTemplateError("Template name is required.");
      return;
    }

    if (exercises.length < 2) {
      setTemplateError("Add at least 2 exercises.");
      return;
    }

    const template: ProgramTemplate = {
      id: `custom-${crypto.randomUUID()}`,
      name: trimmedName,
      description: trimmedDescription || "CUSTOM PROGRAM",
      exercises,
    };

    const next = [template, ...customTemplates];
    setCustomTemplates(next);
    writeCustomTemplates(next);

    setName("");
    setDescription("");
    setExerciseInput("");
  }

  function removeTemplate(id: string) {
    const next = customTemplates.filter((template) => template.id !== id);
    setCustomTemplates(next);
    writeCustomTemplates(next);
  }

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">PROGRAM & GOALS</h1>
        <div className="text-sm text-[var(--muted)]">
          Goal targets and template authoring for your dashboard start screen.
        </div>
      </header>

      <section className="border border-[var(--divider)] p-5 space-y-4">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
          GOAL TRACKING
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-xs tracking-wide">WEEKLY WORKOUT TARGET</div>
            <input
              type="number"
              min={1}
              max={14}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value))}
              className="w-full border border-[var(--divider)] px-3 py-2 text-lg font-semibold"
            />
          </label>
          <label className="space-y-2">
            <div className="text-xs tracking-wide">MONTHLY WORKOUT TARGET</div>
            <input
              type="number"
              min={1}
              max={60}
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number(e.target.value))}
              className="w-full border border-[var(--divider)] px-3 py-2 text-lg font-semibold"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveGoals}
            className="border-2 border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] px-4 py-2 text-sm font-bold tracking-wide"
          >
            SAVE GOALS
          </button>
          {goalSaved && (
            <span className="text-xs text-[var(--muted)]">Saved</span>
          )}
        </div>
      </section>

      <section className="border border-[var(--divider)] p-5 space-y-4">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
          CUSTOM PROGRAM TEMPLATES
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Template Name (e.g. UPPER B)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--divider)] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[var(--divider)] px-3 py-2 text-sm"
            />
            <textarea
              placeholder={
                "One exercise per line\nbench_press|Bench Press\nbarbell_row|Barbell Row"
              }
              value={exerciseInput}
              onChange={(e) => setExerciseInput(e.target.value)}
              className="w-full min-h-[180px] border border-[var(--divider)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCreateTemplate}
              className="border-2 border-[var(--fg)] px-4 py-2 text-sm font-bold tracking-wide"
            >
              ADD TEMPLATE
            </button>
            {templateError && (
              <div className="text-xs text-red-600">{templateError}</div>
            )}
          </div>

          <div className="space-y-3">
            {customTemplates.length === 0 && (
              <div className="text-sm text-[var(--muted)] border border-[var(--divider)] p-3">
                No custom templates yet.
              </div>
            )}
            {customTemplates.map((template) => (
              <article
                key={template.id}
                className="border border-[var(--divider)] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">{template.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {template.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTemplate(template.id)}
                    className="border border-[var(--fg)] px-2 py-1 text-xs"
                  >
                    DELETE
                  </button>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {template.exercises.map((item) => item.label).join(" / ")}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--muted)]">
          ACTIVE TEMPLATE LIBRARY
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {allTemplates.map((template) => (
            <article
              key={template.id}
              className="border border-[var(--divider)] p-3 space-y-1"
            >
              <div className="text-sm font-bold">{template.name}</div>
              <div className="text-xs text-[var(--muted)]">
                {template.description}
              </div>
              <div className="text-xs">
                {template.exercises.length} exercises
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
