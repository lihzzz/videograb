import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Download, Sparkles, ListVideo, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function DownloadButton() {
  const { currentVideo, selectedFormat, startDownload, playlistParams, updatePlaylistParams } = useDownloadStore();
  const [isStarting, setIsStarting] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("1");
  const [draftEnd, setDraftEnd] = useState("");
  const [draftItems, setDraftItems] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const hydratePlaylistDraft = () => {
    setDraftStart(String(playlistParams.start || 1));
    setDraftEnd(playlistParams.end == null ? "" : String(playlistParams.end));
    setDraftItems(playlistParams.items || "");
    setFormError(null);
  };

  const handleDownload = async (isPlaylist: boolean = false) => {
    if (!selectedFormat || !currentVideo) return;

    setIsStarting(true);
    try {
      // 选择保存路径
      const outputPath = await invoke<string | null>("select_download_folder", {
        defaultName: `${currentVideo.title}.%(ext)s`,
      });

      if (outputPath) {
        await startDownload(outputPath, isPlaylist);
      }
    } catch (err: any) {
      console.error("选择保存路径失败:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePlaylistOpen = () => {
    hydratePlaylistDraft();
    setIsPlaylistModalOpen(true);
  };

  const handlePlaylistConfirm = async () => {
    const start = Math.max(1, Number.parseInt(draftStart, 10) || 1);
    const end = draftEnd.trim() === "" ? null : Number.parseInt(draftEnd, 10);
    const items = draftItems.trim();

    if (draftEnd.trim() !== "" && (!Number.isFinite(end) || (end as number) < start)) {
      setFormError("结束位置必须大于或等于开始位置");
      return;
    }

    if (items && !/^[0-9,\-\s]+$/.test(items)) {
      setFormError("指定项目仅支持数字、逗号和范围，例如 1,3,5-10");
      return;
    }

    setFormError(null);
    updatePlaylistParams({
      start,
      end,
      items,
    });

    await handleDownload(true);
    setIsPlaylistModalOpen(false);
  };

  if (!currentVideo) return null;
  const isPlaylistVideo = currentVideo.is_playlist || currentVideo.playlist_count !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="space-y-2">
        <Button
          onClick={() => handleDownload(false)}
          disabled={!selectedFormat || isStarting}
          size="lg"
          className="w-full py-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Download className="h-5 w-5 mr-2" />
          {isStarting ? "准备中..." : (isPlaylistVideo ? "仅下载当前视频" : "下载视频")}
          <Sparkles className="h-4 w-4 ml-2" />
        </Button>

        {isPlaylistVideo ? (
          <div className="rounded-xl border border-border bg-secondary-50/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">检测到播放列表</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentVideo.playlist_title || currentVideo.title}
                  {currentVideo.playlist_count ? ` · 共 ${currentVideo.playlist_count} 项` : ""}
                </p>
              </div>
              <Button
                onClick={handlePlaylistOpen}
                disabled={!selectedFormat || isStarting}
                size="sm"
                variant="outline"
                className="h-9 px-3"
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                列表下载选项
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              点击后弹窗填写范围与指定项目，再开始批量下载。
            </p>
          </div>
        ) : null}
      </div>

      {isPlaylistModalOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListVideo className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900">播放列表下载选项</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlaylistModalOpen(false)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label="关闭"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                {currentVideo.playlist_title || currentVideo.title}
                {currentVideo.playlist_count ? ` · 总 ${currentVideo.playlist_count} 项` : ""}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">开始位置</label>
                  <Input
                    type="number"
                    min="1"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">结束位置</label>
                  <Input
                    type="number"
                    min="1"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    placeholder="留空表示到最后"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">指定项目 (可选)</label>
                <Input
                  type="text"
                  value={draftItems}
                  onChange={(e) => setDraftItems(e.target.value)}
                  placeholder="例如: 1,3,5-10"
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">格式支持: 1,3,5-10</p>
              </div>

              {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaylistModalOpen(false)}
                disabled={isStarting}
                className="h-9"
              >
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handlePlaylistConfirm}
                disabled={!selectedFormat || isStarting}
                className="h-9 px-4"
              >
                {isStarting ? "准备中..." : "确认并下载列表"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
