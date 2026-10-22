import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export const C = {
  bg: "#0B0B0E",
  surface: "#141417",
  raised: "#1E1E25",
  inset: "#121215",
  accent: "#F2C200",
  text: "#F2F1F7",
  secondary: "#A8A6A0",
  muted: "#7E7D8C",
  line: "rgba(255,255,255,0.09)",
  red: "#F38989",
};
export const F = {
  display: "Display",
  body: "Body",
  bold: "BodyBold",
  mono: "Mono",
};
export function T({
  kind = "body",
  style,
  ...props
}: TextProps & { kind?: "body" | "label" | "title" | "display" | "bold" }) {
  return (
    <Text
      {...props}
      style={[
        {
          color: C.text,
          fontFamily:
            kind === "body"
              ? F.body
              : kind === "bold"
                ? F.bold
                : kind === "label"
                  ? F.mono
                  : F.display,
          fontSize:
            kind === "title"
              ? 44
              : kind === "display"
                ? 72
                : kind === "label"
                  ? 11
                  : 14,
          letterSpacing: kind === "label" ? 0.5 : 0,
        },
        style,
      ]}
    />
  );
}
export type IconName = keyof typeof Feather.glyphMap;
export function Icon({
  name,
  size = 21,
  color = C.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  accent = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: accent ? C.accent : "#18181D",
        borderWidth: accent ? 0 : 1,
        borderColor: C.line,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Icon name={name} color={accent ? C.bg : C.text} />
    </Pressable>
  );
}
export function Button({
  children,
  onPress,
  kind = "primary",
  disabled = false,
  loading = false,
  style,
  testID,
}: {
  children: ReactNode;
  onPress: () => void;
  kind?: "primary" | "secondary" | "ghost" | "white";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  const color = kind === "primary" || kind === "white" ? C.bg : C.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          paddingHorizontal: 19,
          paddingVertical: 12,
          borderRadius: 28,
          backgroundColor:
            kind === "primary"
              ? C.accent
              : kind === "white"
                ? C.text
                : kind === "secondary"
                  ? C.raised
                  : "transparent",
          borderWidth: kind === "secondary" ? 1 : 0,
          borderColor: C.line,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 9,
          opacity: disabled || loading ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : null}
      <T
        kind={kind === "primary" ? "title" : "bold"}
        style={{
          fontSize: kind === "primary" ? 20 : 13,
          color,
          letterSpacing: kind === "primary" ? 0.7 : 0,
          textAlign: "center",
        }}
      >
        {children}
      </T>
    </Pressable>
  );
}
export function Chip({
  label,
  onPress,
  selected = false,
  small = false,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: small ? 38 : 44,
        borderRadius: 22,
        paddingHorizontal: 13,
        paddingVertical: 9,
        backgroundColor: selected ? C.accent : "transparent",
        borderWidth: 1,
        borderColor: selected ? C.accent : C.line,
        justifyContent: "center",
      }}
    >
      <T
        kind="label"
        style={{
          fontSize: small ? 10 : 11,
          color: selected ? C.bg : C.secondary,
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function Segmented<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: TValue; label: string }[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 3,
        alignSelf: "flex-start",
        maxWidth: "100%",
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          style={{
            paddingHorizontal: 14,
            minHeight: 38,
            borderRadius: 21,
            backgroundColor: option.value === value ? C.text : "transparent",
            justifyContent: "center",
          }}
        >
          <T
            kind="label"
            style={{ color: option.value === value ? C.bg : C.secondary }}
          >
            {option.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
export function Screen({
  children,
  title,
  actions,
  back = false,
  scroll = true,
  bottomPadding = 125,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  back?: boolean;
  scroll?: boolean;
  bottomPadding?: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const content = (
    <>
      {title ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 22,
          }}
        >
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              style={{ width: 36, minHeight: 48, justifyContent: "center" }}
            >
              <Icon name="arrow-left" />
            </Pressable>
          ) : null}
          <T
            kind="title"
            accessibilityRole="header"
            style={{ flex: 1, fontSize: 44 }}
          >
            {title}
          </T>
          {actions}
        </View>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 12) + bottomPadding,
              gap: 0,
            }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
            {content}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: C.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 7, marginBottom: 16 }}>
      <T kind="label" style={{ color: C.secondary }}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.muted}
        selectionColor={C.accent}
        {...props}
        style={[
          {
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: error ? C.red : C.line,
            color: C.text,
            fontFamily: F.body,
            fontSize: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            minHeight: 48,
            textAlignVertical: props.multiline ? "top" : "center",
          },
          props.style,
        ]}
      />
      {hint ? (
        <T style={{ fontSize: 11, color: C.secondary, lineHeight: 17 }}>
          {hint}
        </T>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}
export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <T
      accessibilityRole="alert"
      style={{ color: C.red, fontSize: 12, lineHeight: 19, marginVertical: 9 }}
    >
      {children}
    </T>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ paddingVertical: 35, gap: 15 }}>
      <T kind="title" style={{ fontSize: 38, lineHeight: 42 }}>
        {title}
      </T>
      <T style={{ color: C.secondary, lineHeight: 23, maxWidth: 340 }}>
        {body}
      </T>
      {action ? (
        <View style={{ alignSelf: "flex-start", marginTop: 8 }}>{action}</View>
      ) : null}
    </View>
  );
}
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <T
      kind="label"
      style={{ color: C.secondary, marginBottom: 12, marginTop: 22 }}
    >
      {children}
    </T>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: "#0009",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          accessibilityLabel="Close sheet"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ maxHeight: "92%" }}>
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
          >
            <View
              style={{
                height: 5,
                width: 40,
                borderRadius: 3,
                backgroundColor: "#3A3A42",
                alignSelf: "center",
                marginBottom: 14,
              }}
            />
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <T kind="title" style={{ flex: 1, fontSize: 31 }}>
                {title}
              </T>
              <IconButton name="x" label="Close" onPress={onClose} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 15,
              }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  secondary: { color: C.secondary },
  space: { height: 18 },
});
