import {
  fitnessVoltCacheSchema,
  fitnessVoltKey,
  fitnessVoltResponseSchema,
  type FitnessVoltInput,
  type FitnessVoltResult,
} from "../domain/fitnessVolt";

export async function fetchFitnessVolt(
  input: FitnessVoltInput,
  signal?: AbortSignal,
): Promise<FitnessVoltResult> {
  const params = new URLSearchParams({
    lift: input.lift,
    sex: input.sex,
    bw: input.bodyweightKg.toFixed(4),
    e1rm: input.e1rmKg.toFixed(4),
    unit: "kg",
  });
  if (input.age !== null) params.set("age", String(input.age));
  let response: Response;
  try {
    response = await fetch(
      `https://fitnessvolt.com/wp-json/rpe-training/v1/public/rank?${params}`,
      { signal: signal ?? AbortSignal.timeout(25000) },
    );
  } catch {
    throw new Error(
      signal?.aborted
        ? "Lookup stopped."
        : "Could not reach FitnessVolt. Your PR is saved; try again when connected.",
    );
  }
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "FitnessVolt is rate limiting requests. Try again later; saved comparisons remain available."
        : `FitnessVolt lookup failed (HTTP ${response.status}). Your PR has not changed.`,
    );
  const parsed = fitnessVoltResponseSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error(
      "FitnessVolt returned an unsupported result. Your PR has not changed.",
    );
  const result = parsed.data;
  if (
    result.lift !== input.lift ||
    result.sex !== input.sex ||
    Math.abs(result.bodyweight - input.bodyweightKg) > 0.1 ||
    Math.abs(result.e1rm - input.e1rmKg) > 0.1
  )
    throw new Error(
      "FitnessVolt returned a different comparison. Nothing was saved.",
    );
  if (!result.verified && !result.gym)
    throw new Error(
      "No sufficiently sized comparison cohort is available for this lift.",
    );
  if (
    (result.verified &&
      result.verified.population !== "verified_competition") ||
    (result.gym && result.gym.population !== "self_reported_gym")
  )
    throw new Error(
      "FitnessVolt returned inconsistent population labels. Nothing was saved.",
    );
  if (
    (result.score_source === "verified_competition" && !result.verified) ||
    (result.score_source === "self_reported_gym" && !result.gym)
  )
    throw new Error(
      "FitnessVolt score source is unavailable. Nothing was saved.",
    );
  return fitnessVoltCacheSchema.parse({
    key: fitnessVoltKey(input),
    recordId: input.recordId,
    fetchedAt: new Date().toISOString(),
    lift: input.lift,
    sex: input.sex,
    bodyweightKg: input.bodyweightKg,
    e1rmKg: input.e1rmKg,
    age: input.age,
    score: result.fv_score,
    tier: result.tier,
    population: result.score_source,
    verified: result.verified,
    gym: result.gym,
  });
}
