import { exerciseById, exercises, muscleNames } from "../data/catalog";
import {
  planSchema,
  type AppData,
  type Muscle,
  type Plan,
  type PlanExercise,
  type Profile,
  type Proposal,
} from "./schema";

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export type Split = "arms" | "ppl" | "ul" | "full";
export const splitNames: Record<Split, string> = {
  arms: "Arms focus",
  ppl: "Push · pull · legs",
  ul: "Upper · lower",
  full: "Full body",
};
const templates: Record<string, string[]> = {
  push: ["bench", "ohp", "lateral-raise", "pushdown"],
  pull: ["pullup", "row", "face-pull", "ez-curl"],
  legs: ["squat", "rdl", "calf", "leg-curl"],
  upper: ["bench", "row", "ohp", "pullup"],
  lower: ["squat", "rdl", "leg-press", "calf"],
  full: ["squat", "bench", "row", "rdl"],
  arms: [
    "close-bench",
    "ez-curl",
    "overhead-extension",
    "incline-curl",
    "hammer-curl",
  ],
};
const patterns: Record<Split, string[]> = {
  arms: ["arms", "push", "pull", "legs", "arms", "pull", "legs"],
  ppl: ["push", "pull", "legs", "push", "pull", "legs", "push"],
  ul: ["upper", "lower", "upper", "lower", "upper", "lower", "upper"],
  full: ["full", "full", "full", "full", "full", "full", "full"],
};
export function newPlanExercise(
  exerciseId: string,
  goal: Profile["goal"] = "both",
): PlanExercise {
  return {
    exerciseId,
    sets: 3,
    repsMin: goal === "strength" ? 5 : goal === "size" ? 8 : 6,
    repsMax: goal === "strength" ? 5 : goal === "size" ? 12 : 10,
    weightKg: 0,
    restSeconds: 90,
  };
}
export function guidedPlan(
  profile: Profile,
  split: Split,
  focus: Muscle[] = [],
  selectedIds?: string[],
): Plan {
  const count = profile.daysPerWeek;
  const days = Array.from({ length: count }, (_, i) => {
    const kind = patterns[split][i];
    let ids = selectedIds?.length ? selectedIds : templates[kind];
    ids = ids.filter((id) => {
      const ex = exerciseById[id];
      return (
        ex &&
        !profile.avoidedExercises.some(
          (name) => name.toLowerCase() === ex.name.toLowerCase(),
        ) &&
        (ex.equipment === "Bodyweight" ||
          profile.equipment.includes(ex.equipment))
      );
    });
    if (!ids.length)
      ids = exercises
        .filter(
          (ex) =>
            (ex.equipment === "Bodyweight" ||
              profile.equipment.includes(ex.equipment)) &&
            (!focus.length || ex.primary.some((m) => focus.includes(m))) &&
            !profile.avoidedExercises.some(
              (name) => name.toLowerCase() === ex.name.toLowerCase(),
            ),
        )
        .slice(0, 3)
        .map((ex) => ex.id);
    if (!ids.length)
      throw new Error(
        "No exercises match this equipment and avoid list. Adjust your selections.",
      );
    return {
      id: uid(),
      name: selectedIds?.length
        ? "Focused session"
        : kind[0].toUpperCase() + kind.slice(1),
      weekday: Math.floor((i * 7) / count),
      exercises: ids.map((id) => newPlanExercise(id, profile.goal)),
    };
  });
  const now = new Date().toISOString();
  return planSchema.parse({
    id: uid(),
    name: focus.length
      ? `${focus
          .slice(0, 2)
          .map((m) => muscleNames[m])
          .join(" + ")} focus`
      : splitNames[split],
    revision: 1,
    createdAt: now,
    updatedAt: now,
    days,
    focus,
  });
}
export function validatePlan(plan: Plan): Plan {
  const valid = planSchema.parse(plan);
  const dayIds = new Set<string>();
  for (const day of valid.days) {
    if (dayIds.has(day.id)) throw new Error("Duplicate day identifier.");
    dayIds.add(day.id);
    for (const ex of day.exercises)
      if (!exerciseById[ex.exerciseId])
        throw new Error(`Unknown exercise: ${ex.exerciseId}`);
  }
  return valid;
}
export function volumes(plans: Plan[]) {
  const result = {} as Record<Muscle, number>;
  for (const plan of plans)
    for (const day of plan.days)
      for (const item of day.exercises)
        for (const muscle of exerciseById[item.exerciseId]?.primary ?? [])
          result[muscle] = (result[muscle] ?? 0) + item.sets;
  return result;
}
export const volumeColor = (sets: number) =>
  sets === 0
    ? "#202027"
    : sets <= 4
      ? "#40350D"
      : sets <= 8
        ? "#7D6409"
        : sets <= 12
          ? "#C29A06"
          : "#F2C200";
