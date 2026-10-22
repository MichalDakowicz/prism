import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "PRISM",
  slug: "prism-strength",
  version: "0.1.0",
  scheme: "prism",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  backgroundColor: "#0B0B0E",
  icon: "./assets/icon.png",
  android: {
    package: "app.prism.strength",
    versionCode: 1,
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B0B0E",
    },
    permissions: ["android.permission.health.READ_SLEEP"],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_CONTACTS",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
    ],
  },
  ios: { bundleIdentifier: "app.prism.strength", supportsTablet: false },
  web: { bundler: "metro", output: "static", favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-sharing",
    "expo-video",
    [
      "expo-image-picker",
      {
        cameraPermission: false,
        microphonePermission: false,
        photosPermission: "Choose a PR video to attach to your record.",
      },
    ],
    "react-native-health-connect",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 28,
          compileSdkVersion: 37,
          targetSdkVersion: 36,
          buildToolsVersion: "37.0.0",
        },
      },
    ],
    "./plugins/withShortCmakePaths",
  ],
  experiments: { typedRoutes: false },
};
export default config;
