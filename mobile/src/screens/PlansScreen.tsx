import { useState } from "react";
import { Pressable, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useStore } from "../state/AppStore";
import { exerciseById, weekdays } from "../data/catalog";
import { Anatomy } from "../components/Anatomy";
import {
  Button,
  C,
  Card,
  Chip,
  Empty,
  ErrorText,
  IconButton,
  Screen,
  SectionLabel,
  Sheet,
  T,
  ui,
} from "../components/ui";
import {
  estimatedDuration,
  savePlan,
  tuneDay,
  undoPlan,
  type Tuning,
} from "../domain/plans";
import { fmt, toUnit } from "../domain/strength";
const neutral: Tuning = { load: 0, volume: 0, choice: 0, length: 0 };

export default function PlansScreen() {
  const { data, commit, saving, notify, setCoachSeed } = useStore(),
    router = useRouter();
  const [dayIndex, setDayIndex] = useState(0),
    [pick, setPick] = useState(false),
    [tuning, setTuning] = useState(false),
    [tune, setTune] = useState<Tuning>(neutral),
    [error, setError] = useState<string | null>(null);
  const plan =
      data.plans.find((x) => x.id === data.selectedPlanId) ?? data.plans[0],
    day = plan?.days[Math.min(dayIndex, plan.days.length - 1)],
    unit = data.profile.unit;
  const preview = day ? tuneDay(day.exercises, tune, data.profile) : [];
  const changed = Object.values(tune).some((v) => v !== 0);
  const controls: {
    key: keyof Tuning;
    label: string;
    min: number;
    max: number;
    value: string;
  }[] = [
    {
      key: "load",
      label: "LOAD",
      min: -2,
      max: 2,
      value:
        tune.load === 0
          ? "As planned"
          : `${tune.load > 0 ? "+" : ""}${tune.load * 5}%`,
    },
    {
      key: "volume",
      label: "SETS / REPS",
      min: -1,
      max: 2,
      value:
        tune.volume === 0
          ? "As planned"
          : `${tune.volume > 0 ? "+" : ""}${tune.volume} set each`,
    },
    {
      key: "choice",
      label: "EXERCISE CHOICE",
      min: -1,
      max: 1,
      value:
        tune.choice === 0
          ? "As planned"
          : tune.choice < 0
            ? "Alternative movement"
            : "Barbell alternative",
    },
    {
      key: "length",
      label: "SESSION LENGTH",
      min: -2,
      max: 1,
      value: `~${estimatedDuration(preview)} min`,
    },
  ];
  async function apply() {
    if (!plan || !day) return;
    try {
      setError(null);
      await commit((current) => {
        const latest = current.plans.find((x) => x.id === plan.id);
        if (!latest || latest.revision !== plan.revision)
          throw new Error("Plan changed while tuning. Reopen the preview.");
        return savePlan(current, {
          ...plan,
          days: plan.days.map((d) =>
            d.id === day.id ? { ...d, exercises: preview } : d,
          ),
        });
      });
      setTuning(false);
      setTune(neutral);
      notify("Plan updated. Earlier version available through Undo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update plan.");
    }
  }
  return (
    <Screen
      title="PLANS"
      actions={
        <IconButton
          accent
          name="plus"
          label="New plan"
          onPress={() => router.push("/plan/new")}
        />
      }
    >
      {!plan ? (
        <Empty
          title={"A PLAN BUILT\nAROUND YOU."}
          body="Start from muscle groups or a training split. Go guided, or control every exercise and set."
          action={
            <Button onPress={() => router.push("/plan/new")}>
              BUILD YOUR FIRST PLAN
            </Button>
          }
        />
      ) : (
        <>
          <Pressable
            onPress={() => setPick(true)}
            style={{
              padding: 13,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 24,
              alignSelf: "flex-start",
              marginBottom: 20,
            }}
          >
            <T kind="bold" style={{ fontSize: 13 }}>
              {plan.name} · {plan.days.length}{" "}
              {plan.days.length === 1 ? "day" : "days"} ▾
            </T>
          </Pressable>
          <View style={ui.wrap}>
            {plan.days.map((d, i) => (
              <Chip
                key={d.id}
                selected={day?.id === d.id}
                label={weekdays[d.weekday]}
                onPress={() => setDayIndex(i)}
              />
            ))}
          </View>
          {day ? (
            <>
              <View style={{ marginTop: 24, position: "relative" }}>
                <View
                  style={{
                    height: 30,
                    position: "absolute",
                    top: -12,
                    left: 22,
                    right: 22,
                    backgroundColor: "#17171B",
                    borderRadius: 12,
                  }}
                />
                <View
                  style={{
                    height: 30,
                    position: "absolute",
                    top: -5,
                    left: 11,
                    right: 11,
                    backgroundColor: "#1B1B20",
                    borderRadius: 12,
                  }}
                />
                <Card style={{ borderRadius: 12 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ width: 58 }}>
                      <Anatomy
                        focusOnly
                        selected={[
                          ...new Set(
                            day.exercises.flatMap(
                              (x) => exerciseById[x.exerciseId].primary,
                            ),
                          ),
                        ]}
                        height={124}
                        width={57}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 9 }}>
                      <T kind="title" style={{ fontSize: 30 }}>
                        {day.name.toUpperCase()}
                      </T>
                      <T
                        kind="label"
                        style={{ fontSize: 10, color: C.secondary }}
                      >
                        {day.exercises.length} EXERCISES · ~
                        {estimatedDuration(day.exercises)} MIN
                      </T>
                      {day.exercises.slice(0, 3).map((item, index) => (
                        <View
                          key={`${item.exerciseId}-${index}`}
                          style={{
                            flexDirection: "row",
                            alignItems: "baseline",
                            gap: 8,
                          }}
                        >
                          <T
                            numberOfLines={1}
                            style={{ fontSize: 12, flex: 1 }}
                          >
                            {exerciseById[item.exerciseId].name}
                          </T>
                          <T
                            kind="label"
                            style={{ fontSize: 10, color: C.secondary }}
                          >
                            {item.sets}×{item.repsMin}
                            {item.repsMax !== item.repsMin
                              ? `–${item.repsMax}`
                              : ""}
                          </T>
                          <T kind="title" style={{ fontSize: 19 }}>
                            {item.weightKg
                              ? fmt(toUnit(item.weightKg, unit))
                              : "—"}
                          </T>
                        </View>
                      ))}
                      {day.exercises.length > 3 ? (
                        <T style={{ fontSize: 11, color: C.secondary }}>
                          + {day.exercises.length - 3} more
                        </T>
                      ) : null}
                    </View>
                  </View>
                </Card>
              </View>
              <View style={{ gap: 10, marginTop: 23 }}>
                <Button
                  onPress={() => {
                    setTune(neutral);
                    setTuning(true);
                  }}
                >
                  TUNE {day.name.toUpperCase()}
                </Button>
                <Button
                  kind="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/plan/[id]",
                      params: { id: plan.id },
                    })
                  }
                >
                  Edit days & exercises
                </Button>
                <Button
                  kind="ghost"
                  onPress={() => {
                    setCoachSeed(
                      `Review my saved plan "${plan.name}". Suggest useful changes, but prepare a proposal for me to confirm.`,
                    );
                    router.push("/coach");
                  }}
                >
                  Ask Coach to review ↗
                </Button>
              </View>
            </>
          ) : null}
          <SectionLabel>PLAN HISTORY</SectionLabel>
          <Button
            kind="secondary"
            disabled={!data.planHistory.some((x) => x.id === plan.id)}
            onPress={() => {
              void commit((current) => undoPlan(current, plan.id))
                .then(() => notify("Previous plan version restored."))
                .catch(() => {});
            }}
          >
            Undo previous plan change
          </Button>
          <T
            style={{
              fontSize: 11,
              color: C.secondary,
              lineHeight: 19,
              marginTop: 14,
            }}
          >
            Plans stay on this phone. Follow and log workouts in Liftoff.
            Duration is a rough estimate from planned sets and rest.
          </T>
        </>
      )}
      <Sheet visible={pick} title="YOUR PLANS" onClose={() => setPick(false)}>
        {data.plans.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => {
              void commit((current) => ({ ...current, selectedPlanId: p.id }))
                .then(() => {
                  setDayIndex(0);
                  setPick(false);
                })
                .catch(() => {});
            }}
            style={{
              paddingVertical: 17,
              borderBottomWidth: 1,
              borderColor: C.line,
            }}
          >
            <T kind="bold">{p.name}</T>
            <T style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>
              {p.days.length} days · Revision {p.revision}
            </T>
          </Pressable>
        ))}
      </Sheet>
      <Sheet
        visible={tuning}
        title={`TUNE ${day?.name.toUpperCase() ?? "PLAN"}`}
        onClose={() => setTuning(false)}
      >
        <T
          kind="label"
          style={{ color: C.secondary, textAlign: "right", marginBottom: 17 }}
        >
          EASIER ← → HARDER
        </T>
        {controls.map((control) => (
          <View key={control.key} style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <T kind="label">{control.label}</T>
              <T
                kind="bold"
                style={{
                  fontSize: 12,
                  color: tune[control.key] ? C.accent : C.secondary,
                }}
              >
                {control.value}
              </T>
            </View>
            <Slider
              accessibilityLabel={control.label}
              minimumValue={control.min}
              maximumValue={control.max}
              step={1}
              value={tune[control.key]}
              onValueChange={(value) =>
                setTune((current) => ({ ...current, [control.key]: value }))
              }
              minimumTrackTintColor={C.accent}
              maximumTrackTintColor="#2A2A31"
              thumbTintColor={C.text}
              style={{ height: 39 }}
            />
          </View>
        ))}
        <T
          style={{
            fontSize: 11,
            color: C.secondary,
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          Session length removes accessory exercises or adds a set to the last
          exercise. Movement swaps clear the new movement’s load for you to set.
          Every resulting change is listed below.
        </T>
        {preview.map((item, i) => (
          <View
            key={`${item.exerciseId}-${i}`}
            style={{
              flexDirection: "row",
              gap: 9,
              alignItems: "baseline",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: C.line,
            }}
          >
            <T style={{ flex: 1, fontSize: 12 }}>
              {exerciseById[item.exerciseId].name}
            </T>
            <T kind="label" style={{ color: C.accent, fontSize: 10 }}>
              {item.sets}×{item.repsMin}–{item.repsMax} ·{" "}
              {item.weightKg
                ? `${fmt(toUnit(item.weightKg, unit))} ${unit}`
                : "Load unset"}
            </T>
          </View>
        ))}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <View style={[ui.row, { marginTop: 18 }]}>
          <Button kind="secondary" onPress={() => setTune(neutral)}>
            Reset
          </Button>
          <View style={{ flex: 1 }}>
            <Button
              disabled={!changed}
              loading={saving}
              onPress={() => {
                void apply();
              }}
            >
              APPLY
            </Button>
          </View>
        </View>
        <T style={{ fontSize: 11, color: C.secondary, marginTop: 10 }}>
          Nothing is saved until Apply.
        </T>
      </Sheet>
    </Screen>
  );
}