export function estimatedDuration(items: PlanExercise[]) {
  return Math.max(
    5,
    Math.round(
      items.reduce(
        (total, x) => total + (x.sets * (45 + x.restSeconds)) / 60,
        0,
      ) / 5,
    ) * 5,
  );
}
export type Tuning = {
  load: number;
  volume: number;
  choice: number;
  length: number;
};
export function tuneDay(items: PlanExercise[], tune: Tuning, profile: Profile) {
  let result = items.map((item) => {
    const current = exerciseById[item.exerciseId];
    const substitute =
      tune.choice === 0
        ? undefined
        : exercises.find(
            (ex) =>
              ex.id !== current.id &&
              ex.primary.some((m) => current.primary.includes(m)) &&
              (ex.equipment === "Bodyweight" ||
                profile.equipment.includes(ex.equipment)) &&
              !profile.avoidedExercises.some(
                (name) => name.toLowerCase() === ex.name.toLowerCase(),
              ) &&
              (tune.choice < 0 ? ex.type !== "barbell" : ex.type === "barbell"),
          );
    const step = current.step;
    return {
      ...item,
      exerciseId: substitute?.id ?? item.exerciseId,
      sets: Math.max(1, Math.min(12, item.sets + tune.volume)),
      weightKg: substitute
        ? 0
        : Math.max(
            0,
            Math.round((item.weightKg * (1 + tune.load * 0.05)) / step) * step,
          ),
    };
  });
  if (tune.length < 0)
    result = result.slice(0, Math.max(1, result.length + tune.length));
  if (tune.length > 0) {
    const last = result.at(-1)!;
    result = result.map((x, i) =>
      i === result.length - 1
        ? { ...last, sets: Math.min(12, last.sets + tune.length) }
        : x,
    );
  }
  return result;
}
export function savePlan(data: AppData, plan: Plan): AppData {
  const existing = data.plans.find((x) => x.id === plan.id);
  const valid = validatePlan({
    ...plan,
    revision: existing ? existing.revision + 1 : 1,
    updatedAt: new Date().toISOString(),
  });
  return {
    ...data,
    plans: existing
      ? data.plans.map((x) => (x.id === valid.id ? valid : x))
      : [...data.plans, valid],
    selectedPlanId: valid.id,
    planHistory: existing
      ? [...data.planHistory, existing].slice(-30)
      : data.planHistory,
  };
}
export function applyProposal(data: AppData, proposal: Proposal): AppData {
  const existing = proposal.basePlanId
    ? data.plans.find((x) => x.id === proposal.basePlanId)
    : null;
  if (
    proposal.basePlanId &&
    (!existing || existing.revision !== proposal.baseRevision)
  )
    throw new Error(
      "This plan changed after the suggestion. Ask Coach to revise it first.",
    );
  const now = new Date().toISOString();
  return savePlan(data, {
    id: existing?.id ?? uid(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    revision: existing?.revision ?? 1,
    name: proposal.name,
    focus: proposal.focus,
    days: proposal.days.map((day) => ({ ...day, id: uid() })),
  });
}
export function undoPlan(data: AppData, planId: string): AppData {
  const last = [...data.planHistory].reverse().find((x) => x.id === planId);
  const current = data.plans.find((x) => x.id === planId);
  if (!last || !current) throw new Error("No earlier version of this plan.");
  const index = data.planHistory.lastIndexOf(last);
  return {
    ...data,
    plans: data.plans.map((x) =>
      x.id === planId
        ? {
            ...last,
            revision: current.revision + 1,
            updatedAt: new Date().toISOString(),
          }
        : x,
    ),
    planHistory: data.planHistory.filter((_, i) => i !== index),
  };
}
