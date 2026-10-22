import { Pressable, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, Icon, T, type IconName } from "./ui";
import { useKeyboardVisible } from "../hooks/useKeyboardVisible";

const icons: Record<string, IconName> = {
  index: "bar-chart-2",
  body: "user",
  plans: "list",
  coach: "message-square",
};
export function FloatingTabs({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  if (keyboardVisible) return null;
  return (
    <View
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 12) + 8,
        left: 20,
        right: 20,
        height: 68,
        padding: 6,
        borderRadius: 34,
        backgroundColor: "rgba(24,24,32,0.97)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.08)",
        flexDirection: "row",
        gap: 4,
      }}
    >
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const options = descriptors[route.key].options;
        const label =
          typeof options.title === "string" ? options.title : route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => {
              const event = emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented)
                navigateToTab(route.key);
            }}
            style={{
              flex: 1,
              borderRadius: 28,
              backgroundColor: selected ? C.text : "transparent",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Icon
              name={icons[route.name] ?? "circle"}
              size={21}
              color={selected ? C.bg : "#9A99A8"}
            />
            <T
              kind="bold"
              style={{ fontSize: 11, color: selected ? C.bg : "#9A99A8" }}
            >
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
