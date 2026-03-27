import { Play, Clock, User, Calendar } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import type { VideoFormat } from "../../types/download";

function formatDuration(seconds?: number): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "未知大小";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

function hasVideo(format: VideoFormat): boolean {
  return !!format.vcodec && format.vcodec !== "none";
}

function hasAudio(format: VideoFormat): boolean {
  return !!format.acodec && format.acodec !== "none";
}

function parseHeight(format: VideoFormat): number {
  if (typeof format.height === "number") return format.height;
  const resolution = format.resolution || "";
  const match = resolution.match(/(\d{3,4})p/i) || resolution.match(/(\d{3,4})[xX](\d{3,4})/);
  if (!match) return 0;
  return Number(match[2] || match[1]) || 0;
}

export function VideoPreview() {
  const { currentVideo, error } = useDownloadStore();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!currentVideo) return null;

  const bestFormat = [...(currentVideo.formats || [])]
    .filter((f: VideoFormat) => hasVideo(f) && hasAudio(f))
    .sort((a, b) => {
      const ah = parseHeight(a);
      const bh = parseHeight(b);
      if (ah !== bh) return bh - ah;
      return (b.tbr || 0) - (a.tbr || 0);
    })[0];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* 缩略图 */}
      <div className="aspect-video bg-muted relative">
        {currentVideo.thumbnail ? (
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {currentVideo.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(currentVideo.duration)}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2">
          {currentVideo.title}
        </h3>

        {(currentVideo.uploader || currentVideo.upload_date) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {currentVideo.uploader && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{currentVideo.uploader}</span>
              </div>
            )}
            {currentVideo.upload_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(currentVideo.upload_date)}</span>
              </div>
            )}
          </div>
        )}

        {bestFormat && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>预计大小: {formatFileSize(bestFormat.filesize || bestFormat.filesize_approx)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
