import { z } from "zod";
const population = z.enum(["verified_competition", "self_reported_gym"]);
const cohort = z.object({
  percentile: z.number().finite().min(0).max(100),
  sample_size: z.number().int().positive(),
  population,
  source: z.string().min(1).max(120),
});
export const fitnessVoltResponseSchema = z.object({
  success: z.literal(true),
  lift: z.string(),
  sex: z.enum(["male", "female"]),
  unit: z.literal("kg"),
  bodyweight: z.number().positive(),
  e1rm: z.number().positive(),
  fv_score: z.number().finite().min(0).max(100).nullable(),
  tier: z.string().max(80).nullable(),
  score_source: population.nullable(),
  verified: cohort.nullable(),
  gym: cohort.nullable(),
  attribution: z.object({
    text: z.string().min(1),
    url: z.url(),
    license: z.string().min(1),
  }),
});
export const fitnessVoltCacheSchema = z
  .object({
    key: z.string().min(1).max(250),
    recordId: z.string().min(1).max(120),
    fetchedAt: z.iso.datetime(),
    lift: z.string().max(80),
    sex: z.enum(["male", "female"]),
    bodyweightKg: z.number().positive(),
    e1rmKg: z.number().positive(),
    age: z.number().int().min(13).max(110).nullable(),
    score: z.number().finite().min(0).max(100).nullable(),
    tier: z.string().max(80).nullable(),
    population: population.nullable(),
    verified: cohort.nullable(),
    gym: cohort.nullable(),
  })
  .strict();
export type FitnessVoltResult = z.infer<typeof fitnessVoltCacheSchema>;
