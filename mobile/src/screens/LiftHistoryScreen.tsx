import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { useState } from "react";
import { useStore } from "../state/AppStore";
import { exerciseById } from "../data/catalog";
import {
  bestRecord,
  estimatedMax,
  estimationMethod,
  fmt,
  scoreRecord,
  toUnit,
} from "../domain/strength";
import { tiers, type LiftRecord } from "../domain/schema";
import { LoadedBar } from "../components/LoadedBar";
import { FitnessVoltScore } from "../components/FitnessVoltScore";
import {
  cachedFitnessVolt,
  fitnessVoltLifts,
  fitnessVoltBadge,
} from "../domain/fitnessVolt";
import { archiveRecord } from "../domain/records";
import { RecordOptions } from "../components/RecordOptions";
import { PrVideoView } from "../components/PrVideo";
import {
  Button,
  C,
  Card,
  Empty,
  IconButton,
  Screen,
  SectionLabel,
  Sheet,
  T,
  ui,
} from "../components/ui";

export default function LiftHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, commit, notify } = useStore(),
    router = useRouter();
  const [archive, setArchive] = useState<string | null>(null);
  const ex = exerciseById[id],
    unit = data.profile.unit,
    records = data.records
      .filter((x) => x.exerciseId === id && !x.archivedAt)
      .sort((a, b) => b.date.localeCompare(a.date));
  const best = bestRecord(records, id),
    result = best ? scoreRecord(best, data.standards) : null;
  const fv = best
    ? cachedFitnessVolt(best, data.profile, data.fitnessVolt)
    : undefined;
  function removeEntry(record: LiftRecord) {
    Alert.alert(
      "Remove PR entry?",
      `${fmt(toUnit(record.weightKg, unit))} ${unit} × ${record.reps} · ${new Date(record.date).toLocaleDateString()}. Only this entry is removed; the rest of this lift’s history stays. Restore it from Profile → Archived PRs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove entry",
          style: "destructive",
          onPress: () => {
            void commit((current) => archiveRecord(current, record.id))
              .then(() => {
                setArchive(null);
                notify(
                  "PR entry removed. Restore it in Profile → Archived PRs.",
                );
              })
              .catch(() => {});
          },
        },
      ],
    );
  }
  if (!ex)
    return (
      <Screen title="LIFT" back>
        <Empty title="LIFT NOT FOUND" body="Choose an exercise from Lifts." />
      </Screen>
    );
  const measured = records
    .filter((r) => r.reps === 1)
    .sort((a, b) => a.date.localeCompare(b.date));
  const estimated = records
    .filter((r) => r.reps > 1)
    .sort((a, b) => a.date.localeCompare(b.date));
  const all = [...measured, ...estimated],
    dates = all.map((x) => Date.parse(x.date)),
    values = all.map((x) => toUnit(estimatedMax(x.weightKg, x.reps), unit));
  const minDate = Math.min(...dates),
    maxDate = Math.max(...dates),
    min = Math.min(...values) * 0.9,
    max = Math.max(...values) * 1.05;
  const point = (r: (typeof records)[number]) => ({
    x: 24 + ((Date.parse(r.date) - minDate) / (maxDate - minDate || 1)) * 272,
    y:
      124 -
      ((toUnit(estimatedMax(r.weightKg, r.reps), unit) - min) /
        (max - min || 1)) *
        100,
  });
  return (
    <Screen
      title={ex.name.toUpperCase()}
      back
      actions={
        <View style={ui.row}>
          <IconButton
            accent
            name="plus"
            label="Add PR for this lift"
            onPress={() =>
              router.push({ pathname: "/add-pr", params: { exerciseId: id } })
            }
          />
        </View>
      }
    >
      {!best ? (
        <Empty
          title="NO RECORDS YET"
          body="Add your first PR for this exercise."
          action={
            <Button
              onPress={() =>
                router.push({ pathname: "/add-pr", params: { exerciseId: id } })
              }
            >
              ADD PR
            </Button>
          }
        />
      ) : (
        <>
          <T kind="label" style={{ color: C.secondary }}>
            {best.reps === 1
              ? "BEST MEASURED SINGLE"
              : "BEST AVAILABLE REP RECORD"}
          </T>
          <T
            kind="label"
            style={{ color: C.secondary, fontSize: 10, marginTop: 6 }}
          >
            {new Date(best.date).toLocaleDateString()} · BW{" "}
            {fmt(toUnit(best.bodyweightKg, unit))} {unit.toUpperCase()}
          </T>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 8,
              marginTop: 8,
            }}
          >
            <T kind="display" style={{ fontSize: 100 }}>
              {fmt(toUnit(best.weightKg, unit))}
            </T>
            <T kind="title" style={{ fontSize: 28 }}>
              {unit.toUpperCase()}
              {best.reps > 1 ? ` × ${best.reps}` : ""}
            </T>
          </View>
          <View style={ui.row}>
            <T
              kind="label"
              style={{
                backgroundColor: result ? C.accent : C.raised,
                color: result ? C.bg : C.secondary,
                padding: 6,
                borderRadius: 4,
              }}
            >
              {result
                ? result.label.toUpperCase()
                : fv
                  ? fitnessVoltBadge(fv, data.profile.strengthScoreSource)
                  : fitnessVoltLifts[id]
                    ? "FITNESSVOLT SCORE BELOW"
                    : "BODYWEIGHT RATIO"}
            </T>
            <T kind="label">
              {fmt(
                estimatedMax(best.weightKg, best.reps) / best.bodyweightKg,
                2,
              )}{" "}
              × BW
            </T>
          </View>
          {ex.type === "barbell" ? (
            <View style={{ marginTop: 16 }}>
              <LoadedBar
                weightKg={best.weightKg}
                barKg={best.plateLoad?.barKg}
                pairsKg={best.plateLoad?.pairsKg}
                style={data.profile.plateStyle}
                unit={unit}
              />
            </View>
          ) : null}
          <SectionLabel>PROGRESS · {unit.toUpperCase()}</SectionLabel>
          <View style={{ flexDirection: "row", gap: 18, marginBottom: 7 }}>
            <T kind="label">● MEASURED</T>
            <T kind="label" style={{ color: C.accent }}>
              ● ESTIMATE
            </T>
          </View>
          <Svg
            viewBox="0 0 320 155"
            width="100%"
            height={165}
            accessibilityRole="image"
            accessibilityLabel="Measured and estimated single-rep progress. All entries are listed below."
          >
            <Line x1={24} x2={304} y1={125} y2={125} stroke="#2A2A31" />
            {[measured, estimated].map((group, index) => (
              <Polyline
                key={index}
                points={group
                  .map((r) => {
                    const p = point(r);
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={index ? C.accent : C.text}
                strokeWidth={2}
              />
            ))}
            {all.map((r) => {
              const p = point(r);
              return (
                <Circle
                  key={r.id}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={r.reps === 1 ? C.text : C.accent}
                />
              );
            })}
            <SvgText x={24} y={148} fill={C.secondary} fontSize={10}>
              {new Date(minDate).toLocaleDateString()}
            </SvgText>
            <SvgText
              x={303}
              y={148}
              fill={C.secondary}
              fontSize={10}
              textAnchor="end"
            >
              {new Date(maxDate).toLocaleDateString()}
            </SvgText>
          </Svg>
          {best.video ? (
            <PrVideoView
              key={best.id + JSON.stringify(best.video)}
              video={best.video}
            />
          ) : null}
          <SectionLabel>ENTRIES · TAP TO MANAGE</SectionLabel>
          {records.map((record) => (
            <View
              key={record.id}
              style={{
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderColor: C.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Pressable
                onPress={() => setArchive(record.id)}
                accessibilityLabel={`Manage PR entry ${fmt(toUnit(record.weightKg, unit))} ${unit} by ${record.reps} on ${new Date(record.date).toLocaleDateString()}`}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 48,
                }}
              >
                <T
                  kind="label"
                  style={{ fontSize: 10, color: C.secondary, width: 52 }}
                >
                  {new Date(record.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                  })}
                </T>
                <View style={{ flex: 1 }}>
                  <T kind="bold">
                    {fmt(toUnit(record.weightKg, unit))} × {record.reps}
                    {record.reps > 1
                      ? ` ≈ ${fmt(toUnit(estimatedMax(record.weightKg, record.reps), unit))}`
                      : ""}
                  </T>
                  <T
                    kind="label"
                    style={{ fontSize: 9, color: C.secondary, marginTop: 4 }}
                  >
                    BW {fmt(toUnit(record.bodyweightKg, unit))}
                    {record.video ? " · VIDEO" : ""}
                  </T>
                </View>
                <T
                  kind="label"
                  style={{
                    fontSize: 9,
                    color: record.reps > 1 ? C.accent : C.text,
                  }}
                >
                  {record.reps === 1 ? "MEASURED" : "ESTIMATE"}
                </T>
              </Pressable>
              <IconButton
                name="trash-2"
                label={`Remove PR entry ${fmt(toUnit(record.weightKg, unit))} ${unit} by ${record.reps} on ${new Date(record.date).toLocaleDateString()}`}
                onPress={() => removeEntry(record)}
              />
            </View>
          ))}
          <FitnessVoltScore key={best.id} record={best} />
          <SectionLabel>
            STANDARDS AT {fmt(toUnit(best.bodyweightKg, unit))}{" "}
            {unit.toUpperCase()}
          </SectionLabel>
          {result ? (
            <Card>
              {tiers.map((tier, i) => (
                <View
                  key={tier}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                  }}
                >
                  <T
                    kind="label"
                    style={{
                      color: result.index === i ? C.accent : C.secondary,
                    }}
                  >
                    {tier.toUpperCase()}
                    {result.index === i ? " · YOU" : ""}
                  </T>
                  <T kind="label">{fmt(toUnit(result.thresholds[i], unit))}</T>
                </View>
              ))}
              <T
                style={{
                  fontSize: 11,
                  color: C.secondary,
                  lineHeight: 18,
                  marginTop: 10,
                }}
              >
                {result.source} ·{" "}
                {result.ageAdjusted ? "Age-group table" : "Age not adjusted"} ·
                Linear bodyweight interpolation
              </T>
            </Card>
          ) : (
            <T style={{ fontSize: 12, color: C.secondary, lineHeight: 20 }}>
              Custom standards are optional. Import your own matching table in
              Profile
              {fitnessVoltLifts[id]
                ? ", or use the FitnessVolt ranking above."
                : ". FitnessVolt does not support this exact exercise variant."}
            </T>
          )}
          <T
            style={{
              fontSize: 11,
              color: C.muted,
              lineHeight: 18,
              marginTop: 20,
            }}
          >
            Estimates: {estimationMethod}. An estimate is not a measured single.
          </T>
        </>
      )}
      <Sheet
        visible={archive !== null}
        title="RECORD OPTIONS"
        onClose={() => setArchive(null)}
      >
        {archive && records.find((r) => r.id === archive) ? (
          <RecordOptions
            key={archive}
            record={records.find((r) => r.id === archive)!}
            onClose={() => setArchive(null)}
            onRemove={() => removeEntry(records.find((r) => r.id === archive)!)}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
