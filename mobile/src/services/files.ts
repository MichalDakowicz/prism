import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import type { AppData } from "../domain/schema";

export async function exportBackup(data: AppData) {
  const filename = `prism-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const text = JSON.stringify(data, null, 2);
  if (Platform.OS === "web") {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    return;
  }
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(text);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Save PRISM backup",
    UTI: "public.json",
  });
}
export async function pickJson(): Promise<unknown | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 10_000_000)
    throw new Error("Choose a JSON file smaller than 10 MB.");
  const text =
    Platform.OS === "web"
      ? await (await fetch(asset.uri)).text()
      : await new File(asset.uri).text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
}
