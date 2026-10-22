import type { Muscle } from "../domain/schema";

export const muscleNames: Record<Muscle, string> = {
  pectorals: "Chest",
  front_delts: "Front delts",
  side_delts: "Side delts",
  rear_delts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  traps: "Traps",
  upper_back: "Upper back",
  middle_back: "Mid back",
  lats: "Lats",
  lower_back: "Lower back",
  quadriceps: "Quads",
  inner_thighs: "Adductors",
  shins: "Shins",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calves: "Calves",
};
export type Exercise = {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: string;
  type: "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";
  step: number;
};
const e = (
  id: string,
  name: string,
  primary: Muscle[],
  secondary: Muscle[],
  equipment: string,
  type: Exercise["type"],
  step = 2.5,
): Exercise => ({ id, name, primary, secondary, equipment, type, step });
export const exercises: Exercise[] = [
  e(
    "bench",
    "Bench press",
    ["pectorals"],
    ["triceps", "front_delts"],
    "Barbell",
    "barbell",
  ),
  e(
    "squat",
    "Back squat",
    ["quadriceps"],
    ["glutes", "abs"],
    "Barbell",
    "barbell",
  ),
  e(
    "deadlift",
    "Deadlift",
    ["hamstrings", "glutes"],
    ["lower_back", "traps"],
    "Barbell",
    "barbell",
  ),
  e(
    "ohp",
    "Overhead press",
    ["front_delts"],
    ["triceps", "side_delts"],
    "Barbell",
    "barbell",
  ),
  e("ez-curl", "EZ-bar curl", ["biceps"], ["forearms"], "Barbell", "barbell"),
  e(
    "incline-curl",
    "Incline dumbbell curl",
    ["biceps"],
    ["forearms"],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e(
    "close-bench",
    "Close-grip bench press",
    ["triceps"],
    ["pectorals"],
    "Barbell",
    "barbell",
  ),
  e(
    "overhead-extension",
    "Overhead cable extension",
    ["triceps"],
    [],
    "Cables",
    "cable",
  ),
  e(
    "hammer-curl",
    "Hammer curl",
    ["forearms", "biceps"],
    [],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e(
    "reverse-curl",
    "Reverse-grip curl",
    ["forearms"],
    ["biceps"],
    "Barbell",
    "barbell",
  ),
  e("pushdown", "Cable pushdown", ["triceps"], [], "Cables", "cable"),
  e(
    "incline-press",
    "Incline dumbbell press",
    ["pectorals"],
    ["front_delts", "triceps"],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e(
    "db-press",
    "Dumbbell bench press",
    ["pectorals"],
    ["triceps", "front_delts"],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e(
    "lateral-raise",
    "Lateral raise",
    ["side_delts"],
    [],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e(
    "face-pull",
    "Face pull",
    ["rear_delts", "upper_back"],
    [],
    "Cables",
    "cable",
  ),
  e(
    "pullup",
    "Pull-up",
    ["lats"],
    ["biceps", "middle_back"],
    "Pull-up bar",
    "bodyweight",
  ),
  e(
    "row",
    "Chest-supported row",
    ["middle_back", "upper_back"],
    ["biceps", "lats"],
    "Dumbbells",
    "dumbbell",
    1,
  ),
  e("pulldown", "Lat pulldown", ["lats"], ["biceps"], "Cables", "cable"),
  e(
    "cable-row",
    "Seated cable row",
    ["middle_back"],
    ["lats", "biceps"],
    "Cables",
    "cable",
  ),
  e("shrug", "Barbell shrug", ["traps"], [], "Barbell", "barbell"),
  e(
    "rdl",
    "Romanian deadlift",
    ["hamstrings", "glutes"],
    ["lower_back"],
    "Barbell",
    "barbell",
  ),
  e("hip-thrust", "Hip thrust", ["glutes"], [], "Barbell", "barbell"),
  e(
    "leg-press",
    "Leg press",
    ["quadriceps"],
    ["glutes"],
    "Machines",
    "machine",
    5,
  ),
  e("leg-curl", "Leg curl", ["hamstrings"], [], "Machines", "machine"),
  e(
    "leg-extension",
    "Leg extension",
    ["quadriceps"],
    [],
    "Machines",
    "machine",
  ),
  e("calf", "Standing calf raise", ["calves"], [], "Machines", "machine"),
  e("crunch", "Cable crunch", ["abs"], [], "Cables", "cable"),
  e("woodchop", "Cable woodchop", ["obliques"], ["abs"], "Cables", "cable"),
  e(
    "back-extension",
    "Back extension",
    ["lower_back"],
    ["glutes"],
    "Machines",
    "machine",
  ),
  e("adductor", "Hip adduction", ["inner_thighs"], [], "Machines", "machine"),
  e("tibialis", "Tibialis raise", ["shins"], [], "Bodyweight", "bodyweight", 1),
  e(
    "pushup",
    "Push-up",
    ["pectorals"],
    ["triceps", "front_delts"],
    "Bodyweight",
    "bodyweight",
    1,
  ),
];
export const exerciseById = Object.fromEntries(
  exercises.map((x) => [x.id, x]),
) as Record<string, Exercise>;
export function exercise(id: string) {
  return exerciseById[id];
}
export const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const muscleGroups = [
  {
    id: "arms",
    name: "Arms",
    muscles: ["biceps", "triceps", "forearms"] as Muscle[],
  },
  { id: "chest", name: "Chest", muscles: ["pectorals"] as Muscle[] },
  {
    id: "shoulders",
    name: "Shoulders",
    muscles: ["front_delts", "side_delts", "rear_delts"] as Muscle[],
  },
  {
    id: "back",
    name: "Back",
    muscles: [
      "traps",
      "upper_back",
      "middle_back",
      "lats",
      "lower_back",
    ] as Muscle[],
  },
  {
    id: "legs",
    name: "Legs",
    muscles: [
      "quadriceps",
      "glutes",
      "hamstrings",
      "inner_thighs",
      "calves",
      "shins",
    ] as Muscle[],
  },
  { id: "core", name: "Core", muscles: ["abs", "obliques"] as Muscle[] },
];
export function groupForMuscle(id: Muscle) {
  return muscleGroups.find((g) => g.muscles.includes(id))!;
}
