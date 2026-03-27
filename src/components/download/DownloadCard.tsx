import { Download, CheckCircle, XCircle, Loader2, Pause } from "lucide-react";
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
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* 缩略图 */}
        {task.thumbnail ? (
          <img
            src={task.thumbnail}
            alt={task.title}
            className="w-20 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
            <Download className="h-4 w-4 text-muted-foreground" />
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
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-1">
          {task.status === "downloading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelDownload(task.id)}
            >
              取消
            </Button>
          )}
          {(task.status === "completed" || task.status === "failed" || task.status === "cancelled") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeTask(task.id)}
            >
              移除
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {task.status === "downloading" && (
        <div className="space-y-1">
          <Progress value={task.progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{task.speed}</span>
            <span>预计 {task.eta}</span>
          </div>
        </div>
      )}

      {task.status === "failed" && task.error && (
        <p className="text-xs text-red-500">{task.error}</p>
      )}
    </div>
  );
}
