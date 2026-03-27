import { useEffect, useMemo, useState } from "react";
import { AudioLines, Clapperboard, MonitorSpeaker } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import type { VideoFormat } from "../../types/download";
import { Button } from "../common/Button";
import { Select } from "../common/Select";

type CustomDownloadType = "video" | "audio";

type VideoTrackOption = {
  value: string;
  label: string;
  isMuxed: boolean;
};

const BUILTIN_PRESETS = [
  {
    value: "bestvideo+bestaudio/best",
    label: "智能推荐（最佳画质）",
  },
  {
    value:
      "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best[height<=1080]",
    label: "MP4 1080p（通用）",
  },
  {
    value:
      "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best[height<=720]",
    label: "MP4 720p（通用）",
  },
  {
    value:
      "bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/best[ext=mp4][height<=480]/best[height<=480]",
    label: "MP4 480p（通用）",
  },
  {
    value:
      "bestvideo[ext=webm][height<=1080]+bestaudio[ext=webm]/best[ext=webm][height<=1080]/best[height<=1080]",
    label: "WebM 1080p（通用）",
  },
  {
    value: "bestaudio[ext=m4a]/bestaudio",
    label: "仅音频 M4A（高质量）",
  },
  {
    value: "bestaudio",
    label: "仅音频（最佳可用）",
  },
];

const DEFAULT_PRESET = BUILTIN_PRESETS[0].value;

function hasVideo(format: VideoFormat): boolean {
  return !!format.vcodec && format.vcodec !== "none";
}

function hasAudio(format: VideoFormat): boolean {
  return !!format.acodec && format.acodec !== "none";
}

function parseHeight(format: VideoFormat): number | null {
  if (typeof format.height === "number" && Number.isFinite(format.height)) {
    return format.height;
  }

  const text = format.resolution || format.format_note || format.format || "";
  const fromP = text.match(/(\d{3,4})p/i);
  if (fromP) return Number(fromP[1]);

  const fromDimension = text.match(/(\d{3,4})[xX](\d{3,4})/);
  if (fromDimension) return Number(fromDimension[2]);

  return null;
}

function formatBitrate(value?: number): string {
  if (!value || !Number.isFinite(value)) return "未知码率";
  return `${Math.round(value)} kbps`;
}

function buildVideoTrackLabel(format: VideoFormat): string {
  const height = parseHeight(format);
  const resolution = height ? `${height}p` : format.resolution || format.format_note || "未知分辨率";
  const fps = format.fps ? ` · ${Math.round(format.fps)}fps` : "";
  const ext = format.ext ? ` · ${format.ext.toUpperCase()}` : "";
  return `${resolution}${fps}${ext}`;
}

function buildAudioTrackLabel(format: VideoFormat): string {
  const bitrate = format.abr || format.tbr;
  const ext = format.ext ? format.ext.toUpperCase() : "AUDIO";
  return `${formatBitrate(bitrate)} · ${ext}`;
}

function pickBestVideoByResolution(formats: VideoFormat[]): VideoTrackOption[] {
  const sorted = [...formats].sort((a, b) => {
    const ah = parseHeight(a) ?? 0;
    const bh = parseHeight(b) ?? 0;
    if (ah !== bh) return bh - ah;

    const aMp4 = a.ext === "mp4" ? 1 : 0;
    const bMp4 = b.ext === "mp4" ? 1 : 0;
    if (aMp4 !== bMp4) return bMp4 - aMp4;

    return (b.tbr || 0) - (a.tbr || 0);
  });

  const grouped = new Map<string, VideoTrackOption>();
  for (const item of sorted) {
    const key = (parseHeight(item) ?? item.resolution ?? item.format_id).toString();
    if (grouped.has(key)) continue;
    grouped.set(key, {
      value: item.format_id,
      label: buildVideoTrackLabel(item),
      isMuxed: hasAudio(item),
    });
  }

  return Array.from(grouped.values());
}

function pickBestAudioTracks(formats: VideoFormat[]): { value: string; label: string }[] {
  const sorted = [...formats].sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));
  return sorted.map((item) => ({
    value: item.format_id,
    label: buildAudioTrackLabel(item),
  }));
}

