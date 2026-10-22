import { useState } from "react";
import { Pressable, View } from "react-native";
import { exercises, muscleNames } from "../data/catalog";
import { C, Field, Icon, Sheet, T } from "./ui";
export function ExercisePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <Sheet visible={visible} title="ADD EXERCISE" onClose={onClose}>
      <Field
        label="SEARCH LIBRARY"
        value={query}
        onChangeText={setQuery}
        placeholder="Exercise or muscle…"
      />
      {exercises
        .filter((ex) =>
          `${ex.name} ${ex.primary.map((m) => muscleNames[m]).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map((ex) => (
          <Pressable
            key={ex.id}
            onPress={() => {
              onPick(ex.id);
              onClose();
            }}
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              minHeight: 61,
              borderBottomWidth: 1,
              borderColor: C.line,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <T kind="bold" style={{ fontSize: 13 }}>
                {ex.name}
              </T>
              <T kind="label" style={{ fontSize: 9, color: C.secondary }}>
                {ex.primary.map((m) => muscleNames[m]).join(" · ")} /{" "}
                {ex.equipment}
              </T>
            </View>
            <Icon name="plus" color={C.accent} />
          </Pressable>
        ))}
    </Sheet>
  );
}
