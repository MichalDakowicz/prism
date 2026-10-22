import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useStore } from "../state/AppStore";
import {
  exerciseById,
  muscleGroups,
  muscleNames,
  weekdays,
} from "../data/catalog";
import { Anatomy } from "../components/Anatomy";
import { Button, C, Card, Screen, SectionLabel, T, ui } from "../components/ui";
import { volumes } from "../domain/plans";

export default function MuscleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data } = useStore(),
    router = useRouter();
  const group = muscleGroups.find((x) => x.id === id) ?? muscleGroups[0];
  const volume = volumes(data.plans),
    matches = data.plans
      .flatMap((plan) =>
        plan.days.map((day) => ({
          plan,
          day,
          items: day.exercises.filter((item) =>
            exerciseById[item.exerciseId].primary.some((m) =>
              group.muscles.includes(m),
            ),
          ),
        })),
      )
      .filter((x) => x.items.length);
  const total = matches.reduce(
      (sum, match) => sum + match.items.reduce((n, item) => n + item.sets, 0),
      0,
    ),
    planCount = new Set(matches.map((x) => x.plan.id)).size,
    exerciseCount = new Set(
      matches.flatMap((x) => x.items.map((item) => item.exerciseId)),
    ).size;
  return (
    <Screen title="MUSCLE GROUP" back>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
        {(["front", "back"] as const).map((side) => (
          <View key={side} style={{ alignItems: "center", gap: 4, flex: 1 }}>
            <Anatomy
              side={side}
              focusOnly
              selected={group.muscles}
              height={255}
              width={135}
            />
            <T kind="label" style={{ color: C.secondary, fontSize: 10 }}>
              {side.toUpperCase()}
            </T>
          </View>
        ))}
      </View>
      <T kind="title" style={{ fontSize: 58, marginTop: 16 }}>
        {group.name.toUpperCase()}
      </T>
      <T kind="label" style={{ color: C.secondary, fontSize: 10 }}>
        {group.muscles.map((m) => muscleNames[m].toUpperCase()).join(" · ")}
      </T>
      <View style={[ui.row, { marginTop: 19, alignItems: "flex-start" }]}>
        {[
          [String(total), "SETS / WEEK"],
          [String(planCount), "PLANS"],
          [String(exerciseCount), "EXERCISES"],
        ].map(([value, label]) => (
          <View key={label} style={{ flex: 1 }}>
            <T kind="title" style={{ fontSize: 42 }}>
              {value}
            </T>
            <T kind="label" style={{ fontSize: 9, color: C.secondary }}>
              {label}
            </T>
          </View>
        ))}
      </View>
      <SectionLabel>SETS PER WEEK</SectionLabel>
      <Card>
        {group.muscles.map((muscle) => (
          <View key={muscle} style={{ marginVertical: 7, gap: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <T>{muscleNames[muscle]}</T>
              <T kind="label">{volume[muscle] ?? 0}</T>
            </View>
            <View
              style={{ height: 5, backgroundColor: "#24242B", borderRadius: 3 }}
            >
              <View
                style={{
                  height: 5,
                  width: `${Math.min(100, ((volume[muscle] ?? 0) / Math.max(1, ...group.muscles.map((m) => volume[m] ?? 0))) * 100)}%`,
                  backgroundColor: C.accent,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        ))}
      </Card>
      <T
        style={{ fontSize: 10, color: C.muted, lineHeight: 17, marginTop: 10 }}
      >
        Group total counts each set once. Per-muscle counts can overlap when an
        exercise has multiple primary muscles.
      </T>
      <SectionLabel>IN YOUR PLANS</SectionLabel>
      {matches.length ? (
        matches.map(({ plan, day, items }) => (
          <Pressable
            key={`${plan.id}-${day.id}`}
            onPress={() =>
              router.push({ pathname: "/plan/[id]", params: { id: plan.id } })
            }
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 15,
              marginBottom: 9,
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <T kind="bold" style={{ flex: 1 }}>
                {day.name}
              </T>
              <T kind="label" style={{ fontSize: 10, color: C.accent }}>
                {weekdays[day.weekday]}
              </T>
            </View>
            <T style={{ fontSize: 12, color: C.secondary, lineHeight: 19 }}>
              {plan.name} ·{" "}
              {items.map((x) => exerciseById[x.exerciseId].name).join(", ")}
            </T>
          </Pressable>
        ))
      ) : (
        <T style={{ color: C.secondary, lineHeight: 21 }}>
          No saved plan targets this group yet.
        </T>
      )}
      <View style={{ height: 20 }} />
      <Button
        onPress={() =>
          router.push({
            pathname: "/plan/new",
            params: { muscles: group.muscles.join(",") },
          })
        }
      >
        BUILD {group.name.toUpperCase()} PLAN
      </Button>
    </Screen>
  );
}
