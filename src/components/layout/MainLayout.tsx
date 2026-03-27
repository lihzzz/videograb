import { Video, Download } from "lucide-react";
import { UrlInput } from "../download/UrlInput";
import { ProxyConfig } from "../download/ProxyConfig";
import { VideoPreview } from "../download/VideoPreview";
import { FormatSelector } from "../download/FormatSelector";
import { DownloadButton } from "../download/DownloadButton";
import { DownloadList } from "../download/DownloadList";
import { useDownloadStore } from "../../stores/downloadStore";

export function MainLayout() {
  const { currentVideo, error } = useDownloadStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="px-6 py-4 flex items-center gap-3">
          <Video className="h-6 w-6 text-primary-600" />
          <h1 className="text-xl font-bold">VideoGrab</h1>
          <span className="text-sm text-muted-foreground">macOS 视频下载器</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* URL Input Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              添加下载
            </h2>
            <UrlInput />
            <ProxyConfig />
          </div>

          {/* Video Preview & Format Selection */}
          {(currentVideo || error) && (
            <div className="space-y-4">
              <VideoPreview />
              <FormatSelector />
              <DownloadButton />
            </div>
          )}

          {/* Download List */}
          <DownloadList />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-4 text-center text-sm text-muted-foreground">
        Powered by yt-dlp · Tauri 2.x
      </footer>
    </div>
  );
}
