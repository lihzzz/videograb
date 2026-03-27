import { Clock, User, Calendar, VideoIcon, FileText } from "lucide-react";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-red-50 border border-red-200 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 mb-1">解析失败</h4>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card-secondary to-white border border-border rounded-xl overflow-hidden"
    >
      {/* 缩略图 */}
      <div className="aspect-video bg-gradient-to-br from-muted to-gray-200 relative overflow-hidden">
        {currentVideo.thumbnail ? (
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-blue-100">
            <VideoIcon className="h-16 w-16 text-primary-600 opacity-50" />
          </div>
        )}
        {currentVideo.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(currentVideo.duration)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* 信息 */}
      <div className="p-5 space-y-3">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900">
          {currentVideo.title}
        </h3>

        {(currentVideo.uploader || currentVideo.upload_date) && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
            {currentVideo.uploader && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate max-w-[120px]">{currentVideo.uploader}</span>
              </div>
            )}
            {currentVideo.upload_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(currentVideo.upload_date)}</span>
              </div>
            )}
          </div>
        )}

        {bestFormat && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
            <Clock className="h-4 w-4" />
            <span>预计大小: {formatFileSize(bestFormat.filesize || bestFormat.filesize_approx)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
