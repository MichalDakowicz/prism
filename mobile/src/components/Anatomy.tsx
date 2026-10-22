import { memo, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import anatomy from "../data/anatomy.json";
import { muscleNames } from "../data/catalog";
import { muscleIds, type Muscle } from "../domain/schema";
import { volumeColor } from "../domain/plans";
import { C } from "./ui";

export const Anatomy = memo(function Anatomy({
  side = "front",
  selected = [],
  volume = {},
  onSelect,
  width = 265,
  height = 500,
  focusOnly = false,
}: {
  side?: "front" | "back";
  selected?: Muscle[];
  volume?: Partial<Record<Muscle, number>>;
  onSelect?: (id: Muscle) => void;
  width?: number;
  height?: number;
  focusOnly?: boolean;
}) {
  const [reduced, setReduced] = useState(false);
  const reveal = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (reduced) {
      reveal.setValue(height);
      return;
    }
    reveal.setValue(0);
    const motion = Animated.timing(reveal, {
      toValue: height,
      duration: 700,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    });
    motion.start();
    return () => motion.stop();
  }, [side, height, reduced, reveal]);
  const map = anatomy[side];
  const [, , viewWidth, viewHeight] = map.viewBox.split(" ").map(Number);
  const unitsPerDp = 1 / Math.min(width / viewWidth, height / viewHeight);
  return (
    <View style={{ width, height, position: "relative", alignSelf: "center" }}>
      <Animated.View style={{ width, height: reveal, overflow: "hidden" }}>
        <Svg
          width={width}
          height={height}
          viewBox={map.viewBox}
          accessibilityLabel={`${side} muscle map`}
        >
          {map.groups.map((group, i) => {
            const id = group.id as Muscle,
              valid = muscleIds.includes(id),
              chosen = selected.includes(id);
            const fill = !valid
              ? "#16161B"
              : focusOnly
                ? chosen
                  ? C.accent
                  : "#1C1C22"
                : volumeColor(volume[id] ?? 0);
            return (
              <G
                key={`${group.id}-${i}`}
                accessibilityLabel={valid ? muscleNames[id] : undefined}
              >
                {group.paths.map((d, j) => (
                  <Path
                    key={j}
                    d={d}
                    onPress={valid && onSelect ? () => onSelect(id) : undefined}
                    fill={fill}
                    stroke={chosen ? "#FFFFFF" : C.bg}
                    strokeWidth={(chosen ? 1.7 : 0.8) * unitsPerDp}
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                ))}
              </G>
            );
          })}
        </Svg>
      </Animated.View>
      {!reduced ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 1,
            backgroundColor: C.accent,
            opacity: reveal.interpolate({
              inputRange: [0, height * 0.9, height],
              outputRange: [0.7, 0.7, 0],
            }),
            transform: [{ translateY: reveal }],
          }}
        />
      ) : null}
    </View>
  );
});
