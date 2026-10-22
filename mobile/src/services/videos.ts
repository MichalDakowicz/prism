import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { uid } from "../domain/plans";
import {
  maxVideoBytes,
  videoAttachmentSchema,
  videoExtension,
  videoFileNameSchema,
  type VideoAttachment,
  type VideoDraft,
} from "../domain/video";

const directory = () => new Directory(Paths.document, "prism-videos");
export function videoFile(fileName: string) {
  return new File(directory(), videoFileNameSchema.parse(fileName));
}
export async function pickPrVideo(): Promise<VideoDraft | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
    allowsMultipleSelection: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || asset.type !== "video")
    throw new Error("Choose a video from your gallery.");
  if ((asset.fileSize ?? new File(asset.uri).size) > maxVideoBytes)
    throw new Error("Choose a video smaller than 1 GB.");
  return {
    kind: "gallery",
    uri: asset.uri,
    label: (asset.fileName || "PR video").slice(0, 240),
    mimeType: asset.mimeType,
  };
}
export async function savePrVideo(
  draft: VideoDraft,
): Promise<VideoAttachment | undefined> {
  if (draft.kind === "none") return undefined;
  if (draft.kind !== "gallery") return videoAttachmentSchema.parse(draft);
  const source = new File(draft.uri);
  if (!source.exists)
    throw new Error("Selected video is no longer available. Choose it again.");
  if (source.size > maxVideoBytes)
    throw new Error("Choose a video smaller than 1 GB.");
  directory().create({ intermediates: true, idempotent: true });
  const fileName = `prism-${uid()}.${videoExtension(draft.uri, draft.mimeType)}`;
  const destination = videoFile(fileName);
  try {
    await source.copy(destination);
    return videoAttachmentSchema.parse({
      kind: "local",
      fileName,
      label: draft.label,
    });
  } catch (error) {
    deletePrVideo({ kind: "local", fileName, label: draft.label });
    throw error;
  }
}
// Only our private copy is removed; the gallery original is never touched.
export function deletePrVideo(video?: VideoAttachment) {
  if (video?.kind !== "local") return;
  try {
    const file = videoFile(video.fileName);
    if (file.exists) file.delete();
  } catch {
    /* Can be retried by replacing/removing the attachment. */
  }
}
