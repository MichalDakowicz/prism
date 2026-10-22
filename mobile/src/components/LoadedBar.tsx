import { View } from "react-native";
import { loadPlates, plateColors } from "../domain/plates";
import { C, T } from "./ui";
import { fmt, toUnit } from "../domain/strength";
import type { Unit } from "../domain/schema";

export function LoadedBar({
  weightKg,
  barKg = 20,
  pairsKg,
  style = "color",
  unit = "kg",
  height = 112,
}: {
  weightKg: number;
  barKg?: number;
  pairsKg?: readonly number[];
  style?: "color" | "black";
  unit?: Unit;
  height?: number;
}) {
  const { pairs, remainderKg, belowBar } = loadPlates(
    Math.max(0, weightKg),
    barKg,
    pairsKg,
  );
  const base = (p: number) =>
    p >= 20 ? 20 : p >= 15 ? 14 : p >= 10 ? 11 : p >= 5 ? 9 : 6;
  const scale = Math.min(
    1,
    115 / (pairs.reduce((n, p) => n + base(p) + 2, 0) || 1),
  );
  const stack = (left: boolean) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        position: "absolute",
        ...(left ? { left: 5 } : { right: 5 }),
        top: 0,
        bottom: 0,
      }}
    >
      {!left ? (
        <View
          style={{
            width: 6,
            height: 24,
            backgroundColor: "#B5B3AD",
            borderRadius: 2,
          }}
        />
      ) : null}
      {(left ? [...pairs].reverse() : pairs).map((p, i) => (
        <View
          key={`${p}-${i}`}
          style={{
            width: Math.max(2, base(p) * scale),
            height:
              height *
              (p >= 20
                ? 0.85
                : p >= 15
                  ? 0.74
                  : p >= 10
                    ? 0.62
                    : p >= 5
                      ? 0.47
                      : 0.32),
            borderRadius: 3,
            backgroundColor: style === "black" ? "#0A0A0C" : plateColors[p],
            borderWidth: style === "black" ? 1 : 0,
            borderColor: "#4A4A52",
          }}
        />
      ))}
      {left ? (
        <View
          style={{
            width: 6,
            height: 24,
            backgroundColor: "#B5B3AD",
            borderRadius: 2,
          }}
        />
      ) : null}
    </View>
  );
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${fmt(toUnit(barKg, unit))} ${unit} bar, ${pairs.length ? pairs.map((p) => fmt(toUnit(p, unit), 2)).join(", ") : "no plates"} ${unit} per side`}
    >
      <View style={{ height, position: "relative", justifyContent: "center" }}>
        <View
          style={{ height: 6, backgroundColor: "#55545A", borderRadius: 3 }}
        />
        <View
          style={{
            height: 10,
            width: Math.max(30, pairs.length * 15),
            backgroundColor: "#8E8C87",
            position: "absolute",
            left: 0,
            top: height / 2 - 5,
          }}
        />
        <View
          style={{
            height: 10,
            width: Math.max(30, pairs.length * 15),
            backgroundColor: "#8E8C87",
            position: "absolute",
            right: 0,
            top: height / 2 - 5,
          }}
        />
        {stack(true)}
        {stack(false)}
        <View
          style={{
            alignSelf: "center",
            position: "absolute",
            backgroundColor: C.surface,
            paddingHorizontal: 6,
          }}
        >
          <T kind="label" style={{ color: C.secondary, fontSize: 9 }}>
            BAR {fmt(toUnit(barKg, unit))}
          </T>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <T kind="label" style={{ fontSize: 9, color: C.secondary, flex: 1 }}>
          {[...pairs]
            .reverse()
            .map((p) => fmt(toUnit(p, unit), 2))
            .join(" + ") || "—"}
        </T>
        <T
          kind="label"
          style={{
            fontSize: 9,
            color: C.secondary,
            textAlign: "right",
            flex: 1,
          }}
        >
          {pairs.map((p) => fmt(toUnit(p, unit), 2)).join(" + ") || "—"}
        </T>
      </View>
      {belowBar || remainderKg > 0.01 ? (
        <T
          style={{
            fontSize: 11,
            color: C.accent,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {belowBar
            ? "Lighter than selected bar"
            : `${fmt(toUnit(remainderKg, unit))} ${unit} not shown in plates`}
        </T>
      ) : null}
    </View>
  );
}
