import { Download, Sparkles, MonitorPlay } from "lucide-react";
import { motion } from "framer-motion";
import { UrlInput } from "../download/UrlInput";
import { ProxyConfig } from "../download/ProxyConfig";
import { CookiesConfig } from "../download/CookiesConfig";
import { VideoPreview } from "../download/VideoPreview";
import { FormatSelector } from "../download/FormatSelector";
import { DownloadButton } from "../download/DownloadButton";
import { DownloadList } from "../download/DownloadList";
import { UpdateYtdlpButton } from "../download/UpdateYtdlpButton";
import { useDownloadStore } from "../../stores/downloadStore";

export function MainLayout() {
  const { currentVideo, error } = useDownloadStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <MonitorPlay className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                VideoGrab
              </h1>
              <p className="text-xs text-muted-foreground">智能视频下载器</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <UpdateYtdlpButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <MonitorPlay className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              轻松下载视频
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              支持 YouTube、Bilibili 等多种平台，一键解析并下载高质量视频
            </p>
          </div>

          {/* URL Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">添加下载链接</h3>
            </div>
            <UrlInput />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ProxyConfig />
              <CookiesConfig />
            </div>
          </motion.div>

          {/* Video Preview & Format Selection */}
          {(currentVideo || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">视频预览</h3>
                <VideoPreview />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">选择格式</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                    <div className="xl:col-span-3">
                      <FormatSelector />
                    </div>
                    <div className="xl:col-span-2">
                      <div className="h-full rounded-xl border border-border/60 bg-secondary-50/30 p-4 flex flex-col justify-end">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">下载动作</h4>
                        <DownloadButton />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Download List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-border/50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">下载列表</h3>
            <DownloadList />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 backdrop-blur-sm py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            基于 yt-dlp 强力驱动 · 使用 Tauri 构建
          </p>
        </div>
      </footer>
    </div>
  );
}
