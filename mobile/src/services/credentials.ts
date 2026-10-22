import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const KEY = "prism.gemini.key";
let webKey: string | null = null;
export async function getApiKey() {
  return Platform.OS === "web" ? webKey : SecureStore.getItemAsync(KEY);
}
export async function saveApiKey(key: string) {
  const value = key.trim();
  if (!value) throw new Error("Enter your Gemini API key.");
  if (Platform.OS === "web") webKey = value;
  else await SecureStore.setItemAsync(KEY, value);
}
export async function clearApiKey() {
  if (Platform.OS === "web") webKey = null;
  else await SecureStore.deleteItemAsync(KEY);
}
