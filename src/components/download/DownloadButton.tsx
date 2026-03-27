import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";

export function DownloadButton() {
  const { currentVideo, selectedFormat, startDownload } = useDownloadStore();
  const [isStarting, setIsStarting] = useState(false);

  const handleDownload = async () => {
    if (!selectedFormat || !currentVideo) return;

    setIsStarting(true);
    try {
      // 选择保存路径
      const outputPath = await invoke<string | null>("select_download_folder", {
        defaultName: `${currentVideo.title}.%(ext)s`,
      });

      if (outputPath) {
        await startDownload(outputPath);
      }
    } catch (err: any) {
      console.error("选择保存路径失败:", err);
    } finally {
      setIsStarting(false);
    }
  };

  if (!currentVideo) return null;

  return (
    <Button
      onClick={handleDownload}
      disabled={!selectedFormat || isStarting}
      size="lg"
      className="w-full"
    >
      <FolderOpen className="h-5 w-5 mr-2" />
      {isStarting ? "准备中..." : "开始下载"}
    </Button>
  );
}
