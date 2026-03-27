import { useDownloadStore } from "../../stores/downloadStore";
import { DownloadCard } from "./DownloadCard";

export function DownloadList() {
  const { tasks } = useDownloadStore();

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无下载任务</p>
        <p className="text-sm mt-1">添加视频链接开始下载</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">下载任务</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DownloadCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
