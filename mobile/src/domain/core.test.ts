import { describe, expect, it } from "vitest";
import {
  emptyData,
  defaultProfile,
  type LiftRecord,
  type Standards,
  type Proposal,
  recordSchema,
} from "./schema";
import {
  bestRecord,
  estimatedMax,
  fromUnit,
  scoreRecord,
  toUnit,
  validateStandards,
} from "./strength";
import { loadPlates, totalLoad } from "./plates";
import {
  applyProposal,
  guidedPlan,
  savePlan,
  tuneDay,
  undoPlan,
  volumes,
} from "./plans";
import { recordDate } from "./dates";
import { validateBackup } from "./backup";

const record = (changes: Partial<LiftRecord> = {}): LiftRecord => ({
  id: "r1",
  exerciseId: "bench",
  weightKg: 100,
  reps: 1,
  bodyweightKg: 80,
  age: 28,
  comparisonGroup: "male",
  date: "2026-10-19T12:00:00.000Z",
  createdAt: "2026-10-19T12:00:00.000Z",
  archivedAt: null,
  note: "",
  ...changes,
});
// Synthetic fixtures test arithmetic only. Never shipped as strength norms.
const standards: Standards = {
  version: 1,
  source: "Synthetic test fixture",
  sourceUrl: null,
  tables: [
    {
      id: "test",
      exerciseId: "bench",
      comparisonGroup: "male",
      ageMin: 18,
      ageMax: 40,
      rows: [
        { bodyweightKg: 60, thresholdsKg: [30, 50, 70, 90, 110] },
        { bodyweightKg: 100, thresholdsKg: [50, 70, 90, 110, 130] },
      ],
    },
  ],
};
describe("PR math and historical comparisons", () => {
  it("prefers measured singles, regardless of a larger estimated max", () => {
    expect(
      bestRecord(
        [record(), record({ id: "r2", weightKg: 120, reps: 5 })],
        "bench",
      )?.id,
    ).toBe("r1");
  });
  it("falls back to estimated records and ignores archives", () => {
    expect(
      bestRecord(
        [
          record({ archivedAt: record().date }),
          record({ id: "estimate", weightKg: 90, reps: 5 }),
        ],
        "bench",
      )?.id,
    ).toBe("estimate");
    expect(estimatedMax(100, 1)).toBe(100);
    expect(estimatedMax(100, 5)).toBeCloseTo(112.5);
    expect(() => estimatedMax(100, 13)).toThrow();
  });
  it("converts units without changing canonical loads", () => {
    expect(fromUnit(toUnit(104, "lb"), "lb")).toBeCloseTo(104, 10);
  });
  it("interpolates bodyweight boundaries using the record snapshot", () => {
    const score = scoreRecord(record({ weightKg: 100 }), standards)!;
    expect(score.thresholds).toEqual([40, 60, 80, 100, 120]);
    expect(score.label).toBe("Advanced");
    expect(score.next?.gapKg).toBe(20);
  });
  it("does not extrapolate uncovered bodyweights, ages or groups", () => {
    expect(scoreRecord(record({ bodyweightKg: 110 }), standards)).toBeNull();
    expect(scoreRecord(record({ age: null }), standards)).toBeNull();
    expect(
      scoreRecord(record({ comparisonGroup: "female" }), standards),
    ).toBeNull();
    expect(scoreRecord(record(), null)).toBeNull();
  });
  it("rejects malformed or ambiguous standards", () => {
    const copy = JSON.parse(JSON.stringify(standards));
    copy.tables.push({
      ...copy.tables[0],
      id: "overlap",
      ageMin: 35,
      ageMax: 60,
    });
    expect(() => validateStandards(copy)).toThrow(/overlap/);
    copy.tables.pop();
    copy.tables[0].rows[1].bodyweightKg = 60;
    expect(() => validateStandards(copy)).toThrow(/increase/);
  });
});
describe("physical plates and dates", () => {
  it("keeps two selected 20 kg plates per side at 100 kg instead of substituting 25s", () => {
    const pairs: number[] = [];
    for (let i = 0; i < 2; i++) {
      pairs.push(20);
      const shown = loadPlates(totalLoad(pairs, 20), 20, pairs);
      expect(shown.pairs).toEqual(pairs);
      expect(shown.pairs).not.toContain(25);
    }
    expect(totalLoad(pairs, 20)).toBe(100);
    expect(loadPlates(100, 20, pairs).representedKg).toBe(100);
  });
  it("keeps selected order through mixed additions, removal, and a bar change", () => {
    const pairs = [20, 20, 5, 2.5];
    expect(loadPlates(115, 20, pairs).pairs).toEqual(pairs);
    expect(loadPlates(110, 20, pairs.slice(0, -1)).pairs).toEqual([20, 20, 5]);
    expect(loadPlates(110, 15, pairs).pairs).toEqual(pairs);
    expect(loadPlates(20, 20, []).pairs).toEqual([]);
  });
  it("retains selected plates and bar in saved backups without requiring them on legacy records", () => {
    const data = {
      ...emptyData(),
      records: [record({ plateLoad: { barKg: 20, pairsKg: [20, 20] } })],
    };
    const saved = validateBackup(JSON.parse(JSON.stringify(data))).records[0];
    expect(saved.plateLoad).toEqual({ barKg: 20, pairsKg: [20, 20] });
    expect(
      loadPlates(
        saved.weightKg,
        saved.plateLoad!.barKg,
        saved.plateLoad!.pairsKg,
      ).pairs,
    ).toEqual([20, 20]);
    expect(recordSchema.parse(record()).plateLoad).toBeUndefined();
    expect(
      recordSchema.parse(
        record({ weightKg: 95, plateLoad: { barKg: 15, pairsKg: [20, 20] } }),
      ).plateLoad?.barKg,
    ).toBe(15);
  });
  it("rejects inconsistent plate metadata instead of showing a false load", () => {
    expect(() =>
      recordSchema.parse(
        record({ plateLoad: { barKg: 20, pairsKg: [25, 25] } }),
      ),
    ).toThrow(/match/);
    expect(() =>
      recordSchema.parse(record({ plateLoad: { barKg: 20, pairsKg: [40] } })),
    ).toThrow(/Unsupported/);
    expect(() =>
      validateBackup({
        ...emptyData(),
        records: [
          record({
            exerciseId: "incline-curl",
            plateLoad: { barKg: 20, pairsKg: [20, 20] },
          }),
        ],
      }),
    ).toThrow(/barbell/);
  });
  it("represents a valid paired load exactly", () => {
    const loaded = loadPlates(132.5, 20);
    expect(totalLoad(loaded.pairs, 20)).toBe(132.5);
    expect(loaded.remainderKg).toBe(0);
  });
  it("preserves typed loads that the available plates cannot represent", () => {
    const loaded = loadPlates(101, 20);
    expect(loaded.representedKg).toBe(100);
    expect(loaded.remainderKg).toBe(1);
    expect(loadPlates(10, 20).belowBar).toBe(true);
  });
  it("rejects nonexistent dates and future dates", () => {
    const today = new Date(2026, 9, 20, 16);
    expect(() => recordDate("2026-02-30", today)).toThrow(/exist/);
    expect(() => recordDate("2026-10-21", today)).toThrow(/future/);
    expect(Number.isFinite(Date.parse(recordDate("2026-10-20", today)))).toBe(
      true,
    );
  });
});
describe("plan proposals and recovery", () => {
  const profile = { ...defaultProfile, daysPerWeek: 2 };
  function fixture() {
    const plan = guidedPlan(profile, "ul");
    return savePlan(emptyData(), plan);
  }
  const proposalFor = (data: ReturnType<typeof fixture>): Proposal => {
    const plan = data.plans[0];
    return {
      summary: "Change plan",
      name: "Updated",
      days: plan.days.map(({ id, ...day }) => {
        void id;
        return day;
      }),
      focus: plan.focus,
      basePlanId: plan.id,
      baseRevision: plan.revision,
    };
  };
  it("creates templates without invented training loads or duplicate weekdays", () => {
    const plan = guidedPlan(profile, "ul");
    expect(new Set(plan.days.map((d) => d.weekday)).size).toBe(2);
    expect(
      plan.days.flatMap((d) => d.exercises).every((e) => e.weightKg === 0),
    ).toBe(true);
    expect(volumes([plan]).pectorals).toBe(3);
  });
  it("does not let load tuning alter planned sets", () => {
    const item = {
      exerciseId: "bench",
      sets: 3,
      repsMin: 5,
      repsMax: 5,
      restSeconds: 90,
      weightKg: 100,
    };
    const changed = tuneDay(
      [item],
      { load: 1, volume: 0, choice: 0, length: 0 },
      profile,
    )[0];
    expect(changed.weightKg).toBe(105);
    expect(changed.sets).toBe(3);
    expect(item.weightKg).toBe(100);
  });
  it("requires the reviewed plan revision, and undo never revives stale proposals", () => {
    const initial = fixture(),
      proposal = proposalFor(initial);
    const changed = applyProposal(initial, proposal);
    expect(initial.plans[0].name).not.toBe("Updated");
    expect(changed.plans[0].name).toBe("Updated");
    expect(() => applyProposal(changed, proposal)).toThrow(/changed/);
    const undone = undoPlan(changed, changed.plans[0].id);
    expect(undone.plans[0].name).toBe(initial.plans[0].name);
    expect(undone.plans[0].revision).toBe(3);
    expect(() => applyProposal(undone, proposal)).toThrow(/changed/);
  });
  it("rejects unsupported exercises atomically", () => {
    const data = fixture(),
      proposal = proposalFor(data);
    proposal.days[0].exercises[0].exerciseId = "invented";
    expect(() => applyProposal(data, proposal)).toThrow(/Unknown/);
    expect(data.plans[0].revision).toBe(1);
  });
  it("rejects secrets, duplicate records and invalid backup versions", () => {
    expect(() =>
      validateBackup({ ...emptyData(), apiKey: "never-allowed" }),
    ).toThrow();
    expect(() => validateBackup({ ...emptyData(), version: 2 })).toThrow();
    expect(() =>
      validateBackup({ ...emptyData(), records: [record(), record()] }),
    ).toThrow(/duplicate/);
  });
});
