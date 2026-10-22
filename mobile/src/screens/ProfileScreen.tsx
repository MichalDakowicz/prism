import { useEffect, useState } from "react";
import { Alert, Linking, Switch, View } from "react-native";
import {
  Button,
  C,
  Card,
  Chip,
  ErrorText,
  Field,
  IconButton,
  Screen,
  SectionLabel,
  Segmented,
  Sheet,
  T,
  ui,
} from "../components/ui";
import { useStore } from "../state/AppStore";
import {
  profileSchema,
  type AppData,
  type Profile,
  type Unit,
} from "../domain/schema";
import { validateBackup } from "../domain/backup";
import {
  fmt,
  fromUnit,
  parseNumber,
  toUnit,
  validateStandards,
} from "../domain/strength";
import { clearApiKey, getApiKey, saveApiKey } from "../services/credentials";
import { verifyGeminiKey } from "../services/gemini";
import { exportBackup, pickJson } from "../services/files";
import { connectSleep, readSleep, type SleepSummary } from "../services/health";
import { exerciseById } from "../data/catalog";

const equipmentOptions = [
  "Barbell",
  "Dumbbells",
  "Cables",
  "Machines",
  "Pull-up bar",
];
function Toggle({
  label,
  hint,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
        marginVertical: 9,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <T kind="bold">{label}</T>
        <T style={{ color: C.secondary, fontSize: 11, lineHeight: 18 }}>
          {hint}
        </T>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#33333C", true: "#8D7409" }}
        thumbColor={value ? C.accent : "#AAA9B1"}
      />
    </View>
  );
}
const errorMessage = (e: unknown) =>
  e instanceof Error
    ? "issues" in e
      ? "Check your entries: age 13–110, positive bodyweight, 1–7 days and session length 10–240 minutes."
      : e.message
    : "Could not complete this action.";
