import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "../state/AppStore";
import {
  Button,
  C,
  Card,
  Chip,
  ErrorText,
  F,
  Icon,
  IconButton,
  Screen,
  Sheet,
  T,
  ui,
} from "../components/ui";
import { askCoach, type ContextChoice } from "../services/gemini";
import { readSleep } from "../services/health";
import { applyProposal, uid } from "../domain/plans";
import type { ChatMessage, Proposal } from "../domain/schema";
import { exerciseById, weekdays } from "../data/catalog";
import { fmt, toUnit } from "../domain/strength";
import { useKeyboardVisible } from "../hooks/useKeyboardVisible";

export default function CoachScreen() {
  const { data, commit, notify, saving, coachSeed, setCoachSeed } = useStore();
  const router = useRouter(),
    insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const draft = coachSeed ?? "",
    setDraft = setCoachSeed;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<ContextChoice>({
    profile: true,
    records: true,
    plan: true,
    rest: false,
  });
  const [proposal, setProposal] = useState<Proposal | null>(null),
    [review, setReview] = useState(false);
  const request = useRef<AbortController | null>(null),
    scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setProposal(null);
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 90000);
    const user: ChatMessage = {
      id: uid(),
      role: "user",
      text,
      date: new Date().toISOString(),
    };
    try {
      const sleep =
        choice.rest && data.profile.shareRest && data.profile.healthEnabled
          ? await readSleep()
          : null;
      const answer = await askCoach(
        data,
        choice,
        sleep,
        [...data.messages, user],
        controller.signal,
      );
      const model: ChatMessage = {
        id: uid(),
        role: "model",
        text: answer.reply,
        date: new Date().toISOString(),
      };
      await commit((current) => ({
        ...current,
        messages: [...current.messages, user, model].slice(-150),
      }));
      setDraft("");
      setProposal(answer.proposal);
      if (answer.proposal) setReview(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send this message.");
    } finally {
      clearTimeout(timer);
      request.current = null;
      setBusy(false);
    }
  }
  async function apply() {
    if (!proposal || saving) return;
    try {
      await commit((current) => applyProposal(current, proposal));
      setProposal(null);
      setReview(false);
      notify("Plan saved. Review it in Plans; earlier versions support Undo.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not apply this proposal.",
      );
      setReview(false);
    }
  }
  return (
    <Screen
      title="COACH"
      scroll={false}
      actions={
        <>
          <IconButton
            name="trash-2"
            label="Clear chat"
            onPress={() =>
              Alert.alert(
                "Clear this chat?",
                "Saved plans and PRs stay on your phone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear chat",
                    style: "destructive",
                    onPress: () => {
                      void commit((current) => ({
                        ...current,
                        messages: [],
                      })).catch(() => {});
                      setProposal(null);
                    },
                  },
                ],
              )
            }
          />
          <IconButton
            name="settings"
            label="Coach settings"
            onPress={() => router.push("/profile")}
          />
        </>
      }
    >
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scroll.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
      >
        <View style={[ui.row, { marginBottom: 5 }]}>
          <View
            style={{
              width: 7,
              height: 7,
              backgroundColor: C.accent,
              borderRadius: 4,
            }}
          />
          <T kind="label" style={{ color: C.secondary }}>
            {data.profile.geminiModel.replace(/-/g, " ").toUpperCase()}
          </T>
        </View>
        {!data.messages.length ? (
          <View style={{ paddingVertical: 24, gap: 18 }}>
            <T kind="title" style={{ fontSize: 48 }}>
              LET’S BUILD{"\n"}YOUR NEXT STEP.
            </T>
            <T style={{ color: C.secondary, lineHeight: 23 }}>
              Talk through your PRs, adjust a plan, or build something new. You
              review every plan change.
            </T>
            {[
              "Build a plan around my goals",
              "Review my saved plan",
              "Help me understand my PRs",
            ].map((text) => (
              <Pressable
                key={text}
                onPress={() => setDraft(text)}
                style={{
                  borderWidth: 1,
                  borderColor: C.line,
                  padding: 15,
                  borderRadius: 12,
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                <T style={{ flex: 1, fontSize: 13 }}>{text}</T>
                <Icon name="arrow-up-right" size={17} />
              </Pressable>
            ))}
          </View>
        ) : (
          data.messages.map((message) => (
            <View
              key={message.id}
              style={{
                alignSelf: message.role === "user" ? "flex-end" : "stretch",
                maxWidth: message.role === "user" ? "90%" : "100%",
                backgroundColor:
                  message.role === "user" ? C.raised : "transparent",
                padding: message.role === "user" ? 14 : 3,
                borderRadius: 15,
                gap: 9,
              }}
            >
              <T
                kind="label"
                style={{
                  color: message.role === "user" ? C.secondary : C.accent,
                }}
              >
                {message.role === "user" ? "YOU" : "PRISM COACH"}
              </T>
              <T selectable style={{ lineHeight: 23 }}>
                {message.text}
              </T>
            </View>
          ))
        )}
        {busy ? (
          <T accessibilityLiveRegion="polite" style={{ color: C.secondary }}>
            Coach is thinking…
          </T>
        ) : null}
        {proposal ? (
          <Card>
            <T kind="label" style={{ color: C.accent }}>
              PLAN PROPOSAL · NOT SAVED
            </T>
            <T style={{ marginVertical: 12, lineHeight: 22 }}>
              {proposal.summary}
            </T>
            <Button kind="secondary" onPress={() => setReview(true)}>
              Review proposal
            </Button>
          </Card>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </ScrollView>
      <View
        style={{
          marginTop: "auto",
          paddingTop: 10,
          paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 12) + 89,
          backgroundColor: C.bg,
          gap: 10,
        }}
      >
        <T kind="label" style={{ color: C.secondary, fontSize: 9 }}>
          SEND WITH MESSAGE · LAST 12 CHAT MESSAGES INCLUDED
        </T>
        <View style={ui.wrap}>
          {(["profile", "records", "plan"] as const).map((key) => (
            <Chip
              key={key}
              small
              label={
                key === "records"
                  ? "PRs"
                  : key === "profile"
                    ? "Profile"
                    : "Active plan"
              }
              selected={choice[key]}
              onPress={() =>
                setChoice((current) => ({ ...current, [key]: !current[key] }))
              }
            />
          ))}
          {data.profile.shareRest ? (
            <Chip
              small
              label="Rest"
              selected={choice.rest}
              onPress={() =>
                setChoice((current) => ({ ...current, rest: !current.rest }))
              }
            />
          ) : null}
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-end",
            backgroundColor: C.surface,
            padding: 7,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 25,
          }}
        >
          <TextInput
            accessibilityLabel="Message Coach"
            placeholder="Ask your coach…"
            placeholderTextColor={C.muted}
            multiline
            maxLength={4000}
            value={draft}
            onChangeText={setDraft}
            style={{
              flex: 1,
              color: C.text,
              fontFamily: F.body,
              paddingHorizontal: 12,
              paddingVertical: 9,
              minHeight: 40,
              maxHeight: 110,
              fontSize: 14,
            }}
          />
          <IconButton
            name={busy ? "square" : "arrow-up"}
            accent
            label={busy ? "Stop request" : "Send message"}
            onPress={() => (busy ? request.current?.abort() : void send())}
          />
        </View>
      </View>
      <Sheet
        visible={review && !!proposal}
        title="REVIEW PLAN CHANGE"
        onClose={() => setReview(false)}
      >
        {proposal ? (
          <>
            <T kind="label" style={{ color: C.accent }}>
              {proposal.basePlanId
                ? "REPLACES ACTIVE PLAN AFTER CONFIRMATION"
                : "CREATES NEW PLAN AFTER CONFIRMATION"}
            </T>
            <T kind="title" style={{ fontSize: 32, marginTop: 15 }}>
              {proposal.name}
            </T>
            <T
              style={{ color: C.secondary, lineHeight: 22, marginVertical: 14 }}
            >
              {proposal.summary}
            </T>
            {proposal.days.map((day, index) => (
              <Card key={index} style={{ marginBottom: 10 }}>
                <T kind="bold">
                  {weekdays[day.weekday]} · {day.name}
                </T>
                {day.exercises.map((exercise, i) => (
                  <T
                    key={i}
                    style={{ fontSize: 12, color: C.secondary, lineHeight: 23 }}
                  >
                    {exerciseById[exercise.exerciseId].name} · {exercise.sets}×
                    {exercise.repsMin}–{exercise.repsMax} ·{" "}
                    {exercise.weightKg
                      ? `${fmt(toUnit(exercise.weightKg, data.profile.unit))} ${data.profile.unit}`
                      : "Load unset"}{" "}
                    · {exercise.restSeconds}s rest
                  </T>
                ))}
              </Card>
            ))}
            <Button
              loading={saving}
              onPress={() => {
                void apply();
              }}
            >
              CONFIRM & SAVE PLAN
            </Button>
            <Button
              kind="ghost"
              onPress={() => {
                setProposal(null);
                setReview(false);
                notify("Proposal dismissed. No plan changes saved.");
              }}
            >
              Discard proposal
            </Button>
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
