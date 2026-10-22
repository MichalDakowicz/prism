import { afterEach, describe, expect, it, vi } from "vitest";
import { askCoach, coachContext } from "./gemini";
import { emptyData, type ChatMessage } from "../domain/schema";
import { geminiResponseSchema } from "../domain/gemini-contract";
vi.mock("./credentials", () => ({ getApiKey: async () => "test-key" }));
afterEach(() => vi.unstubAllGlobals());
const user: ChatMessage = {
  id: "u",
  role: "user",
  text: "Create a plan",
  date: "2026-10-20T12:00:00.000Z",
};
const choice = { profile: true, records: true, plan: true, rest: false };
const reply = {
  reply: "Here is a draft.",
  proposal: {
    summary: "One day to review.",
    name: "Draft",
    days: [
      {
        name: "Upper",
        weekday: 0,
        exercises: [
          {
            exerciseId: "bench",
            sets: 3,
            repsMin: 5,
            repsMax: 5,
            weightKg: 0,
            restSeconds: 120,
          },
        ],
      },
    ],
    focus: ["pectorals"],
  },
};
const response = (value: unknown, finishReason = "STOP") =>
  new Response(
    JSON.stringify({
      candidates: [
        { finishReason, content: { parts: [{ text: JSON.stringify(value) }] } },
      ],
    }),
    { status: 200 },
  );
describe("Gemini boundary", () => {
  it("excludes video links and private file names from shared PR context", () => {
    const data = emptyData();
    const base = {
      id: "private-video",
      exerciseId: "bench",
      weightKg: 100,
      reps: 1,
      bodyweightKg: 80,
      age: null,
      comparisonGroup: null,
      archivedAt: null,
      note: "",
      date: user.date,
      createdAt: user.date,
    };
    data.records = [
      {
        ...base,
        video: { kind: "link", url: "https://example.com/private-token" },
      },
      {
        ...base,
        id: "local-video",
        video: {
          kind: "local",
          fileName: "prism-private.mp4",
          label: "Private clip",
        },
      },
    ];
    const shared = coachContext(data, choice, null);
    expect(shared.records).toHaveLength(2);
    expect(JSON.stringify(shared)).not.toContain("private-token");
    expect(JSON.stringify(shared)).not.toContain("prism-private.mp4");
    expect(shared.records?.[0].weightKg).toBe(100);
  });
  it("uses a compact server grammar and retains client validation", () => {
    const grammar = JSON.stringify(geminiResponseSchema());
    expect(grammar).not.toContain("maxItems");
    expect(grammar).not.toContain("maximum");
    expect(grammar).toContain("exerciseId");
  });
  it("requires both rest permission and message selection, even when profile is shared", () => {
    const data = emptyData();
    data.profile.restNote = "Private rest note";
    expect(JSON.stringify(coachContext(data, choice, null))).not.toContain(
      "Private rest note",
    );
    data.profile.shareRest = true;
    expect(coachContext(data, { ...choice, rest: true }, null).rest?.note).toBe(
      "Private rest note",
    );
    expect(
      coachContext(
        data,
        { profile: false, records: false, plan: false, rest: false },
        null,
      ),
    ).toEqual({ profile: null, records: null, plan: null, rest: null });
  });
  it("returns a validated draft without persisting anything", async () => {
    const fetch = vi.fn().mockResolvedValue(response(reply));
    vi.stubGlobal("fetch", fetch);
    const data = emptyData(),
      result = await askCoach(
        data,
        choice,
        null,
        [user],
        new AbortController().signal,
      );
    expect(result.proposal?.name).toBe("Draft");
    expect(data.plans).toHaveLength(0);
    expect(fetch.mock.calls[0][0]).not.toContain("test-key");
    expect(fetch.mock.calls[0][0]).toContain(
      "/models/gemini-3.8-flash:generateContent",
    );
    expect(
      JSON.parse(fetch.mock.calls[0][1].body).generationConfig.thinkingConfig
        .thinkingLevel,
    ).toBe("LOW");
    expect(fetch.mock.calls[0][1].headers["x-goog-api-key"]).toBe("test-key");
    expect(fetch.mock.calls[0][1].body).not.toContain("test-key");
  });
  it("rejects truncated or unsupported proposals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(reply, "MAX_TOKENS")),
    );
    await expect(
      askCoach(emptyData(), choice, null, [user], new AbortController().signal),
    ).rejects.toThrow(/finish/);
    const invalid = JSON.parse(JSON.stringify(reply));
    invalid.proposal.days[0].exercises[0].exerciseId = "invented";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(invalid)));
    await expect(
      askCoach(emptyData(), choice, null, [user], new AbortController().signal),
    ).rejects.toThrow(/unsupported/);
  });
  it("shows a quota failure without losing or applying data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 429 })),
    );
    await expect(
      askCoach(emptyData(), choice, null, [user], new AbortController().signal),
    ).rejects.toThrow(/quota/);
  });
});