export default function ProfileScreen() {
  const { data, commit, restore, saving, notify } = useStore();
  const [draft, setDraft] = useState<Profile>({ ...data.profile });
  const [preferred, setPreferred] = useState(
    data.profile.preferredExercises.join(", "),
  );
  const [avoided, setAvoided] = useState(
    data.profile.avoidedExercises.join(", "),
  );
  const [weight, setWeight] = useState(
    data.profile.bodyweightKg
      ? fmt(toUnit(data.profile.bodyweightKg, data.profile.unit), 2)
      : "",
  );
  const [age, setAge] = useState(data.profile.age?.toString() ?? ""),
    [years, setYears] = useState(
      data.profile.experienceYears?.toString() ?? "",
    );
  const [days, setDays] = useState(String(data.profile.daysPerWeek)),
    [minutes, setMinutes] = useState(String(data.profile.sessionMinutes));
  const [key, setKey] = useState(""),
    [hasKey, setHasKey] = useState(false),
    [keyBusy, setKeyBusy] = useState(false),
    [healthBusy, setHealthBusy] = useState(false);
  const [sleep, setSleep] = useState<SleepSummary | null>(null),
    [healthStatus, setHealthStatus] = useState("No sleep read yet.");
  const [error, setError] = useState<string | null>(null),
    [pendingBackup, setPendingBackup] = useState<AppData | null>(null);
  useEffect(() => {
    void getApiKey()
      .then((value) => setHasKey(!!value))
      .catch(() => setError("Secure storage is unavailable."));
  }, []);
  function change<K extends keyof Profile>(name: K, value: Profile[K]) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  function loadProfileFields(profile: Profile) {
    setDraft({ ...profile });
    setWeight(
      profile.bodyweightKg
        ? fmt(toUnit(profile.bodyweightKg, profile.unit), 2)
        : "",
    );
    setAge(profile.age?.toString() ?? "");
    setYears(profile.experienceYears?.toString() ?? "");
    setDays(String(profile.daysPerWeek));
    setMinutes(String(profile.sessionMinutes));
    setPreferred(profile.preferredExercises.join(", "));
    setAvoided(profile.avoidedExercises.join(", "));
    setSleep(null);
    setHealthStatus("No sleep read yet.");
  }
  function changeUnit(unit: Unit) {
    const value = parseNumber(weight);
    if (Number.isFinite(value))
      setWeight(fmt(toUnit(fromUnit(value, draft.unit), unit), 2));
    change("unit", unit);
  }
  async function save() {
    try {
      setError(null);
      const profile = profileSchema.parse({
        ...draft,
        preferredExercises: preferred
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        avoidedExercises: avoided
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        bodyweightKg: weight.trim()
          ? fromUnit(parseNumber(weight), draft.unit)
          : null,
        age: age.trim() ? parseNumber(age) : null,
        experienceYears: years.trim() ? parseNumber(years) : null,
        daysPerWeek: parseNumber(days),
        sessionMinutes: parseNumber(minutes),
        healthEnabled: data.profile.healthEnabled,
      });
      await commit((current) => ({ ...current, profile }));
      notify("Profile saved. Existing PR snapshots stay unchanged.");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function saveKey() {
    setKeyBusy(true);
    setError(null);
    try {
      const value = key.trim() || (await getApiKey());
      if (!value) throw new Error("Enter your Gemini key.");
      await verifyGeminiKey(value, draft.geminiModel);
      await saveApiKey(value);
      await commit((current) => ({
        ...current,
        profile: { ...current.profile, geminiModel: draft.geminiModel },
      }));
      setKey("");
      setHasKey(true);
      notify("Gemini connected. Key saved securely on this phone.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setKeyBusy(false);
    }
  }
  async function connect() {
    setHealthBusy(true);
    setError(null);
    try {
      await connectSleep();
      await commit((current) => ({
        ...current,
        profile: { ...current.profile, healthEnabled: true },
      }));
      change("healthEnabled", true);
      setHealthStatus(
        "Sleep access enabled. Tap Read latest session to check available data.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setHealthBusy(false);
    }
  }
  async function readLatest() {
    setHealthBusy(true);
    setError(null);
    try {
      const result = await readSleep();
      setSleep(result);
      setHealthStatus(
        result
          ? "Latest sleep session in the last 48 hours."
          : "No sleep session found in the last 48 hours. Missing data does not mean poor rest. Check that your Xiaomi companion app writes sleep to Health Connect.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setHealthBusy(false);
    }
  }
  async function importStandards() {
    try {
      setError(null);
      const input = await pickJson();
      if (input === null) return;
      const standards = validateStandards(input);
      await commit((current) => ({ ...current, standards }));
      notify(
        `Imported ${standards.tables.length} standards tables from ${standards.source}.`,
      );
    } catch (e) {
      setError(
        e instanceof Error && "issues" in e
          ? "This is not a valid PRISM standards file. See the standards format in project docs."
          : errorMessage(e),
      );
    }
  }
  async function chooseBackup() {
    try {
      setError(null);
      const input = await pickJson();
      if (input !== null) setPendingBackup(validateBackup(input));
    } catch (e) {
      setError(
        e instanceof Error && "issues" in e
          ? "This file is not a supported PRISM backup. Current data has not changed."
          : errorMessage(e),
      );
    }
  }
  return (
    <Screen
      title="PROFILE"
      back
      bottomPadding={35}
      actions={
        <IconButton
          accent
          name="check"
          label="Save profile"
          onPress={() => {
            void save();
          }}
        />
      }
    >
      <T style={{ fontSize: 12, color: C.secondary, lineHeight: 21 }}>
        Stored on this phone. Coach reads the context you choose.
      </T>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <SectionLabel>BODY</SectionLabel>
      <Card>
        <View
          style={[
            ui.row,
            { justifyContent: "space-between", marginBottom: 18 },
          ]}
        >
          <T kind="bold">Units</T>
          <Segmented
            value={draft.unit}
            onChange={changeUnit}
            options={[
              { value: "kg", label: "KG" },
              { value: "lb", label: "LB" },
            ]}
          />
        </View>
        <Field
          label={`BODYWEIGHT (${draft.unit.toUpperCase()})`}
          hint="Copied into each new PR. Earlier records keep their own bodyweight."
          keyboardType="decimal-pad"
          placeholder="Add bodyweight"
          value={weight}
          onChangeText={setWeight}
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="AGE (OPTIONAL)"
              keyboardType="number-pad"
              placeholder="Age"
              value={age}
              onChangeText={setAge}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="YEARS TRAINING"
              keyboardType="decimal-pad"
              placeholder="Optional"
              value={years}
              onChangeText={setYears}
            />
          </View>
        </View>
        <T kind="label" style={{ color: C.secondary, marginBottom: 10 }}>
          STANDARDS COMPARISON GROUP
        </T>
        <View style={ui.wrap}>
          {([null, "male", "female"] as const).map((value) => (
            <Chip
              key={value ?? "unset"}
              label={
                value === null
                  ? "Not set"
                  : value === "male"
                    ? "Male"
                    : "Female"
              }
              selected={draft.comparisonGroup === value}
              onPress={() => change("comparisonGroup", value)}
            />
          ))}
        </View>
      </Card>
      <SectionLabel>STRENGTH SCORE</SectionLabel>
      <Card>
        <T kind="bold" style={{ marginBottom: 14 }}>
          Headline comparison
        </T>
        <Segmented
          value={draft.strengthScoreSource}
          onChange={(value) => change("strengthScoreSource", value)}
          options={[
            { value: "gym", label: "GYM" },
            { value: "competition", label: "COMPETITION" },
          ]}
        />
        <T
          style={{
            fontSize: 12,
            color: C.secondary,
            lineHeight: 21,
            marginTop: 14,
          }}
        >
          Gym compares self-reported lifts. Competition compares verified meet
          results. This controls the headline number and lift badges; both
          populations stay visible in details. Missing data shows unavailable.
          Save Profile to apply.
        </T>
      </Card>
      <SectionLabel>TRAINING</SectionLabel>
      <Card>
        <T kind="label" style={{ color: C.secondary, marginBottom: 12 }}>
          GOAL
        </T>
        <View style={[ui.wrap, { marginBottom: 18 }]}>
          {(["strength", "size", "both"] as const).map((value) => (
            <Chip
              key={value}
              label={value.toUpperCase()}
              selected={draft.goal === value}
              onPress={() => change("goal", value)}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="DAYS / WEEK"
              keyboardType="number-pad"
              value={days}
              onChangeText={setDays}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="MIN / SESSION"
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
            />
          </View>
        </View>
        <T kind="label" style={{ color: C.secondary, marginBottom: 10 }}>
          AVAILABLE EQUIPMENT
        </T>
        <View style={[ui.wrap, { marginBottom: 18 }]}>
          {equipmentOptions.map((value) => (
            <Chip
              key={value}
              small
              label={value}
              selected={draft.equipment.includes(value)}
              onPress={() =>
                change(
                  "equipment",
                  draft.equipment.includes(value)
                    ? draft.equipment.filter((item) => item !== value)
                    : [...draft.equipment, value],
                )
              }
            />
          ))}
        </View>
        <Field
          label="FAVORITE EXERCISES"
          placeholder="Bench press, EZ-bar curl"
          hint="Separate names with commas."
          value={preferred}
          onChangeText={setPreferred}
        />
        <Field
          label="EXERCISES TO AVOID"
          placeholder="Exercise names"
          value={avoided}
          onChangeText={setAvoided}
        />
        <Field
          label="TRAINING CONSTRAINTS & NEEDS"
          placeholder="Equipment limits, preferences, anything Coach should consider…"
          multiline
          value={draft.constraints}
          onChangeText={(text) => change("constraints", text)}
          maxLength={2000}
        />
        <Field
          label="REST NOTES"
          placeholder="How you’ve been resting, work schedule…"
          multiline
          value={draft.restNote}
          onChangeText={(text) => change("restNote", text)}
          maxLength={2000}
        />
      </Card>
      <SectionLabel>PLATE DISPLAY</SectionLabel>
      <Segmented
        value={draft.plateStyle}
        onChange={(value) => change("plateStyle", value)}
        options={[
          { value: "color", label: "COLORED" },
          { value: "black", label: "BLACK" },
        ]}
      />
      <View style={{ marginTop: 24 }}>
        <Button
          loading={saving}
          onPress={() => {
            void save();
          }}
        >
          SAVE PROFILE
        </Button>
      </View>
      <SectionLabel>GEMINI CONNECTION</SectionLabel>
      <Card>
        <T
          kind="label"
          style={{ color: hasKey ? C.accent : C.secondary, marginBottom: 14 }}
        >
          {hasKey ? "KEY SAVED ON THIS PHONE" : "ADD YOUR API KEY"}
        </T>
        <Field
          label="GEMINI API KEY"
          testID="gemini-key"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={hasKey ? "Enter a replacement key" : "Paste your key"}
          value={key}
          onChangeText={setKey}
          maxLength={512}
          hint="Saved in Android secure storage. Excluded from backups and app source."
        />
        <Field
          label="GEMINI MODEL ID"
          autoCapitalize="none"
          autoCorrect={false}
          value={draft.geminiModel}
          onChangeText={(value) => change("geminiModel", value)}
        />
        <Button
          kind="secondary"
          loading={keyBusy}
          onPress={() => {
            void saveKey();
          }}
        >
          {hasKey ? "Verify & save connection" : "Connect Gemini"}
        </Button>
        {error ? <ErrorText>{error}</ErrorText> : null}
        {hasKey ? (
          <Button
            kind="ghost"
            onPress={() =>
              Alert.alert(
                "Remove Gemini key?",
                "Coach will need a new key. Your plans and PRs stay saved.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove key",
                    style: "destructive",
                    onPress: () => {
                      void clearApiKey()
                        .then(() => {
                          setHasKey(false);
                          notify("Key removed.");
                        })
                        .catch((e) => setError(errorMessage(e)));
                    },
                  },
                ],
              )
            }
          >
            Remove key
          </Button>
        ) : null}
      </Card>
      <SectionLabel>REST · OPTIONAL</SectionLabel>
      <Card>
        <Toggle
          label="Read sleep from Health Connect"
          hint="Read-only sleep sessions. Requires your Android permission; Xiaomi’s companion app must write sleep there."
          value={data.profile.healthEnabled}
          disabled={healthBusy}
          onChange={(value) => {
            if (value) void connect();
            else {
              void commit((current) => ({
                ...current,
                profile: { ...current.profile, healthEnabled: false },
              }))
                .then(() => {
                  change("healthEnabled", false);
                  setSleep(null);
                  setHealthStatus(
                    "Sleep reads off. Revoke permission anytime in Android settings.",
                  );
                })
                .catch((e) => setError(errorMessage(e)));
            }
          }}
        />
        <Toggle
          label="Allow rest context for Coach"
          hint="Separate from health access. Save Profile, then select Rest in Coach before sending. Includes rest notes and available sleep session."
          value={draft.shareRest}
          onChange={(value) => change("shareRest", value)}
        />
        <T
          style={{
            fontSize: 12,
            color: C.secondary,
            lineHeight: 21,
            marginVertical: 12,
          }}
        >
          {healthStatus}
        </T>
        {sleep ? (
          <T style={{ color: C.accent, marginBottom: 12 }}>
            {Math.floor(sleep.minutes / 60)}h {sleep.minutes % 60}m session ·{" "}
            {new Date(sleep.endTime).toLocaleDateString()} · {sleep.source}
          </T>
        ) : null}
        <T
          style={{
            fontSize: 11,
            color: C.secondary,
            lineHeight: 18,
            marginBottom: 12,
          }}
        >
          Session duration includes the recorded interval; it is not a recovery
          score or necessarily time asleep.
        </T>
        <Button
          kind="secondary"
          disabled={!data.profile.healthEnabled}
          loading={healthBusy}
          onPress={() => {
            void readLatest();
          }}
        >
          Read latest session
        </Button>
        <Button
          kind="ghost"
          onPress={() => {
            void Linking.sendIntent(
              "android.settings.HEALTH_CONNECT_SETTINGS",
            ).catch(() =>
              setError(
                "Open Health Connect from Android Settings → Security & privacy.",
              ),
            );
          }}
        >
          Open Android health settings
        </Button>
      </Card>
      <SectionLabel>STRENGTH STANDARDS</SectionLabel>
      <Card>
        <T kind="bold">
          {data.standards?.source ?? "No standards table imported"}
        </T>
        <T
          style={{
            fontSize: 12,
            color: C.secondary,
            lineHeight: 21,
            marginVertical: 12,
          }}
        >
          FitnessVolt rankings are available from supported lifts. Gym and
          competition populations stay separate. Import a sourced PRISM JSON
          table for optional five-tier standards. Bodyweight ratios always work.
        </T>
        <Button
          kind="secondary"
          onPress={() => {
            void importStandards();
          }}
        >
          Import standards JSON
        </Button>
      </Card>
      <SectionLabel>BACKUPS</SectionLabel>
      <Card>
        <T
          style={{
            fontSize: 12,
            color: C.secondary,
            lineHeight: 21,
            marginBottom: 15,
          }}
        >
          Export PRs, plans, profile and chat as JSON. Keep your backup private.
          API key and Health Connect records are excluded. Video links and
          attachment details are included; gallery video files stay on this
          phone. Attach them again after restoring on another phone.
        </T>
        <Button
          kind="secondary"
          onPress={() => {
            void exportBackup(data).catch((e) => setError(errorMessage(e)));
          }}
        >
          Export backup
        </Button>
        <View style={{ height: 10 }} />
        <Button
          kind="secondary"
          onPress={() => {
            void chooseBackup();
          }}
        >
          Restore backup
        </Button>
      </Card>
      {data.records.some((record) => record.archivedAt) ? (
        <>
          <SectionLabel>ARCHIVED PRS</SectionLabel>
          {data.records
            .filter((record) => record.archivedAt)
            .map((record) => (
              <Card key={record.id} style={{ marginBottom: 8 }}>
                <T kind="bold">{exerciseById[record.exerciseId].name}</T>
                <T
                  style={{
                    color: C.secondary,
                    fontSize: 12,
                    marginVertical: 9,
                  }}
                >
                  {fmt(toUnit(record.weightKg, data.profile.unit))}{" "}
                  {data.profile.unit} × {record.reps} ·{" "}
                  {record.date.slice(0, 10)}
                </T>
                <Button
                  kind="secondary"
                  onPress={() => {
                    void commit((current) => ({
                      ...current,
                      records: current.records.map((item) =>
                        item.id === record.id
                          ? { ...item, archivedAt: null }
                          : item,
                      ),
                    }))
                      .then(() => notify("PR restored."))
                      .catch((e) => setError(errorMessage(e)));
                  }}
                >
                  Restore PR
                </Button>
              </Card>
            ))}
        </>
      ) : null}
      {data.plans.length ? (
        <>
          <SectionLabel>MANAGE PLANS</SectionLabel>
          {data.plans.map((plan) => (
            <View
              key={plan.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 9,
              }}
            >
              <T style={{ flex: 1 }}>{plan.name}</T>
              <IconButton
                name="trash-2"
                label={`Delete ${plan.name}`}
                onPress={() =>
                  Alert.alert(
                    "Delete this plan?",
                    `${plan.name} and its revision history will be removed. Export a backup first if you want to keep it.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete plan",
                        style: "destructive",
                        onPress: () => {
                          void commit((current) => ({
                            ...current,
                            plans: current.plans.filter(
                              (p) => p.id !== plan.id,
                            ),
                            planHistory: current.planHistory.filter(
                              (p) => p.id !== plan.id,
                            ),
                            selectedPlanId:
                              current.selectedPlanId === plan.id
                                ? null
                                : current.selectedPlanId,
                          })).catch((e) => setError(errorMessage(e)));
                        },
                      },
                    ],
                  )
                }
              />
            </View>
          ))}
        </>
      ) : null}
      <T
        kind="label"
        style={{ color: C.muted, marginTop: 30, textAlign: "center" }}
      >
        PRISM · 0.1.0 · MADE FOR YOUR NEXT PR
      </T>
      <Sheet
        visible={pendingBackup !== null}
        title="RESTORE BACKUP?"
        onClose={() => setPendingBackup(null)}
      >
        {pendingBackup ? (
          <>
            <T style={{ color: C.secondary, lineHeight: 24, marginBottom: 15 }}>
              This replaces current local data with{" "}
              {pendingBackup.records.length} PR records,{" "}
              {pendingBackup.plans.length} plans and{" "}
              {pendingBackup.messages.length} chat messages. Your Gemini key
              stays in secure storage. Export current data first if you want to
              keep it.
            </T>
            <Button
              loading={saving}
              onPress={() => {
                void restore(pendingBackup)
                  .then(() => {
                    loadProfileFields(pendingBackup.profile);
                    setPendingBackup(null);
                  })
                  .catch((e) => setError(errorMessage(e)));
              }}
            >
              CONFIRM RESTORE
            </Button>
            <Button kind="ghost" onPress={() => setPendingBackup(null)}>
              Cancel
            </Button>
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
