import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Download, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Button
        onClick={handleDownload}
        disabled={!selectedFormat || isStarting}
        size="lg"
        className="w-full py-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Download className="h-5 w-5 mr-2" />
        {isStarting ? "准备中..." : "开始下载"}
        <Sparkles className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  );
}
