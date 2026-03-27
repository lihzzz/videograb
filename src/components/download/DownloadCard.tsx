import { Download, CheckCircle, XCircle, Loader2, Pause, File, Trash2, ListVideo } from "lucide-react";
import { motion } from "framer-motion";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";
import { Progress } from "../common/Progress";

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "cancelled":
      return <Pause className="h-5 w-5 text-gray-500" />;
    case "downloading":
      return <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />;
    default:
      return <Download className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "已完成";
    case "failed":
      return "失败";
    case "cancelled":
      return "已取消";
    case "downloading":
      return "下载中";
    case "pending":
      return "等待中";
    default:
      return status;
  }
}

export function DownloadCard({ task }: { task: import("../../types/download").DownloadTask }) {
  const { cancelDownload, removeTask } = useDownloadStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {/* 缩略图 */}
        {task.thumbnail ? (
          <div className="relative">
            <img
              src={task.thumbnail}
              alt={task.title}
              className="w-24 h-14 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
          </div>
        ) : (
          <div className="w-24 h-14 bg-gradient-to-br from-primary-100 to-blue-100 rounded-lg flex items-center justify-center">
            <File className="h-5 w-5 text-primary-600" />
          </div>
        )}

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            {getStatusIcon(task.status)}
            <span className="text-xs text-muted-foreground">
              {getStatusText(task.status)}
            </span>
            {task.format_id && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {task.format_id}
              </span>
            )}
          </div>

          {/* 播放列表信息 */}
          {task.is_playlist && task.playlist_title && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ListVideo className="h-3 w-3" />
              <span>{task.playlist_title}</span>
              {task.playlist_size && (
                <span>({task.playlist_size} 个项目)</span>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-1">
          {task.status === "downloading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelDownload(task.id)}
              className="h8 w-8 p-0"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {(task.status === "completed" || task.status === "failed" || task.status === "cancelled") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeTask(task.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {task.status === "downloading" && (
        <div className="space-y-1 pl-28">
          <Progress value={task.progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{task.speed}</span>
            <span>预计 {task.eta}</span>
          </div>
        </div>
      )}

      {task.status === "failed" && task.error && (
        <div className="pl-28">
          <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">{task.error}</p>
        </div>
      )}
    </motion.div>
  );
}
