import { useRef, useState } from "react";
import { View } from "react-native";
import { type LiftRecord } from "../domain/schema";
import {
  validateVideoDraft,
  videoDraft,
  type VideoAttachment,
} from "../domain/video";
import { savePrVideo, deletePrVideo } from "../services/videos";
import { useStore } from "../state/AppStore";
import { PrVideoEditor, PrVideoView } from "./PrVideo";
import { Button, C, ErrorText, T } from "./ui";

export function RecordOptions({
  record,
  onClose,
  onRemove,
}: {
  record: LiftRecord;
  onClose: () => void;
  onRemove: () => void;
}) {
  const { commit, notify } = useStore();
  const [draft, setDraft] = useState(() => videoDraft(record.video));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const guard = useRef(false);
  async function save() {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError(null);
    let video: VideoAttachment | undefined;
    let oldVideo: VideoAttachment | undefined;
    let canDeleteOld = false;
    let saved = false;
    try {
      validateVideoDraft(draft);
      video = await savePrVideo(draft);
      await commit((current) => {
        const existing = current.records.find((r) => r.id === record.id);
        if (!existing) throw new Error("This record no longer exists.");
        oldVideo = existing.video;
        canDeleteOld =
          oldVideo?.kind === "local" &&
          !current.records.some(
            (r) =>
              r.id !== record.id &&
              r.video?.kind === "local" &&
              r.video.fileName ===
                (oldVideo?.kind === "local" ? oldVideo.fileName : ""),
          );
        return {
          ...current,
          records: current.records.map((r) =>
            r.id === record.id ? { ...r, video } : r,
          ),
        };
      });
      saved = true;
      if (
        canDeleteOld &&
        oldVideo?.kind === "local" &&
        !(video?.kind === "local" && video.fileName === oldVideo.fileName)
      )
        deletePrVideo(oldVideo);
      notify(video ? "PR video saved." : "PR video removed.");
      onClose();
    } catch (e) {
      if (!saved && draft.kind === "gallery") deletePrVideo(video);
      setError(e instanceof Error ? e.message : "Could not save video.");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <View>
      {record.video ? (
        <PrVideoView key={JSON.stringify(record.video)} video={record.video} />
      ) : null}
      <PrVideoEditor value={draft} onChange={setDraft} disabled={busy} />
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        loading={busy}
        onPress={() => {
          void save();
        }}
      >
        SAVE VIDEO
      </Button>
      <T style={{ color: C.secondary, lineHeight: 22, marginVertical: 18 }}>
        Remove only this PR entry. Other entries stay in history. Restore it in
        Profile → Archived PRs; its video stays attached.
      </T>
      <Button kind="secondary" disabled={busy} onPress={onRemove}>
        Remove PR entry
      </Button>
    </View>
  );
}
