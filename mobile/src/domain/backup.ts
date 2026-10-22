import { appDataSchema, type AppData } from "./schema";
import { validatePlan } from "./plans";
import { validateStandards } from "./strength";
import { exerciseById } from "../data/catalog";

export function validateBackup(input: unknown): AppData {
  const parsed = appDataSchema.parse(input);
  for (const record of parsed.records) {
    if (!exerciseById[record.exerciseId])
      throw new Error("Backup contains an unknown exercise.");
    if (record.plateLoad && exerciseById[record.exerciseId].type !== "barbell")
      throw new Error("Plate layouts can only belong to barbell records.");
  }
  parsed.plans.forEach(validatePlan);
  parsed.planHistory.forEach(validatePlan);
  if (parsed.standards) validateStandards(parsed.standards);
  if (
    new Set(parsed.records.map((x) => x.id)).size !== parsed.records.length ||
    new Set(parsed.plans.map((x) => x.id)).size !== parsed.plans.length
  ) {
    throw new Error("Backup contains duplicate identifiers.");
  }
  if (
    parsed.selectedPlanId &&
    !parsed.plans.some((p) => p.id === parsed.selectedPlanId)
  ) {
    parsed.selectedPlanId = parsed.plans[0]?.id ?? null;
  }
  return parsed;
}
