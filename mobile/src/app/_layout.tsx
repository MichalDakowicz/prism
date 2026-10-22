import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useStore } from "../state/AppStore";
import { Button, C, T } from "../components/ui";
import { pickJson } from "../services/files";

function AppContent() {
  const { ready, error, notice, retry, restore } = useStore();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          justifyContent: "center",
          padding: 28,
          gap: 18,
        }}
      >
        <T kind="title">PRISM</T>
        {error ? (
          <>
            <T style={{ color: C.secondary, lineHeight: 23 }}>{error}</T>
            <Button onPress={retry}>TRY AGAIN</Button>
            <Button
              kind="secondary"
              onPress={() => {
                void pickJson()
                  .then((value) =>
                    value === null ? undefined : restore(value),
                  )
                  .catch(() => {});
              }}
            >
              Restore backup
            </Button>
          </>
        ) : (
          <ActivityIndicator color={C.accent} />
        )}
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-pr" options={{ presentation: "modal" }} />
        <Stack.Screen name="profile" />
      </Stack>
      {notice ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 116,
            padding: 14,
            borderRadius: 12,
            backgroundColor: C.text,
          }}
        >
          <T
            accessibilityLiveRegion="polite"
            style={{ color: C.bg, fontSize: 12, textAlign: "center" }}
          >
            {notice}
          </T>
        </View>
      ) : null}
      {error ? (
        <Pressable
          accessibilityRole="alert"
          onPress={retry}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 45,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#492020",
          }}
        >
          <T style={{ fontSize: 12 }}>{error}</T>
        </Pressable>
      ) : null}
    </View>
  );
}
export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Display: require("@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_900Black.ttf"),
    Body: require("@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf"),
    BodyBold: require("@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf"),
    Mono: require("@expo-google-fonts/ibm-plex-mono/600SemiBold/IBMPlexMono_600SemiBold.ttf"),
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center" }}
      >
        <ActivityIndicator color={C.accent} />
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
