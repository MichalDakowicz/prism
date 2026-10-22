import { Tabs } from "expo-router";
import { FloatingTabs } from "../../components/FloatingTabs";
import { C } from "../../components/ui";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
      }}
      tabBar={(props) => <FloatingTabs {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Lifts" }} />
      <Tabs.Screen name="body" options={{ title: "Body" }} />
      <Tabs.Screen name="plans" options={{ title: "Plans" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
    </Tabs>
  );
}
