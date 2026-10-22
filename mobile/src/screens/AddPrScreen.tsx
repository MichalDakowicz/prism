import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { exercises, exerciseById } from "../data/catalog";
import { useStore } from "../state/AppStore";
import {
  estimatedMax,
  fmt,
  fromUnit,
  parseNumber,
  toUnit,
} from "../domain/strength";
import {
  loadPlates,
  plateColors,
  plateSizes,
  totalLoad,
} from "../domain/plates";
import { uid } from "../domain/plans";
import { localDateText, recordDate } from "../domain/dates";
import { recordSchema } from "../domain/schema";
import { LoadedBar } from "../components/LoadedBar";
import { PrVideoEditor } from "../components/PrVideo";
import {
  validateVideoDraft,
  type VideoDraft,
  type VideoAttachment,
} from "../domain/video";
import { savePrVideo, deletePrVideo } from "../services/videos";
import {
  Button,
  C,
  Chip,
  ErrorText,
  F,
  Field,
  IconButton,
  Screen,
  Segmented,
  Sheet,
  T,
  ui,
} from "../components/ui";

export default function AddPrScreen() {
  const { exerciseId: initial } = useLocalSearchParams<{
    exerciseId?: string;
  }>();
  const { data, commit, notify } = useStore(),
    router = useRouter();
  const [exerciseId, setExerciseId] = useState(
    initial && exerciseById[initial] ? initial : "bench",
  );
  const [weight, setWeight] = useState(""),
    [manualPairs, setManualPairs] = useState<number[] | null>(null),
    [reps, setReps] = useState(1),
    [bar, setBar] = useState("20"),
    [picker, setPicker] = useState(false),
    [query, setQuery] = useState("");
  const [bodyweight, setBodyweight] = useState(
    data.profile.bodyweightKg
      ? fmt(toUnit(data.profile.bodyweightKg, data.profile.unit))
      : "",
  );
  const [date, setDate] = useState(localDateText),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [video, setVideo] = useState<VideoDraft>({ kind: "none" });
  const unit = data.profile.unit,
    ex = exerciseById[exerciseId],
    barKg = Number(bar),
    weightKg =
      manualPairs === null
        ? fromUnit(parseNumber(weight) || 0, unit)
        : totalLoad(manualPairs, barKg);
  const loaded = loadPlates(
    Math.max(0, weightKg),
    barKg,
    manualPairs ?? undefined,
  );
  function setPairs(pairs: number[]) {
    if (pairs.length > 24) {
      setError("Plate display supports up to 24 pairs.");
      return;
    }
    setManualPairs([...pairs]);
    setWeight(fmt(toUnit(totalLoad(pairs, barKg), unit), 2));
  }
  function changeBar(value: string) {
    setBar(value);
    if (manualPairs !== null)
      setWeight(fmt(toUnit(totalLoad(manualPairs, Number(value)), unit), 2));
  }
  async function save() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError(null);
    let savedVideo: VideoAttachment | undefined;
    let saved = false;
    try {
      validateVideoDraft(video);
      const bw = fromUnit(parseNumber(bodyweight), unit);
      const timestamp = recordDate(date);
      let record = recordSchema.parse({
        id: uid(),
        exerciseId,
        weightKg,
        reps,
        bodyweightKg: bw,
        date: timestamp,
        createdAt: new Date().toISOString(),
        age: data.profile.age,
        comparisonGroup: data.profile.comparisonGroup,
        archivedAt: null,
        note: "",
        plateLoad:
          ex.type === "barbell"
            ? {
                barKg,
                ...(manualPairs !== null ? { pairsKg: manualPairs } : {}),
              }
            : undefined,
      });
      savedVideo = await savePrVideo(video);
      record = recordSchema.parse({ ...record, video: savedVideo });
      await commit((current) => ({
        ...current,
        profile: {
          ...current.profile,
          bodyweightKg: current.profile.bodyweightKg ?? bw,
        },
        records: [...current.records, record],
      }));
      saved = true;
      notify("Personal record saved on this phone.");
      router.back();
    } catch (e) {
      if (!saved && video.kind === "gallery") deletePrVideo(savedVideo);
      setError(e instanceof Error ? e.message : "Could not save PR.");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen
      title="NEW PR"
      back
      bottomPadding={30}
      actions={
        <Chip label={ex.name} selected onPress={() => setPicker(true)} />
      }
    >
      <T kind="label" style={{ color: C.secondary }}>
        WEIGHT · TYPE IT OR LOAD PLATES
      </T>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 7,
          marginVertical: 8,
        }}
      >
        <TextInput
          testID="pr-weight"
          accessibilityLabel={`Lift weight in ${unit}`}
          value={weight}
          onChangeText={(text) => {
            setManualPairs(null);
            setWeight(text);
          }}
          placeholder="0"
          placeholderTextColor="#3A3A42"
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={{
            fontFamily: F.display,
            color: C.text,
            fontSize: 100,
            padding: 0,
            minWidth: 90,
            maxWidth: "70%",
            borderBottomWidth: 2,
            borderColor: "#3A3A42",
          }}
        />
        <T kind="title" style={{ fontSize: 28 }}>
          {unit.toUpperCase()}
        </T>
        <T
          kind="title"
          style={{ fontSize: 32, color: C.secondary, marginLeft: "auto" }}
        >
          × {reps}
        </T>
      </View>
      {ex.type === "barbell" ? (
        <>
          <LoadedBar
            weightKg={Math.max(0, weightKg)}
            barKg={barKg}
            pairsKg={manualPairs ?? undefined}
            style={data.profile.plateStyle}
            unit={unit}
            height={122}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 6,
              marginTop: 24,
              marginBottom: 14,
            }}
          >
            {plateSizes.map((p) => (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityLabel={`Add pair of ${fmt(toUnit(p, unit), 2)} ${unit} plates`}
                onPress={() => setPairs([...loaded.pairs, p])}
                style={{
                  width: 43,
                  height: 46,
                  borderRadius: 24,
                  backgroundColor:
                    data.profile.plateStyle === "black"
                      ? "#0A0A0C"
                      : plateColors[p],
                  borderWidth: 2,
                  borderColor:
                    data.profile.plateStyle === "black"
                      ? "#4A4A52"
                      : "rgba(0,0,0,.3)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T
                  kind="label"
                  style={{
                    fontSize: 10,
                    color:
                      data.profile.plateStyle === "black" ||
                      ![5, 15, 1.25].includes(p)
                        ? "#FFF"
                        : C.bg,
                  }}
                >
                  {fmt(toUnit(p, unit), 2)}
                </T>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Segmented
              value={bar}
              onChange={changeBar}
              options={[
                { value: "20", label: "BAR 20 KG" },
                { value: "15", label: "BAR 15 KG" },
              ]}
            />
            <View style={ui.row}>
              <Button
                kind="ghost"
                onPress={() => setPairs(loaded.pairs.slice(0, -1))}
              >
                Remove pair
              </Button>
              <Button kind="ghost" onPress={() => setPairs([])}>
                Clear
              </Button>
            </View>
          </View>
        </>
      ) : (
        <T style={{ color: C.secondary, fontSize: 12, marginVertical: 15 }}>
          {ex.type === "dumbbell"
            ? "Record the weight of one dumbbell."
            : ex.type === "bodyweight"
              ? "Record additional load for this movement. Unweighted rep-only records are not strength-load PRs."
              : "Use the load shown on the equipment."}
        </T>
      )}
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 15,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginVertical: 22,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <T kind="label" style={{ color: C.secondary }}>
            REPS
          </T>
          <T kind="bold" style={{ fontSize: 12 }}>
            {reps === 1
              ? "Measured single"
              : `Estimated 1RM ≈ ${weightKg > 0 ? fmt(toUnit(estimatedMax(weightKg, reps), unit)) : "—"} ${unit}`}
          </T>
        </View>
        <IconButton
          name="minus"
          label="Fewer reps"
          onPress={() => setReps(Math.max(1, reps - 1))}
        />
        <T kind="title" style={{ fontSize: 30 }}>
          {reps}
        </T>
        <IconButton
          name="plus"
          label="More reps"
          onPress={() => setReps(Math.min(12, reps + 1))}
        />
      </View>
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <Field
            label={`BODYWEIGHT (${unit.toUpperCase()})`}
            value={bodyweight}
            onChangeText={setBodyweight}
            keyboardType="decimal-pad"
            placeholder="Your bodyweight"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="DATE"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <T
        style={{
          fontSize: 12,
          color: C.secondary,
          lineHeight: 20,
          marginBottom: 18,
        }}
      >
        Saved with this bodyweight.{" "}
        {weightKg > 0 && parseNumber(bodyweight) > 0
          ? `${fmt(weightKg / fromUnit(parseNumber(bodyweight), unit), 2)} × BW. `
          : ""}
        Measured and estimated records stay separate.
      </T>
      <PrVideoEditor value={video} onChange={setVideo} disabled={busy} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        testID="save-pr"
        loading={busy}
        onPress={() => {
          void save();
        }}
      >
        SAVE PR
      </Button>
      <Sheet
        visible={picker}
        title="CHOOSE EXERCISE"
        onClose={() => setPicker(false)}
      >
        <Field
          label="SEARCH"
          value={query}
          onChangeText={setQuery}
          placeholder="Bench, squat, curl…"
        />
        {exercises
          .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
          .map((e) => (
            <Pressable
              key={e.id}
              onPress={() => {
                setExerciseId(e.id);
                setPicker(false);
                setWeight("");
                setManualPairs(null);
              }}
              style={{
                minHeight: 53,
                justifyContent: "center",
                borderBottomWidth: 1,
                borderColor: C.line,
              }}
            >
              <T kind="bold">{e.name}</T>
              <T style={{ fontSize: 11, color: C.secondary, marginTop: 3 }}>
                {e.equipment}
              </T>
            </Pressable>
          ))}
      </Sheet>
    </Screen>
  );
}
