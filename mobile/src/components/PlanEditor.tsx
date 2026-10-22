import { useState } from "react";
import { Pressable, View } from "react-native";
import { useStore } from "../state/AppStore";
import { exerciseById, weekdays } from "../data/catalog";
import { newPlanExercise, uid, validatePlan } from "../domain/plans";
import { fmt, fromUnit, parseNumber, toUnit } from "../domain/strength";
import type { Plan, PlanExercise } from "../domain/schema";
import { ExercisePicker } from "./ExercisePicker";
import {
  Button,
  C,
  Chip,
  ErrorText,
  Field,
  Icon,
  Screen,
  Segmented,
  T,
  ui,
} from "./ui";

export function PlanEditor({
  initialPlan,
  onSave,
  onCancel,
  busy = false,
}: {
  initialPlan: Plan;
  onSave: (plan: Plan) => Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}) {
  const { data } = useStore();
  const [loadText, setLoadText] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Plan>(() =>
      JSON.parse(JSON.stringify(initialPlan)),
    ),
    [selectedDay, setSelectedDay] = useState(0),
    [mode, setMode] = useState("guided"),
    [picker, setPicker] = useState(false),
    [error, setError] = useState<string | null>(null);
  const day = draft.days[Math.min(selectedDay, draft.days.length - 1)],
    unit = data.profile.unit;
  const updateDay = (changes: Partial<typeof day>) =>
    setDraft((current) => ({
      ...current,
      days: current.days.map((d) =>
        d.id === day.id ? { ...d, ...changes } : d,
      ),
    }));
  const updateExercise = (index: number, changes: Partial<PlanExercise>) =>
    updateDay({
      exercises: day.exercises.map((item, i) =>
        i === index ? { ...item, ...changes } : item,
      ),
    });
  const number = (text: string) => parseNumber(text) || 0;
  async function save() {
    try {
      setError(null);
      await onSave(validatePlan(draft));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save plan.");
    }
  }
  return (
    <Screen
      title="TUNE PLAN"
      bottomPadding={35}
      actions={
        <Button kind="ghost" onPress={onCancel}>
          Cancel
        </Button>
      }
    >
      <Field
        label="PLAN NAME"
        value={draft.name}
        onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
      />
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "guided", label: "GUIDED" },
          { value: "advanced", label: "ADVANCED" },
        ]}
      />
      <View style={[ui.wrap, { marginVertical: 18 }]}>
        {draft.days.map((d, i) => (
          <Chip
            key={d.id}
            selected={day.id === d.id}
            label={`${weekdays[d.weekday]} · ${d.name}`}
            onPress={() => setSelectedDay(i)}
          />
        ))}
      </View>
      <Field
        label="DAY NAME"
        value={day.name}
        onChangeText={(name) => updateDay({ name })}
      />
      <View style={[ui.wrap, { marginBottom: 18 }]}>
        {weekdays.map((label, i) => (
          <Chip
            key={`${label}-${i}`}
            small
            selected={day.weekday === i}
            label={label}
            onPress={() => {
              if (draft.days.some((d) => d.id !== day.id && d.weekday === i)) {
                setError("Another session already uses this weekday.");
                return;
              }
              updateDay({ weekday: i });
            }}
          />
        ))}
      </View>
      {day.exercises.map((item, index) => {
        const ex = exerciseById[item.exerciseId];
        return (
          <View
            key={`${item.exerciseId}-${index}`}
            style={{
              backgroundColor: C.surface,
              borderRadius: 14,
              padding: 15,
              marginBottom: 12,
              gap: 10,
            }}
          >
            <View style={ui.row}>
              <T kind="bold" style={{ flex: 1, fontSize: 14 }}>
                {index + 1}. {ex.name}
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${ex.name}`}
                onPress={() =>
                  updateDay({
                    exercises: day.exercises.filter((_, i) => i !== index),
                  })
                }
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 9 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="SETS"
                  value={String(item.sets)}
                  selectTextOnFocus
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    updateExercise(index, { sets: number(text) })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="REPS MIN"
                  value={String(item.repsMin)}
                  selectTextOnFocus
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    updateExercise(index, { repsMin: number(text) })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="REPS MAX"
                  value={String(item.repsMax)}
                  selectTextOnFocus
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    updateExercise(index, { repsMax: number(text) })
                  }
                />
              </View>
            </View>
            <Field
              label={`PLANNED LOAD (${unit.toUpperCase()})`}
              value={
                loadText[`${day.id}-${index}`] ??
                (item.weightKg ? fmt(toUnit(item.weightKg, unit), 2) : "")
              }
              placeholder="Not set"
              keyboardType="decimal-pad"
              onBlur={() =>
                setLoadText((current) => {
                  const next = { ...current };
                  delete next[`${day.id}-${index}`];
                  return next;
                })
              }
              onChangeText={(text) => {
                setLoadText((current) => ({
                  ...current,
                  [`${day.id}-${index}`]: text,
                }));
                updateExercise(index, {
                  weightKg: fromUnit(number(text), unit),
                });
              }}
            />
            {mode === "advanced" ? (
              <>
                <Field
                  label="REST BETWEEN SETS (SECONDS)"
                  value={String(item.restSeconds)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  onChangeText={(text) =>
                    updateExercise(index, { restSeconds: number(text) })
                  }
                />
                <View style={ui.row}>
                  <Button
                    kind="ghost"
                    disabled={index === 0}
                    onPress={() => {
                      const next = [...day.exercises];
                      [next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ];
                      updateDay({ exercises: next });
                    }}
                  >
                    Move up
                  </Button>
                  <Button
                    kind="ghost"
                    disabled={index === day.exercises.length - 1}
                    onPress={() => {
                      const next = [...day.exercises];
                      [next[index], next[index + 1]] = [
                        next[index + 1],
                        next[index],
                      ];
                      updateDay({ exercises: next });
                    }}
                  >
                    Move down
                  </Button>
                </View>
              </>
            ) : null}
          </View>
        );
      })}
      <Button kind="secondary" onPress={() => setPicker(true)}>
        + Add exercise
      </Button>
      {mode === "advanced" ? (
        <View style={[ui.row, { marginVertical: 14, flexWrap: "wrap" }]}>
          <Button
            kind="ghost"
            disabled={draft.days.length === 7}
            onPress={() => {
              const weekday = weekdays.findIndex(
                (_, i) => !draft.days.some((d) => d.weekday === i),
              );
              if (weekday < 0) return;
              setDraft((current) => ({
                ...current,
                days: [
                  ...current.days,
                  {
                    id: uid(),
                    name: "New session",
                    weekday,
                    exercises: [newPlanExercise("bench", data.profile.goal)],
                  },
                ],
              }));
              setSelectedDay(draft.days.length);
            }}
          >
            + Add day
          </Button>
          <Button
            kind="ghost"
            disabled={draft.days.length === 1}
            onPress={() => {
              setDraft((current) => ({
                ...current,
                days: current.days.filter((d) => d.id !== day.id),
              }));
              setSelectedDay(0);
            }}
          >
            Remove this day
          </Button>
        </View>
      ) : null}
      <T
        style={{
          fontSize: 12,
          color: C.secondary,
          lineHeight: 20,
          marginTop: 18,
          marginBottom: 12,
        }}
      >
        Load is optional until you set it. This is a plan, not a workout log.
        Nothing is saved until you confirm below.
      </T>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        onPress={() => {
          void save();
        }}
        loading={busy}
      >
        SAVE PLAN
      </Button>
      <ExercisePicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(id) =>
          updateDay({
            exercises: [
              ...day.exercises,
              newPlanExercise(id, data.profile.goal),
            ],
          })
        }
      />
    </Screen>
  );
}
