import { z } from "zod";

export const videoLinkSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Use an http:// or https:// video link.");
export const videoFileNameSchema = z
  .string()
  .regex(/^prism-[a-zA-Z0-9-]{1,100}\.(mp4|mov|webm|m4v|3gp|mkv)$/);
export const videoAttachmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("link"), url: videoLinkSchema }).strict(),
  z
    .object({
      kind: z.literal("local"),
      fileName: videoFileNameSchema,
      label: z.string().max(240),
    })
    .strict(),
]);
export type VideoAttachment = z.infer<typeof videoAttachmentSchema>;
export type VideoDraft =
  | { kind: "none" }
  | { kind: "link"; url: string }
  | { kind: "local"; fileName: string; label: string }
  | { kind: "gallery"; uri: string; label: string; mimeType?: string };
export const maxVideoBytes = 1024 * 1024 * 1024;
export function videoDraft(video?: VideoAttachment): VideoDraft {
  return video ? { ...video } : { kind: "none" };
}
export function validateVideoDraft(draft: VideoDraft) {
  if (draft.kind === "link" && !videoLinkSchema.safeParse(draft.url).success)
    throw new Error("Use an http:// or https:// video link.");
  if (draft.kind === "local") videoAttachmentSchema.parse(draft);
}
export function videoExtension(uri: string, mimeType?: string) {
  const extension = uri
    .split("?")[0]
    .match(/\.(mp4|mov|webm|m4v|3gp|mkv)$/i)?.[1]
    ?.toLowerCase();
  return (
    extension ??
    ({
      "video/quicktime": "mov",
      "video/webm": "webm",
      "video/3gpp": "3gp",
      "video/x-matroska": "mkv",
    }[mimeType ?? ""] ||
      "mp4")
  );
}
