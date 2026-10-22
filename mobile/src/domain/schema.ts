import { z } from "zod";
import { plateSizes, totalLoad } from "./plates";
import { fitnessVoltCacheSchema } from "./fitnessVoltSchema";
import { videoAttachmentSchema } from "./video";

export const muscleIds = [
  "pectorals",
  "front_delts",
  "side_delts",
  "rear_delts",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "traps",
  "upper_back",
  "middle_back",
  "lats",
  "lower_back",
  "quadriceps",
  "inner_thighs",
  "shins",
  "glutes",
  "hamstrings",
  "calves",
] as const;
export type Muscle = (typeof muscleIds)[number];
export const unitSchema = z.enum(["kg", "lb"]);
export type Unit = z.infer<typeof unitSchema>;
const id = z.string().min(1).max(120);
const short = z.string().max(160);
const number = z.number().finite();

export const profileSchema = z
  .object({
    bodyweightKg: number.positive().max(500).nullable(),
    age: number.int().min(13).max(110).nullable(),
    comparisonGroup: z.enum(["male", "female"]).nullable(),
    unit: unitSchema,
    goal: z.enum(["strength", "size", "both"]),
    daysPerWeek: number.int().min(1).max(7),
    sessionMinutes: number.int().min(10).max(240),
    experienceYears: number.min(0).max(80).nullable(),
    equipment: z.array(z.string().max(60)).max(30),
    preferredExercises: z.array(short).max(50),
    avoidedExercises: z.array(short).max(50),
    constraints: z.string().max(2000),
    restNote: z.string().max(2000),
    plateStyle: z.enum(["color", "black"]),
    strengthScoreSource: z.enum(["gym", "competition"]).default("competition"),
    healthEnabled: z.boolean(),
    shareRest: z.boolean(),
    geminiModel: z.string().min(1).max(120),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;

export const plateLoadSchema = z
  .object({
    barKg: z.union([z.literal(15), z.literal(20)]),
    pairsKg: z
      .array(
        number.refine(
          (p) => plateSizes.some((size) => size === p),
          "Unsupported plate size.",
        ),
      )
      .max(24)
      .optional(),
  })
  .strict();

export const recordSchema = z
  .object({
    id,
    exerciseId: id,
    weightKg: number.positive().max(1500),
    reps: number.int().min(1).max(12),
    bodyweightKg: number.positive().max(500),
    date: z.iso.datetime(),
    createdAt: z.iso.datetime(),
    age: number.int().min(13).max(110).nullable(),
    comparisonGroup: z.enum(["male", "female"]).nullable(),
    archivedAt: z.iso.datetime().nullable(),
    note: z.string().max(1000),
    plateLoad: plateLoadSchema.optional(),
    video: videoAttachmentSchema.optional(),
  })
  .strict()
  .refine(
    (record) =>
      !record.plateLoad?.pairsKg ||
      Math.abs(
        totalLoad(record.plateLoad.pairsKg, record.plateLoad.barKg) -
          record.weightKg,
      ) <= 0.01,
    "Saved plates must match the recorded load.",
  );
export type LiftRecord = z.infer<typeof recordSchema>;

export const planExerciseSchema = z
  .object({
    exerciseId: id,
    sets: number.int().min(1).max(12),
    repsMin: number.int().min(1).max(100),
    repsMax: number.int().min(1).max(100),
    weightKg: number.min(0).max(1500),
    restSeconds: number.int().min(0).max(900),
  })
  .strict()
  .refine(
    (x) => x.repsMax >= x.repsMin,
    "Maximum reps must be at least minimum reps.",
  );
export type PlanExercise = z.infer<typeof planExerciseSchema>;
export const planDaySchema = z
  .object({
    id,
    name: z.string().min(1).max(80),
    weekday: number.int().min(0).max(6),
    exercises: z.array(planExerciseSchema).min(1).max(20),
  })
  .strict();
export type PlanDay = z.infer<typeof planDaySchema>;
export const planSchema = z
  .object({
    id,
    name: z.string().min(1).max(100),
    revision: number.int().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    days: z.array(planDaySchema).min(1).max(7),
    focus: z.array(z.enum(muscleIds)).max(muscleIds.length),
  })
  .strict()
  .refine(
    (x) => new Set(x.days.map((d) => d.weekday)).size === x.days.length,
    "Use each weekday once.",
  );
export type Plan = z.infer<typeof planSchema>;

export const tiers = [
  "Beginner",
  "Novice",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;
export const standardsTableSchema = z
  .object({
    id,
    exerciseId: id,
    comparisonGroup: z.enum(["male", "female"]),
    ageMin: number.int().min(13).max(110).nullable(),
    ageMax: number.int().min(13).max(110).nullable(),
    rows: z
      .array(
        z
          .object({
            bodyweightKg: number.positive().max(500),
            thresholdsKg: z.tuple([
              number.positive(),
              number.positive(),
              number.positive(),
              number.positive(),
              number.positive(),
            ]),
          })
          .strict(),
      )
      .min(2)
      .max(200),
  })
  .strict();
export const standardsSchema = z
  .object({
    version: z.literal(1),
    source: z.string().min(1).max(200),
    sourceUrl: z.url().nullable(),
    tables: z.array(standardsTableSchema).min(1).max(1000),
  })
  .strict();
export type Standards = z.infer<typeof standardsSchema>;

export const messageSchema = z
  .object({
    id,
    role: z.enum(["user", "model"]),
    text: z.string().max(20000),
    date: z.iso.datetime(),
  })
  .strict();
export type ChatMessage = z.infer<typeof messageSchema>;
export const appDataSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema,
    records: z.array(recordSchema).max(10000),
    plans: z.array(planSchema).max(100),
    selectedPlanId: id.nullable(),
    planHistory: z.array(planSchema).max(30),
    standards: standardsSchema.nullable(),
    messages: z.array(messageSchema).max(150),
    fitnessVolt: z.array(fitnessVoltCacheSchema).max(300).default([]),
  })
  .strict();
export type AppData = z.infer<typeof appDataSchema>;

export const defaultProfile: Profile = {
  bodyweightKg: null,
  age: null,
  comparisonGroup: null,
  unit: "kg",
  goal: "both",
  daysPerWeek: 4,
  sessionMinutes: 55,
  experienceYears: null,
  equipment: ["Barbell", "Dumbbells", "Cables", "Machines", "Pull-up bar"],
  preferredExercises: [],
  avoidedExercises: [],
  constraints: "",
  restNote: "",
  plateStyle: "color",
  strengthScoreSource: "competition",
  healthEnabled: false,
  shareRest: false,
  geminiModel: "gemini-3.8-flash",
};
export function emptyData(): AppData {
  return {
    version: 1,
    profile: { ...defaultProfile },
    records: [],
    plans: [],
    selectedPlanId: null,
    planHistory: [],
    standards: null,
    messages: [],
    fitnessVolt: [],
  };
}

export const coachReplySchema = z
  .object({
    reply: z.string().min(1).max(12000),
    proposal: z
      .object({
        summary: z.string().min(1).max(1500),
        name: z.string().min(1).max(100),
        days: z
          .array(
            z
              .object({
                name: z.string().min(1).max(80),
                weekday: number.int().min(0).max(6),
                exercises: z.array(planExerciseSchema).min(1).max(20),
              })
              .strict(),
          )
          .min(1)
          .max(7),
        focus: z.array(z.enum(muscleIds)).max(muscleIds.length),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type CoachReply = z.infer<typeof coachReplySchema>;
export type Proposal = NonNullable<CoachReply["proposal"]> & {
  basePlanId: string | null;
  baseRevision: number | null;
};
