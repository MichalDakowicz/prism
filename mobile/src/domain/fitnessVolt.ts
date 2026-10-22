import type { LiftRecord, Profile } from "./schema";
import { estimatedMax, fmt } from "./strength";
import type { FitnessVoltResult } from "./fitnessVoltSchema";

export const FITNESS_VOLT_URL =
  "https://fitnessvolt.com/strength-standards/strength-data/";
export const fitnessVoltLifts: Record<string, string> = {
  bench: "bench-press",
  squat: "squat",
  deadlift: "deadlift",
  ohp: "overhead-press",
};
export {
  fitnessVoltCacheSchema,
  fitnessVoltResponseSchema,
  type FitnessVoltResult,
} from "./fitnessVoltSchema";
export type FitnessVoltInput = {
  recordId: string;
  lift: string;
  sex: "male" | "female";
  bodyweightKg: number;
  e1rmKg: number;
  age: number | null;
};
export function fitnessVoltInput(
  record: LiftRecord,
  profile: Profile,
  group?: "male" | "female" | null,
): FitnessVoltInput | null {
  const lift = fitnessVoltLifts[record.exerciseId],
    sex = record.comparisonGroup ?? profile.comparisonGroup ?? group;
  if (!lift || !sex) return null;
  return {
    recordId: record.id,
    lift,
    sex,
    bodyweightKg: record.bodyweightKg,
    e1rmKg: estimatedMax(record.weightKg, record.reps),
    age: record.age ?? profile.age,
  };
}
export function fitnessVoltKey(input: FitnessVoltInput) {
  return [
    input.recordId,
    input.lift,
    input.sex,
    input.bodyweightKg.toFixed(4),
    input.e1rmKg.toFixed(4),
    input.age ?? "all",
  ].join(":");
}
export function cachedFitnessVolt(
  record: LiftRecord,
  profile: Profile,
  results: FitnessVoltResult[],
) {
  const previous = profile.comparisonGroup
    ? null
    : results.filter((result) => result.recordId === record.id).at(-1)?.sex;
  const input = fitnessVoltInput(record, profile, previous);
  return input
    ? results.find((result) => result.key === fitnessVoltKey(input))
    : undefined;
}

export function fitnessVoltDisplay(
  result: FitnessVoltResult | undefined,
  source: Profile["strengthScoreSource"],
) {
  const population =
    source === "gym" ? "self_reported_gym" : "verified_competition";
  const cohort = source === "gym" ? result?.gym : result?.verified;
  return {
    label: source === "gym" ? "Gym" : "Competition",
    score: cohort?.percentile ?? null,
    // The API's tier describes only its own headline population.
    tier: cohort && result?.population === population ? result.tier : null,
  };
}
export function fitnessVoltBadge(
  result: FitnessVoltResult,
  source: Profile["strengthScoreSource"],
) {
  const display = fitnessVoltDisplay(result, source);
  return `${source === "gym" ? "GYM" : "COMP"} · ${display.score === null ? "N/A" : `${fmt(display.score)}/100`}`;
}