export function FormatSelector() {
  const { currentVideo, selectedFormat, setSelectedFormat } = useDownloadStore();
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetValue, setPresetValue] = useState(DEFAULT_PRESET);
  const [customType, setCustomType] = useState<CustomDownloadType>("video");
  const [selectedVideoTrack, setSelectedVideoTrack] = useState("auto");
  const [selectedAudioTrack, setSelectedAudioTrack] = useState("auto");

  const { videoTrackOptions, audioTrackOptions } = useMemo(() => {
    const formats = currentVideo?.formats ?? [];
    const videoOnlyTracks = formats.filter((f) => hasVideo(f) && !hasAudio(f));
    const muxedTracks = formats.filter((f) => hasVideo(f) && hasAudio(f));
    const audioOnlyTracks = formats.filter((f) => !hasVideo(f) && hasAudio(f));

    const videoCandidates = videoOnlyTracks.length > 0 ? videoOnlyTracks : muxedTracks;
    const videos = pickBestVideoByResolution(videoCandidates);
    const audios = pickBestAudioTracks(audioOnlyTracks);

    return {
      videoTrackOptions: videos,
      audioTrackOptions: audios,
    };
  }, [currentVideo]);

  const videoTrackMeta = useMemo(() => {
    const map = new Map<string, { isMuxed: boolean }>();
    for (const item of videoTrackOptions) {
      map.set(item.value, { isMuxed: item.isMuxed });
    }
    return map;
  }, [videoTrackOptions]);

  useEffect(() => {
    if (!currentVideo?.formats?.length) return;

    setMode("preset");
    setPresetValue(DEFAULT_PRESET);
    setCustomType("video");
    setSelectedVideoTrack("auto");
    setSelectedAudioTrack("auto");
    setSelectedFormat(DEFAULT_PRESET);
  }, [currentVideo?.id, currentVideo?.formats?.length, setSelectedFormat]);

  useEffect(() => {
    if (!currentVideo?.formats?.length) return;

    if (mode === "preset") {
      setSelectedFormat(presetValue);
      return;
    }

    if (customType === "audio") {
      if (selectedAudioTrack === "auto") {
        setSelectedFormat("bestaudio");
      } else {
        setSelectedFormat(selectedAudioTrack);
      }
      return;
    }

    if (selectedVideoTrack === "auto") {
      if (selectedAudioTrack === "auto") {
        setSelectedFormat("bestvideo+bestaudio/best");
      } else {
        setSelectedFormat(`bestvideo+${selectedAudioTrack}/best`);
      }
      return;
    }

    const videoMeta = videoTrackMeta.get(selectedVideoTrack);
    if (videoMeta?.isMuxed) {
      setSelectedFormat(selectedVideoTrack);
      return;
    }

    if (selectedAudioTrack === "auto") {
      setSelectedFormat(`${selectedVideoTrack}+bestaudio/${selectedVideoTrack}`);
      return;
    }

    setSelectedFormat(`${selectedVideoTrack}+${selectedAudioTrack}/${selectedVideoTrack}`);
  }, [
    currentVideo?.formats?.length,
    customType,
    mode,
    presetValue,
    selectedAudioTrack,
    selectedVideoTrack,
    setSelectedFormat,
    videoTrackMeta,
  ]);

  if (!currentVideo?.formats?.length) return null;

  return (
    <div className="space-y-4 border border-border rounded-xl p-5 bg-card/60 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-base font-medium text-gray-900">下载格式</label>
        <div className="text-xs text-muted-foreground break-all max-w-full sm:max-w-[60%] bg-muted px-3 py-1.5 rounded-lg">
          当前表达式: {selectedFormat || "未选择"}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="md"
          variant={mode === "preset" ? "default" : "outline"}
          onClick={() => setMode("preset")}
          className="flex-1"
        >
          内置方案
        </Button>
        <Button
          type="button"
          size="md"
          variant={mode === "custom" ? "default" : "outline"}
          onClick={() => setMode("custom")}
          className="flex-1"
        >
          自定义
        </Button>
      </div>

      {mode === "preset" && (
        <div className="pt-2">
          <Select
            value={presetValue}
            onChange={(e) => setPresetValue(e.target.value)}
            options={BUILTIN_PRESETS}
          />
        </div>
      )}

      {mode === "custom" && (
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="md"
              variant={customType === "video" ? "default" : "outline"}
              onClick={() => setCustomType("video")}
              className="flex-1 flex items-center gap-2"
            >
              <Clapperboard className="h-4 w-4" />
              视频
            </Button>
            <Button
              type="button"
              size="md"
              variant={customType === "audio" ? "default" : "outline"}
              onClick={() => setCustomType("audio")}
              className="flex-1 flex items-center gap-2"
            >
              <MonitorSpeaker className="h-4 w-4" />
              音频
            </Button>
          </div>

          {customType === "video" && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground block">视频分辨率</label>
              <Select
                value={selectedVideoTrack}
                onChange={(e) => setSelectedVideoTrack(e.target.value)}
                options={[
                  { value: "auto", label: "自动最佳（视频）" },
                  ...videoTrackOptions,
                ]}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground block">
              {customType === "audio" ? "音频质量" : "音频轨道"}
            </label>
            <Select
              value={selectedAudioTrack}
              onChange={(e) => setSelectedAudioTrack(e.target.value)}
              options={[
                { value: "auto", label: "自动最佳（音频）" },
                ...audioTrackOptions,
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
