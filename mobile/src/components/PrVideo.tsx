import { useState } from "react";
import { Linking, View } from "react-native";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  type VideoAttachment,
  type VideoDraft,
  videoLinkSchema,
} from "../domain/video";
import { pickPrVideo, videoFile } from "../services/videos";
import { Button, C, ErrorText, Field, SectionLabel, T, ui } from "./ui";

export function PrVideoEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: VideoDraft;
  onChange: (value: VideoDraft) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <View style={{ gap: 10, marginBottom: 22 }}>
      <SectionLabel>PR VIDEO · OPTIONAL</SectionLabel>
      {value.kind === "link" ? (
        <Field
          label="VIDEO LINK"
          value={value.url}
          onChangeText={(url) => onChange({ kind: "link", url })}
          placeholder="https://…"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled && !busy}
        />
      ) : null}
      {value.kind === "local" || value.kind === "gallery" ? (
        <T style={{ color: C.secondary, fontSize: 12 }}>{value.label}</T>
      ) : null}
      <View style={[ui.row, { flexWrap: "wrap" }]}>
        <Button
          kind="secondary"
          disabled={disabled || busy}
          onPress={() => {
            setError(null);
            onChange({
              kind: "link",
              url: value.kind === "link" ? value.url : "",
            });
          }}
        >
          Paste link
        </Button>
        <Button
          kind="secondary"
          disabled={disabled}
          loading={busy}
          onPress={() => {
            setBusy(true);
            setError(null);
            void pickPrVideo()
              .then((draft) => {
                if (draft) onChange(draft);
              })
              .catch((e) =>
                setError(
                  e instanceof Error ? e.message : "Could not open gallery.",
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          Choose gallery video
        </Button>
      </View>
      {value.kind !== "none" ? (
        <Button
          kind="ghost"
          disabled={disabled || busy}
          onPress={() => {
            setError(null);
            onChange({ kind: "none" });
          }}
        >
          Remove video
        </Button>
      ) : null}
      <T style={{ color: C.secondary, fontSize: 11, lineHeight: 18 }}>
        One video per PR. Gallery clips are copied onto this phone (up to 1 GB);
        links open in your browser or video app.
      </T>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}
function LocalPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { error } = useEvent(player, "statusChange", { status: player.status });
  return (
    <View style={{ gap: 10 }}>
      <VideoView
        player={player}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
        style={{
          width: "100%",
          height: 260,
          backgroundColor: "#000",
          borderRadius: 12,
        }}
      />
      {error ? (
        <ErrorText>
          This video could not play. Try another format or attach a link.
        </ErrorText>
      ) : null}
    </View>
  );
}
export function PrVideoView({ video }: { video: VideoAttachment }) {
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState<string | null>(null);
  const uri = video.kind === "local" ? videoFile(video.fileName) : null;
  return (
    <View style={{ gap: 10, marginVertical: 12 }}>
      <Button
        kind="secondary"
        onPress={() => {
          setError(null);
          if (video.kind === "link") {
            void Linking.openURL(videoLinkSchema.parse(video.url)).catch(() =>
              setError("Could not open the video link."),
            );
          } else if (!uri?.exists)
            setError(
              "Video is not on this phone. Attach it again from your gallery.",
            );
          else setPlaying(!playing);
        }}
      >
        {video.kind === "link"
          ? "Open PR video link"
          : playing
            ? "Close PR video"
            : "Play PR video"}
      </Button>
      {playing && uri?.exists ? <LocalPlayer uri={uri.uri} /> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}
