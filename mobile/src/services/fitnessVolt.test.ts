import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFitnessVolt } from "./fitnessVolt";
import {
  FITNESS_VOLT_URL,
  cachedFitnessVolt,
  fitnessVoltInput,
  fitnessVoltKey,
  fitnessVoltDisplay,
  fitnessVoltBadge,
  type FitnessVoltInput,
} from "../domain/fitnessVolt";
import { defaultProfile, emptyData, type LiftRecord } from "../domain/schema";
import { validateBackup } from "../domain/backup";
import { archiveRecord } from "../domain/records";

const record: LiftRecord = {
  id: "test",
  exerciseId: "bench",
  weightKg: 100,
  reps: 1,
  bodyweightKg: 80,
  age: 28,
  comparisonGroup: "male",
  date: "2026-10-20T12:00:00.000Z",
  createdAt: "2026-10-20T12:00:00.000Z",
  archivedAt: null,
  note: "",
};
const input: FitnessVoltInput = {
  recordId: "test",
  lift: "bench-press",
  sex: "male",
  bodyweightKg: 80,
  e1rmKg: 100,
  age: 28,
};
// Synthetic transport fixture, not bundled strength norms.
const payload = {
  success: true,
  lift: "bench-press",
  sex: "male",
  unit: "kg",
  bodyweight: 80,
  e1rm: 100,
  fv_score: 34,
  tier: "Novice",
  score_source: "verified_competition",
  verified: {
    percentile: 34,
    sample_size: 1000,
    population: "verified_competition",
    source: "OpenPowerlifting",
  },
  gym: {
    percentile: 84,
    sample_size: 1200,
    population: "self_reported_gym",
    source: "Symmetric Strength",
  },
  attribution: {
    text: "Powered by FitnessVolt",
    url: FITNESS_VOLT_URL,
    license: "CC BY 4.0",
  },
};
afterEach(() => vi.unstubAllGlobals());
const mock = (body: unknown = payload, status = 200) => {
  const fn = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
};

