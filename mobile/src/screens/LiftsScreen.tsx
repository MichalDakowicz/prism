import { useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../state/AppStore";
import {
  bestRecord,
  estimatedMax,
  fmt,
  scoreRecord,
  toUnit,
} from "../domain/strength";
import { exercises, exerciseById } from "../data/catalog";
import { LoadedBar } from "../components/LoadedBar";
import { FitnessVoltScore } from "../components/FitnessVoltScore";
import {
  cachedFitnessVolt,
  fitnessVoltLifts,
  fitnessVoltBadge,
} from "../domain/fitnessVolt";
import {
  Button,
  C,
  Card,
  Empty,
  IconButton,
  Screen,
  SectionLabel,
  T,
  ui,
} from "../components/ui";
import type { LiftRecord } from "../domain/schema";

export default function LiftsScreen() {
  const { data } = useStore(),
    router = useRouter(),
    { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const unit = data.profile.unit;
  const cards = exercises
    .map((ex) => ({ ex, record: bestRecord(data.records, ex.id) }))
    .filter((x): x is { ex: (typeof exercises)[number]; record: LiftRecord } =>
      Boolean(x.record),
    );
  const current = cards[Math.min(page, Math.max(cards.length - 1, 0))];
  const score = current ? scoreRecord(current.record, data.standards) : null;
  const cardWidth = Math.min(350, width - 60);
  const recent = data.records
    .filter((x) => !x.archivedAt)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  return (
    <Screen
      title="LIFTS"
      actions={
        <View style={ui.row}>
          <IconButton
            name="settings"
            label="Profile and settings"
            onPress={() => router.push("/profile")}
          />
          <IconButton
            accent
            name="plus"
            label="Log a new PR"
            onPress={() => router.push("/add-pr")}
          />
        </View>
      }
    >
      {!cards.length ? (
        <>
          <Empty
            title={"YOUR NEXT\nPERSONAL BEST."}
            body="Keep your strongest lifts, see your progress, and build plans around your body."
            action={
              <Button onPress={() => router.push("/add-pr")}>
                ADD YOUR FIRST PR
              </Button>
            }
          />
          <Card>
            <LoadedBar weightKg={20} style={data.profile.plateStyle} />
            <T
              kind="label"
              style={{ color: C.secondary, textAlign: "center", marginTop: 16 }}
            >
              TYPE THE WEIGHT. OR LOAD THE BAR.
            </T>
          </Card>
          <View style={{ height: 22 }} />
          <Button kind="secondary" onPress={() => router.push("/profile")}>
            Set up your training profile
          </Button>
        </>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + 10}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) =>
              setPage(
                Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 10)),
              )
            }
            contentContainerStyle={{ gap: 10, paddingRight: 15 }}
            style={{ marginRight: -20 }}
          >
            {cards.map(({ ex, record }) => {
              const result = scoreRecord(record, data.standards);
              const fv = cachedFitnessVolt(
                record,
                data.profile,
                data.fitnessVolt,
              );
              return (
                <Pressable
                  key={ex.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.name}, open history`}
                  onPress={() =>
                    router.push({
                      pathname: "/lift/[id]",
                      params: { id: ex.id },
                    })
                  }
                  style={{
                    width: cardWidth,
                    backgroundColor: C.surface,
                    borderWidth: 1,
                    borderColor: C.line,
                    borderRadius: 10,
                    padding: 16,
                    gap: 15,
                  }}
                >
                  <View style={{ gap: 5 }}>
                    <T kind="label">{ex.name.toUpperCase()}</T>
                    <T
                      kind="label"
                      style={{ fontSize: 10, color: C.secondary }}
                    >
                      {record.reps === 1
                        ? "MEASURED SINGLE"
                        : `${record.reps} REPS · EST. 1RM ${fmt(toUnit(estimatedMax(record.weightKg, record.reps), unit))} ${unit.toUpperCase()}`}
                    </T>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 5,
                      }}
                    >
                      <T
                        kind="display"
                        style={{
                          fontSize:
                            String(fmt(toUnit(record.weightKg, unit))).length >
                            4
                              ? 76
                              : 100,
                          lineHeight: 110,
                        }}
                      >
                        {fmt(toUnit(record.weightKg, unit))}
                      </T>
                      <T kind="title" style={{ fontSize: 24 }}>
                        {unit.toUpperCase()}
                      </T>
                    </View>
                    <View
                      style={{ alignItems: "flex-end", gap: 7, flexShrink: 1 }}
                    >
                      <T
                        kind="label"
                        style={{
                          fontSize: 10,
                          color: result ? C.bg : C.secondary,
                          backgroundColor: result ? C.accent : C.raised,
                          paddingHorizontal: 7,
                          paddingVertical: 5,
                          borderRadius: 4,
                        }}
                      >
                        {result
                          ? result.label.toUpperCase()
                          : fv
                            ? fitnessVoltBadge(
                                fv,
                                data.profile.strengthScoreSource,
                              )
                            : fitnessVoltLifts[record.exerciseId]
                              ? "GET SCORE"
                              : "BW RATIO"}
                      </T>
                      <T kind="label" style={{ fontSize: 11 }}>
                        {fmt(
                          estimatedMax(record.weightKg, record.reps) /
                            record.bodyweightKg,
                          2,
                        )}{" "}
                        × BW
                      </T>
                    </View>
                  </View>
                  {ex.type === "barbell" ? (
                    <LoadedBar
                      weightKg={record.weightKg}
                      barKg={record.plateLoad?.barKg}
                      pairsKg={record.plateLoad?.pairsKg}
                      unit={unit}
                      style={data.profile.plateStyle}
                      height={100}
                    />
                  ) : (
                    <T
                      style={{
                        color: C.secondary,
                        fontSize: 12,
                        paddingVertical: 12,
                      }}
                    >
                      {ex.type === "dumbbell"
                        ? "Weight per dumbbell"
                        : ex.type === "bodyweight"
                          ? "Additional load recorded"
                          : "Recorded equipment load"}
                    </T>
                  )}
                  <T kind="label" style={{ fontSize: 10, color: C.secondary }}>
                    {new Date(record.date).toLocaleDateString()} · BW{" "}
                    {fmt(toUnit(record.bodyweightKg, unit))}{" "}
                    {unit.toUpperCase()}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              marginVertical: 17,
            }}
          >
            {cards.map(({ ex }, i) => (
              <View
                key={ex.id}
                style={{
                  width: i === page ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === page ? C.accent : "#3A3A42",
                }}
              />
            ))}
          </View>
          <Card>
            {score?.next ? (
              <>
                <T kind="label" style={{ color: C.secondary }}>
                  NEXT TIER · {score.next.tier.toUpperCase()}
                </T>
                <T kind="title" style={{ fontSize: 36, marginTop: 5 }}>
                  +{fmt(toUnit(score.next.gapKg, unit))} {unit.toUpperCase()}
                </T>
                <T style={{ fontSize: 12, color: C.secondary }}>
                  At {fmt(toUnit(score.next.weightKg, unit))} {unit} ·{" "}
                  {score.source}
                </T>
              </>
            ) : (
              <>
                <T kind="label" style={{ color: C.secondary }}>
                  STRENGTH IN CONTEXT
                </T>
                <T kind="title" style={{ fontSize: 28, marginTop: 8 }}>
                  {score ? "TOP TIER REACHED" : "YOUR LIFT. YOUR BODYWEIGHT."}
                </T>
                <T
                  style={{
                    fontSize: 12,
                    color: C.secondary,
                    lineHeight: 20,
                    marginTop: 5,
                  }}
                >
                  {score
                    ? "Keep the record, keep moving forward."
                    : current && fitnessVoltLifts[current.record.exerciseId]
                      ? "Get a FitnessVolt ranking below, or import your own standards in Profile. Bodyweight ratios use your saved PR snapshot."
                      : "Bodyweight ratios use your saved PR snapshot. Custom standards can be imported in Profile for this exercise."}
                </T>
              </>
            )}
          </Card>
          {current ? (
            <FitnessVoltScore key={current.record.id} record={current.record} />
          ) : null}
          <SectionLabel>RECENT PRS</SectionLabel>
          {recent.map((record) => (
            <Pressable
              key={record.id}
              onPress={() =>
                router.push({
                  pathname: "/lift/[id]",
                  params: { id: record.exerciseId },
                })
              }
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
                minHeight: 54,
                borderBottomWidth: 1,
                borderColor: C.line,
              }}
            >
              <T
                kind="label"
                style={{ fontSize: 10, color: C.secondary, width: 48 }}
              >
                {new Date(record.date)
                  .toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                  })
                  .toUpperCase()}
              </T>
              <T kind="bold" style={{ flex: 1, fontSize: 13 }}>
                {exerciseById[record.exerciseId].name}
              </T>
              <T kind="label" style={{ fontSize: 12 }}>
                {fmt(toUnit(record.weightKg, unit))} × {record.reps}
              </T>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
