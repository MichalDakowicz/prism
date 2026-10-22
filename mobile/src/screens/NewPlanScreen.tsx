import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "../state/AppStore";
import { Anatomy } from "../components/Anatomy";
import { PlanEditor } from "../components/PlanEditor";
import {
  Button,
  C,
  Chip,
  ErrorText,
  Icon,
  Screen,
  SectionLabel,
  Segmented,
  T,
  ui,
} from "../components/ui";
import { exercises, muscleNames, weekdays } from "../data/catalog";
import { muscleIds, type Muscle, type Plan } from "../domain/schema";
import { guidedPlan, savePlan, splitNames, type Split } from "../domain/plans";

export default function NewPlanScreen() {
  const { muscles } = useLocalSearchParams<{ muscles?: string }>(),
    { data, commit, saving, notify, setCoachSeed } = useStore(),
    router = useRouter();
  const [selected, setSelected] = useState<Muscle[]>(() =>
    muscles
      ? muscles
          .split(",")
          .filter((id): id is Muscle => muscleIds.includes(id as Muscle))
      : ["biceps", "triceps", "forearms"],
  );
  const [mode, setMode] = useState("muscles"),
    [side, setSide] = useState<"front" | "back">("front"),
    [split, setSplit] = useState<Split>("arms"),
    [days, setDays] = useState(data.profile.daysPerWeek),
    [added, setAdded] = useState<string[]>([]),
    [draft, setDraft] = useState<Plan | null>(null),
    [error, setError] = useState<string | null>(null);
  const eligible = useMemo(
    () =>
      exercises.filter(
        (ex) =>
          ex.primary.some((m) => selected.includes(m)) &&
          (ex.equipment === "Bodyweight" ||
            data.profile.equipment.includes(ex.equipment)),
      ),
    [selected, data.profile.equipment],
  );
  function toggleMuscle(id: Muscle) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    setAdded((current) =>
      current.filter((exId) =>
        exercises
          .find((ex) => ex.id === exId)
          ?.primary.some((m) => next.includes(m)),
      ),
    );
  }
  function next() {
    try {
      setError(null);
      if (mode === "muscles" && !added.length)
        throw new Error("Add at least one exercise for your selected muscles.");
      setDraft(
        guidedPlan(
          { ...data.profile, daysPerWeek: days },
          split,
          mode === "muscles" ? selected : [],
          mode === "muscles" ? added : undefined,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare draft.");
    }
  }
  if (draft)
    return (
      <PlanEditor
        initialPlan={draft}
        busy={saving}
        onCancel={() => setDraft(null)}
        onSave={async (plan) => {
          await commit((current) => savePlan(current, plan));
          notify("Training plan saved.");
          router.replace("/plans");
        }}
      />
    );
  return (
    <Screen title="NEW PLAN" back bottomPadding={35}>
      <T kind="label" style={{ color: C.secondary, marginBottom: 17 }}>
        STEP 1 OF 2 · SELECT, THEN TUNE
      </T>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "muscles", label: "FROM MUSCLES" },
          { value: "split", label: "FROM A SPLIT" },
        ]}
      />
      {mode === "muscles" ? (
        <>
          <View style={{ alignItems: "flex-end", marginTop: 17 }}>
            <Segmented
              value={side}
              onChange={setSide}
              options={[
                { value: "front", label: "FRONT" },
                { value: "back", label: "BACK" },
              ]}
            />
          </View>
          <Anatomy
            side={side}
            focusOnly
            selected={selected}
            onSelect={toggleMuscle}
            height={330}
            width={185}
          />
          <T kind="label" style={{ color: C.secondary, marginVertical: 10 }}>
            TAP THE BODY · {selected.length} SELECTED
          </T>
          <View style={ui.wrap}>
            {selected.map((id) => (
              <Chip
                key={id}
                selected
                small
                label={`${muscleNames[id]} ×`}
                onPress={() => toggleMuscle(id)}
              />
            ))}
          </View>
          <SectionLabel>OR SELECT A MUSCLE</SectionLabel>
          <View style={ui.wrap}>
            {muscleIds
              .filter((id) => !selected.includes(id))
              .map((id) => (
                <Chip
                  key={id}
                  small
                  label={muscleNames[id]}
                  onPress={() => toggleMuscle(id)}
                />
              ))}
          </View>
          <SectionLabel>EXERCISES · {added.length} ADDED</SectionLabel>
          {!eligible.length ? (
            <T style={{ color: C.secondary, lineHeight: 22 }}>
              Choose muscles and check available equipment in Profile.
            </T>
          ) : (
            eligible.map((ex) => {
              const on = added.includes(ex.id),
                avoided = data.profile.avoidedExercises.some(
                  (x) => x.toLowerCase() === ex.name.toLowerCase(),
                );
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  key={ex.id}
                  onPress={() =>
                    setAdded((current) =>
                      on
                        ? current.filter((id) => id !== ex.id)
                        : [...current, ex.id],
                    )
                  }
                  style={{
                    minHeight: 65,
                    padding: 12,
                    marginBottom: 7,
                    borderRadius: 12,
                    backgroundColor: on ? "#17170F" : C.inset,
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, gap: 5 }}>
                    <T kind="bold" style={{ fontSize: 13 }}>
                      {ex.name}
                    </T>
                    <T
                      kind="label"
                      style={{
                        fontSize: 9,
                        color: avoided ? C.red : C.secondary,
                      }}
                    >
                      {avoided
                        ? "ON YOUR AVOID LIST"
                        : ex.primary
                            .map((m) => muscleNames[m])
                            .join(" · ")
                            .toUpperCase()}
                    </T>
                  </View>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: on ? C.accent : C.raised,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={on ? "check" : "plus"}
                      size={17}
                      color={on ? C.bg : C.text}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </>
      ) : (
        <>
          <SectionLabel>CHOOSE YOUR SPLIT</SectionLabel>
          {(Object.keys(splitNames) as Split[]).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ checked: split === key }}
              onPress={() => setSplit(key)}
              style={{
                padding: 17,
                borderRadius: 14,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: split === key ? C.accent : "transparent",
                marginBottom: 10,
              }}
            >
              <T kind="title" style={{ fontSize: 27 }}>
                {splitNames[key].toUpperCase()}
              </T>
              <T style={{ fontSize: 12, color: C.secondary, marginTop: 5 }}>
                Editable starting template · {days} days / week
              </T>
            </Pressable>
          ))}
        </>
      )}
      <SectionLabel>DAYS / WEEK</SectionLabel>
      <View style={ui.wrap}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Chip
            key={n}
            label={String(n)}
            selected={days === n}
            onPress={() => setDays(n)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 5, marginTop: 13 }}>
        {weekdays.map((day, i) => (
          <View
            key={`${day}-${i}`}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 7,
              backgroundColor: Array.from({ length: days }, (_, x) =>
                Math.floor((x * 7) / days),
              ).includes(i)
                ? C.accent
                : C.surface,
            }}
          >
            <T
              kind="label"
              style={{
                fontSize: 9,
                color: Array.from({ length: days }, (_, x) =>
                  Math.floor((x * 7) / days),
                ).includes(i)
                  ? C.bg
                  : C.secondary,
              }}
            >
              {day.slice(0, 1)}
            </T>
          </View>
        ))}
      </View>
      <T
        style={{
          fontSize: 11,
          color: C.secondary,
          lineHeight: 19,
          marginTop: 13,
        }}
      >
        Templates respect equipment and your avoid list. Tune loads,
        repetitions, exercises, rest, and weekdays in the next step.
      </T>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <View style={{ gap: 10, marginTop: 22 }}>
        <Button onPress={next}>NEXT · TUNE YOUR PLAN</Button>
        <Button
          kind="secondary"
          onPress={() => {
            setCoachSeed(
              mode === "muscles"
                ? `Create a ${days}-day editable training plan focused on ${selected.map((m) => muscleNames[m]).join(", ")}. ${added.length ? `Use these selected exercises where appropriate: ${added.map((id) => exercises.find((e) => e.id === id)!.name).join(", ")}.` : ""} Prepare a full proposal for my confirmation.`
                : `Create a ${days}-day ${splitNames[split]} plan using my profile and equipment. Prepare a full plan proposal for my confirmation.`,
            );
            router.push("/coach");
          }}
        >
          Ask Coach to draft this plan ↗
        </Button>
      </View>
    </Screen>
  );
}
