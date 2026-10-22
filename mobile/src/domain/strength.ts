import {
  standardsSchema,
  tiers,
  type LiftRecord,
  type Standards,
  type Unit,
} from "./schema";
import { exerciseById } from "../data/catalog";

export const KG_TO_LB = 2.2046226218487757;
export const toUnit = (kg: number, unit: Unit) =>
  unit === "lb" ? kg * KG_TO_LB : kg;
export const fromUnit = (value: number, unit: Unit) =>
  unit === "lb" ? value / KG_TO_LB : value;
export function fmt(value: number, precision = 1) {
  return Number(value.toFixed(precision)).toString();
}
export function parseNumber(value: string) {
  const text = value.trim().replace(",", ".");
  return text ? Number(text) : NaN;
}
export const estimationMethod = "Brzycki 2–10 reps; Epley 11–12, v1";
export function estimatedMax(weightKg: number, reps: number) {
  if (
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    reps > 12
  )
    throw new Error("Enter a positive load and 1–12 reps.");
  if (reps === 1) return weightKg;
  return reps <= 10
    ? (weightKg * 36) / (37 - reps)
    : weightKg * (1 + reps / 30);
}
export function bestRecord(records: LiftRecord[], exerciseId: string) {
  const available = records.filter(
    (x) => x.exerciseId === exerciseId && !x.archivedAt,
  );
  const singles = available.filter((x) => x.reps === 1);
  return (singles.length ? singles : available).sort(
    (a, b) =>
      estimatedMax(b.weightKg, b.reps) - estimatedMax(a.weightKg, a.reps) ||
      b.date.localeCompare(a.date),
  )[0];
}
export function scoreRecord(record: LiftRecord, standards: Standards | null) {
  if (!standards) return null;
  const table = standards.tables.find(
    (t) =>
      t.exerciseId === record.exerciseId &&
      t.comparisonGroup === record.comparisonGroup &&
      (t.ageMin === null || (record.age !== null && record.age >= t.ageMin)) &&
      (t.ageMax === null || (record.age !== null && record.age <= t.ageMax)),
  );
  if (!table) return null;
  const bw = record.bodyweightKg;
  if (bw < table.rows[0].bodyweightKg || bw > table.rows.at(-1)!.bodyweightKg)
    return null;
  const upper = table.rows.find((r) => r.bodyweightKg >= bw)!;
  const lower = [...table.rows].reverse().find((r) => r.bodyweightKg <= bw)!;
  const ratio =
    upper.bodyweightKg === lower.bodyweightKg
      ? 0
      : (bw - lower.bodyweightKg) / (upper.bodyweightKg - lower.bodyweightKg);
  const thresholds = lower.thresholdsKg.map(
    (v, i) => v + ratio * (upper.thresholdsKg[i] - v),
  );
  const value = estimatedMax(record.weightKg, record.reps);
  let index = -1;
  thresholds.forEach((v, i) => {
    if (value >= v) index = i;
  });
  return {
    label: index < 0 ? "Below beginner" : tiers[index],
    index,
    thresholds,
    next:
      index < 4
        ? {
            tier: tiers[index + 1],
            weightKg: thresholds[index + 1],
            gapKg: thresholds[index + 1] - value,
          }
        : null,
    source: standards.source,
    ageAdjusted: table.ageMin !== null || table.ageMax !== null,
  };
}
export function validateStandards(input: unknown): Standards {
  const data = standardsSchema.parse(input);
  const keys = new Set<string>();
  for (const table of data.tables) {
    if (!exerciseById[table.exerciseId])
      throw new Error(`Unknown exercise: ${table.exerciseId}`);
    if (
      table.ageMin !== null &&
      table.ageMax !== null &&
      table.ageMin > table.ageMax
    )
      throw new Error("Age ranges must be ordered.");
    const key = `${table.exerciseId}:${table.comparisonGroup}:${table.ageMin}:${table.ageMax}`;
    if (keys.has(key)) throw new Error("Duplicate standards table.");
    keys.add(key);
    if (
      data.tables.some(
        (other) =>
          other !== table &&
          other.exerciseId === table.exerciseId &&
          other.comparisonGroup === table.comparisonGroup &&
          (other.ageMin ?? 13) <= (table.ageMax ?? 110) &&
          (table.ageMin ?? 13) <= (other.ageMax ?? 110),
      )
    ) {
      throw new Error(
        "Standards age ranges must not overlap for the same exercise and comparison group.",
      );
    }
    table.rows.forEach((row, i) => {
      if (i && row.bodyweightKg <= table.rows[i - 1].bodyweightKg)
        throw new Error("Bodyweight rows must increase.");
      row.thresholdsKg.forEach((value, j) => {
        if (j && value <= row.thresholdsKg[j - 1])
          throw new Error("Tier thresholds must increase.");
      });
    });
  }
  return data;
}
