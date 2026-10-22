import { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Anatomy } from "../components/Anatomy";
import { Button, C, Chip, Screen, Segmented, T, ui } from "../components/ui";
import { useStore } from "../state/AppStore";
import { volumes, volumeColor } from "../domain/plans";
import { muscleIds, type Muscle } from "../domain/schema";
import { groupForMuscle, muscleNames, exerciseById } from "../data/catalog";

export default function BodyScreen() {
  const { data } = useStore(),
    router = useRouter(),
    { height } = useWindowDimensions();
  const [side, setSide] = useState<"front" | "back">("front"),
    [selected, setSelected] = useState<Muscle>("biceps");
  const volume = volumes(data.plans),
    sets = volume[selected] ?? 0;
  const planCount = data.plans.filter((plan) =>
    plan.days.some((day) =>
      day.exercises.some(
        (item) =>
          item.sets > 0 &&
          exerciseById[item.exerciseId].primary.includes(selected),
      ),
    ),
  ).length;
  return (
    <Screen
      title="BODY"
      actions={
        <Segmented
          value={side}
          onChange={setSide}
          options={[
            { value: "front", label: "FRONT" },
            { value: "back", label: "BACK" },
          ]}
        />
      }
    >
      <View
        style={{ position: "relative", minHeight: Math.min(500, height - 255) }}
      >
        <View
          style={{ position: "absolute", left: 0, top: 5, zIndex: 1, gap: 8 }}
        >
          <T kind="label" style={{ color: C.secondary, fontSize: 9 }}>
            SETS / WK
          </T>
          {[13, 9, 5, 1, 0].map((n, i) => (
            <View
              key={n}
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: volumeColor(n),
                }}
              />
              <T kind="label" style={{ fontSize: 10, color: C.secondary }}>
                {["13+", "9–12", "5–8", "1–4", "0"][i]}
              </T>
            </View>
          ))}
        </View>
        <View style={{ marginLeft: 30 }}>
          <Anatomy
            side={side}
            selected={[selected]}
            volume={volume}
            onSelect={setSelected}
            height={Math.min(495, height - 270)}
            width={Math.min(265, (height - 270) * 0.54)}
          />
        </View>
      </View>
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 15,
          flexDirection: "row",
          gap: 13,
          alignItems: "center",
          borderWidth: 1,
          borderColor: C.line,
          marginTop: 12,
        }}
      >
        <View
          style={{
            width: 9,
            height: 48,
            borderRadius: 3,
            backgroundColor: volumeColor(sets),
          }}
        />
        <View style={{ flex: 1, gap: 5 }}>
          <T kind="title" style={{ fontSize: 29 }}>
            {muscleNames[selected].toUpperCase()}
          </T>
          <T kind="label" style={{ fontSize: 10, color: C.secondary }}>
            {sets} SETS / WK · {planCount} {planCount === 1 ? "PLAN" : "PLANS"}
          </T>
        </View>
        <Button
          onPress={() =>
            router.push({
              pathname: "/muscle/[id]",
              params: { id: groupForMuscle(selected).id },
            })
          }
        >
          OPEN
        </Button>
      </View>
      <T
        style={{
          fontSize: 11,
          color: C.secondary,
          lineHeight: 18,
          marginTop: 13,
        }}
      >
        Planned primary-muscle sets across your saved plans. Not completed
        workouts or a recovery score.
      </T>
      <View style={[ui.wrap, { marginTop: 17 }]}>
        {muscleIds.map((id) => (
          <Chip
            key={id}
            small
            selected={selected === id}
            label={muscleNames[id]}
            onPress={() => setSelected(id)}
          />
        ))}
      </View>
    </Screen>
  );
}
