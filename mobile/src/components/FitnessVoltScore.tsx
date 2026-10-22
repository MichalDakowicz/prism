import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useStore } from "../state/AppStore";
import type { LiftRecord } from "../domain/schema";
import {
  FITNESS_VOLT_URL,
  fitnessVoltInput,
  fitnessVoltKey,
  fitnessVoltLifts,
  fitnessVoltDisplay,
} from "../domain/fitnessVolt";
import { fetchFitnessVolt } from "../services/fitnessVolt";
import { fmt, toUnit } from "../domain/strength";
import { Button, C, Card, Chip, ErrorText, T, ui } from "./ui";

export function FitnessVoltScore({ record }: { record: LiftRecord }) {
  const { data, commit } = useStore();
  const [group, setGroup] = useState<"male" | "female" | null>(() =>
      !data.profile.comparisonGroup
        ? (data.fitnessVolt.filter((item) => item.recordId === record.id).at(-1)
            ?.sex ?? null)
        : null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (!fitnessVoltLifts[record.exerciseId]) return null;
  const input = fitnessVoltInput(record, data.profile, group);
  const result = input
    ? data.fitnessVolt.find((item) => item.key === fitnessVoltKey(input))
    : undefined;
  const cacheFresh =
    result && now - Date.parse(result.fetchedAt) < 60 * 60 * 1000;
  const display = fitnessVoltDisplay(result, data.profile.strengthScoreSource);
  async function lookup() {
    if (!input || busy) return;
    setBusy(true);
    setError(null);
    const request = new AbortController();
    controller.current = request;
    const timer = setTimeout(() => request.abort(), 25000);
    try {
      const next = await fetchFitnessVolt(input, request.signal);
      await commit((current) => ({
        ...current,
        fitnessVolt: [
          ...current.fitnessVolt.filter((item) => item.key !== next.key),
          next,
        ].slice(-300),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get this ranking.");
    } finally {
      clearTimeout(timer);
      controller.current = null;
      setBusy(false);
    }
  }
  return (
    <Card style={{ marginTop: 16 }}>
      <T kind="label" style={{ color: C.secondary }}>
        FITNESSVOLT · {display.label.toUpperCase()} RANKING
      </T>
      {result ? (
        <>
          <View style={[ui.row, { marginTop: 13, alignItems: "baseline" }]}>
            <T kind="display" style={{ fontSize: 62 }}>
              {display.score === null ? "—" : fmt(display.score)}
            </T>
            <T kind="label" style={{ color: C.secondary }}>
              / 100
            </T>
            <T kind="bold" style={{ color: C.accent, marginLeft: "auto" }}>
              {display.tier ?? display.label}
            </T>
          </View>
          <T style={{ fontSize: 11, color: C.secondary, marginBottom: 14 }}>
            {display.score === null
              ? `${display.label} data is unavailable for this lift. Choose ${data.profile.strengthScoreSource === "gym" ? "Competition" : "Gym"} in Profile to view the other population.`
              : `Headline number uses ${data.profile.strengthScoreSource === "gym" ? "self-reported gym lifts" : "verified competition results"}. Change it in Profile → Strength score.`}
          </T>
          {result.verified ? (
            <View style={{ marginBottom: 12 }}>
              <T kind="bold" style={{ fontSize: 13 }}>
                Competition · percentile {fmt(result.verified.percentile)}
              </T>
              <T style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>
                {result.verified.source} ·{" "}
                {result.verified.sample_size.toLocaleString()} results · Raw
                equipment
              </T>
            </View>
          ) : null}
          {result.gym ? (
            <View style={{ marginBottom: 12 }}>
              <T kind="bold" style={{ fontSize: 13 }}>
                Gym · percentile {fmt(result.gym.percentile)}
              </T>
              <T style={{ fontSize: 11, color: C.secondary, marginTop: 4 }}>
                {result.gym.source} · {result.gym.sample_size.toLocaleString()}{" "}
                self-reports
              </T>
            </View>
          ) : null}
          <T
            style={{
              fontSize: 10,
              color: C.secondary,
              lineHeight: 17,
              marginBottom: 12,
            }}
          >
            {result.sex} · BW{" "}
            {fmt(toUnit(result.bodyweightKg, data.profile.unit))}{" "}
            {data.profile.unit} · {record.reps > 1 ? "Estimated" : "Measured"}{" "}
            1RM {fmt(toUnit(result.e1rmKg, data.profile.unit))}{" "}
            {data.profile.unit}
            {result.age !== null ? ` · Age ${result.age}` : ""}
            {"\n"}Saved {new Date(result.fetchedAt).toLocaleString()}.
            Competition ranks are not age-adjusted; gym may use age.
          </T>
        </>
      ) : (
        <T
          style={{
            color: C.secondary,
            fontSize: 12,
            lineHeight: 21,
            marginVertical: 13,
          }}
        >
          Compare this PR with sourced competition and self-reported gym data.
          Headline number uses {display.label.toLowerCase()} rankings, chosen in
          Profile → Strength score. Results stay available after lookup.
        </T>
      )}
      {!record.comparisonGroup && !data.profile.comparisonGroup ? (
        <>
          <T kind="label" style={{ color: C.secondary, marginVertical: 10 }}>
            COMPARISON GROUP FOR THIS LOOKUP
          </T>
          <View style={[ui.wrap, { marginBottom: 12 }]}>
            {(["male", "female"] as const).map((value) => (
              <Chip
                key={value}
                label={value === "male" ? "Male" : "Female"}
                selected={group === value}
                onPress={() => setGroup(value)}
              />
            ))}
          </View>
        </>
      ) : null}
      {!result ? (
        <T
          style={{
            color: C.secondary,
            fontSize: 10,
            lineHeight: 18,
            marginBottom: 12,
          }}
        >
          Sends this lift, saved bodyweight, comparison group and optional age
          to FitnessVolt when you tap Get score. Age/group use Profile only when
          absent on the PR.
        </T>
      ) : null}
      <Button
        kind="secondary"
        loading={busy}
        disabled={!input || !!cacheFresh}
        onPress={() => {
          void lookup();
        }}
      >
        {cacheFresh
          ? "Saved result · refresh available after 1 hour"
          : result
            ? "Refresh FitnessVolt score"
            : "Get FitnessVolt score"}
      </Button>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <T
        style={{
          fontSize: 10,
          color: C.secondary,
          lineHeight: 17,
          marginTop: 10,
        }}
      >
        API rankings compare the stated population. They differ from
        FitnessVolt’s editorial five-level standards tables.
      </T>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Powered by FitnessVolt — data and CC BY 4.0 license"
        onPress={() => {
          void Linking.openURL(FITNESS_VOLT_URL);
        }}
        style={{ minHeight: 44, justifyContent: "center", marginTop: 4 }}
      >
        <T
          style={{
            fontSize: 11,
            color: C.accent,
            textDecorationLine: "underline",
          }}
        >
          Powered by FitnessVolt · CC BY 4.0 ↗
        </T>
      </Pressable>
    </Card>
  );
}