describe("FitnessVolt comparisons", () => {
  it("switches cached headline number and badge without mixing population tiers", async () => {
    const fetch = mock();
    const result = await fetchFitnessVolt(input);
    expect(fitnessVoltDisplay(result, "competition")).toEqual({
      label: "Competition",
      score: 34,
      tier: "Novice",
    });
    expect(fitnessVoltDisplay(result, "gym")).toEqual({
      label: "Gym",
      score: 84,
      tier: null,
    });
    expect(fitnessVoltBadge(result, "gym")).toBe("GYM · 84/100");
    expect(fitnessVoltBadge(result, "competition")).toBe("COMP · 34/100");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.score).toBe(34);
  });
  it("shows unavailable for a missing selected population instead of substituting the other", async () => {
    mock();
    const result = await fetchFitnessVolt(input);
    expect(
      fitnessVoltDisplay({ ...result, gym: null }, "gym").score,
    ).toBeNull();
    expect(fitnessVoltBadge({ ...result, verified: null }, "competition")).toBe(
      "COMP · N/A",
    );
    expect(
      fitnessVoltDisplay(
        { ...result, gym: { ...result.gym!, percentile: 0 } },
        "gym",
      ).score,
    ).toBe(0);
  });
  it("defaults older profiles to competition and preserves the saved preference in backups", () => {
    const legacy = JSON.parse(JSON.stringify(emptyData()));
    delete legacy.profile.strengthScoreSource;
    expect(validateBackup(legacy).profile.strengthScoreSource).toBe(
      "competition",
    );
    legacy.profile.strengthScoreSource = "gym";
    const restored = validateBackup(JSON.parse(JSON.stringify(legacy)));
    expect(restored.profile.strengthScoreSource).toBe("gym");
    expect(fitnessVoltKey(fitnessVoltInput(record, restored.profile)!)).toBe(
      fitnessVoltKey(fitnessVoltInput(record, defaultProfile)!),
    );
  });
  it("uses historical snapshots and estimates rep records without changing their load", () => {
    expect(
      fitnessVoltInput(record, {
        ...defaultProfile,
        bodyweightKg: 110,
        age: 40,
        comparisonGroup: "female",
      }),
    ).toEqual(input);
    expect(
      fitnessVoltInput({ ...record, reps: 5 }, defaultProfile)?.e1rmKg,
    ).toBeCloseTo(112.5);
    expect(record.weightKg).toBe(100);
  });
  it("requires an explicit comparison group and excludes ambiguous exercise variants", () => {
    expect(
      fitnessVoltInput({ ...record, comparisonGroup: null }, defaultProfile),
    ).toBeNull();
    expect(
      fitnessVoltInput(
        { ...record, comparisonGroup: null },
        defaultProfile,
        "female",
      )?.sex,
    ).toBe("female");
    expect(
      fitnessVoltInput(
        { ...record, exerciseId: "incline-press" },
        defaultProfile,
      ),
    ).toBeNull();
    expect(
      fitnessVoltInput({ ...record, exerciseId: "pullup" }, defaultProfile),
    ).toBeNull();
  });
  it("sends only comparison inputs and keeps both population results separate", async () => {
    const fetch = mock();
    const result = await fetchFitnessVolt(input);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("unit")).toBe("kg");
    expect([...url.searchParams.keys()].sort()).toEqual([
      "age",
      "bw",
      "e1rm",
      "lift",
      "sex",
      "unit",
    ]);
    expect(result.score).toBe(34);
    expect(result.population).toBe("verified_competition");
    expect(result.verified?.percentile).toBe(34);
    expect(result.gym?.percentile).toBe(84);
    expect(result.key).toBe(fitnessVoltKey(input));
    expect(input).not.toHaveProperty("fetchedAt");
  });
  it("retains cached rankings in backups and never reuses a different bodyweight or group", async () => {
    mock();
    const result = await fetchFitnessVolt(input);
    const saved = validateBackup(
      JSON.parse(
        JSON.stringify({
          ...emptyData(),
          records: [record],
          fitnessVolt: [result],
        }),
      ),
    );
    expect(
      cachedFitnessVolt(record, defaultProfile, saved.fitnessVolt)?.score,
    ).toBe(34);
    expect(
      cachedFitnessVolt(
        { ...record, bodyweightKg: 90 },
        defaultProfile,
        saved.fitnessVolt,
      ),
    ).toBeUndefined();
    expect(
      cachedFitnessVolt(
        { ...record, comparisonGroup: "female" },
        defaultProfile,
        saved.fitnessVolt,
      ),
    ).toBeUndefined();
    const legacy = emptyData() as Record<string, unknown>;
    delete legacy.fitnessVolt;
    expect(validateBackup(legacy).fitnessVolt).toEqual([]);
  });
  it("rejects mismatched inputs, blended labels, and missing cohorts", async () => {
    mock({ ...payload, bodyweight: 90 });
    await expect(fetchFitnessVolt(input)).rejects.toThrow(/different/);
    mock({
      ...payload,
      verified: { ...payload.verified, population: "self_reported_gym" },
    });
    await expect(fetchFitnessVolt(input)).rejects.toThrow(/population/);
    mock({ ...payload, verified: null, gym: null });
    await expect(fetchFitnessVolt(input)).rejects.toThrow(/cohort/);
    mock({ ...payload, fv_score: 150 });
    await expect(fetchFitnessVolt(input)).rejects.toThrow(/unsupported/);
  });
  it("reports rate limits without inventing a score", async () => {
    mock({}, 429);
    await expect(fetchFitnessVolt(input)).rejects.toThrow(/rate limiting/);
  });
});
describe("removing a PR entry", () => {
  it("archives only the selected entry and preserves the rest of the same lift history", () => {
    const data = {
      ...emptyData(),
      records: [
        record,
        { ...record, id: "second", weightKg: 90 },
        { ...record, id: "squat", exerciseId: "squat" },
        { ...record, id: "archived", archivedAt: "2026-10-19T12:00:00.000Z" },
      ],
    };
    const next = archiveRecord(data, record.id);
    expect(
      next.records.filter((r) => r.exerciseId === "bench" && !r.archivedAt),
    ).toHaveLength(1);
    expect(next.records.find((r) => r.id === "second")?.archivedAt).toBeNull();
    expect(next.records[0].archivedAt).toBeTruthy();
    expect(next.records.find((r) => r.id === "squat")?.archivedAt).toBeNull();
    expect(next.records.find((r) => r.id === "archived")?.archivedAt).toBe(
      "2026-10-19T12:00:00.000Z",
    );
    expect(data.records[0].archivedAt).toBeNull();
    expect(next.records).toHaveLength(4);
  });
});
