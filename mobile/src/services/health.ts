import { Platform } from "react-native";
export type SleepSummary = { minutes: number; endTime: string; source: string };
async function health() {
  if (Platform.OS !== "android")
    throw new Error("Health Connect requires an Android development build.");
  return import("react-native-health-connect");
}
export async function connectSleep() {
  const api = await health();
  if (!(await api.initialize()))
    throw new Error(
      "Health Connect is unavailable. Enable or update it in Android settings.",
    );
  const granted = await api.requestPermission([
    { accessType: "read", recordType: "SleepSession" },
  ]);
  if (
    !granted.some(
      (x) => x.accessType === "read" && x.recordType === "SleepSession",
    )
  )
    throw new Error(
      "Sleep access was not granted. PRs and plans still work normally.",
    );
}
export async function readSleep(): Promise<SleepSummary | null> {
  const api = await health();
  if (!(await api.initialize())) return null;
  const granted = await api.getGrantedPermissions();
  if (
    !granted.some(
      (x) => x.accessType === "read" && x.recordType === "SleepSession",
    )
  )
    throw new Error(
      "Sleep permission is off. Reconnect Health Connect in Profile.",
    );
  const end = new Date(),
    start = new Date(end.getTime() - 48 * 60 * 60 * 1000);
  const { records } = await api.readRecords("SleepSession", {
    timeRangeFilter: {
      operator: "between",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  });
  const latest = records.sort((a, b) => b.endTime.localeCompare(a.endTime))[0];
  if (!latest) return null;
  return {
    minutes: Math.round(
      (Date.parse(latest.endTime) - Date.parse(latest.startTime)) / 60000,
    ),
    endTime: latest.endTime,
    source: latest.metadata?.dataOrigin ?? "Health Connect",
  };
}
