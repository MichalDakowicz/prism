import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  maxVideoBytes,
  videoAttachmentSchema,
  videoLinkSchema,
} from "../domain/video";
import { deletePrVideo, pickPrVideo, savePrVideo, videoFile } from "./videos";
import { emptyData, recordSchema } from "../domain/schema";
import { validateBackup } from "../domain/backup";

const mocks = vi.hoisted(() => ({
  files: new Map<string, number>(),
  pick: vi.fn(),
  copyFails: false,
}));
vi.mock("expo-image-picker", () => ({ launchImageLibraryAsync: mocks.pick }));
vi.mock("expo-file-system", () => {
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts
        .map((x) => (typeof x === "string" ? x : x.uri))
        .join("/");
    }
    create() {}
  }
  class File extends Directory {
    get exists() {
      return mocks.files.has(this.uri);
    }
    get size() {
      return mocks.files.get(this.uri) ?? 0;
    }
    async copy(destination: File) {
      mocks.files.set(destination.uri, this.size);
      if (mocks.copyFails) throw new Error("Storage full");
    }
    delete() {
      mocks.files.delete(this.uri);
    }
  }
  return {
    File,
    Directory,
    Paths: { document: "file://private", cache: "file://cache" },
  };
});
beforeEach(() => {
  mocks.files.clear();
  mocks.pick.mockReset();
  mocks.copyFails = false;
});
describe("PR video attachments", () => {
  it("accepts web video links and rejects unsafe schemes and embedded credentials", () => {
    expect(videoLinkSchema.parse(" https://youtu.be/example ")).toBe(
      "https://youtu.be/example",
    );
    for (const url of [
      "javascript:alert(1)",
      "file:///private/video.mp4",
      "content://media/1",
      "https://user:pass@example.com",
      "not a url",
    ])
      expect(videoLinkSchema.safeParse(url).success).toBe(false);
    expect(
      videoAttachmentSchema.safeParse({
        kind: "local",
        fileName: "../credentials",
        label: "",
      }).success,
    ).toBe(false);
    expect(() => videoFile("../../another-file.mp4")).toThrow();
  });
  it("cancellation leaves the attachment unchanged; the picker requests videos only", async () => {
    mocks.pick.mockResolvedValue({ canceled: true });
    expect(await pickPrVideo()).toBeNull();
    expect(mocks.pick).toHaveBeenCalledWith({
      mediaTypes: ["videos"],
      allowsEditing: false,
      allowsMultipleSelection: false,
    });
  });
  it("copies a chosen clip into private persistent storage and deletes only that copy", async () => {
    mocks.files.set("file://cache/gallery.mov", 800);
    mocks.pick.mockResolvedValue({
      canceled: false,
      assets: [
        {
          type: "video",
          uri: "file://cache/gallery.mov",
          fileName: "My PR.mov",
          fileSize: 800,
          mimeType: "video/quicktime",
        },
      ],
    });
    const draft = await pickPrVideo();
    expect(draft?.kind).toBe("gallery");
    const video = await savePrVideo(draft!);
    expect(video?.kind).toBe("local");
    if (video?.kind !== "local") throw new Error("Missing local attachment");
    expect(videoFile(video.fileName).uri).toMatch(
      /^file:\/\/private\/prism-videos\/prism-.*\.mov$/,
    );
    expect(videoFile(video.fileName).exists).toBe(true);
    deletePrVideo(video);
    expect(videoFile(video.fileName).exists).toBe(false);
    expect(mocks.files.has("file://cache/gallery.mov")).toBe(true);
  });
  it("rejects oversized/missing clips and cleans up partial copies on failure", async () => {
    mocks.files.set("file://cache/large.mp4", maxVideoBytes + 1);
    await expect(
      savePrVideo({
        kind: "gallery",
        uri: "file://cache/large.mp4",
        label: "large",
      }),
    ).rejects.toThrow("1 GB");
    await expect(
      savePrVideo({
        kind: "gallery",
        uri: "file://cache/missing.mp4",
        label: "missing",
      }),
    ).rejects.toThrow("no longer available");
    mocks.files.set("file://cache/small.mp4", 80);
    mocks.copyFails = true;
    await expect(
      savePrVideo({
        kind: "gallery",
        uri: "file://cache/small.mp4",
        label: "small",
      }),
    ).rejects.toThrow("Storage full");
    expect(
      [...mocks.files.keys()].some((uri) => uri.startsWith("file://private")),
    ).toBe(false);
  });
  it("keeps old backups valid and round-trips links and portable local metadata", async () => {
    const record = recordSchema.parse({
      id: "test-video",
      exerciseId: "bench",
      weightKg: 100,
      reps: 1,
      bodyweightKg: 80,
      date: "2026-10-20T12:00:00.000Z",
      createdAt: "2026-10-20T12:00:00.000Z",
      age: null,
      comparisonGroup: null,
      archivedAt: null,
      note: "",
    });
    const data = emptyData();
    data.records = [record];
    expect(validateBackup(data).records[0].video).toBeUndefined();
    for (const video of [
      { kind: "link", url: "https://youtu.be/example" },
      { kind: "local", fileName: "prism-test.mp4", label: "PR clip" },
    ] as const) {
      data.records[0] = { ...record, video };
      expect(
        validateBackup(JSON.parse(JSON.stringify(data))).records[0].video,
      ).toEqual(video);
    }
    expect(await savePrVideo({ kind: "none" })).toBeUndefined();
  });
});
